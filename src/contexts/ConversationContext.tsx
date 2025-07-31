import useConversation from "@/hooks/useConversation";
import {
  type ConversationContextType,
  type ConversationMessage,
} from "@/types/conversation";
import {
  createContext,
  forwardRef,
  memo,
  type ReactNode,
  useImperativeHandle,
} from "react";

const ConversationContext = createContext<ConversationContextType | null>(null);

export interface ConversationProviderRef {
  injectMessage: (
    message: Pick<ConversationMessage, "role" | "content">,
  ) => void;
}

export const ConversationProvider = memo(
  forwardRef<ConversationProviderRef, { children: ReactNode }>(
    ({ children }, ref) => {
      const conversation = useConversation();

      useImperativeHandle(ref, () => {
        return {
          injectMessage: conversation.injectMessage,
        };
      }, [conversation.injectMessage]);

      return (
        <ConversationContext.Provider value={conversation}>
          {children}
        </ConversationContext.Provider>
      );
    },
  ),
);

export { ConversationContext };
