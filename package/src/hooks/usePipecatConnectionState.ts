import { RTVIEvent, TransportState } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";
import { useCallback, useState } from "react";

/**
 * Simplified connection states derived from Pipecat transport states.
 *
 * This type provides a simplified view of connectivity that's useful for UI controls
 * where the full complexity of transport states isn't needed.
 */
export type PipecatConnectionState =
  | "disconnected"
  | "connecting"
  | "connected";

/**
 * Return type for the usePipecatConnectionState hook.
 */
export interface PipecatConnectionStateResult {
  /** The current connection state */
  state: PipecatConnectionState;
  /** True when the connection is established and ready */
  isConnected: boolean;
  /** True when attempting to establish a connection */
  isConnecting: boolean;
  /** True when disconnected or in an error state */
  isDisconnected: boolean;
}

/**
 * Hook that provides a simplified connection state for Pipecat transport.
 *
 * This hook derives a basic connectivity state from the underlying Pipecat transport
 * states, mapping them to three simple states: disconnected, connecting, and connected.
 *
 * **Purpose:**
 * - Simplifies transport state management for UI components
 * - Provides consistent state for controlling button labels, loading states, and disabled elements
 * - Abstracts away complex transport states that aren't useful for UI control
 *
 * **State Mapping:**
 * - `"ready"` → `"connected"`
 * - `"authenticating"` | `"authenticated"` | `"connecting"` → `"connecting"`
 * - All other states → `"disconnected"`
 *
 * @returns {PipecatConnectionStateResult} Object containing the state and boolean flags
 *
 * @example
 * ```tsx
 * const { state, isConnected, isConnecting, isDisconnected } = usePipecatConnectionState();
 *
 * return (
 *   <button
 *     disabled={!isConnected}
 *     onClick={handleConnect}
 *   >
 *     {isConnected ? "Connected" :
 *      isConnecting ? "Connecting..." : "Connect"}
 *   </button>
 * );
 * ```
 */
export const usePipecatConnectionState = (): PipecatConnectionStateResult => {
  const [connectionState, setConnectionState] =
    useState<PipecatConnectionState>("disconnected");

  useRTVIClientEvent(
    RTVIEvent.TransportStateChanged,
    useCallback((state: TransportState) => {
      if (state === "ready") {
        setConnectionState("connected");
      } else if (
        ["authenticating", "authenticated", "connecting", "connected"].includes(
          state,
        )
      ) {
        setConnectionState("connecting");
      } else {
        setConnectionState("disconnected");
      }
    }, []),
  );

  return {
    state: connectionState,
    isConnected: connectionState === "connected",
    isConnecting: connectionState === "connecting",
    isDisconnected: connectionState === "disconnected",
  };
};
