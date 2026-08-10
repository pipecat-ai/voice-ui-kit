import type { Transport } from "@pipecat-ai/client-js";

export type TransportType = "daily" | "smallwebrtc" | "websocket" | "moq";

/**
 * Constructor options for the selected transport.
 *
 * Typed loosely on purpose: transport packages are optional installs, so
 * their option types can't be referenced here without breaking consumers
 * that don't have them installed. For precise typing, annotate at the call
 * site with the transport package's own options type.
 */
export type TransportOptions = Record<string, unknown>;

type TransportConstructor = new (options?: TransportOptions) => Transport;

const INSTALL_HINTS: Record<TransportType, string> = {
  daily: "npm install @pipecat-ai/daily-transport",
  smallwebrtc: "npm install @pipecat-ai/small-webrtc-transport",
  websocket: "npm install @pipecat-ai/websocket-transport",
  moq: "npm install @pipecat-ai/moq-transport",
};

/**
 * Dynamically imports the transport class for a transport type.
 *
 * Transports load on demand so they stay optional installs — consumers only
 * add the package for the transport they actually use. A missing package
 * fails with an error naming the exact install command.
 */
export async function loadTransport(
  transportType: TransportType,
): Promise<TransportConstructor> {
  if (!(transportType in INSTALL_HINTS)) {
    throw new Error(`Unsupported transport type: ${String(transportType)}`);
  }
  try {
    switch (transportType) {
      case "daily": {
        const { DailyTransport } = await import(
          // Optional install: @ts-ignore, not @ts-expect-error — the latter
          // inverts into an error once the package IS present.
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          "@pipecat-ai/daily-transport"
        );
        return DailyTransport as TransportConstructor;
      }
      case "smallwebrtc": {
        const { SmallWebRTCTransport } = await import(
          // Optional install: @ts-ignore, not @ts-expect-error — the latter
          // inverts into an error once the package IS present.
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          "@pipecat-ai/small-webrtc-transport"
        );
        return SmallWebRTCTransport as TransportConstructor;
      }
      case "websocket": {
        const { WebSocketTransport } = await import(
          // Optional install: @ts-ignore, not @ts-expect-error — the latter
          // inverts into an error once the package IS present.
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          "@pipecat-ai/websocket-transport"
        );
        return WebSocketTransport as TransportConstructor;
      }
      case "moq": {
        const { MoqTransport } = await import(
          // MoQ's libav.js dependency doesn't survive strict bundlers, so
          // webpack/Turbopack skip this import entirely (alias the package
          // yourself to opt in there); Vite resolves it normally.
          /* webpackIgnore: true */ /* turbopackIgnore: true */
          // Optional install: @ts-ignore, not @ts-expect-error — the latter
          // inverts into an error once the package IS present.
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          "@pipecat-ai/moq-transport"
        );
        // Through unknown: MoQ's constructor options are required, unlike
        // the loose TransportOptions this loader hands every transport.
        return MoqTransport as unknown as TransportConstructor;
      }
    }
    // Unreachable: transportType was validated against INSTALL_HINTS above.
    throw new Error(`Unsupported transport type: ${String(transportType)}`);
  } catch (loadError) {
    const message =
      loadError instanceof Error ? loadError.message : String(loadError);
    throw new Error(
      `Failed to load transport "${transportType}". Make sure the package ` +
        `is installed: ${INSTALL_HINTS[transportType]}. Original error: ${message}`,
      { cause: loadError },
    );
  }
}

/**
 * Creates a transport instance for a transport type, loading the transport
 * package on demand. See {@link loadTransport} for the install semantics.
 */
export async function createTransport(
  transportType: TransportType,
  options?: TransportOptions,
): Promise<Transport> {
  const TransportClass = await loadTransport(transportType);
  return new TransportClass(options);
}
