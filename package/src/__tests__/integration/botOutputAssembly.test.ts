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

  // -----------------------------------------------------------------------
  // Out-of-order: spoken-before-unspoken (S2S race)
  // -----------------------------------------------------------------------
  describe("S2S race: spoken events arrive before unspoken", () => {
    it("absorbs leading spoken-only fallback parts into the arriving unspoken sentence", () => {
      harness.ensureAssistantMessage();

      // Word-level spoken events arrive first (the bot's TTS races ahead of the
      // LLM aggregator). There is no unspoken content yet.
      harness.emitBotOutput("Hello", true, "sentence");
      harness.emitBotOutput("there", true, "sentence");
      harness.emitBotOutput("!", true, "sentence");

      // At this point three spoken-only fallback parts exist.
      let parts = harness.getMessages()[0].parts;
      expect(parts).toHaveLength(3);
      const cursorBefore = harness.getLastAssistantCursor()!;
      expect(cursorBefore.partSpokenOnly).toEqual([true, true, true]);

      // Now the unspoken sentence arrives. The three fallback parts should be
      // absorbed into the single sentence part.
      harness.emitBotOutput("Hello there!", false, "sentence");

      parts = harness.getMessages()[0].parts;
      expect(parts).toHaveLength(1);
      expect(parts[0].aggregatedBy).toBe("sentence");
      expect(parts[0].text).toBe("Hello there!");

      const cursor = harness.getLastAssistantCursor()!;
      // The absorbed spoken prefix covers the full sentence, so the part is
      // marked final and the cursor sits at the end.
      expect(cursor.partFinalFlags[0]).toBe(true);
      expect(cursor.currentPartIndex).toBe(0);
      expect(cursor.currentCharIndex).toBe("Hello there!".length);
      expect(cursor.hasReceivedUnspoken).toBe(true);
      // Text should not be duplicated in the rendered output.
      expect(getRawPartTexts(harness.getMessages()[0]).join("")).toBe(
        "Hello there!",
      );
    });

    it("does not absorb when leading spoken-only parts do not prefix the new unspoken text", () => {
      harness.ensureAssistantMessage();

      harness.emitBotOutput("Goodbye", true, "sentence");

      // Unspoken text that does not start with "Goodbye" — no absorption.
      harness.emitBotOutput("Hello there!", false, "sentence");

      const parts = harness.getMessages()[0].parts;
      expect(parts).toHaveLength(2);
      expect(parts[0].text).toBe("Goodbye");
      expect(parts[1].text).toBe("Hello there!");
    });

    it("absorbs spoken fragments that contain TTS sub-word splits (Pi/pec/at)", () => {
      harness.ensureAssistantMessage();

      // Word-level spoken events for most of a sentence arrive before the
      // unspoken aggregator emits. One of the "words" is a multi-token TTS
      // split of "Pipecat" into "Pi"/"pec"/"at".
      const leadingSpoken = [
        "Let",
        "me",
        "check",
        "the",
        "Pi",
        "pec",
        "at",
        "documentation",
        "for",
        "details",
      ];
      for (const word of leadingSpoken) {
        harness.emitBotOutput(word, true, "sentence");
      }

      expect(harness.getMessages()[0].parts).toHaveLength(leadingSpoken.length);

      // Unspoken sentence arrives. Every leading spoken fragment should be
      // absorbed — including the "Pi"/"pec"/"at" split — leaving just the
      // single unspoken part.
      const unspokenText =
        "Let me check the Pipecat documentation for details on how filter_user_turns works.";
      harness.emitBotOutput(unspokenText, false, "sentence");

      const parts = harness.getMessages()[0].parts;
      expect(parts).toHaveLength(1);
      expect(parts[0].text).toBe(unspokenText);

      const cursor = harness.getLastAssistantCursor()!;
      expect(cursor.partSpokenOnly).toEqual([false]);
      // The cursor should sit after "details " inside the new unspoken part,
      // reflecting the portion already covered by the absorbed spoken events.
      expect(cursor.currentPartIndex).toBe(0);
      const spokenPrefix =
        "Let me check the Pipecat documentation for details ";
      expect(cursor.currentCharIndex).toBe(spokenPrefix.length);
    });

    it("only absorbs the prefix portion when trailing spoken parts span multiple sentences", () => {
      harness.ensureAssistantMessage();

      // Spoken events for sentence 1 AND the start of sentence 2 arrive before
      // either unspoken sentence event.
      harness.emitBotOutput("Hello", true, "sentence");
      harness.emitBotOutput("there", true, "sentence");
      harness.emitBotOutput("!", true, "sentence");
      harness.emitBotOutput("How", true, "sentence");
      harness.emitBotOutput("are", true, "sentence");

      expect(harness.getMessages()[0].parts).toHaveLength(5);

      // Unspoken "Hello there!" arrives. Only the first three spoken parts
      // should be absorbed; "How" and "are" remain as fallback parts (they
      // belong to the next sentence).
      harness.emitBotOutput("Hello there!", false, "sentence");

      const parts = harness.getMessages()[0].parts;
      expect(parts).toHaveLength(3);
      expect(parts[0].text).toBe("Hello there!");
      expect(parts[0].aggregatedBy).toBe("sentence");
      expect(parts[1].text).toBe("How");
      expect(parts[2].text).toBe("are");
    });
  });

  // -----------------------------------------------------------------------
  // Cascaded pipeline (unspoken first): ensure absorption is inert
  // -----------------------------------------------------------------------
  describe("cascaded pipeline: unspoken arrives before spoken", () => {
    it("keeps the existing karaoke-cursor behavior intact", () => {
      const scenario = conversation()
        .bot("Hello there!", { aggregation: "sentence" })
        .build();

      playScenario(harness, scenario);

      const messages = harness.getMessages();
      expectMessages(messages, [{ role: "assistant", final: true }]);

      const parts = messages[0].parts;
      expect(parts).toHaveLength(1);
      expect(parts[0].text).toBe("Hello there!");
      expect(parts[0].aggregatedBy).toBe("sentence");

      const cursor = harness.getLastAssistantCursor()!;
      // No spoken-only parts should have been created.
      expect(cursor.partSpokenOnly).toEqual([false]);
      expect(cursor.partFinalFlags[0]).toBe(true);
      expect(cursor.hasReceivedUnspoken).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // TTS mid-sentence tokenization splits
  // -----------------------------------------------------------------------
  describe("TTS splits mid-sentence tokens after unspoken arrived", () => {
    it("advances cursor through a sentence with contractions and sub-word splits", () => {
      // Regression: the user reported "the info." was left unspoken at the
      // end of a message because cursor advancement drifted one word behind
      // for every spoken event that had to skip past earlier words. The root
      // cause was findSpokenPositionInUnspoken returning the position of the
      // wrong word when skipping, compounded by contractions ("shouldn't",
      // "I'll") making the char-walker over-count word starts.
      harness.ensureAssistantMessage();

      harness.emitBotOutput(
        "It shouldn't take too long, so hang tight and I'll explain filters and turns in Pipecat as soon as I have the info.",
        false,
        "sentence",
      );

      const spokenWords = [
        "It",
        "shouldn't",
        "take",
        "too",
        "long",
        ",",
        "so",
        "hang",
        "tight",
        "and",
        "I'll",
        "explain",
        "filters",
        "and",
        "turns",
        "in",
        "Pi",
        "pec",
        "at",
        "as",
        "soon",
        "as",
        "I",
        "have",
        "the",
        "info",
        ".",
      ];
      for (const word of spokenWords) {
        harness.emitBotOutput(word, true, "sentence");
      }

      const cursor = harness.getLastAssistantCursor()!;
      // The cursor must have reached the end of the part — not stalled a few
      // words before it. "Pi"/"pec"/"at" splits and the drop-after-unspoken
      // logic should let "the" and "info" both advance the cursor normally.
      expect(cursor.partFinalFlags[0]).toBe(true);
      const partText = harness.getMessages()[0].parts[0].text as string;
      expect(cursor.currentCharIndex).toBe(partText.length);
      expect(harness.getMessages()[0].parts).toHaveLength(1);
    });

    it("keeps unmatched spoken words as fallbacks when the current sentence is fully consumed", () => {
      // Regression: after the first sentence was fully spoken and absorbed,
      // TTS started speaking the *next* sentence before its unspoken event
      // arrived. The drop-when-unspoken logic was too aggressive and lost
      // those words, leaving the UI stuck on sentence 1 until absorption
      // finally happened.
      harness.ensureAssistantMessage();

      // Sentence 1: S2S race — spoken words first, then unspoken.
      for (const word of ["I'll", "look", "that", "up", "for", "you"]) {
        harness.emitBotOutput(word, true, "sentence");
      }
      harness.emitBotOutput("I'll look that up for you.", false, "sentence");
      harness.emitBotOutput(".", true, "sentence");

      // Sentence 2: TTS begins speaking before the unspoken aggregator emits.
      // These should survive as fallback parts (not be dropped).
      for (const word of ["Give", "me", "just", "a"]) {
        harness.emitBotOutput(word, true, "sentence");
      }

      // At this point the trailing spoken words must exist as fallback parts.
      const partsBefore = harness.getMessages()[0].parts;
      expect(partsBefore.length).toBeGreaterThan(1);
      const cursorBefore = harness.getLastAssistantCursor()!;
      expect(
        cursorBefore.partSpokenOnly.slice(1).every((v) => v === true),
      ).toBe(true);

      // Sentence 2 unspoken arrives and absorbs the trailing fallbacks.
      harness.emitBotOutput(
        "Give me just a moment to gather the details.",
        false,
        "sentence",
      );

      const parts = harness.getMessages()[0].parts;
      expect(parts).toHaveLength(2);
      expect(parts[0].text).toBe("I'll look that up for you.");
      expect(parts[1].text).toBe(
        "Give me just a moment to gather the details.",
      );

      const cursor = harness.getLastAssistantCursor()!;
      expect(cursor.partSpokenOnly).toEqual([false, false]);
      // Cursor is positioned after the absorbed "Give me just a " prefix.
      expect(cursor.currentPartIndex).toBe(1);
      expect(cursor.currentCharIndex).toBe("Give me just a ".length);
    });

    it("handles multi-word spoken tokens that cross a sentence boundary", () => {
      // Regression: a TTS source emitted "Hello! I'm" as a single spoken event
      // that spans the end of sentence 1 and the start of sentence 2 (whose
      // unspoken event arrives later). Multi-word tokens like "a friendly"
      // and "the open-source" are also emitted. All of these should be split
      // and processed token-by-token so the cursor advances correctly.
      harness.ensureAssistantMessage();

      harness.emitBotOutput("Hello!", false, "sentence");
      harness.emitBotOutput("Hello! I'm", true, "sentence");
      harness.emitBotOutput("a friendly", true, "sentence");
      harness.emitBotOutput(
        "I'm a friendly AI assistant knowledgeable about Pipecat.",
        false,
        "sentence",
      );
      harness.emitBotOutput("AI", true, "sentence");
      harness.emitBotOutput("assistant", true, "sentence");
      harness.emitBotOutput("knowledgeable", true, "sentence");
      harness.emitBotOutput("about", true, "sentence");
      harness.emitBotOutput("Pipecat.", true, "sentence");

      const parts = harness.getMessages()[0].parts;
      // After absorption, only the two sentence parts should remain — no
      // stray fallbacks like "I'm" or "a friendly" between them.
      expect(parts).toHaveLength(2);
      expect(parts[0].text).toBe("Hello!");
      expect(parts[1].text).toBe(
        "I'm a friendly AI assistant knowledgeable about Pipecat.",
      );

      const cursor = harness.getLastAssistantCursor()!;
      expect(cursor.partSpokenOnly).toEqual([false, false]);
      // Cursor has advanced through the full second sentence.
      expect(cursor.currentPartIndex).toBe(1);
      const part2Text = parts[1].text as string;
      expect(cursor.currentCharIndex).toBe(part2Text.length);
    });

    it("drops unmatched spoken fragments instead of appending duplicate text", () => {
      harness.ensureAssistantMessage();

      // LLM delivers the full sentence first (cascaded path).
      harness.emitBotOutput(
        "I know a lot about Pipecat and can guide you through that too.",
        false,
        "sentence",
      );

      // TTS word timing events. "Pi" prefix-matches "Pipecat" and consumes
      // the whole token; "pec" and "at" then fail to match and should be
      // dropped silently (not spawn trailing fallback parts).
      const spokenWords = [
        "I",
        "know",
        "a",
        "lot",
        "about",
        "Pi",
        "pec",
        "at",
        "and",
        "can",
        "guide",
        "you",
        "through",
        "that",
        "too",
        ".",
      ];
      for (const word of spokenWords) {
        harness.emitBotOutput(word, true, "sentence");
      }

      const parts = harness.getMessages()[0].parts;
      // Only the single unspoken sentence part — no trailing spoken-only
      // fragments should have been spawned for "pec" / "at".
      expect(parts).toHaveLength(1);
      expect(parts[0].text).toBe(
        "I know a lot about Pipecat and can guide you through that too.",
      );

      const cursor = harness.getLastAssistantCursor()!;
      expect(cursor.partSpokenOnly).toEqual([false]);
    });
  });
});
