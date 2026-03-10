export {
  usePipecatConnectionState,
  type PipecatConnectionState,
} from "./usePipecatConnectionState";
export {
  usePipecatConversation,
  /** @deprecated Use `usePipecatConversation` instead. This alias will be removed in a future major release. */
  usePipecatConversation as useConversation,
} from "@pipecat-ai/client-react";
export { usePipecatEventStream } from "./usePipecatEventStream";
export type {
  PipecatEventGroup,
  PipecatEventLog,
  UsePipecatEventStreamOptions,
} from "./usePipecatEventStream";
export { useTheme } from "./useTheme";
