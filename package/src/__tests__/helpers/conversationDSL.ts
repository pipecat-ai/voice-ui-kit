import type { StoreHarness } from "./storeHarness";
import type { ConversationMessage } from "@/types/conversation";
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Step types
// ---------------------------------------------------------------------------

export type ScenarioStep =
  | { type: "botOutput"; text: string; spoken: boolean; aggregatedBy?: string }
  | { type: "botStartedSpeaking" }
  | { type: "botStoppedSpeaking" }
  | { type: "userStartedSpeaking" }
  | { type: "userStoppedSpeaking" }
  | { type: "userTranscript"; text: string; final: boolean }
  | { type: "wait"; ms: number };

export interface ConversationScenario {
  steps: ScenarioStep[];
}

// ---------------------------------------------------------------------------
// Builder options
// ---------------------------------------------------------------------------

interface BotTurnOptions {
  /** How text is chunked: "word" sends one event per word, "sentence" sends one event for the whole text. Default: "word". */
  aggregation?: "word" | "sentence";
  /** If true, only spoken events are emitted (no unspoken). Default: false. */
  spokenOnly?: boolean;
}

interface BotPartOptions {
  /** Custom aggregation type (e.g. "code", "link"). */
  aggregation: string;
  /** Display mode. Default: "inline". */
  displayMode?: "inline" | "block";
  /** Whether this part is spoken by TTS. If false, no spoken events are emitted. Default: true. */
  isSpoken?: boolean;
}

// ---------------------------------------------------------------------------
// Internal turn representation
// ---------------------------------------------------------------------------

type Turn =
  | { kind: "bot"; text: string; options: BotTurnOptions }
  | { kind: "botPart"; text: string; options: BotPartOptions }
  | { kind: "user"; text: string }
  | { kind: "interruptAfter"; spokenUpTo: string };

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

class ConversationBuilder {
  private turns: Turn[] = [];

  /**
   * Add a bot turn. Text will be split into events per the aggregation mode.
   */
  bot(text: string, options: BotTurnOptions = {}): this {
    this.turns.push({ kind: "bot", text, options });
    return this;
  }

  /**
   * Add a custom-aggregation bot part (e.g. code block) within the current
   * assistant message. Does NOT emit speaking events on its own — it's part
   * of the surrounding bot turn.
   */
  botPart(text: string, options: BotPartOptions): this {
    this.turns.push({ kind: "botPart", text, options });
    return this;
  }

  /**
   * Mark that the user interrupts the preceding bot turn after the bot has
   * spoken up to (and including) the given text fragment.
   *
   * Example: `.bot("Hello, how are you today?").interruptAfter("how are")`
   * means the bot's spoken events stop after "how" and "are" are spoken.
   */
  interruptAfter(spokenUpTo: string): this {
    this.turns.push({ kind: "interruptAfter", spokenUpTo });
    return this;
  }

  /**
   * Add a user turn. Text will be split into incremental transcripts.
   */
  user(text: string): this {
    this.turns.push({ kind: "user", text });
    return this;
  }

  /**
   * Build the scenario into a flat step sequence.
   */
  build(): ConversationScenario {
    const steps: ScenarioStep[] = [];
    const turns = this.turns;

    for (let ti = 0; ti < turns.length; ti++) {
      const turn = turns[ti];

      if (turn.kind === "bot") {
        const { aggregation = "word", spokenOnly = false } = turn.options;

        // Check if next turn(s) are botPart (continuation of same assistant message)
        // or interruptAfter (modifies this turn's spoken events).
        const pendingParts: Turn[] = [];
        let interrupt: { spokenUpTo: string } | null = null;

        let lookahead = ti + 1;
        while (lookahead < turns.length) {
          const next = turns[lookahead];
          if (next.kind === "botPart") {
            pendingParts.push(next);
            lookahead++;
          } else if (next.kind === "interruptAfter") {
            interrupt = { spokenUpTo: next.spokenUpTo };
            lookahead++;
            break; // interrupt ends the bot's turn
          } else {
            break;
          }
        }
        // Skip turns we consumed in lookahead
        ti = lookahead - 1;

        // Collect all content segments for this assistant message
        const segments: Array<{
          text: string;
          aggregatedBy: string;
          words: string[];
          isSpoken: boolean;
        }> = [];

        // Main bot text
        const mainWords = splitWords(turn.text);
        segments.push({
          text: turn.text,
          aggregatedBy: aggregation,
          words: mainWords,
          isSpoken: true,
        });

        // Pending botPart segments
        for (const part of pendingParts) {
          if (part.kind === "botPart") {
            segments.push({
              text: part.text,
              aggregatedBy: part.options.aggregation,
              words: splitWords(part.text),
              isSpoken: part.options.isSpoken !== false,
            });
          }
        }

        // --- Emit events ---
        steps.push({ type: "botStartedSpeaking" });

        // 1. Unspoken events (all segments, unless spokenOnly)
        if (!spokenOnly) {
          for (const seg of segments) {
            if (seg.aggregatedBy === "word") {
              for (const word of seg.words) {
                steps.push({
                  type: "botOutput",
                  text: word,
                  spoken: false,
                  aggregatedBy: "word",
                });
              }
            } else {
              // Sentence-level or custom: one event for the whole text
              steps.push({
                type: "botOutput",
                text: seg.text,
                spoken: false,
                aggregatedBy: seg.aggregatedBy,
              });
            }
          }
        }

        // 2. Spoken events
        if (interrupt) {
          // Only emit spoken words up to the interrupt point
          const interruptWords = splitWords(interrupt.spokenUpTo);
          const allSpokenWords = segments.flatMap((seg) =>
            seg.aggregatedBy === "word" ? seg.words : [seg.text],
          );

          let matched = 0;
          for (const word of allSpokenWords) {
            if (matched >= interruptWords.length) break;
            // Check if this spoken word matches the next interrupt word
            const wordNorm = word.toLowerCase().replace(/[^\w\s]/g, "");
            const targetNorm = interruptWords[matched]
              .toLowerCase()
              .replace(/[^\w\s]/g, "");
            steps.push({
              type: "botOutput",
              text: word,
              spoken: true,
              aggregatedBy: "word",
            });
            if (wordNorm === targetNorm || wordNorm.startsWith(targetNorm)) {
              matched++;
            }
          }

          // Interrupt: user starts speaking, which finalizes the assistant message
          steps.push({ type: "userStartedSpeaking" });
        } else {
          // Full spoken events for all spoken segments
          for (const seg of segments) {
            if (!seg.isSpoken) continue;
            if (seg.aggregatedBy === "word" || spokenOnly) {
              for (const word of seg.words) {
                steps.push({
                  type: "botOutput",
                  text: word,
                  spoken: true,
                  aggregatedBy: seg.aggregatedBy,
                });
              }
            } else {
              // Sentence-level or custom: one spoken event
              steps.push({
                type: "botOutput",
                text: seg.text,
                spoken: true,
                aggregatedBy: seg.aggregatedBy,
              });
            }
          }

          steps.push({ type: "botStoppedSpeaking" });
          // Wait for finalize timeout
          steps.push({ type: "wait", ms: 2500 });
        }
      } else if (turn.kind === "user") {
        steps.push({ type: "userStartedSpeaking" });

        // Incremental transcripts: build up word by word
        const words = splitWords(turn.text);
        for (let wi = 0; wi < words.length; wi++) {
          const partial = words.slice(0, wi + 1).join(" ");
          const isFinal = wi === words.length - 1;
          steps.push({
            type: "userTranscript",
            text: partial,
            final: isFinal,
          });
        }

        steps.push({ type: "userStoppedSpeaking" });
      }
      // botPart and interruptAfter are handled inline with the preceding bot turn
    }

    return { steps };
  }
}

/**
 * Start building a conversation scenario.
 */
export function conversation(): ConversationBuilder {
  return new ConversationBuilder();
}

// ---------------------------------------------------------------------------
// Scenario player
// ---------------------------------------------------------------------------

/**
 * Play a scenario against a store harness, executing each step in order.
 * Timer-based steps (wait) use vi.advanceTimersByTime, so the caller
 * must have called vi.useFakeTimers() beforehand.
 *
 * This replicates the ConversationProvider's event handler orchestration:
 * - botStartedSpeaking: clears botStopped finalize timer
 * - botStoppedSpeaking: starts 2500ms finalize timer
 * - userStartedSpeaking: immediately finalizes pending assistant message
 * - userStoppedSpeaking: starts 3000ms cleanup timer
 */
export function playScenario(
  harness: StoreHarness,
  scenario: ConversationScenario,
) {
  // Timer IDs tracked locally (mirrors ConversationProvider refs)
  let botStoppedTimeout: ReturnType<typeof setTimeout> | undefined;
  let userStoppedTimeout: ReturnType<typeof setTimeout> | undefined;

  for (const step of scenario.steps) {
    switch (step.type) {
      case "botOutput":
        // A BotOutput event means the response is still active; cancel any
        // pending finalize timer from BotStoppedSpeaking to avoid premature
        // finalization mid-response.
        if (botStoppedTimeout !== undefined) {
          clearTimeout(botStoppedTimeout);
          botStoppedTimeout = undefined;
        }
        harness.emitBotOutput(step.text, step.spoken, step.aggregatedBy);
        break;

      case "botStartedSpeaking":
        if (botStoppedTimeout !== undefined) {
          clearTimeout(botStoppedTimeout);
          botStoppedTimeout = undefined;
        }
        break;

      case "botStoppedSpeaking": {
        if (botStoppedTimeout !== undefined) {
          clearTimeout(botStoppedTimeout);
        }
        const messages = harness.getMessages();
        const lastAssistant = messages.findLast(
          (m: ConversationMessage) => m.role === "assistant",
        );
        if (!lastAssistant || lastAssistant.final) break;
        botStoppedTimeout = setTimeout(() => {
          botStoppedTimeout = undefined;
          harness.finalizeAssistant();
        }, 2500);
        break;
      }

      case "userStartedSpeaking":
        // Immediately finalize pending assistant message
        if (botStoppedTimeout !== undefined) {
          clearTimeout(botStoppedTimeout);
          botStoppedTimeout = undefined;
        }
        harness.finalizeAssistantIfPending();
        if (userStoppedTimeout !== undefined) {
          clearTimeout(userStoppedTimeout);
          userStoppedTimeout = undefined;
        }
        break;

      case "userTranscript":
        harness.emitUserTranscript(step.text, step.final);
        if (userStoppedTimeout !== undefined) {
          clearTimeout(userStoppedTimeout);
          userStoppedTimeout = undefined;
        }
        break;

      case "userStoppedSpeaking": {
        if (userStoppedTimeout !== undefined) {
          clearTimeout(userStoppedTimeout);
        }
        userStoppedTimeout = setTimeout(() => {
          const msgs = harness.getMessages();
          const lastUser = msgs.findLast(
            (m: ConversationMessage) => m.role === "user",
          );
          const hasParts =
            Array.isArray(lastUser?.parts) && lastUser!.parts.length > 0;
          if (!lastUser || !hasParts) {
            harness.removeEmptyLastUserMessage();
          } else if (!lastUser.final) {
            harness.finalizeUser();
          }
        }, 3000);
        break;
      }

      case "wait":
        vi.advanceTimersByTime(step.ms);
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}
