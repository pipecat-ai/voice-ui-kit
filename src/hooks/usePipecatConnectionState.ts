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
 * @returns {PipecatConnectionState} The simplified connection state
 *
 * @example
 * ```tsx
 * const connectionState = usePipecatConnectionState();
 *
 * return (
 *   <button
 *     disabled={connectionState !== "connected"}
 *     onClick={handleConnect}
 *   >
 *     {connectionState === "connected" ? "Connected" :
 *      connectionState === "connecting" ? "Connecting..." : "Connect"}
 *   </button>
 * );
 * ```
 */
export const usePipecatConnectionState = () => {
  const [connectionState, setConnectionState] =
    useState<PipecatConnectionState>("disconnected");

  useRTVIClientEvent(
    RTVIEvent.TransportStateChanged,
    useCallback((state: TransportState) => {
      if (state === "ready") {
        setConnectionState("connected");
      } else if (["authenticating", "authenticated"].includes(state)) {
        setConnectionState("connecting");
      } else {
        setConnectionState("disconnected");
      }
    }, []),
  );

  return connectionState;
};
