import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStoreHarness } from "../helpers/storeHarness";
import { conversation, playScenario } from "../helpers/conversationDSL";
import { expectMessages, getRawPartTexts } from "../helpers/assertions";

describe("BotOutput assembly", () => {
  let harness: ReturnType<typeof createStoreHarness>;

  beforeEach(() => {
    vi.useFakeTimers();
    harness = createStoreHarness();
    harness.reset();
  });

  // -----------------------------------------------------------------------
  // Word-level assembly
  // -----------------------------------------------------------------------
  describe("word-level unspoken then spoken", () => {
    it("assembles words into a single part with correct text", () => {
      const scenario = conversation().bot("Hello how are you today").build();

      playScenario(harness, scenario);

      const messages = harness.getMessages();
      expectMessages(messages, [{ role: "assistant", final: true }]);

      // All words should be in a single part (word-level appends)
      const parts = messages[0].parts;
      expect(parts).toHaveLength(1);

      const text = getRawPartTexts(messages[0])[0];
      expect(text).toContain("Hello");
      expect(text).toContain("how");
      expect(text).toContain("today");
    });

    it("has cursor fully advanced after all words spoken", () => {
      const scenario = conversation().bot("Hello how are you").build();

      playScenario(harness, scenario);

      const cursor = harness.getLastAssistantCursor();
      expect(cursor).toBeDefined();
      // Cursor should be at or past the end of the text
      const text = getRawPartTexts(harness.getMessages()[0])[0];
      expect(cursor!.currentCharIndex).toBe(text.length);
    });
  });

  // -----------------------------------------------------------------------
  // Sentence-level assembly
  // -----------------------------------------------------------------------
  describe("sentence-level unspoken then spoken", () => {
    it("creates one part per sentence", () => {
      const scenario = conversation()
        .bot("Hello there.", { aggregation: "sentence" })
        .build();

      playScenario(harness, scenario);

      const messages = harness.getMessages();
      expectMessages(messages, [{ role: "assistant", final: true }]);

      const partTexts = getRawPartTexts(messages[0]);
      expect(partTexts).toHaveLength(1);
      expect(partTexts[0]).toContain("Hello there.");
    });

    it("creates separate parts for consecutive sentence-level turns in same message", () => {
      // Two bot turns that get merged into one assistant message
      const scenario = conversation()
        .bot("First sentence.", { aggregation: "sentence" })
        .build();

      playScenario(harness, scenario);

      const messages = harness.getMessages();
      expect(messages).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // Mixed aggregation types
  // -----------------------------------------------------------------------
  describe("mixed aggregation types", () => {
    it("handles sentence followed by code block followed by sentence", () => {
      // Build manually to control the sequence within one assistant turn
      harness.ensureAssistantMessage();

      // Unspoken: sentence
      harness.emitBotOutput("Here is some code:", false, "sentence");
      // Unspoken: code block
      harness.emitBotOutput("console.log('hi')", false, "code");
      // Unspoken: sentence
      harness.emitBotOutput("Pretty cool right?", false, "sentence");

      const messages = harness.getMessages();
      const parts = messages[0].parts;

      expect(parts).toHaveLength(3);
      expect(parts[0].aggregatedBy).toBe("sentence");
      expect(parts[1].aggregatedBy).toBe("code");
      expect(parts[2].aggregatedBy).toBe("sentence");
    });

    it("handles word-level followed by sentence-level in same message", () => {
      harness.ensureAssistantMessage();

      // Word-level words
      harness.emitBotOutput("Hello", false, "word");
      harness.emitBotOutput("world", false, "word");

      // Then a sentence-level part
      harness.emitBotOutput("This is a full sentence.", false, "sentence");

      const parts = harness.getMessages()[0].parts;

      // Word-level words get merged into one part, sentence gets its own
      expect(parts).toHaveLength(2);
      expect(parts[0].aggregatedBy).toBe("word");
      expect(parts[1].aggregatedBy).toBe("sentence");
    });
  });

  // -----------------------------------------------------------------------
  // Multi-sentence bot response
  // -----------------------------------------------------------------------
  describe("multi-sentence bot response", () => {
    it("creates separate parts for each sentence, spoken advances through them", () => {
      harness.ensureAssistantMessage();

      // 3 sentence-level unspoken events
      harness.emitBotOutput("First sentence.", false, "sentence");
      harness.emitBotOutput("Second sentence.", false, "sentence");
      harness.emitBotOutput("Third sentence.", false, "sentence");

      const parts = harness.getMessages()[0].parts;
      expect(parts).toHaveLength(3);

      // Now spoken events arrive sentence-at-a-time
      harness.emitBotOutput("First sentence.", true, "sentence");
      const cursorAfterFirst = harness.getLastAssistantCursor();
      expect(cursorAfterFirst).toBeDefined();
      expect(cursorAfterFirst!.partFinalFlags[0]).toBe(true);
      expect(cursorAfterFirst!.currentPartIndex).toBe(1);

      harness.emitBotOutput("Second sentence.", true, "sentence");
      const cursorAfterSecond = harness.getLastAssistantCursor();
      expect(cursorAfterSecond!.partFinalFlags[1]).toBe(true);
      expect(cursorAfterSecond!.currentPartIndex).toBe(2);

      harness.emitBotOutput("Third sentence.", true, "sentence");
      const cursorAfterThird = harness.getLastAssistantCursor();
      expect(cursorAfterThird!.partFinalFlags[2]).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Spoken progress skipping non-spoken parts
  // -----------------------------------------------------------------------
  describe("spoken progress through mixed types", () => {
    it("spoken cursor skips code block and advances through surrounding sentences", () => {
      harness.ensureAssistantMessage();

      // Unspoken: sentence → code (not spoken) → sentence
      harness.emitBotOutput("Here is some code:", false, "sentence");
      harness.emitBotOutput("console.log('hi')", false, "code");
      harness.emitBotOutput("Pretty cool right?", false, "sentence");

      // Verify 3 parts created
      expect(harness.getMessages()[0].parts).toHaveLength(3);

      // Spoken: first sentence → cursor should advance through part 0
      harness.emitBotOutput("Here is some code:", true, "sentence");
      const cursorAfterFirst = harness.getLastAssistantCursor();
      expect(cursorAfterFirst!.partFinalFlags[0]).toBe(true);

      // Spoken: "Pretty cool right?" — cursor should skip the code block (part 1)
      // and find this text in part 2 via mismatch recovery
      harness.emitBotOutput("Pretty cool right?", true, "sentence");
      const cursorAfterSecond = harness.getLastAssistantCursor();
      // Code block (part 1) should be marked as skipped/final
      expect(cursorAfterSecond!.partFinalFlags[1]).toBe(true);
      // Cursor should be on part 2
      expect(cursorAfterSecond!.currentPartIndex).toBe(2);
    });

    it("works end-to-end via DSL with botPart isSpoken:false", () => {
      const scenario = conversation()
        .bot("Here is code:", { aggregation: "sentence" })
        .botPart("console.log('hi')", {
          aggregation: "code",
          isSpoken: false,
        })
        .build();

      playScenario(harness, scenario);

      const messages = harness.getMessages();
      expect(messages).toHaveLength(1);

      const parts = messages[0].parts;
      expect(parts).toHaveLength(2);
      expect(parts[0].aggregatedBy).toBe("sentence");
      expect(parts[1].aggregatedBy).toBe("code");

      // Spoken cursor should have advanced through the sentence only
      const cursor = harness.getLastAssistantCursor();
      expect(cursor).toBeDefined();
      expect(cursor!.partFinalFlags[0]).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Spoken-only bot
  // -----------------------------------------------------------------------
  describe("spoken-only bot", () => {
    it("creates parts directly from spoken events", () => {
      const scenario = conversation()
        .bot("Hello how are you", { spokenOnly: true })
        .build();

      playScenario(harness, scenario);

      const messages = harness.getMessages();
      expectMessages(messages, [{ role: "assistant", final: true }]);

      // Parts should have been created from spoken events
      expect(messages[0].parts.length).toBeGreaterThan(0);
    });

    it("has cursor at the end after all words spoken", () => {
      const scenario = conversation()
        .bot("Hello world", { spokenOnly: true })
        .build();

      playScenario(harness, scenario);

      const cursor = harness.getLastAssistantCursor();
      expect(cursor).toBeDefined();
      expect(cursor!.currentCharIndex).toBeGreaterThan(0);
    });
  });
});
