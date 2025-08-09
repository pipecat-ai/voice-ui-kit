"use client";

import { createTransport } from "@/lib/transports";
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
import React, { useEffect, useState } from "react";
import { ThemeProvider, type ThemeProviderProps } from "../ThemeProvider";

/**
 * Props for the PipecatAppBase component.
 */
export interface PipecatBaseProps {
  /** Connection parameters for the Pipecat client */
  connectParams: TransportConnectionParams | ConnectionEndpoint;
  /** Type of transport to use for the connection */
  transportType: "smallwebrtc" | "daily";
  /** Optional configuration options for the Pipecat client */
  clientOptions?: PipecatClientOptions;
  /** Whether to disable the theme provider */
  noThemeProvider?: boolean;
  /** Default theme to use for the app */
  themeProps?: Partial<ThemeProviderProps>;

  /**
   * Children can be either:
   * - A render prop function that receives helper props and returns React nodes
   * - Direct React nodes that will be wrapped with the necessary providers
   *
   * @param props - PipecatBasePassedProps including connection handlers, loading, and error state
   * @returns React.ReactNode
   */
  children:
    | ((props: PipecatBaseChildProps) => React.ReactNode)
    | React.ReactNode;
}

/**
 * Props that are passed to child components by the PipecatAppBase.
 */
export interface PipecatBaseChildProps {
  /** Pipecat client instance */
  client: PipecatClient | null;
  /** Function to initiate a connection to the session. Can be sync or async. */
  handleConnect?: () => void | Promise<void>;
  /** Function to disconnect from the current session. Can be sync or async. */
  handleDisconnect?: () => void | Promise<void>;
  /** Error message if connection fails */
  error?: string | null;
}

/**
 * PipecatAppBase component that provides a configured Pipecat client with audio capabilities.
 *
 * This component:
 * - Initializes a Pipecat client with the specified transport type
 * - Provides connection and disconnection handlers (sync or async)
 * - Wraps children in the necessary providers (ThemeProvider, PipecatClientProvider)
 * - Handles error states and loading states
 * - Automatically disconnects the client when unmounting
 * - Optionally disables theme provider based on noThemeProvider prop
 *
 * @param props - Configuration for the audio client including connection params and transport type
 * @returns A provider component that wraps children with client context and handlers
 *
 * @example
 * ```tsx
 * // Using as a render prop (function children)
 * <PipecatAppBase
 *   connectParams={...}
 *   transportType="daily"
 * >
 *   {({ client, handleConnect, handleDisconnect, error }) => (
 *     <YourComponent
 *       client={client}
 *       handleConnect={handleConnect}
 *       handleDisconnect={handleDisconnect}
 *       error={error}
 *     />
 *   )}
 * </PipecatAppBase>
 *
 * // Using with direct React nodes
 * <PipecatAppBase
 *   connectParams={...}
 *   transportType="daily"
 * >
 *   <YourComponent />
 * </PipecatAppBase>
 *
 * // Using with noThemeProvider to disable theme wrapping
 * <PipecatAppBase
 *   connectParams={...}
 *   transportType="daily"
 *   noThemeProvider={true}
 * >
 *   <YourComponent />
 * </PipecatAppBase>
 * ```
 */
export const PipecatAppBase: React.FC<PipecatBaseProps> = ({
  connectParams,
  transportType,
  clientOptions,
  noThemeProvider = false,
  themeProps,
  children,
}) => {
  const [client, setClient] = useState<PipecatClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initializes the Pipecat client with the specified transport type.
   * Creates a new client instance when transport type or connection params change.
   * Uses a ref to prevent double initialization in Strict Mode.
   */
  useEffect(() => {
    let currentClient: PipecatClient | null = null;

    (async () => {
      try {
        const transport = await createTransport(transportType);

        const pcClient = new PipecatClient({
          enableCam: false,
          enableMic: true,
          transport: transport,
          ...clientOptions,
        });
        currentClient = pcClient;
        setClient(pcClient);
      } catch (error) {
        console.error("Failed to initialize transport:", error);
      }
    })();

    return () => {
      currentClient?.disconnect();
      setClient(null);
      setError(null);
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

  /**
   * Show loading state while client is being initialized.
   * Don't render PipecatClientProvider until client is ready to prevent multiple instances.
   */
  if (!client) {
    return typeof children === "function"
      ? children({ client: null, error: null })
      : children;
  }

  const passedProps: PipecatBaseChildProps = {
    client,
    handleConnect,
    handleDisconnect,
    error,
  };

  // Only create PipecatClientProvider when client is fully initialized
  const clientProvider = (
    <PipecatClientProvider client={client!}>
      {typeof children === "function" ? children(passedProps) : children}
      <PipecatClientAudio />
    </PipecatClientProvider>
  );

  return noThemeProvider ? (
    clientProvider
  ) : (
    <ThemeProvider {...themeProps}>{clientProvider}</ThemeProvider>
  );
};

/**
 * @deprecated Use PipecatAppBase instead. This component will be removed in a future version.
 */
export const AudioAppHelper = PipecatAppBase;
