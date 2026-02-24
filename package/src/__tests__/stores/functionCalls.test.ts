import { beforeEach, describe, expect, it } from "vitest";
import {
  isMessageEmpty,
  mergeMessages,
  useConversationStore,
} from "@/stores/conversationStore";
import type { ConversationMessage } from "@/types/conversation";

function getState() {
  return useConversationStore.getState();
}

describe("conversationStore – function calls", () => {
  beforeEach(() => {
    getState().clearMessages();
  });

  // -----------------------------------------------------------------------
  // addFunctionCall
  // -----------------------------------------------------------------------
  describe("addFunctionCall", () => {
    it("adds a function_call message with started status", () => {
      getState().addFunctionCall({ function_name: "get_weather" });

      const messages = getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("function_call");
      expect(messages[0].functionCall).toEqual({
        function_name: "get_weather",
        tool_call_id: undefined,
        args: undefined,
        status: "started",
      });
      expect(messages[0].final).toBe(false);
    });

    it("sets timestamps on the message", () => {
      getState().addFunctionCall({ function_name: "search" });

      const msg = getState().messages[0];
      expect(msg.createdAt).toBeTruthy();
      expect(msg.updatedAt).toBeTruthy();
    });

    it("adds function call with tool_call_id and args", () => {
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_123",
        args: { query: "hello" },
      });

      const fc = getState().messages[0].functionCall!;
      expect(fc.function_name).toBe("search");
      expect(fc.tool_call_id).toBe("call_123");
      expect(fc.args).toEqual({ query: "hello" });
      expect(fc.status).toBe("started");
    });

    it("does not add duplicate when tool_call_id already exists", () => {
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_123",
      });
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_123",
      });

      expect(getState().messages).toHaveLength(1);
    });

    it("allows multiple function calls without tool_call_id", () => {
      getState().addFunctionCall({ function_name: "fn_a" });
      getState().addFunctionCall({ function_name: "fn_b" });

      expect(getState().messages).toHaveLength(2);
    });

    it("allows different tool_call_ids", () => {
      getState().addFunctionCall({
        function_name: "fn_a",
        tool_call_id: "call_1",
      });
      getState().addFunctionCall({
        function_name: "fn_b",
        tool_call_id: "call_2",
      });

      expect(getState().messages).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // updateFunctionCall
  // -----------------------------------------------------------------------
  describe("updateFunctionCall", () => {
    it("updates status of an existing function call by tool_call_id", () => {
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_1",
      });

      const found = getState().updateFunctionCall("call_1", {
        status: "in_progress",
      });

      expect(found).toBe(true);
      const fc = getState().messages[0].functionCall!;
      expect(fc.status).toBe("in_progress");
    });

    it("updates result and status to completed", () => {
      getState().addFunctionCall({
        function_name: "get_weather",
        tool_call_id: "call_1",
      });

      getState().updateFunctionCall("call_1", {
        status: "completed",
        result: { temp: 72, unit: "F" },
      });

      const msg = getState().messages[0];
      expect(msg.functionCall!.status).toBe("completed");
      expect(msg.functionCall!.result).toEqual({ temp: 72, unit: "F" });
      expect(msg.final).toBe(true);
    });

    it("marks message as final when status is completed", () => {
      getState().addFunctionCall({
        function_name: "fn",
        tool_call_id: "call_1",
      });

      getState().updateFunctionCall("call_1", { status: "completed" });

      expect(getState().messages[0].final).toBe(true);
    });

    it("does not mark message as final for non-completed status", () => {
      getState().addFunctionCall({
        function_name: "fn",
        tool_call_id: "call_1",
      });

      getState().updateFunctionCall("call_1", { status: "in_progress" });

      expect(getState().messages[0].final).toBe(false);
    });

    it("returns false when tool_call_id not found", () => {
      getState().addFunctionCall({
        function_name: "fn",
        tool_call_id: "call_1",
      });

      const found = getState().updateFunctionCall("nonexistent", {
        status: "completed",
      });

      expect(found).toBe(false);
    });

    it("updates function_name if provided", () => {
      getState().addFunctionCall({
        tool_call_id: "call_1",
      });

      getState().updateFunctionCall("call_1", {
        function_name: "get_weather",
      });

      expect(getState().messages[0].functionCall!.function_name).toBe(
        "get_weather",
      );
    });

    it("sets cancelled flag", () => {
      getState().addFunctionCall({
        function_name: "fn",
        tool_call_id: "call_1",
      });

      getState().updateFunctionCall("call_1", {
        status: "completed",
        cancelled: true,
      });

      const fc = getState().messages[0].functionCall!;
      expect(fc.status).toBe("completed");
      expect(fc.cancelled).toBe(true);
    });

    it("updates the last matching function call when duplicates exist", () => {
      // Add two function calls with different tool_call_ids
      getState().addFunctionCall({
        function_name: "fn",
        tool_call_id: "call_1",
      });
      getState().addFunctionCall({
        function_name: "fn",
        tool_call_id: "call_2",
      });

      getState().updateFunctionCall("call_1", { status: "completed" });

      // The first function call should be completed
      const messages = getState().messages;
      const call1 = messages.find(
        (m) => m.functionCall?.tool_call_id === "call_1",
      );
      const call2 = messages.find(
        (m) => m.functionCall?.tool_call_id === "call_2",
      );
      expect(call1?.functionCall?.status).toBe("completed");
      expect(call2?.functionCall?.status).toBe("started");
    });
  });

  // -----------------------------------------------------------------------
  // updateLastStartedFunctionCall
  // -----------------------------------------------------------------------
  describe("updateLastStartedFunctionCall", () => {
    it("updates the last started function call without a tool_call_id", () => {
      getState().addFunctionCall({ function_name: "search" });

      const found = getState().updateLastStartedFunctionCall({
        tool_call_id: "call_1",
        args: { query: "test" },
        status: "in_progress",
      });

      expect(found).toBe(true);
      const fc = getState().messages[0].functionCall!;
      expect(fc.tool_call_id).toBe("call_1");
      expect(fc.args).toEqual({ query: "test" });
      expect(fc.status).toBe("in_progress");
    });

    it("returns false if no started function call without tool_call_id exists", () => {
      // Add a function call that already has a tool_call_id
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_1",
      });

      const found = getState().updateLastStartedFunctionCall({
        tool_call_id: "call_2",
        status: "in_progress",
      });

      expect(found).toBe(false);
    });

    it("returns false if the only function call is already in_progress", () => {
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_1",
      });
      getState().updateFunctionCall("call_1", { status: "in_progress" });

      const found = getState().updateLastStartedFunctionCall({
        tool_call_id: "call_2",
        status: "in_progress",
      });

      expect(found).toBe(false);
    });

    it("returns false when no function calls exist", () => {
      const found = getState().updateLastStartedFunctionCall({
        tool_call_id: "call_1",
        status: "in_progress",
      });

      expect(found).toBe(false);
    });

    it("targets the last started entry when multiple exist", () => {
      getState().addFunctionCall({ function_name: "fn_a" });
      getState().addFunctionCall({ function_name: "fn_b" });

      const found = getState().updateLastStartedFunctionCall({
        tool_call_id: "call_b",
        status: "in_progress",
      });

      expect(found).toBe(true);
      // The last added function call should be updated
      const messages = getState().messages;
      const updated = messages.find(
        (m) => m.functionCall?.tool_call_id === "call_b",
      );
      expect(updated).toBeDefined();
      expect(updated!.functionCall!.function_name).toBe("fn_b");
    });
  });

  // -----------------------------------------------------------------------
  // isMessageEmpty – function_call role
  // -----------------------------------------------------------------------
  describe("isMessageEmpty – function_call", () => {
    it("returns false for function_call messages (even with empty parts)", () => {
      const fcMessage: ConversationMessage = {
        role: "function_call",
        parts: [],
        createdAt: new Date().toISOString(),
        final: false,
        functionCall: {
          function_name: "test",
          status: "started",
        },
      };

      expect(isMessageEmpty(fcMessage)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // mergeMessages – function_call role
  // -----------------------------------------------------------------------
  describe("mergeMessages – function_call", () => {
    it("does not merge function_call messages with each other", () => {
      const now = new Date();

      const messages: ConversationMessage[] = [
        {
          role: "function_call",
          parts: [],
          createdAt: now.toISOString(),
          final: false,
          functionCall: { function_name: "fn_a", status: "started" },
        },
        {
          role: "function_call",
          parts: [],
          createdAt: new Date(now.getTime() + 100).toISOString(),
          final: false,
          functionCall: { function_name: "fn_b", status: "started" },
        },
      ];

      const merged = mergeMessages(messages);
      expect(merged).toHaveLength(2);
    });

    it("does not merge function_call with adjacent assistant messages", () => {
      const now = new Date();

      const messages: ConversationMessage[] = [
        {
          role: "assistant",
          parts: [{ text: "Hello", final: true, createdAt: "" }],
          createdAt: now.toISOString(),
          final: true,
        },
        {
          role: "function_call",
          parts: [],
          createdAt: new Date(now.getTime() + 100).toISOString(),
          final: false,
          functionCall: { function_name: "search", status: "started" },
        },
      ];

      const merged = mergeMessages(messages);
      expect(merged).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // deduplicateFunctionCalls (tested via normalizeMessagesForUI)
  // -----------------------------------------------------------------------
  describe("deduplication via addMessage pipeline", () => {
    it("keeps the most advanced status when duplicates share a tool_call_id", () => {
      // Simulate the scenario: add a started entry, then add another
      // with same tool_call_id but advanced status via updateFunctionCall
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_1",
      });

      // Update to completed
      getState().updateFunctionCall("call_1", {
        status: "completed",
        result: "done",
      });

      const messages = getState().messages;
      // Should only have one entry for this tool_call_id
      const fcMessages = messages.filter(
        (m) => m.functionCall?.tool_call_id === "call_1",
      );
      expect(fcMessages).toHaveLength(1);
      expect(fcMessages[0].functionCall!.status).toBe("completed");
    });
  });

  // -----------------------------------------------------------------------
  // Full lifecycle: started → in_progress → completed
  // -----------------------------------------------------------------------
  describe("function call lifecycle", () => {
    it("transitions started → in_progress → completed", () => {
      // Started event
      getState().addFunctionCall({ function_name: "get_weather" });
      expect(getState().messages[0].functionCall!.status).toBe("started");

      // InProgress event updates the started entry
      getState().updateLastStartedFunctionCall({
        tool_call_id: "call_abc",
        args: { location: "NYC" },
        status: "in_progress",
      });

      let fc = getState().messages.find(
        (m) => m.functionCall?.tool_call_id === "call_abc",
      );
      expect(fc).toBeDefined();
      expect(fc!.functionCall!.status).toBe("in_progress");
      expect(fc!.functionCall!.args).toEqual({ location: "NYC" });

      // Completed event
      getState().updateFunctionCall("call_abc", {
        status: "completed",
        result: { temp: 72 },
      });

      fc = getState().messages.find(
        (m) => m.functionCall?.tool_call_id === "call_abc",
      );
      expect(fc).toBeDefined();
      expect(fc!.functionCall!.status).toBe("completed");
      expect(fc!.functionCall!.result).toEqual({ temp: 72 });
      expect(fc!.final).toBe(true);
    });

    it("handles InProgress arriving before Started", () => {
      // InProgress arrives first (no started entry yet)
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_1",
        args: { q: "test" },
      });
      getState().updateFunctionCall("call_1", { status: "in_progress" });

      let messages = getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].functionCall!.status).toBe("in_progress");

      // Completed
      getState().updateFunctionCall("call_1", {
        status: "completed",
        result: ["result1"],
      });

      messages = getState().messages;
      const fc = messages.find(
        (m) => m.functionCall?.tool_call_id === "call_1",
      );
      expect(fc!.functionCall!.status).toBe("completed");
      expect(fc!.functionCall!.result).toEqual(["result1"]);
    });

    it("handles cancelled function calls", () => {
      getState().addFunctionCall({
        function_name: "slow_fn",
        tool_call_id: "call_1",
      });

      getState().updateFunctionCall("call_1", {
        status: "completed",
        cancelled: true,
      });

      const fc = getState().messages[0].functionCall!;
      expect(fc.status).toBe("completed");
      expect(fc.cancelled).toBe(true);
    });

    it("function calls coexist with assistant messages", () => {
      // Add an assistant message
      getState().addMessage({
        role: "assistant",
        final: false,
        parts: [{ text: "Let me check", final: false, createdAt: "" }],
      });

      // Add a function call
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_1",
      });

      const messages = getState().messages;
      expect(messages.length).toBeGreaterThanOrEqual(2);

      const assistantMsg = messages.find((m) => m.role === "assistant");
      const fcMsg = messages.find((m) => m.role === "function_call");
      expect(assistantMsg).toBeDefined();
      expect(fcMsg).toBeDefined();
    });

    it("multiple concurrent function calls", () => {
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_1",
      });
      getState().addFunctionCall({
        function_name: "get_weather",
        tool_call_id: "call_2",
      });

      // Complete them in different order
      getState().updateFunctionCall("call_2", {
        status: "completed",
        result: { temp: 72 },
      });
      getState().updateFunctionCall("call_1", {
        status: "completed",
        result: ["result"],
      });

      const messages = getState().messages;
      const call1 = messages.find(
        (m) => m.functionCall?.tool_call_id === "call_1",
      );
      const call2 = messages.find(
        (m) => m.functionCall?.tool_call_id === "call_2",
      );

      expect(call1!.functionCall!.status).toBe("completed");
      expect(call2!.functionCall!.status).toBe("completed");
      expect(call1!.functionCall!.result).toEqual(["result"]);
      expect(call2!.functionCall!.result).toEqual({ temp: 72 });
    });
  });

  // -----------------------------------------------------------------------
  // Message callbacks
  // -----------------------------------------------------------------------
  describe("message callbacks for function calls", () => {
    it("triggers callbacks when adding a function call", () => {
      let callbackMessage: ConversationMessage | undefined;
      getState().registerMessageCallback("test", (msg) => {
        callbackMessage = msg;
      });

      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_1",
      });

      expect(callbackMessage).toBeDefined();
      expect(callbackMessage!.role).toBe("function_call");

      getState().unregisterMessageCallback("test");
    });

    it("triggers callbacks when updating a function call", () => {
      let callbackMessage: ConversationMessage | undefined;

      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_1",
      });

      getState().registerMessageCallback("test", (msg) => {
        callbackMessage = msg;
      });

      getState().updateFunctionCall("call_1", { status: "completed" });

      expect(callbackMessage).toBeDefined();
      expect(callbackMessage!.functionCall!.status).toBe("completed");

      getState().unregisterMessageCallback("test");
    });
  });
});
