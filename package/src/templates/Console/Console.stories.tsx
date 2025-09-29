import { FullScreenContainer } from "@/components/ui";
import type { ConversationMessage } from "@/types/conversation";
import type { StoryDefault } from "@ladle/react";
import { useCallback, useRef, useState } from "react";
import { ConsoleTemplate } from "./index";

export default {
  title: "Templates / Console",
} satisfies StoryDefault;

export const Default = () => {
  const injectMessageRef = useRef<
    ((message: Pick<ConversationMessage, "role" | "parts">) => void) | null
  >(null);
  const [isReady, setIsReady] = useState(false);

  const handleInjectUserMessage = useCallback(() => {
    injectMessageRef.current?.({
      role: "user",
      parts: [
        {
          text: "Hello! This is a test message from the user.",
          final: true,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }, []);

  const handleInjectAssistantMessage = useCallback(() => {
    injectMessageRef.current?.({
      role: "assistant",
      parts: [
        {
          text: "Hi there! This is a test response from the assistant.",
          final: true,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }, []);

  const handleOnInjectMessage = useCallback(
    (
      injectFn: (message: Pick<ConversationMessage, "role" | "parts">) => void,
    ) => {
      injectMessageRef.current = injectFn;
      setIsReady(true);
    },
    [],
  );

  return (
    <FullScreenContainer>
      <div
        style={{
          padding: "10px",
          display: "flex",
          gap: "10px",
          backgroundColor: "#f0f0f0",
        }}
      >
        <button
          onClick={handleInjectUserMessage}
          disabled={!isReady}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isReady ? "pointer" : "not-allowed",
          }}
        >
          Inject User Message
        </button>
        <button
          onClick={handleInjectAssistantMessage}
          disabled={!isReady}
          style={{
            padding: "8px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isReady ? "pointer" : "not-allowed",
          }}
        >
          Inject Assistant Message
        </button>

        {!isReady && (
          <span
            style={{ color: "#666", fontSize: "14px", alignSelf: "center" }}
          >
            Waiting for conversation to be ready...
          </span>
        )}
      </div>
      <ConsoleTemplate
        transportType="smallwebrtc"
        connectParams={{
          connectionUrl: "http://localhost:7860/api/offer",
        }}
        noUserVideo={true}
        conversationElementProps={{
          assistantLabel: "my-assistant",
        }}
        onInjectMessage={handleOnInjectMessage}
      />
    </FullScreenContainer>
  );
};
Default.meta = { iframed: false };
