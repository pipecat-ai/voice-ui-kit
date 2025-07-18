"use client";

import { LoaderIcon } from "@/icons";
import {
  type ConnectionEndpoint,
  PipecatClient,
  type PipecatClientOptions,
  type TransportConnectionParams,
} from "@pipecat-ai/client-js";
import {
  PipecatClientAudio,
  PipecatClientProvider,
} from "@pipecat-ai/client-react";
import { DailyTransport } from "@pipecat-ai/daily-transport";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import { cloneElement, isValidElement, useEffect, useState } from "react";
import { ThemeProvider } from "../ThemeProvider";

/**
 * Props for the AudioClientHelper component.
 */
export interface AppProps {
  /** Connection parameters for the Pipecat client */
  connectParams: TransportConnectionParams | ConnectionEndpoint;
  /** Type of transport to use for the connection */
  transportType: "smallwebrtc" | "daily";
  /** Optional configuration options for the Pipecat client */
  clientOptions?: PipecatClientOptions;
  /** Child components to render with the client context */
  children: React.ReactNode;
}

/**
 * Props that are passed to child components by the AudioClientHelper.
 */
export interface HelperChildProps {
  /** Function to initiate a connection to the session */
  handleConnect?: () => Promise<void>;
  /** Function to disconnect from the current session */
  handleDisconnect?: () => Promise<void>;
  /** Error message if connection fails */
  error?: string;
}

/**
 * AudioClientHelper component that provides a configured Pipecat client with audio capabilities.
 *
 * This component:
 * - Initializes a Pipecat client with the specified transport type
 * - Provides connection and disconnection handlers
 * - Wraps children in the necessary providers (ThemeProvider, PipecatClientProvider)
 * - Handles error states and loading states
 * - Automatically disconnects the client when unmounting
 *
 * @param props - Configuration for the audio client including connection params and transport type
 * @returns A provider component that wraps children with client context and handlers
 *
 * @example
 * ```tsx
 * <AudioClientHelper
 *   connectParams={...}
 *   transportType="daily"
 * >
 *   <YourComponent />
 * </AudioClientHelper>
 * ```
 */
export const AudioClientHelper = ({
  connectParams,
  transportType,
  clientOptions,
  children,
}: AppProps) => {
  const [client, setClient] = useState<PipecatClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initializes the Pipecat client with the specified transport type.
   * Creates a new client instance when transport type or connection params change.
   */
  useEffect(() => {
    let transport: DailyTransport | SmallWebRTCTransport;
    switch (transportType) {
      case "smallwebrtc":
        transport = new SmallWebRTCTransport();
        break;
      case "daily":
      default:
        transport = new DailyTransport();
        break;
    }

    const pcClient = new PipecatClient({
      enableCam: false,
      enableMic: true,
      transport: transport,
      ...clientOptions,
    });
    setClient(pcClient);

    return () => {
      /**
       * Disconnect client when component unmounts or options change.
       */
      pcClient.disconnect();
    };
  }, [connectParams, transportType, clientOptions]);

  /**
   * Initiates a connection to the session using the configured client.
   * Only allows connection from specific states (initialized, disconnected, error).
   * Clears any previous errors and handles connection failures.
   */
  const handleConnect = async () => {
    if (
      !client ||
      !["initialized", "disconnected", "error"].includes(client.state)
    ) {
      return;
    }
    setError(null);

    try {
      await client.connect(connectParams);
    } catch (err) {
      console.error("Connection error:", err);
      setError(
        `Failed to start session: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  /**
   * Disconnects from the current session.
   * Safely handles the case where no client is available.
   */
  const handleDisconnect = async () => {
    if (!client) return;
    await client.disconnect();
  };

  // Show loading state while client is being initialized
  if (!client) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <LoaderIcon className="animate-spin opacity-50" size={32} />
      </div>
    );
  }

  /**
   * Clones child elements and injects the helper props (handleConnect, handleDisconnect, error).
   * This allows child components to access the connection handlers and error state.
   */
  const childrenWithProps = isValidElement(children)
    ? cloneElement(children, {
        handleConnect,
        handleDisconnect,
        error,
      } as HelperChildProps)
    : children;

  return (
    <ThemeProvider>
      <PipecatClientProvider client={client!}>
        {childrenWithProps}
        <PipecatClientAudio />
      </PipecatClientProvider>
    </ThemeProvider>
  );
};
