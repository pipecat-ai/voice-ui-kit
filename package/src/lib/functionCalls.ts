import type {
  ConversationMessage,
  FunctionCallData,
} from "@pipecat-ai/client-react";

/**
 * `FunctionCallData` with the `parent_tool_call_id` field.
 *
 * `parent_tool_call_id` is the `tool_call_id` of the function call this one
 * ran as part of. A tool's work can involve function calls of its own, made
 * by another model on its behalf (e.g. a backend that a `delegate` tool hands
 * work to makes calls while the `delegate` call is in progress); each of them
 * names it as its parent. Absent for a call the bot's LLM made itself.
 *
 * The field is declared here until the `@pipecat-ai/client-react` release
 * that adds it to `FunctionCallData` is published; the intersection is a
 * no-op once it is.
 */
export type NestableFunctionCallData = FunctionCallData & {
  parent_tool_call_id?: string;
};

/** A function call together with the calls that ran as part of it. */
export interface NestedFunctionCall {
  functionCall: FunctionCallData;
  /** Calls whose `parent_tool_call_id` is this call's `tool_call_id`, in arrival order. */
  children: NestedFunctionCall[];
}

export interface FunctionCallTree {
  /**
   * Messages to render at the top level: every non-function-call message,
   * plus the function calls that have no rendered parent.
   */
  messages: ConversationMessage[];
  /** Nested calls keyed by the parent's `tool_call_id`. */
  nested: Map<string, NestedFunctionCall[]>;
}

/**
 * Groups function-call messages under their parent call.
 *
 * A function call whose `parent_tool_call_id` names a call present in
 * `messages` is removed from the top level and attached to that parent, so
 * the conversation view can indent it under the parent's row. A call whose
 * parent is not present (the app may hide it from the client) stays at the
 * top level, exactly like a call without a parent. Arrival order is kept at
 * every level.
 */
export function nestFunctionCalls(
  messages: ConversationMessage[],
): FunctionCallTree {
  const byToolCallId = new Set<string>();
  for (const message of messages) {
    const id = message.functionCall?.tool_call_id;
    if (message.role === "function_call" && id) byToolCallId.add(id);
  }

  const topLevel: ConversationMessage[] = [];
  const childrenOf = new Map<string, FunctionCallData[]>();
  for (const message of messages) {
    const functionCall = message.functionCall as
      | NestableFunctionCallData
      | undefined;
    const parentId = functionCall?.parent_tool_call_id;
    const isNested =
      message.role === "function_call" &&
      functionCall &&
      parentId &&
      parentId !== functionCall.tool_call_id &&
      byToolCallId.has(parentId);
    if (!isNested) {
      topLevel.push(message);
      continue;
    }
    const siblings = childrenOf.get(parentId) ?? [];
    siblings.push(functionCall);
    childrenOf.set(parentId, siblings);
  }

  // Each call has a single parent and top-level calls have none, so the walk
  // down from a top-level call never revisits a node.
  const toNode = (functionCall: FunctionCallData): NestedFunctionCall => ({
    functionCall,
    children: (functionCall.tool_call_id
      ? (childrenOf.get(functionCall.tool_call_id) ?? [])
      : []
    ).map(toNode),
  });

  const nested = new Map<string, NestedFunctionCall[]>();
  for (const message of topLevel) {
    const id = message.functionCall?.tool_call_id;
    if (message.role !== "function_call" || !id) continue;
    const children = childrenOf.get(id);
    if (children?.length) nested.set(id, children.map(toNode));
  }

  return { messages: topLevel, nested };
}
