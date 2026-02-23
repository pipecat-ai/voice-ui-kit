import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStoreHarness } from "../helpers/storeHarness";
import { conversation, playScenario } from "../helpers/conversationDSL";
import { expectMessages } from "../helpers/assertions";
import { useConversationStore } from "@/stores/conversationStore";

function getState() {
  return useConversationStore.getState();
}

describe("function call lifecycle – integration", () => {
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
  // DSL-based full lifecycle tests
  // -----------------------------------------------------------------------
  describe("full lifecycle via DSL", () => {
    it("single function call completes normally", () => {
      const scenario = conversation()
        .functionCall("get_weather", {
          args: { location: "NYC" },
          result: { temp: 72 },
        })
        .build();

      playScenario(harness, scenario);

      expectMessages(harness.getMessages(), [
        {
          role: "function_call",
          functionName: "get_weather",
          functionStatus: "completed",
          final: true,
        },
      ]);
    });

    it("bot speaks, calls a function, then responds with result", () => {
      const scenario = conversation()
        .bot("Let me check the weather for you.")
        .functionCall("get_weather", {
          toolCallId: "call_weather_1",
          args: { location: "New York" },
          result: { temperature: 72, condition: "sunny" },
        })
        .bot("The weather in New York is seventy two degrees and sunny.")
        .build();

      playScenario(harness, scenario);

      const messages = harness.getMessages();
      const fcMessages = messages.filter((m) => m.role === "function_call");
      const assistantMessages = messages.filter((m) => m.role === "assistant");

      expect(fcMessages).toHaveLength(1);
      expect(fcMessages[0].functionCall!.status).toBe("completed");
      expect(fcMessages[0].functionCall!.result).toEqual({
        temperature: 72,
        condition: "sunny",
      });
      expect(assistantMessages.length).toBeGreaterThanOrEqual(1);
    });

    it("multiple sequential function calls", () => {
      const scenario = conversation()
        .functionCall("search", {
          args: { query: "restaurants" },
          result: ["Pizza Place", "Sushi Bar"],
        })
        .functionCall("get_details", {
          args: { name: "Pizza Place" },
          result: { rating: 4.5 },
        })
        .build();

      playScenario(harness, scenario);

      const messages = harness.getMessages();
      const fcMessages = messages.filter((m) => m.role === "function_call");

      expect(fcMessages).toHaveLength(2);
      expect(fcMessages[0].functionCall!.function_name).toBe("search");
      expect(fcMessages[0].functionCall!.status).toBe("completed");
      expect(fcMessages[1].functionCall!.function_name).toBe("get_details");
      expect(fcMessages[1].functionCall!.status).toBe("completed");
    });

    it("cancelled function call", () => {
      const scenario = conversation()
        .functionCall("long_running_task", {
          cancelled: true,
        })
        .build();

      playScenario(harness, scenario);

      expectMessages(harness.getMessages(), [
        {
          role: "function_call",
          functionName: "long_running_task",
          functionStatus: "completed",
          cancelled: true,
          final: true,
        },
      ]);
    });

    it("function calls interleaved with user turns", () => {
      const scenario = conversation()
        .bot("Let me search for that.")
        .functionCall("search", {
          args: { q: "weather" },
          result: "sunny",
        })
        .bot("Its sunny today.")
        .user("Great thanks")
        .build();

      playScenario(harness, scenario);
      vi.advanceTimersByTime(5000);

      const messages = harness.getMessages();
      const roles = messages.map((m) => m.role);
      expect(roles).toContain("assistant");
      expect(roles).toContain("function_call");
      expect(roles).toContain("user");
    });

    it("auto-generates unique tool_call_ids", () => {
      const scenario = conversation()
        .functionCall("fn_a", { result: "a" })
        .functionCall("fn_b", { result: "b" })
        .build();

      playScenario(harness, scenario);

      const messages = harness.getMessages();
      const fcMessages = messages.filter((m) => m.role === "function_call");

      expect(fcMessages).toHaveLength(2);
      expect(fcMessages[0].functionCall!.tool_call_id).toBe("call_1");
      expect(fcMessages[1].functionCall!.tool_call_id).toBe("call_2");
    });
  });

  // -----------------------------------------------------------------------
  // Event ordering edge cases via DSL lifecycle options
  // -----------------------------------------------------------------------
  describe("event ordering edge cases", () => {
    it("handles Started → Stopped (skipping InProgress)", () => {
      const scenario = conversation()
        .functionCall("quick_fn", {
          toolCallId: "call_quick",
          lifecycle: "skipInProgress",
          result: "done",
        })
        .build();

      playScenario(harness, scenario);

      expectMessages(harness.getMessages(), [
        {
          role: "function_call",
          functionName: "quick_fn",
          functionStatus: "completed",
          toolCallId: "call_quick",
        },
      ]);
      expect(harness.getMessages()[0].functionCall!.result).toBe("done");
    });

    it("handles InProgress → Stopped (skipping Started)", () => {
      const scenario = conversation()
        .functionCall("search", {
          toolCallId: "call_early",
          args: { q: "test" },
          lifecycle: "skipStarted",
          result: "found",
        })
        .build();

      playScenario(harness, scenario);

      expectMessages(harness.getMessages(), [
        {
          role: "function_call",
          functionName: "search",
          functionStatus: "completed",
          toolCallId: "call_early",
        },
      ]);
      expect(harness.getMessages()[0].functionCall!.result).toBe("found");
    });

    it("Started only leaves function in started state", () => {
      const scenario = conversation()
        .functionCall("pending_fn", { lifecycle: "startedOnly" })
        .build();

      playScenario(harness, scenario);

      expectMessages(harness.getMessages(), [
        {
          role: "function_call",
          functionName: "pending_fn",
          functionStatus: "started",
          final: false,
        },
      ]);
    });

    it("Started after InProgress within 2s does not create duplicate", () => {
      // InProgress arrives first (out-of-order)
      harness.handleFunctionCallInProgress({
        function_name: "search",
        tool_call_id: "call_1",
        args: { q: "test" },
      });

      // Started arrives within 2 seconds — should not create a new entry
      harness.handleFunctionCallStarted({ function_name: "search" });

      const messages = harness.getMessages();
      const fcMessages = messages.filter((m) => m.role === "function_call");
      expect(fcMessages).toHaveLength(1);
      expect(fcMessages[0].functionCall!.status).toBe("in_progress");
      expect(fcMessages[0].functionCall!.function_name).toBe("search");
    });

    it("Started after InProgress beyond 2s creates new entry", () => {
      // InProgress arrives first
      harness.handleFunctionCallInProgress({
        tool_call_id: "call_1",
        args: { q: "test" },
      });

      // Advance past the 2-second window
      vi.advanceTimersByTime(2001);

      // Started arrives — should create a new entry since window expired
      harness.handleFunctionCallStarted({ function_name: "new_fn" });

      const messages = harness.getMessages();
      const fcMessages = messages.filter((m) => m.role === "function_call");
      expect(fcMessages).toHaveLength(2);
    });

    it("Started fills in missing function_name on existing entry", () => {
      // InProgress arrives first WITHOUT function_name
      harness.handleFunctionCallInProgress({
        tool_call_id: "call_1",
        args: { q: "test" },
      });

      // Started arrives with function_name
      harness.handleFunctionCallStarted({ function_name: "search" });

      const messages = harness.getMessages();
      const fc = messages.find(
        (m) => m.functionCall?.tool_call_id === "call_1",
      );
      expect(fc!.functionCall!.function_name).toBe("search");
    });
  });

  // -----------------------------------------------------------------------
  // Deduplication
  // -----------------------------------------------------------------------
  describe("deduplication", () => {
    it("addFunctionCall deduplicates by tool_call_id", () => {
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_dup",
      });
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_dup",
      });

      const fcMessages = harness
        .getMessages()
        .filter((m) => m.functionCall?.tool_call_id === "call_dup");
      expect(fcMessages).toHaveLength(1);
    });

    it("function calls without tool_call_id are not deduplicated", () => {
      getState().addFunctionCall({ function_name: "fn_a" });
      getState().addFunctionCall({ function_name: "fn_b" });

      const fcMessages = harness
        .getMessages()
        .filter((m) => m.role === "function_call");
      expect(fcMessages).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // Message ordering and cleanup
  // -----------------------------------------------------------------------
  describe("message ordering and cleanup", () => {
    it("function calls are sorted by createdAt alongside other messages", () => {
      getState().addMessage({
        role: "assistant",
        final: true,
        parts: [{ text: "Let me help", final: true, createdAt: "" }],
      });

      vi.advanceTimersByTime(100);

      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_1",
      });

      const messages = harness.getMessages();
      const assistantIdx = messages.findIndex((m) => m.role === "assistant");
      const fcIdx = messages.findIndex((m) => m.role === "function_call");

      expect(assistantIdx).toBeLessThan(fcIdx);
    });

    it("clearMessages removes function calls too", () => {
      getState().addFunctionCall({
        function_name: "search",
        tool_call_id: "call_1",
      });

      expect(harness.getMessages().length).toBeGreaterThan(0);
      getState().clearMessages();
      expect(harness.getMessages()).toHaveLength(0);
    });
  });
});
