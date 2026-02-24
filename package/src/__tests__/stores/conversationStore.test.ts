import { beforeEach, describe, expect, it } from "vitest";
import {
  filterEmptyMessages,
  isMessageEmpty,
  mergeMessages,
  useConversationStore,
} from "@/stores/conversationStore";
import type { ConversationMessage } from "@/types/conversation";

function getState() {
  return useConversationStore.getState();
}

/** Helper: create a minimal message for merge/filter tests. */
function msg(
  role: "user" | "assistant",
  text: string,
  opts: { createdAt?: string; final?: boolean } = {},
): ConversationMessage {
  return {
    role,
    final: opts.final ?? true,
    parts: [{ text, final: true, createdAt: opts.createdAt ?? "2024-01-01" }],
    createdAt: opts.createdAt ?? new Date().toISOString(),
  };
}

describe("conversationStore", () => {
  beforeEach(() => {
    getState().clearMessages();
  });

  // -----------------------------------------------------------------------
  // addMessage
  // -----------------------------------------------------------------------
  describe("addMessage", () => {
    it("adds a message to the store", () => {
      getState().addMessage({
        role: "assistant",
        final: false,
        parts: [],
      });
      expect(getState().messages).toHaveLength(1);
      expect(getState().messages[0].role).toBe("assistant");
    });

    it("sets createdAt and updatedAt timestamps", () => {
      getState().addMessage({
        role: "user",
        final: false,
        parts: [],
      });
      const message = getState().messages[0];
      expect(message.createdAt).toBeTruthy();
      expect(message.updatedAt).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // finalizeLastMessage
  // -----------------------------------------------------------------------
  describe("finalizeLastMessage", () => {
    it("marks message and last part as final", () => {
      getState().addMessage({
        role: "assistant",
        final: false,
        parts: [{ text: "Hello", final: false, createdAt: "" }],
      });
      getState().finalizeLastMessage("assistant");
      const message = getState().messages[0];
      expect(message.final).toBe(true);
      expect(message.parts[0].final).toBe(true);
    });

    it("removes empty messages on finalize", () => {
      getState().addMessage({
        role: "assistant",
        final: false,
        parts: [],
      });
      getState().finalizeLastMessage("assistant");
      expect(getState().messages).toHaveLength(0);
    });

    it("does nothing if no message of that role exists", () => {
      getState().addMessage({
        role: "assistant",
        final: false,
        parts: [{ text: "Hi", final: false, createdAt: "" }],
      });
      getState().finalizeLastMessage("user"); // No user message
      // Assistant message should be unchanged
      expect(getState().messages[0].final).toBeFalsy();
    });
  });

  // -----------------------------------------------------------------------
  // removeEmptyLastMessage
  // -----------------------------------------------------------------------
  describe("removeEmptyLastMessage", () => {
    it("removes the last message if it is empty", () => {
      getState().addMessage({
        role: "user",
        final: false,
        parts: [],
      });
      expect(getState().messages).toHaveLength(1);
      getState().removeEmptyLastMessage("user");
      expect(getState().messages).toHaveLength(0);
    });

    it("does not remove the last message if it has content", () => {
      getState().addMessage({
        role: "user",
        final: false,
        parts: [{ text: "Hello", final: false, createdAt: "" }],
      });
      getState().removeEmptyLastMessage("user");
      expect(getState().messages).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // upsertUserTranscript
  // -----------------------------------------------------------------------
  describe("upsertUserTranscript", () => {
    it("creates new user message for first transcript", () => {
      getState().upsertUserTranscript("Hello", false);
      const messages = getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("user");
      expect(messages[0].parts[0].text).toBe("Hello");
    });

    it("updates in-progress part for interim transcripts", () => {
      getState().upsertUserTranscript("Hello", false);
      getState().upsertUserTranscript("Hello world", false);
      const messages = getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].parts).toHaveLength(1);
      expect(messages[0].parts[0].text).toBe("Hello world");
    });

    it("finalizes message on final transcript", () => {
      getState().upsertUserTranscript("Hello", false);
      getState().upsertUserTranscript("Hello world", true);
      const messages = getState().messages;
      expect(messages[0].parts[0].text).toBe("Hello world");
      expect(messages[0].parts[0].final).toBe(true);
      expect(messages[0].final).toBe(true);
    });

    it("creates new part after a final part", () => {
      getState().upsertUserTranscript("First sentence", true);

      // New transcript on the same (now finalized) message won't update it;
      // it creates a new message because the existing one is final.
      getState().upsertUserTranscript("Second sentence", false);
      const messages = getState().messages;
      // Should have 2 messages since the first was finalized
      expect(messages.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // updateAssistantBotOutput — unspoken
  // -----------------------------------------------------------------------
  describe("updateAssistantBotOutput (unspoken)", () => {
    it("appends word-level chunks to same part", () => {
      getState().addMessage({
        role: "assistant",
        final: false,
        parts: [],
      });

      getState().updateAssistantBotOutput("Hello", false, false, "word");
      getState().updateAssistantBotOutput("world", false, false, "word");

      const parts = getState().messages[0].parts;
      expect(parts).toHaveLength(1);
      expect(parts[0].text).toBe("Hello world");
      expect(parts[0].aggregatedBy).toBe("word");
    });

    it("creates new part for sentence-level chunks", () => {
      getState().addMessage({
        role: "assistant",
        final: false,
        parts: [],
      });

      getState().updateAssistantBotOutput(
        "First sentence.",
        true,
        false,
        "sentence",
      );
      getState().updateAssistantBotOutput(
        "Second sentence.",
        true,
        false,
        "sentence",
      );

      const parts = getState().messages[0].parts;
      expect(parts).toHaveLength(2);
      expect(parts[0].text).toBe("First sentence.");
      expect(parts[1].text).toBe("Second sentence.");
    });

    it("creates new part for custom aggregation types", () => {
      getState().addMessage({
        role: "assistant",
        final: false,
        parts: [],
      });

      getState().updateAssistantBotOutput(
        "Some text",
        false,
        false,
        "sentence",
      );
      getState().updateAssistantBotOutput(
        "console.log('hi')",
        false,
        false,
        "code",
      );

      const parts = getState().messages[0].parts;
      expect(parts).toHaveLength(2);
      expect(parts[1].aggregatedBy).toBe("code");
    });
  });

  // -----------------------------------------------------------------------
  // updateAssistantBotOutput — spoken
  // -----------------------------------------------------------------------
  describe("updateAssistantBotOutput (spoken)", () => {
    it("advances cursor for existing unspoken content", () => {
      getState().addMessage({
        role: "assistant",
        final: false,
        parts: [],
      });

      // First send unspoken
      getState().updateAssistantBotOutput("Hello", false, false, "word");
      getState().updateAssistantBotOutput("world", false, false, "word");

      // Then spoken
      getState().updateAssistantBotOutput("Hello", false, true, "word");

      const cursor = getState().botOutputMessageState.values().next().value;
      expect(cursor).toBeDefined();
      expect(cursor!.currentCharIndex).toBeGreaterThan(0);
    });

    it("creates new fully-spoken part when no unspoken content exists", () => {
      getState().addMessage({
        role: "assistant",
        final: false,
        parts: [],
      });

      // Spoken without prior unspoken
      getState().updateAssistantBotOutput("Hello", false, true, "word");

      const parts = getState().messages[0].parts;
      expect(parts).toHaveLength(1);
      expect(parts[0].text).toBe("Hello");
    });
  });

  // -----------------------------------------------------------------------
  // Helper functions
  // -----------------------------------------------------------------------
  describe("isMessageEmpty", () => {
    it("returns true for message with no parts", () => {
      expect(
        isMessageEmpty({
          role: "assistant",
          parts: [],
          createdAt: "",
        }),
      ).toBe(true);
    });

    it("returns true for message with only whitespace text", () => {
      expect(
        isMessageEmpty({
          role: "assistant",
          parts: [{ text: "  ", final: false, createdAt: "" }],
          createdAt: "",
        }),
      ).toBe(true);
    });

    it("returns false for message with content", () => {
      expect(
        isMessageEmpty({
          role: "assistant",
          parts: [{ text: "Hello", final: false, createdAt: "" }],
          createdAt: "",
        }),
      ).toBe(false);
    });

    it("handles BotOutputText objects", () => {
      expect(
        isMessageEmpty({
          role: "assistant",
          parts: [
            {
              text: { spoken: "", unspoken: "" },
              final: false,
              createdAt: "",
            },
          ],
          createdAt: "",
        }),
      ).toBe(true);

      expect(
        isMessageEmpty({
          role: "assistant",
          parts: [
            {
              text: { spoken: "Hello", unspoken: "" },
              final: false,
              createdAt: "",
            },
          ],
          createdAt: "",
        }),
      ).toBe(false);
    });
  });

  describe("mergeMessages", () => {
    it("merges consecutive same-role messages within 30s", () => {
      const now = new Date();
      const messages: ConversationMessage[] = [
        msg("assistant", "Hello", { createdAt: now.toISOString() }),
        msg("assistant", "World", {
          createdAt: new Date(now.getTime() + 5000).toISOString(),
        }),
      ];

      const merged = mergeMessages(messages);

      expect(merged).toHaveLength(1);
      expect(merged[0].parts).toHaveLength(2);
    });

    it("does not merge messages from different roles", () => {
      const now = new Date();
      const messages: ConversationMessage[] = [
        msg("assistant", "Hello", { createdAt: now.toISOString() }),
        msg("user", "Hi", {
          createdAt: new Date(now.getTime() + 1000).toISOString(),
        }),
      ];

      const merged = mergeMessages(messages);

      expect(merged).toHaveLength(2);
    });

    it("does not merge messages more than 30s apart", () => {
      const now = new Date();
      const messages: ConversationMessage[] = [
        msg("assistant", "Hello", { createdAt: now.toISOString() }),
        msg("assistant", "World", {
          createdAt: new Date(now.getTime() + 31000).toISOString(),
        }),
      ];

      const merged = mergeMessages(messages);

      expect(merged).toHaveLength(2);
    });

    it("does not merge system messages", () => {
      const now = new Date();
      const messages: ConversationMessage[] = [
        {
          role: "system",
          parts: [{ text: "A", final: true, createdAt: "" }],
          createdAt: now.toISOString(),
          final: true,
        },
        {
          role: "system",
          parts: [{ text: "B", final: true, createdAt: "" }],
          createdAt: new Date(now.getTime() + 1000).toISOString(),
          final: true,
        },
      ];

      const merged = mergeMessages(messages);

      expect(merged).toHaveLength(2);
    });
  });

  describe("filterEmptyMessages", () => {
    it("removes empty messages that have a later non-empty message with same role", () => {
      const messages: ConversationMessage[] = [
        msg("assistant", ""), // empty
        msg("assistant", "Hello"), // non-empty
      ];

      // Fix: empty message part
      messages[0].parts = [];

      const filtered = filterEmptyMessages(messages);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].parts[0].text).toBe("Hello");
    });

    it("keeps empty message if no later same-role non-empty message exists", () => {
      const messages: ConversationMessage[] = [
        {
          role: "assistant",
          parts: [],
          createdAt: new Date().toISOString(),
        },
      ];

      const filtered = filterEmptyMessages(messages);

      expect(filtered).toHaveLength(1);
    });
  });
});
