import { ConversationContext } from "@/components/ConversationContext";
import { useContext } from "react";

export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      "useConversationContext must be used within ConversationProvider",
    );
  }
  return context;
};
