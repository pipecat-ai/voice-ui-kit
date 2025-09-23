import { MessageContent } from "./MessageContent";
import type { Story, StoryDefault } from "@ladle/react";
import { ConversationMessage } from "@/types/conversation";

export default {
  title: "Components",
} satisfies StoryDefault;

// Sample message data
const createSampleMessage = (
  role: "user" | "assistant" | "system",
  text: string,
  final = true,
): ConversationMessage => ({
  role,
  parts: [
    {
      text,
      final,
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
});

const createMultiPartMessage = (): ConversationMessage => ({
  role: "assistant",
  parts: [
    {
      text: "This is a multi-part message. ",
      final: false,
      createdAt: new Date().toISOString(),
    },
    {
      text: "Each part can be displayed separately. ",
      final: false,
      createdAt: new Date().toISOString(),
    },
    {
      text: "This allows for streaming text updates.",
      final: true,
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
});

const createEmptyMessage = (): ConversationMessage => ({
  role: "assistant",
  parts: [],
  createdAt: new Date().toISOString(),
});

export const MessageContentDefault: Story<{
  messageType: "user" | "assistant" | "system" | "multiPart" | "empty";
  customText: string;
  messageContentClass: string;
  timeClass: string;
}> = ({ messageType, customText, messageContentClass, timeClass }) => {
  let message: ConversationMessage;

  switch (messageType) {
    case "user":
      message = createSampleMessage("user", customText);
      break;
    case "assistant":
      message = createSampleMessage("assistant", customText);
      break;
    case "system":
      message = createSampleMessage("system", customText);
      break;
    case "multiPart":
      message = createMultiPartMessage();
      break;
    case "empty":
      message = createEmptyMessage();
      break;
    default:
      message = createSampleMessage("assistant", customText);
  }

  return (
    <div className="ladle-section-container">
      <section className="ladle-section">
        <MessageContent
          message={message}
          classNames={{
            messageContent: messageContentClass,
            time: timeClass,
          }}
        />
      </section>

      <h2 className="ladle-section-header">All Message Types</h2>
      <section className="ladle-section">
        <MessageContent
          message={createSampleMessage("user", "Hello, can you help me?")}
        />
        <MessageContent
          message={createSampleMessage(
            "assistant",
            "Of course! I'd be happy to help you.",
          )}
        />
        <MessageContent
          message={createSampleMessage(
            "system",
            "System: Conversation started",
          )}
        />
      </section>

      <h2 className="ladle-section-header">Multi-Part Message</h2>
      <section className="ladle-section">
        <MessageContent message={createMultiPartMessage()} />
      </section>

      <h2 className="ladle-section-header">Empty Message (Thinking)</h2>
      <section className="ladle-section">
        <MessageContent message={createEmptyMessage()} />
      </section>

      <h2 className="ladle-section-header">Custom Styling</h2>
      <section className="ladle-section">
        <MessageContent
          message={createSampleMessage(
            "assistant",
            "This message has custom styling",
          )}
          classNames={{
            messageContent:
              "bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400",
            time: "text-blue-600 font-medium",
          }}
        />
      </section>
    </div>
  );
};

MessageContentDefault.args = {
  messageType: "assistant",
  customText: "Hello! This is a customizable message.",
  messageContentClass: "",
  timeClass: "",
};

MessageContentDefault.argTypes = {
  messageType: {
    options: ["user", "assistant", "system", "multiPart", "empty"],
    control: { type: "select" },
    defaultValue: "assistant",
  },
  customText: {
    control: { type: "text" },
    defaultValue: "Hello! This is a customizable message.",
  },
  messageContentClass: {
    control: { type: "text" },
    defaultValue: "",
  },
  timeClass: {
    control: { type: "text" },
    defaultValue: "",
  },
};

MessageContentDefault.storyName = "Message Content";
