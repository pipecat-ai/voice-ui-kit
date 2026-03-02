export {
  usePipecatConnectionState,
  type PipecatConnectionState,
} from "./usePipecatConnectionState";
export { usePipecatConversation } from "@pipecat-ai/client-react";
import { usePipecatConversation } from "@pipecat-ai/client-react";
/**
 * @deprecated Use `usePipecatConversation` instead. This alias will be removed in a future major release.
 */
export const useConversation = usePipecatConversation;
export { usePipecatEventStream } from "./usePipecatEventStream";
export type {
  PipecatEventGroup,
  PipecatEventLog,
  UsePipecatEventStreamOptions,
} from "./usePipecatEventStream";
export { useTheme } from "./useTheme";
