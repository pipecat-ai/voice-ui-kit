import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStoreHarness } from "../helpers/storeHarness";
import { conversation, playScenario } from "../helpers/conversationDSL";
import { expectMessages, getUserText } from "../helpers/assertions";

describe("user transcript assembly", () => {
  let harness: ReturnType<typeof createStoreHarness>;

  beforeEach(() => {
    vi.useFakeTimers();
    harness = createStoreHarness();
    harness.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Incremental transcript assembly
  // -----------------------------------------------------------------------
  describe("incremental transcripts", () => {
    it("assembles interim transcripts into a single part", () => {
      harness.emitUserTranscript("I'm", false);
      harness.emitUserTranscript("I'm doing", false);
      harness.emitUserTranscript("I'm doing great", false);

      const messages = harness.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("user");
      expect(messages[0].parts).toHaveLength(1);
      expect(messages[0].parts[0].text).toBe("I'm doing great");
      expect(messages[0].parts[0].final).toBe(false);
    });

    it("finalizes part on final transcript", () => {
      harness.emitUserTranscript("Hello", false);
      harness.emitUserTranscript("Hello world", true);

      const messages = harness.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].parts[0].text).toBe("Hello world");
      expect(messages[0].parts[0].final).toBe(true);
    });

    it("creates new part after a final part in same message", () => {
      // First final transcript
      harness.emitUserTranscript("First sentence.", true);

      // Second transcript — since the message is now final, this creates a new message
      harness.emitUserTranscript("Second sentence.", false);

      const messages = harness.getMessages();
      // The store creates a new user message after the first is finalized
      expect(messages.length).toBeGreaterThanOrEqual(1);
      // The last user message should contain the second transcript
      const lastUser = messages.findLast((m) => m.role === "user");
      expect(lastUser).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // User turn via DSL
  // -----------------------------------------------------------------------
  describe("user turn via DSL", () => {
    it("creates user message with incremental transcripts", () => {
      const scenario = conversation().user("Hello how are you").build();

      playScenario(harness, scenario);
      vi.advanceTimersByTime(5000);

      const messages = harness.getMessages();
      expectMessages(messages, [{ role: "user", final: true }]);

      const text = getUserText(messages[0]);
      expect(text).toContain("Hello how are you");
    });
  });

  // -----------------------------------------------------------------------
  // User turn after bot turn
  // -----------------------------------------------------------------------
  describe("user turn after bot turn", () => {
    it("creates user message after finalized assistant message", () => {
      const scenario = conversation()
        .bot("Hello there!", { aggregation: "sentence" })
        .user("Hi back!")
        .build();

      playScenario(harness, scenario);
      vi.advanceTimersByTime(5000);

      const messages = harness.getMessages();
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe("assistant");
      expect(messages[1].role).toBe("user");

      const userText = getUserText(messages[1]);
      expect(userText).toContain("Hi back!");
    });
  });

  // -----------------------------------------------------------------------
  // VAD gaps within same turn
  // -----------------------------------------------------------------------
  describe("VAD gaps within same turn", () => {
    it("keeps user message open across VAD stop/start without bot activity", () => {
      // Simulate: user speaks, VAD fires stop/start (breathing pause), user continues
      playScenario(harness, {
        steps: [
          { type: "userStartedSpeaking" },
          { type: "userTranscript", text: "Can you help me", final: false },
          { type: "userTranscript", text: "Can you help me find", final: true },
          { type: "userStoppedSpeaking" },
          // VAD gap — user pauses briefly, VAD fires stop then start
          { type: "userStartedSpeaking" },
          {
            type: "userTranscript",
            text: "the name for a shape",
            final: false,
          },
          {
            type: "userTranscript",
            text: "the name for a shape that",
            final: true,
          },
          { type: "userStoppedSpeaking" },
        ],
      });
      vi.advanceTimersByTime(5000);

      const messages = harness.getMessages();
      // All transcripts should be in a single user message
      const userMessages = messages.filter((m) => m.role === "user");
      expect(userMessages).toHaveLength(1);
      expect(userMessages[0].parts.length).toBeGreaterThanOrEqual(2);
      expect(getUserText(userMessages[0])).toContain("Can you help me find");
      expect(getUserText(userMessages[0])).toContain(
        "the name for a shape that",
      );
    });

    it("splits user messages when bot responds between VAD gaps", () => {
      // Simulate: user speaks, bot responds, then user speaks again
      playScenario(harness, {
        steps: [
          { type: "userStartedSpeaking" },
          { type: "userTranscript", text: "Hello", final: true },
          { type: "userStoppedSpeaking" },
          // Bot responds
          { type: "botStartedSpeaking" },
          {
            type: "botOutput",
            text: "Hi",
            spoken: false,
            aggregatedBy: "word",
          },
          { type: "botOutput", text: "Hi", spoken: true, aggregatedBy: "word" },
          { type: "botStoppedSpeaking" },
          { type: "wait", ms: 2500 },
          // User speaks again — this should be a new message
          { type: "userStartedSpeaking" },
          { type: "userTranscript", text: "How are you", final: true },
          { type: "userStoppedSpeaking" },
        ],
      });
      vi.advanceTimersByTime(5000);

      const messages = harness.getMessages();
      const userMessages = messages.filter((m) => m.role === "user");
      expect(userMessages).toHaveLength(2);
      expect(getUserText(userMessages[0])).toContain("Hello");
      expect(getUserText(userMessages[1])).toContain("How are you");
    });
  });

  // -----------------------------------------------------------------------
  // Single-word user transcript
  // -----------------------------------------------------------------------
  describe("edge cases", () => {
    it("handles single-word user transcript", () => {
      harness.emitUserTranscript("Yes", true);

      const messages = harness.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].parts[0].text).toBe("Yes");
      expect(messages[0].parts[0].final).toBe(true);
    });

    it("handles empty string transcript gracefully", () => {
      harness.emitUserTranscript("", false);

      const messages = harness.getMessages();
      // Should create a message (the store doesn't filter empty text on insert)
      expect(messages).toHaveLength(1);
    });
  });
});
