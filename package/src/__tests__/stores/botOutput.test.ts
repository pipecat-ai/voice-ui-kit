import { describe, expect, it } from "vitest";
import {
  applySpokenBotOutputProgress,
  hasUnspokenContent,
  type BotOutputMessageCursor,
} from "@/stores/botOutput";
import type { ConversationMessagePart } from "@/types/conversation";

/** Helper: create a simple text part. */
function textPart(text: string): ConversationMessagePart {
  return { text, final: false, createdAt: new Date().toISOString() };
}

/** Helper: create a fresh cursor for a given number of parts. */
function cursor(partCount: number): BotOutputMessageCursor {
  return {
    currentPartIndex: 0,
    currentCharIndex: 0,
    partFinalFlags: Array(partCount).fill(false),
  };
}

describe("hasUnspokenContent", () => {
  it("returns false for empty parts", () => {
    const c = cursor(0);
    expect(hasUnspokenContent(c, [])).toBe(false);
  });

  it("returns true when a text part has not been spoken", () => {
    const parts = [textPart("Hello world")];
    const c = cursor(1);
    expect(hasUnspokenContent(c, parts)).toBe(true);
  });

  it("returns false when all text parts are spoken", () => {
    const parts = [textPart("Hello"), textPart("World")];
    const c = cursor(2);
    c.partFinalFlags[0] = true;
    c.partFinalFlags[1] = true;
    expect(hasUnspokenContent(c, parts)).toBe(false);
  });

  it("returns true when only some parts are spoken", () => {
    const parts = [textPart("First"), textPart("Second"), textPart("Third")];
    const c = cursor(3);
    c.partFinalFlags[0] = true;
    // parts[1] and [2] are not yet spoken
    expect(hasUnspokenContent(c, parts)).toBe(true);
  });

  it("skips non-string text parts", () => {
    const parts: ConversationMessagePart[] = [
      { text: null as unknown as string, final: false, createdAt: "" },
    ];
    const c = cursor(1);
    // The only part has non-string text, so no unspoken string content exists
    expect(hasUnspokenContent(c, parts)).toBe(false);
  });

  it("returns true when non-string parts are mixed with unspoken string parts", () => {
    const parts: ConversationMessagePart[] = [
      { text: null as unknown as string, final: false, createdAt: "" },
      textPart("Some text"),
    ];
    const c = cursor(2);
    // First part is non-string (skipped), second part is string and not spoken
    expect(hasUnspokenContent(c, parts)).toBe(true);
  });
});

describe("applySpokenBotOutputProgress", () => {
  describe("basic word-level advancement", () => {
    it("advances cursor through a single word", () => {
      const parts = [textPart("Hello world")];
      const c = cursor(1);

      const result = applySpokenBotOutputProgress(c, parts, "Hello");

      expect(result).toBe(true);
      expect(c.currentCharIndex).toBeGreaterThan(0);
      expect(c.currentCharIndex).toBeLessThanOrEqual("Hello ".length);
    });

    it("advances cursor through multiple sequential words", () => {
      const parts = [textPart("Hello world today")];
      const c = cursor(1);

      applySpokenBotOutputProgress(c, parts, "Hello");
      applySpokenBotOutputProgress(c, parts, "world");
      const result = applySpokenBotOutputProgress(c, parts, "today");

      expect(result).toBe(true);
      // After all words spoken, cursor should be at the end
      expect(c.currentCharIndex).toBe("Hello world today".length);
    });

    it("advances past punctuation correctly", () => {
      const parts = [textPart("Hello, world! How are you?")];
      const c = cursor(1);

      applySpokenBotOutputProgress(c, parts, "Hello,");
      const result = applySpokenBotOutputProgress(c, parts, "world!");

      expect(result).toBe(true);
      expect(c.currentCharIndex).toBeGreaterThan("Hello, ".length);
    });

    it("handles case-insensitive matching", () => {
      const parts = [textPart("Hello World")];
      const c = cursor(1);

      const result = applySpokenBotOutputProgress(c, parts, "hello");

      expect(result).toBe(true);
      expect(c.currentCharIndex).toBeGreaterThan(0);
    });

    it("returns true when cursor advances, false when it cannot", () => {
      const parts = [textPart("Hello world")];
      const c = cursor(1);

      expect(applySpokenBotOutputProgress(c, parts, "Hello")).toBe(true);
      // A completely mismatched word at a non-zero position should fail
      // (mismatch recovery only jumps to later parts, and there are none)
      expect(applySpokenBotOutputProgress(c, parts, "bananas")).toBe(false);
    });
  });

  describe("sentence-level matching", () => {
    it("consumes entire part when spoken matches full remaining text", () => {
      const parts = [textPart("Hello, how are you today?")];
      const c = cursor(1);

      const result = applySpokenBotOutputProgress(
        c,
        parts,
        "Hello, how are you today?",
      );

      expect(result).toBe(true);
      expect(c.currentCharIndex).toBe("Hello, how are you today?".length);
      expect(c.partFinalFlags[0]).toBe(true);
    });

    it("consumes part even with minor punctuation differences", () => {
      const parts = [textPart("Hello, how are you?")];
      const c = cursor(1);

      // Spoken text without punctuation should still match via normalization
      const result = applySpokenBotOutputProgress(
        c,
        parts,
        "Hello how are you",
      );

      expect(result).toBe(true);
      expect(c.currentCharIndex).toBe("Hello, how are you?".length);
    });
  });

  describe("multi-part traversal", () => {
    it("moves to next part when current part is fully consumed", () => {
      const parts = [textPart("Hello"), textPart("World")];
      const c = cursor(2);

      applySpokenBotOutputProgress(c, parts, "Hello");

      expect(c.partFinalFlags[0]).toBe(true);
      expect(c.currentPartIndex).toBe(1);
      expect(c.currentCharIndex).toBe(0);

      applySpokenBotOutputProgress(c, parts, "World");

      expect(c.partFinalFlags[1]).toBe(true);
    });

    it("skips parts already marked as final in partFinalFlags", () => {
      const parts = [textPart("First"), textPart("Second"), textPart("Third")];
      const c = cursor(3);
      c.partFinalFlags[0] = true; // Already spoken
      c.partFinalFlags[1] = true; // Already spoken

      const result = applySpokenBotOutputProgress(c, parts, "Third");

      expect(result).toBe(true);
      expect(c.currentPartIndex).toBe(2);
    });
  });

  describe("mismatch recovery", () => {
    it("finds spoken text in a later part when current part mismatches", () => {
      const parts = [
        textPart("Code block content"),
        textPart("After the code block"),
      ];
      const c = cursor(2);

      // Spoken text matches second part, not first
      const result = applySpokenBotOutputProgress(c, parts, "After");

      expect(result).toBe(true);
      // Should have jumped to part index 1
      expect(c.currentPartIndex).toBe(1);
      // First part should be marked as final (skipped)
      expect(c.partFinalFlags[0]).toBe(true);
    });

    it("marks all skipped parts as final when jumping forward", () => {
      const parts = [
        textPart("Part A"),
        textPart("Part B"),
        textPart("Part C"),
      ];
      const c = cursor(3);

      const result = applySpokenBotOutputProgress(c, parts, "Part C");

      expect(result).toBe(true);
      expect(c.partFinalFlags[0]).toBe(true);
      expect(c.partFinalFlags[1]).toBe(true);
      expect(c.currentPartIndex).toBe(2);
    });
  });

  describe("deadlock prevention", () => {
    it("skips stuck part when at position 0 with no match", () => {
      const parts = [textPart("Mismatched"), textPart("Actual speech")];
      const c = cursor(2);

      // No words in "Mismatched" match "Actual"
      const result = applySpokenBotOutputProgress(c, parts, "Actual");

      expect(result).toBe(true);
      // Should have recovered to part 1
      expect(c.currentPartIndex).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("returns false for empty parts array", () => {
      const c = cursor(0);
      expect(applySpokenBotOutputProgress(c, [], "hello")).toBe(false);
    });

    it("returns false when all parts are already final", () => {
      const parts = [textPart("Done")];
      const c = cursor(1);
      c.partFinalFlags[0] = true;

      expect(applySpokenBotOutputProgress(c, parts, "more text")).toBe(false);
    });

    it("handles leading whitespace in spoken text", () => {
      const parts = [textPart("Hello world")];
      const c = cursor(1);

      // Spoken text with leading space (as ConversationProvider prepends)
      const result = applySpokenBotOutputProgress(c, parts, " Hello");

      expect(result).toBe(true);
      expect(c.currentCharIndex).toBeGreaterThan(0);
    });

    it("handles contraction matching", () => {
      const parts = [textPart("I'm doing great")];
      const c = cursor(1);

      // "I" should prefix-match "I'm"
      const result = applySpokenBotOutputProgress(c, parts, "I");

      expect(result).toBe(true);
    });

    it("returns false for non-string part text", () => {
      // Part with non-string text (e.g. ReactNode)
      const parts: ConversationMessagePart[] = [
        { text: null as unknown as string, final: false, createdAt: "" },
      ];
      const c = cursor(1);

      expect(applySpokenBotOutputProgress(c, parts, "hello")).toBe(false);
    });
  });
});
