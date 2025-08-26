import { Button } from "@/components/ui/button";
import type { ButtonSize, ButtonVariant } from "@/components/ui/buttonVariants";
import { cn } from "@/lib/utils";
import { type TransportState } from "@pipecat-ai/client-js";
import { usePipecatClientTransportState } from "@pipecat-ai/client-react";
import React, { memo } from "react";

/**
 * Configuration for customizing button appearance and content for specific transport states.
 * Allows partial configuration - only specify the states you want to customize.
 */
export type ConnectButtonStateContent = Partial<
  Record<
    TransportState,
    {
      /** The text or content to display in the button */
      children: React.ReactNode;
      /** The button variant to use for this state */
      variant: ButtonVariant;
      /** Optional CSS class to apply to the button */
      className?: string;
    }
  >
>;

/**
 * Props for the ConnectButton component.
 */
export type ConnectButtonProps = {
  /** CSS class name to apply to the button */
  className?: string;
  /** Callback function called when the connect action is triggered */
  onConnect?: () => void;
  /** Generic click handler for the button */
  onClick?: () => void;
  /** Callback function called when the disconnect action is triggered */
  onDisconnect?: () => void;
  /** Size of the button component */
  size?: ButtonSize;
  /** Default variant of the button component */
  defaultVariant?: ButtonVariant;
  /** Custom state content configuration for different transport states */
  stateContent?: ConnectButtonStateContent;
};

/**
 * Internal component that renders a connect/disconnect button based on transport state.
 * Handles button appearance, content, and interactions based on the current transport state.
 *
 * @param props - Component props including transport state and configuration
 * @returns A button component that adapts to the current transport state
 */
export const ConnectButtonComponent: React.FC<
  ConnectButtonProps & {
    transportState: TransportState;
  }
> = ({
  className: passedClassName,
  onClick,
  onConnect,
  onDisconnect,
  stateContent,
  size = "md",
  transportState,
}) => {
  /**
   * Determines button properties based on current transport state and custom state content.
   * Prioritizes custom state content over default behavior.
   *
   * @returns Button props including children, variant, and className
   */
  const getButtonProps = (): React.ComponentProps<typeof Button> => {
    // Check if we have custom content for this state
    if (stateContent && stateContent[transportState]) {
      return stateContent[transportState]!;
    }

    // Default content based on transport state
    switch (transportState) {
      case "disconnected":
      case "initialized":
        return {
          children: "Connect",
          variant: "active",
        };
      case "initializing":
        return {
          children: "Initializing...",
          variant: "secondary",
        };
      case "ready":
        return {
          children: "Disconnect",
          variant: "destructive",
        };
      case "disconnecting":
        return { children: "Disconnecting...", variant: "secondary" };
      case "error":
        return { children: "Error", variant: "destructive" };
      default:
        return { children: "Connecting...", variant: "secondary" };
    }
  };

  const { children, className, variant } = getButtonProps();

  /**
   * Handles button click events.
   * Calls the generic onClick handler, then either onConnect or onDisconnect based on current state.
   */
  const handleClick = () => {
    onClick?.();
    if (["ready", "connected"].includes(transportState)) {
      onDisconnect?.();
    } else {
      onConnect?.();
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      disabled={
        !["disconnected", "ready", "initialized"].includes(transportState)
      }
      isLoading={
        !["disconnected", "ready", "error", "initialized"].includes(
          transportState,
        )
      }
      className={cn(className, passedClassName)}
    >
      {children}
    </Button>
  );
};

/**
 * ConnectButton component that automatically adapts to the current transport state.
 *
 * This component:
 * - Automatically gets the current transport state from the Pipecat client
 * - Renders a button that changes appearance and behavior based on the state
 * - Handles connect/disconnect actions automatically
 * - Supports custom state content configuration
 *
 * @param props - Component configuration including callbacks and styling options
 * @returns A button component that adapts to transport state changes
 */
export const ConnectButton = memo((props: ConnectButtonProps) => {
  const transportState = usePipecatClientTransportState();

  return <ConnectButtonComponent transportState={transportState} {...props} />;
});

ConnectButton.displayName = "ConnectButton";

export default ConnectButton;
