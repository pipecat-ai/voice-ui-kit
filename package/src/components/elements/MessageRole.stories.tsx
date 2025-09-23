import { MessageRole } from "./MessageRole";
import type { Story, StoryDefault } from "@ladle/react";

export default {
  title: "Components",
} satisfies StoryDefault;

export const MessageRoleDefault: Story<{
  role: "user" | "assistant" | "system";
  assistantLabel: string;
  clientLabel: string;
  systemLabel: string;
  className: string;
}> = ({ role, assistantLabel, clientLabel, systemLabel, className }) => (
  <div className="ladle-section-container">
    <section className="ladle-section">
      <MessageRole
        role={role}
        assistantLabel={assistantLabel}
        clientLabel={clientLabel}
        systemLabel={systemLabel}
        className={className}
      />
    </section>

    <h2 className="ladle-section-header">All Roles</h2>
    <section className="ladle-section">
      <MessageRole role="user" clientLabel={clientLabel} />
      <MessageRole role="assistant" assistantLabel={assistantLabel} />
      <MessageRole role="system" systemLabel={systemLabel} />
    </section>

    <h2 className="ladle-section-header">Custom Labels</h2>
    <section className="ladle-section">
      <MessageRole role="user" clientLabel={clientLabel || "You"} />
      <MessageRole
        role="assistant"
        assistantLabel={assistantLabel || "AI Assistant"}
      />
      <MessageRole
        role="system"
        systemLabel={systemLabel || "System Message"}
      />
    </section>

    <h2 className="ladle-section-header">Custom Styling</h2>
    <section className="ladle-section">
      <MessageRole
        role="user"
        clientLabel={clientLabel || "You"}
        className="text-blue-600 bg-blue-50 px-2 py-1 rounded"
      />
      <MessageRole
        role="assistant"
        assistantLabel={assistantLabel || "AI Assistant"}
        className="text-green-600 bg-green-50 px-2 py-1 rounded"
      />
      <MessageRole
        role="system"
        systemLabel={systemLabel || "System Message"}
        className="text-gray-600 bg-gray-50 px-2 py-1 rounded"
      />
    </section>
  </div>
);

MessageRoleDefault.args = {
  role: "assistant",
  assistantLabel: "",
  clientLabel: "",
  systemLabel: "",
  className: "",
};

MessageRoleDefault.argTypes = {
  role: {
    options: ["user", "assistant", "system"],
    control: { type: "select" },
    defaultValue: "assistant",
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
  className: {
    control: { type: "text" },
    defaultValue: "",
  },
};

MessageRoleDefault.storyName = "Message Role";
