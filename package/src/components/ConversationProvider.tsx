/* eslint-disable react-refresh/only-export-components */
export { useConversationContext } from "@pipecat-ai/client-react";

/**
 * @deprecated ConversationProvider is no longer needed — conversation state
 * management is now built into PipecatClientProvider from @pipecat-ai/client-react.
 * This component is a no-op pass-through kept for backwards compatibility.
 * It will be removed in the next major release.
 */
export const ConversationProvider = ({ children }: React.PropsWithChildren) => {
  return <>{children}</>;
};
