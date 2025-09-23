import { MessageContainer } from "./MessageContainer";
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

export const MessageContainerDefault: Story<{
  messageType: "user" | "assistant" | "system" | "multiPart" | "empty";
  customText: string;
  assistantLabel: string;
  clientLabel: string;
  systemLabel: string;
  containerClass: string;
  roleClass: string;
  messageContentClass: string;
  timeClass: string;
}> = ({
  messageType,
  customText,
  assistantLabel,
  clientLabel,
  systemLabel,
  containerClass,
  roleClass,
  messageContentClass,
  timeClass,
}) => {
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
        <MessageContainer
          message={message}
          assistantLabel={assistantLabel}
          clientLabel={clientLabel}
          systemLabel={systemLabel}
          classNames={{
            container: containerClass,
            role: roleClass,
            messageContent: messageContentClass,
            time: timeClass,
          }}
        />
      </section>

      <h2 className="ladle-section-header">All Message Types</h2>
      <section className="ladle-section">
        <MessageContainer
          message={createSampleMessage("user", "Hello, can you help me?")}
        />
        <MessageContainer
          message={createSampleMessage(
            "assistant",
            "Of course! I'd be happy to help you.",
          )}
        />
        <MessageContainer
          message={createSampleMessage(
            "system",
            "System: Conversation started",
          )}
        />
      </section>

      <h2 className="ladle-section-header">Multi-Part Message</h2>
      <section className="ladle-section">
        <MessageContainer message={createMultiPartMessage()} />
      </section>

      <h2 className="ladle-section-header">Empty Message (Shows Thinking)</h2>
      <section className="ladle-section">
        <MessageContainer message={createEmptyMessage()} />
      </section>

      <h2 className="ladle-section-header">Custom Labels</h2>
      <section className="ladle-section">
        <MessageContainer
          message={createSampleMessage("user", "Hello!")}
          clientLabel="Customer"
        />
        <MessageContainer
          message={createSampleMessage("assistant", "Hi there!")}
          assistantLabel="AI Assistant"
        />
        <MessageContainer
          message={createSampleMessage("system", "System message")}
          systemLabel="System Message"
        />
      </section>

      <h2 className="ladle-section-header">Custom Styling</h2>
      <section className="ladle-section">
        <MessageContainer
          message={createSampleMessage(
            "assistant",
            "This message has custom styling",
          )}
          classNames={{
            container: "bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400",
            role: "text-blue-700 font-bold",
            messageContent: "text-blue-800",
            time: "text-blue-600 font-medium",
          }}
        />
      </section>

      <h2 className="ladle-section-header">Conversation Thread</h2>
      <section className="ladle-section">
        <div>
          <MessageContainer message={createSampleMessage("user", "Hello!")} />
          <MessageContainer
            message={createSampleMessage(
              "assistant",
              "Hi there! How can I help?",
            )}
          />
          <MessageContainer
            message={createSampleMessage("user", "Can you explain something?")}
          />
          <MessageContainer message={createMultiPartMessage()} />
          <MessageContainer
            message={createSampleMessage("system", "Conversation ended")}
          />
        </div>
      </section>
    </div>
  );
};

MessageContainerDefault.args = {
  messageType: "assistant",
  customText: "Hello! This is a customizable message.",
  assistantLabel: "assistant",
  clientLabel: "user",
  systemLabel: "system",
  containerClass: "",
  roleClass: "",
  messageContentClass: "",
  timeClass: "",
};

MessageContainerDefault.argTypes = {
  messageType: {
    options: ["user", "assistant", "system", "multiPart", "empty"],
    control: { type: "select" },
    defaultValue: "assistant",
  },
  customText: {
    control: { type: "text" },
    defaultValue: "Hello! This is a customizable message.",
  },
  assistantLabel: {
    control: { type: "text" },
    defaultValue: "assistant",
  },
  clientLabel: {
    control: { type: "text" },
    defaultValue: "user",
  },
  systemLabel: {
    control: { type: "text" },
    defaultValue: "system",
  },
  containerClass: {
    control: { type: "text" },
    defaultValue: "",
  },
  roleClass: {
    control: { type: "text" },
    defaultValue: "",
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

MessageContainerDefault.storyName = "Message Container";
