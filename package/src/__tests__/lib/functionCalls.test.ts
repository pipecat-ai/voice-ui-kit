import { describe, expect, it } from "vitest";
import type { ConversationMessage } from "@pipecat-ai/client-react";
import {
  type NestableFunctionCallData,
  nestFunctionCalls,
} from "@/lib/functionCalls";

const call = (
  tool_call_id: string,
  parent_tool_call_id?: string,
): ConversationMessage => ({
  role: "function_call",
  parts: [],
  createdAt: new Date().toISOString(),
  functionCall: {
    function_name: `fn_${tool_call_id}`,
    tool_call_id,
    status: "completed",
    parent_tool_call_id,
  } satisfies NestableFunctionCallData,
});

const text = (role: "user" | "assistant"): ConversationMessage => ({
  role,
  parts: [{ text: "hi", final: true, createdAt: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
});

const ids = (messages: ConversationMessage[]) =>
  messages.map((m) => m.functionCall?.tool_call_id ?? m.role);

describe("nestFunctionCalls", () => {
  it("leaves calls without a parent at the top level", () => {
    const { messages, nested } = nestFunctionCalls([
      text("user"),
      call("a"),
      call("b"),
    ]);
    expect(ids(messages)).toEqual(["user", "a", "b"]);
    expect(nested.size).toBe(0);
  });

  it("groups calls under a rendered parent, in arrival order", () => {
    const { messages, nested } = nestFunctionCalls([
      call("delegate"),
      call("c1", "delegate"),
      text("assistant"),
      call("c2", "delegate"),
    ]);
    expect(ids(messages)).toEqual(["delegate", "assistant"]);
    expect(
      nested.get("delegate")?.map((n) => n.functionCall.tool_call_id),
    ).toEqual(["c1", "c2"]);
  });

  it("nests recursively", () => {
    const { messages, nested } = nestFunctionCalls([
      call("root"),
      call("mid", "root"),
      call("leaf", "mid"),
    ]);
    expect(ids(messages)).toEqual(["root"]);
    const [mid] = nested.get("root")!;
    expect(mid.functionCall.tool_call_id).toBe("mid");
    expect(mid.children.map((n) => n.functionCall.tool_call_id)).toEqual([
      "leaf",
    ]);
  });

  it("keeps a call whose parent is not rendered at the top level", () => {
    const { messages, nested } = nestFunctionCalls([
      call("orphan", "hidden"),
      call("other"),
    ]);
    expect(ids(messages)).toEqual(["orphan", "other"]);
    expect(nested.size).toBe(0);
  });

  it("ignores a call that names itself as parent", () => {
    const { messages } = nestFunctionCalls([call("loop", "loop")]);
    expect(ids(messages)).toEqual(["loop"]);
  });
});
