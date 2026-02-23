import type { BotOutputText, ConversationMessage } from "@/types/conversation";
import { expect } from "vitest";

/**
 * Extract the raw string text from all parts of a message.
 * For store-level tests, parts store text as plain strings.
 */
export function getRawPartTexts(message: ConversationMessage): string[] {
  return message.parts
    .filter((p) => typeof p.text === "string")
    .map((p) => p.text as string);
}

/**
 * Get the combined text of an assistant message (all parts joined).
 */
export function getAssistantText(message: ConversationMessage): string {
  return message.parts
    .map((p) => {
      if (typeof p.text === "string") return p.text;
      if (
        p.text &&
        typeof p.text === "object" &&
        "spoken" in p.text &&
        "unspoken" in p.text
      ) {
        const t = p.text as BotOutputText;
        return t.spoken + t.unspoken;
      }
      return "";
    })
    .join("");
}

/**
 * Get the user transcript text from a user message.
 */
export function getUserText(message: ConversationMessage): string {
  return message.parts
    .map((p) => (typeof p.text === "string" ? (p.text as string) : ""))
    .join(" ")
    .trim();
}

/**
 * Assert the high-level structure of a messages array.
 */
export function expectMessages(
  messages: ConversationMessage[],
  expected: Array<{
    role: "user" | "assistant" | "system";
    final?: boolean;
    textContains?: string;
    partCount?: number;
  }>,
) {
  expect(messages).toHaveLength(expected.length);
  expected.forEach((exp, i) => {
    const msg = messages[i];
    expect(msg.role).toBe(exp.role);
    if (exp.final !== undefined) {
      expect(msg.final).toBe(exp.final);
    }
    if (exp.partCount !== undefined) {
      expect(msg.parts).toHaveLength(exp.partCount);
    }
    if (exp.textContains) {
      const text =
        msg.role === "assistant"
          ? getRawPartTexts(msg).join("")
          : getUserText(msg);
      expect(text).toContain(exp.textContains);
    }
  });
}
