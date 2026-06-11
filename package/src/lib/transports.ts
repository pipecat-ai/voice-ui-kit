import type { Transport } from "@pipecat-ai/client-js";

export type TransportType = "daily" | "smallwebrtc" | "websocket" | "moq";

// Use the actual types from the packages without importing them at build time
export type DailyTransportOptions = ConstructorParameters<
  typeof import("@pipecat-ai/daily-transport").DailyTransport
>[0];
export type SmallWebRTCTransportOptions = ConstructorParameters<
  typeof import("@pipecat-ai/small-webrtc-transport").SmallWebRTCTransport
>[0];
export type WebSocketTransportOptions = ConstructorParameters<
  typeof import("@pipecat-ai/websocket-transport").WebSocketTransport
>[0];
export type MoqTransportOptions = ConstructorParameters<
  typeof import("@pipecat-ai/moq-transport").MoqTransport
>[0];

export interface TransportModule {
  DailyTransport: typeof import("@pipecat-ai/daily-transport").DailyTransport;
  SmallWebRTCTransport: typeof import("@pipecat-ai/small-webrtc-transport").SmallWebRTCTransport;
  WebSocketTransport: typeof import("@pipecat-ai/websocket-transport").WebSocketTransport;
  MoqTransport: typeof import("@pipecat-ai/moq-transport").MoqTransport;
}

/**
 * Dynamically imports transport modules based on the transport type.
 * This allows the packages to be peer dependencies and only loaded when needed.
 */
export async function loadTransport(transportType: TransportType) {
  try {
    switch (transportType) {
      case "daily": {
        const { DailyTransport } = await import("@pipecat-ai/daily-transport");
        return { DailyTransport };
      }
      case "smallwebrtc": {
        const { SmallWebRTCTransport } = await import(
          "@pipecat-ai/small-webrtc-transport"
        );
        return { SmallWebRTCTransport };
      }
      case "websocket": {
        const { WebSocketTransport } = await import(
          "@pipecat-ai/websocket-transport"
        );
        return { WebSocketTransport };
      }
      case "moq": {
        const { MoqTransport } = await import("@pipecat-ai/moq-transport");
        return { MoqTransport };
      }
      default:
        throw new Error(`Unsupported transport type: ${transportType}`);
    }
  } catch (loadError) {
    const errorMessage =
      loadError instanceof Error ? loadError.message : String(loadError);
    const installHint =
      transportType === "daily"
        ? "npm install @pipecat-ai/daily-transport"
        : transportType === "smallwebrtc"
          ? "npm install @pipecat-ai/small-webrtc-transport"
          : transportType === "websocket"
            ? "npm install @pipecat-ai/websocket-transport"
            : "npm install @pipecat-ai/moq-transport";
    throw new Error(
      `Failed to load transport "${transportType}". Make sure the package is installed: ${installHint}. Original error: ${errorMessage}`,
    );
  }
}

/**
 * Creates a transport instance based on the transport type.
 *
 * @param transportType - The type of transport to create ("daily", "smallwebrtc", "websocket", or "moq")
 * @param options - Transport-specific options
 *
 */
export async function createTransport(
  transportType: "daily",
  options?: DailyTransportOptions,
): Promise<Transport>;
export async function createTransport(
  transportType: "smallwebrtc",
  options?: SmallWebRTCTransportOptions,
): Promise<Transport>;
export async function createTransport(
  transportType: "websocket",
  options?: WebSocketTransportOptions,
): Promise<Transport>;
export async function createTransport(
  transportType: "moq",
  options?: MoqTransportOptions,
): Promise<Transport>;
export async function createTransport(
  transportType: TransportType,
  options?:
    | DailyTransportOptions
    | SmallWebRTCTransportOptions
    | WebSocketTransportOptions
    | MoqTransportOptions,
): Promise<Transport>;
export async function createTransport(
  transportType: TransportType,
  options?:
    | DailyTransportOptions
    | SmallWebRTCTransportOptions
    | WebSocketTransportOptions
    | MoqTransportOptions,
): Promise<Transport> {
  const transportModule = await loadTransport(transportType);

  switch (transportType) {
    case "daily": {
      const { DailyTransport } = transportModule;
      if (!DailyTransport) {
        throw new Error("DailyTransport not found in loaded module");
      }
      return new DailyTransport(options as DailyTransportOptions);
    }
    case "smallwebrtc": {
      const { SmallWebRTCTransport } = transportModule;
      if (!SmallWebRTCTransport) {
        throw new Error("SmallWebRTCTransport not found in loaded module");
      }
      return new SmallWebRTCTransport(options as SmallWebRTCTransportOptions);
    }
    case "websocket": {
      const { WebSocketTransport } = transportModule;
      if (!WebSocketTransport) {
        throw new Error("WebSocketTransport not found in loaded module");
      }
      return new WebSocketTransport(options as WebSocketTransportOptions);
    }
    case "moq": {
      const { MoqTransport } = transportModule;
      if (!MoqTransport) {
        throw new Error("MoqTransport not found in loaded module");
      }
      return new MoqTransport(options as MoqTransportOptions);
    }
    default:
      throw new Error(`Unsupported transport type: ${transportType}`);
  }
}
