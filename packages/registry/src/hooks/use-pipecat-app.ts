"use client";

import type {
  APIRequest,
  PipecatClientOptions,
  TransportConnectionParams,
} from "@pipecat-ai/client-js";
import { PipecatClient } from "@pipecat-ai/client-js";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  createTransport,
  type TransportOptions,
  type TransportType,
} from "@/lib/transports";

/** Client states from which a new connection attempt may start. */
const CONNECTABLE_STATES: string[] = ["initialized", "disconnected", "error"];

export interface UsePipecatAppOptions {
  /**
   * Which transport backs the client (default "smallwebrtc"). The transport
   * package is loaded on demand — install the matching @pipecat-ai/*-transport
   * package; a missing one surfaces as `error` with the install command.
   * This is the only option that rebuilds the client when it changes.
   */
  transportType?: TransportType;
  /**
   * Constructor options for the selected transport. Read once at client
   * creation — to apply a change, remount the calling component with a
   * React `key`.
   */
  transportOptions?: TransportOptions;
  /**
   * Overrides merged into the PipecatClient constructor (defaults:
   * enableMic true, enableCam false). Read once at client creation, like
   * `transportOptions`.
   */
  clientOptions?: Partial<PipecatClientOptions>;
  /**
   * Connection params passed to connect(), or an APIRequest (an object with
   * an `endpoint`) to start a bot and connect in one step. Read at connect
   * time, so it may change between attempts.
   */
  connectParams?: TransportConnectionParams | APIRequest;
  /**
   * When set, connect() first starts a bot via client.startBot() with these
   * params, then connects with the (optionally transformed) response. Takes
   * precedence over `connectParams`.
   */
  startBotParams?: APIRequest;
  /** Transforms the startBot response before it is passed to connect(). */
  startBotResponseTransformer?: (
    response: TransportConnectionParams,
  ) => TransportConnectionParams | Promise<TransportConnectionParams>;
  /** Connect automatically once the client is ready. Default false. */
  connectOnMount?: boolean;
  /** Call client.initDevices() as soon as the client exists. Default false. */
  initDevicesOnMount?: boolean;
  /**
   * Fired once per created client, before any device init or connect —
   * subscribe to client events here to catch everything from the start.
   */
  onClient?: (client: PipecatClient) => void;
}

export interface UsePipecatAppReturn {
  /** Null until the transport module has loaded and the client is built. */
  client: PipecatClient | null;
  /**
   * Starts the session (startBot flow when configured). No-op unless the
   * client state is initialized, disconnected, or error.
   */
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /**
   * Failure message from transport loading, device init, or connecting —
   * null while healthy. Cleared automatically when connect() retries.
   */
  error: string | null;
  clearError: () => void;
  /** Raw client.startBot() response from the most recent connect. */
  rawStartBotResponse: unknown;
  /** The startBot response after `startBotResponseTransformer` ran. */
  transformedStartBotResponse: unknown;
}

/**
 * Bootstraps a PipecatClient for a chosen transport and owns the
 * connect/disconnect lifecycle. Renders nothing — pass the returned client
 * to a PipecatClientProvider yourself:
 *
 * ```tsx
 * const { client, connect } = usePipecatApp({ connectParams });
 * if (!client) return <Spinner />;
 * return <PipecatClientProvider client={client}>…</PipecatClientProvider>;
 * ```
 *
 * The client is created once per `transportType`; every other option is read
 * when it is used, so changing them never tears down a live session. To
 * force a rebuild (e.g. new transportOptions), remount with a React `key`.
 */
export function usePipecatApp(
  options: UsePipecatAppOptions = {},
): UsePipecatAppReturn {
  const { transportType = "smallwebrtc" } = options;

  // Latest-value ref: effects and callbacks read options at call time, so
  // callers never need to memoize what they pass in.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [client, setClient] = useState<PipecatClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawStartBotResponse, setRawStartBotResponse] = useState<unknown>(null);
  const [transformedStartBotResponse, setTransformedStartBotResponse] =
    useState<unknown>(null);

  const startAndConnect = useCallback(async (activeClient: PipecatClient) => {
    const { connectParams, startBotParams, startBotResponseTransformer } =
      optionsRef.current;
    const activeTransportType =
      optionsRef.current.transportType ?? "smallwebrtc";
    try {
      if (startBotParams) {
        const response = await activeClient.startBot({
          requestData: {},
          ...startBotParams,
        });
        setRawStartBotResponse(response);
        if (
          activeTransportType === "smallwebrtc" &&
          typeof response === "object" &&
          response !== null &&
          "iceConfig" in response
        ) {
          const { iceConfig } = response as {
            iceConfig: { iceServers: RTCIceServer[] };
          };
          // Structural cast: SmallWebRTCTransport's type can't be named
          // here (transports are optional installs); the assignment only
          // needs the setter to exist.
          (
            activeClient.transport as { iceServers?: RTCIceServer[] }
          ).iceServers = iceConfig.iceServers;
        }
        const transformed = startBotResponseTransformer
          ? await startBotResponseTransformer(response)
          : response;
        await activeClient.connect(transformed);
        setTransformedStartBotResponse(transformed);
      } else if (
        connectParams &&
        typeof connectParams === "object" &&
        "endpoint" in connectParams
      ) {
        await activeClient.startBotAndConnect(connectParams as APIRequest);
      } else {
        await activeClient.connect(connectParams ?? {});
      }
    } catch (err) {
      setError(
        `Failed to start session: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let createdClient: PipecatClient | null = null;

    (async () => {
      const { transportOptions, clientOptions } = optionsRef.current;
      let transport;
      try {
        transport = await createTransport(transportType, transportOptions);
      } catch (err) {
        // Surface the load failure (with its install hint) instead of
        // leaving callers on a spinner forever.
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
        return;
      }
      if (cancelled) return;

      const pcClient = new PipecatClient({
        enableCam: false,
        enableMic: true,
        transport,
        ...clientOptions,
      });
      createdClient = pcClient;
      setClient(pcClient);
      optionsRef.current.onClient?.(pcClient);

      try {
        if (optionsRef.current.initDevicesOnMount) {
          await pcClient.initDevices();
        }
        if (!cancelled && optionsRef.current.connectOnMount) {
          await startAndConnect(pcClient);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
      void createdClient?.disconnect();
      setClient(null);
      setError(null);
      setRawStartBotResponse(null);
      setTransformedStartBotResponse(null);
    };
  }, [transportType, startAndConnect]);

  const connect = useCallback(async () => {
    if (!client || !CONNECTABLE_STATES.includes(client.state)) return;
    setError(null);
    await startAndConnect(client);
  }, [client, startAndConnect]);

  const disconnect = useCallback(async () => {
    if (!client) return;
    await client.disconnect();
  }, [client]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    client,
    connect,
    disconnect,
    error,
    clearError,
    rawStartBotResponse,
    transformedStartBotResponse,
  };
}
