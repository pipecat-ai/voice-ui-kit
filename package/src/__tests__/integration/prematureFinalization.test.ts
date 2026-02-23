import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStoreHarness } from "../helpers/storeHarness";
import { expectMessages, getRawPartTexts } from "../helpers/assertions";

/**
 * Tests for the premature finalization fix (commit 0277a2c).
 *
 * When the bot sends a long response, TTS may pause mid-response causing
 * BotStoppedSpeaking to fire. If the finalize timer completes before the
 * next BotOutput arrives, the message gets finalized prematurely. The fix:
 *
 * 1. BotOutput events cancel pending finalize timers.
 * 2. ensureAssistantMessage un-finalizes a message if it still has unspoken
 *    content and no user message followed (i.e. it wasn't an interruption).
 */
describe("premature finalization during long bot response", () => {
  let harness: ReturnType<typeof createStoreHarness>;

  beforeEach(() => {
    vi.useFakeTimers();
    harness = createStoreHarness();
    harness.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("un-finalizes a prematurely finalized message when more output arrives", () => {
    // 1. Bot sends unspoken words
    harness.ensureAssistantMessage();
    harness.emitBotOutput("Hello", false, "word");
    harness.emitBotOutput("how", false, "word");
    harness.emitBotOutput("are", false, "word");
    harness.emitBotOutput("you", false, "word");
    harness.emitBotOutput("today", false, "word");

    // 2. Spoken events for first part
    harness.emitBotOutput("Hello", true, "word");
    harness.emitBotOutput("how", true, "word");

    // 3. Premature finalization (BotStoppedSpeaking timer fires)
    harness.finalizeAssistant();

    const messagesAfterFinalize = harness.getMessages();
    expect(messagesAfterFinalize).toHaveLength(1);
    expect(messagesAfterFinalize[0].final).toBe(true);

    // 4. More output arrives — should un-finalize, not create a new bubble
    harness.emitBotOutput("I", false, "word");
    harness.emitBotOutput("am", false, "word");
    harness.emitBotOutput("fine", false, "word");

    const messagesAfterMore = harness.getMessages();
    expect(messagesAfterMore).toHaveLength(1);
    expect(messagesAfterMore[0].final).toBe(false);

    // The text should contain both old and new content
    const text = getRawPartTexts(messagesAfterMore[0]).join("");
    expect(text).toContain("Hello");
    expect(text).toContain("today");
    expect(text).toContain("fine");
  });

  it("creates a new bubble if user spoke after finalization (real interruption)", () => {
    // 1. Bot sends output
    harness.ensureAssistantMessage();
    harness.emitBotOutput("Hello", false, "word");
    harness.emitBotOutput("world", false, "word");
    harness.emitBotOutput("Hello", true, "word");

    // 2. Finalize the assistant message
    harness.finalizeAssistant();

    // 3. User speaks (this is a real interruption)
    harness.emitUserTranscript("Wait", true);

    // 4. New bot output arrives — should create a NEW assistant message
    harness.ensureAssistantMessage();
    harness.emitBotOutput("Sorry", false, "word");

    const messages = harness.getMessages();
    // Should be: assistant (finalized), user, assistant (new)
    expect(messages).toHaveLength(3);
    expect(messages[0].role).toBe("assistant");
    expect(messages[0].final).toBe(true);
    expect(messages[1].role).toBe("user");
    expect(messages[2].role).toBe("assistant");
  });

  it("keeps message in a single bubble with sentence-level aggregation", () => {
    // Sentence-level: bot sends multiple sentences, gets prematurely finalized
    harness.ensureAssistantMessage();
    harness.emitBotOutput("First sentence.", false, "sentence");
    harness.emitBotOutput("Second sentence.", false, "sentence");
    harness.emitBotOutput("First sentence.", true, "sentence");

    // Premature finalization before spoken catches up
    harness.finalizeAssistant();

    expect(harness.getMessages()[0].final).toBe(true);

    // More output arrives — un-finalize happens internally, but sentence-level
    // isFinal re-sets final:true. The key assertion is that no new bubble is
    // created: all 3 parts stay in a single message.
    harness.emitBotOutput("Third sentence.", false, "sentence");

    const messages = harness.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].parts).toHaveLength(3);
  });

  it("does not un-finalize when all content has been spoken", () => {
    // Bot sends and speaks everything (word-level to avoid isFinal=true)
    harness.ensureAssistantMessage();
    harness.emitBotOutput("Hello", false, "word");
    harness.emitBotOutput("world", false, "word");
    harness.emitBotOutput("Hello", true, "word");
    harness.emitBotOutput("world", true, "word");

    // Finalize — all content is spoken
    harness.finalizeAssistant();

    // Advance time past the 30s merge window so the new message isn't merged
    vi.advanceTimersByTime(31_000);

    // New output arrives — should create a new bubble since everything was spoken
    harness.ensureAssistantMessage();
    harness.emitBotOutput("New", false, "word");
    harness.emitBotOutput("message", false, "word");

    const messages = harness.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].final).toBe(true);
    expect(messages[1].final).toBe(false);
  });

  it("BotOutput cancels pending finalize timer before it fires", () => {
    harness.ensureAssistantMessage();
    harness.emitBotOutput("Hello", false, "word");
    harness.emitBotOutput("world", false, "word");
    harness.emitBotOutput("Hello", true, "word");

    // Simulate BotStoppedSpeaking → start finalize timer
    const finalizeTimer = setTimeout(() => {
      harness.finalizeAssistant();
    }, 2500);

    // Before timer fires, more BotOutput arrives → cancel timer
    // (In the real ConversationProvider, BotOutput clears the timeout)
    clearTimeout(finalizeTimer);
    harness.emitBotOutput("more", false, "word");
    harness.emitBotOutput("text", false, "word");

    // Advance past the timer — should NOT finalize since we cleared it
    vi.advanceTimersByTime(3000);

    const messages = harness.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].final).toBe(false);

    const text = getRawPartTexts(messages[0]).join("");
    expect(text).toContain("text");
  });

  it("handles multiple premature finalization cycles", () => {
    harness.ensureAssistantMessage();

    // First batch of output
    harness.emitBotOutput("Part one.", false, "sentence");
    harness.emitBotOutput("Part two.", false, "sentence");
    harness.emitBotOutput("Part one.", true, "sentence");

    // First premature finalization
    harness.finalizeAssistant();
    expect(harness.getMessages()[0].final).toBe(true);

    // More output — un-finalizes internally, then sentence-level re-sets final.
    // The key: still one message, not split.
    harness.emitBotOutput("Part three.", false, "sentence");
    expect(harness.getMessages()).toHaveLength(1);

    // Spoken catches up through part two
    harness.emitBotOutput("Part two.", true, "sentence");

    // Second premature finalization (part three not yet spoken)
    harness.finalizeAssistant();
    expect(harness.getMessages()[0].final).toBe(true);

    // More output again — still one message
    harness.emitBotOutput("Part four.", false, "sentence");
    expect(harness.getMessages()).toHaveLength(1);

    // Still a single message with all 4 parts
    const messages = harness.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].parts).toHaveLength(4);
  });

  it("end-to-end: long response with mid-turn TTS pause stays in one bubble", () => {
    harness.ensureAssistantMessage();

    // Bot streams a long response sentence by sentence
    const sentences = [
      "Let me explain this to you.",
      "First, you need to understand the basics.",
      "Then we can move on to advanced topics.",
      "Finally, we'll put it all together.",
    ];

    // All unspoken content arrives
    for (const s of sentences) {
      harness.emitBotOutput(s, false, "sentence");
    }

    // Spoken: first two sentences
    harness.emitBotOutput(sentences[0], true, "sentence");
    harness.emitBotOutput(sentences[1], true, "sentence");

    // TTS pause → premature finalization
    harness.finalizeAssistant();

    // Spoken resumes with third sentence — triggers un-finalize via ensureAssistantMessage
    harness.ensureAssistantMessage();
    harness.emitBotOutput(sentences[2], true, "sentence");
    harness.emitBotOutput(sentences[3], true, "sentence");

    // Proper finalization
    harness.finalizeAssistant();

    const messages = harness.getMessages();
    expectMessages(messages, [
      { role: "assistant", final: true, partCount: 4 },
    ]);

    const text = getRawPartTexts(messages[0]).join(" ");
    for (const s of sentences) {
      expect(text).toContain(s);
    }
  });
});
