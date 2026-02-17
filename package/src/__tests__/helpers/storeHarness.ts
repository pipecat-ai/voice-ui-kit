import { useConversationStore } from "@/stores/conversationStore";
import type { ConversationMessage } from "@/types/conversation";
import {
  hasUnspokenContent,
  type BotOutputMessageCursor,
} from "@/stores/botOutput";

/**
 * Store-level test harness that replicates the ConversationProvider's
 * event-to-store-action logic without requiring React.
 *
 * The key behavior replicated here is the space-prepending logic from
 * ConversationProvider (lines 106-135): each BotOutput chunk gets a
 * leading space if there was a previous chunk of the same type (spoken
 * or unspoken). This is critical because the store receives already-spaced text.
 */
export function createStoreHarness() {
  // Tracks last chunk per type, mirroring botOutputLastChunkRef in ConversationProvider
  let lastChunk = { spoken: "", unspoken: "" };

  function reset() {
    useConversationStore.getState().clearMessages();
    lastChunk = { spoken: "", unspoken: "" };
  }

  /**
   * Ensures an assistant message exists, creating one if needed.
   * Mirrors ConversationProvider's ensureAssistantMessage(), including the
   * un-finalize logic for prematurely finalized messages with unspoken content.
   */
  function ensureAssistantMessage(): boolean {
    const store = useConversationStore.getState();
    const lastAssistantIndex = store.messages.findLastIndex(
      (msg: ConversationMessage) => msg.role === "assistant",
    );
    const lastAssistant =
      lastAssistantIndex !== -1
        ? store.messages[lastAssistantIndex]
        : undefined;

    if (!lastAssistant || lastAssistant.final) {
      // If the message was finalized but still has unspoken content, it was
      // finalized prematurely. Un-finalize it instead of creating a new bubble
      // — but only when no user message followed.
      if (
        lastAssistant?.final &&
        lastAssistantIndex === store.messages.length - 1
      ) {
        const messageId = lastAssistant.createdAt;
        const cursor = store.botOutputMessageState.get(messageId);
        if (cursor && hasUnspokenContent(cursor, lastAssistant.parts || [])) {
          store.updateLastMessage("assistant", { final: false });
          return false;
        }
      }

      store.addMessage({ role: "assistant", final: false, parts: [] });
      lastChunk = { spoken: "", unspoken: "" };
      return true;
    }
    return false;
  }

  /**
   * Emit a BotOutput event, replicating ConversationProvider spacing logic.
   */
  function emitBotOutput(text: string, spoken: boolean, aggregatedBy?: string) {
    ensureAssistantMessage();

    let textToAdd = text;
    const prevChunk = spoken ? lastChunk.spoken : lastChunk.unspoken;

    if (prevChunk) {
      textToAdd = " " + textToAdd;
    }

    if (spoken) {
      lastChunk.spoken = textToAdd;
    } else {
      lastChunk.unspoken = textToAdd;
    }

    const isFinal = aggregatedBy === "sentence";
    useConversationStore
      .getState()
      .updateAssistantBotOutput(textToAdd, isFinal, spoken, aggregatedBy);
  }

  /**
   * Emit a UserTranscript event.
   */
  function emitUserTranscript(text: string, final: boolean) {
    useConversationStore.getState().upsertUserTranscript(text, final);
  }

  /**
   * Finalize the last assistant message, replicating what happens after
   * BotStoppedSpeaking timeout or UserStartedSpeaking.
   */
  function finalizeAssistant() {
    useConversationStore.getState().finalizeLastMessage("assistant");
  }

  /**
   * Finalize the last user message.
   */
  function finalizeUser() {
    useConversationStore.getState().finalizeLastMessage("user");
  }

  /**
   * Finalize the last assistant message if it's pending (not yet final).
   * Mirrors ConversationProvider's finalizeLastAssistantMessageIfPending().
   */
  function finalizeAssistantIfPending() {
    const messages = useConversationStore.getState().messages;
    const lastAssistant = messages.findLast(
      (m: ConversationMessage) => m.role === "assistant",
    );
    if (lastAssistant && !lastAssistant.final) {
      finalizeAssistant();
    }
  }

  function removeEmptyLastUserMessage() {
    useConversationStore.getState().removeEmptyLastMessage("user");
  }

  function getMessages(): ConversationMessage[] {
    return useConversationStore.getState().messages;
  }

  function getBotOutputState(): Map<string, BotOutputMessageCursor> {
    return useConversationStore.getState().botOutputMessageState;
  }

  /**
   * Get the cursor for the last assistant message.
   */
  function getLastAssistantCursor(): BotOutputMessageCursor | undefined {
    const messages = getMessages();
    const lastAssistant = messages.findLast(
      (m: ConversationMessage) => m.role === "assistant",
    );
    if (!lastAssistant) return undefined;
    return getBotOutputState().get(lastAssistant.createdAt);
  }

  /**
   * Reset the chunk trackers, as happens when a new assistant message is created.
   */
  function resetChunkTrackers() {
    lastChunk = { spoken: "", unspoken: "" };
  }

  return {
    reset,
    ensureAssistantMessage,
    emitBotOutput,
    emitUserTranscript,
    finalizeAssistant,
    finalizeUser,
    finalizeAssistantIfPending,
    removeEmptyLastUserMessage,
    getMessages,
    getBotOutputState,
    getLastAssistantCursor,
    resetChunkTrackers,
  };
}

export type StoreHarness = ReturnType<typeof createStoreHarness>;
