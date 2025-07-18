import type { Story, StoryDefault } from "@ladle/react";
import type { TransportState } from "@pipecat-ai/client-js";
import {
  type ButtonSize,
  buttonSizeOptions,
  type ButtonVariant,
  buttonVariantOptions,
} from "../ui/buttonVariants";
import {
  ConnectButtonComponent,
  type ConnectButtonStateContent,
} from "./ConnectButton";

const transportStateOptions = [
  "disconnected",
  "initializing",
  "initialized",
  "authenticating",
  "authenticated",
  "connecting",
  "connected",
  "ready",
  "disconnecting",
  "error",
] satisfies TransportState[];

export default {
  title: "Components",
  argTypes: {
    transportState: {
      options: transportStateOptions,
      control: { type: "select" },
      defaultValue: "disconnected",
    },
    disconnectedVariant: {
      control: { type: "select" },
      defaultValue: "default",
      options: buttonVariantOptions,
    },
    disconnectedChildren: {
      control: { type: "text" },
      defaultValue: "Connect",
    },
    connectingVariant: {
      control: { type: "select" },
      defaultValue: "default",
      options: buttonVariantOptions,
    },
    connectingChildren: {
      control: { type: "text" },
      defaultValue: "Connecting...",
    },
    connectedVariant: {
      control: { type: "select" },
      defaultValue: "default",
      options: buttonVariantOptions,
    },
    connectedChildren: {
      control: { type: "text" },
      defaultValue: "Connected",
    },
    readyVariant: {
      control: { type: "select" },
      defaultValue: "active",
      options: buttonVariantOptions,
    },
    readyChildren: {
      control: { type: "text" },
      defaultValue: "Disconnect",
    },
    size: {
      options: buttonSizeOptions,
      control: { type: "select" },
      defaultValue: "default",
    },
  },
} satisfies StoryDefault;

export const ConnectButtonDefault: Story<{
  transportState: TransportState;
  size: ButtonSize;
  disconnectedVariant: ButtonVariant;
  connectingVariant: ButtonVariant;
  disconnectedChildren: string;
  connectingChildren: string;
  connectedVariant: ButtonVariant;
  connectedChildren: string;
  readyVariant: ButtonVariant;
  readyChildren: string;
}> = ({
  transportState,
  size,
  disconnectedVariant,
  connectingVariant,
  disconnectedChildren,
  connectingChildren,
  connectedVariant,
  connectedChildren,
  readyVariant,
  readyChildren,
}) => {
  const stateContent: ConnectButtonStateContent = {
    disconnected: {
      children: disconnectedChildren,
      variant: disconnectedVariant,
    },
    connecting: {
      children: connectingChildren,
      variant: connectingVariant,
    },
    connected: {
      children: connectedChildren,
      variant: connectedVariant,
    },
    ready: {
      children: readyChildren,
      variant: readyVariant,
    },
  };

  return (
    <ConnectButtonComponent
      transportState={transportState}
      size={size}
      stateContent={stateContent}
    />
  );
};
ConnectButtonDefault.storyName = "Connect Button";
