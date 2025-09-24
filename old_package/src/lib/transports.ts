import type { Transport } from "@pipecat-ai/client-js";

export type TransportType = "daily" | "smallwebrtc";

// Use the actual types from the packages without importing them at build time
export type DailyTransportOptions = ConstructorParameters<
  typeof import("@pipecat-ai/daily-transport").DailyTransport
>[0];
export type SmallWebRTCTransportOptions = ConstructorParameters<
  typeof import("@pipecat-ai/small-webrtc-transport").SmallWebRTCTransport
>[0];

export interface TransportModule {
  DailyTransport: typeof import("@pipecat-ai/daily-transport").DailyTransport;
  SmallWebRTCTransport: typeof import("@pipecat-ai/small-webrtc-transport").SmallWebRTCTransport;
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
      default:
        throw new Error(`Unsupported transport type: ${transportType}`);
    }
  } catch (loadError) {
    const errorMessage =
      loadError instanceof Error ? loadError.message : String(loadError);
    throw new Error(
      `Failed to load transport "${transportType}". Make sure the package is installed: ${
        transportType === "daily"
          ? "npm install @pipecat-ai/daily-transport"
          : "npm install @pipecat-ai/small-webrtc-transport"
      }. Original error: ${errorMessage}`,
    );
  }
}

/**
 * Creates a transport instance based on the transport type.
 *
 * @param transportType - The type of transport to create ("daily" or "smallwebrtc")
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
  transportType: TransportType,
  options?: DailyTransportOptions | SmallWebRTCTransportOptions,
): Promise<Transport>;
export async function createTransport(
  transportType: TransportType,
  options?: DailyTransportOptions | SmallWebRTCTransportOptions,
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
    default:
      throw new Error(`Unsupported transport type: ${transportType}`);
  }
}
