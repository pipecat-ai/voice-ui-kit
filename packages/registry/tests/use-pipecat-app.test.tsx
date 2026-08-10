import { PipecatClient } from "@pipecat-ai/client-js";
import { act, renderHook, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  usePipecatApp,
  type UsePipecatAppOptions,
} from "@/hooks/use-pipecat-app";
import { StubTransport } from "./helpers/stub-transport";

const transports = vi.hoisted(() => ({
  createTransport: vi.fn(),
  loadTransport: vi.fn(),
}));

vi.mock("@/lib/transports", () => ({
  createTransport: transports.createTransport,
  loadTransport: transports.loadTransport,
}));

// Network-touching client methods are spied so no test awaits a bot-ready
// signal that never comes. The client itself stays the real class over a
// real Transport subclass.
let connectSpy: ReturnType<typeof vi.spyOn>;
let startBotSpy: ReturnType<typeof vi.spyOn>;
let startBotAndConnectSpy: ReturnType<typeof vi.spyOn>;
let initDevicesSpy: ReturnType<typeof vi.spyOn>;
let disconnectSpy: ReturnType<typeof vi.spyOn>;

let lastTransport: StubTransport | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  lastTransport = null;
  transports.createTransport.mockImplementation(async () => {
    lastTransport = new StubTransport();
    return lastTransport;
  });
  connectSpy = vi
    .spyOn(PipecatClient.prototype, "connect")
    .mockResolvedValue(undefined as never);
  startBotSpy = vi
    .spyOn(PipecatClient.prototype, "startBot")
    .mockResolvedValue({} as never);
  startBotAndConnectSpy = vi
    .spyOn(PipecatClient.prototype, "startBotAndConnect")
    .mockResolvedValue(undefined as never);
  initDevicesSpy = vi
    .spyOn(PipecatClient.prototype, "initDevices")
    .mockResolvedValue(undefined);
  disconnectSpy = vi
    .spyOn(PipecatClient.prototype, "disconnect")
    .mockResolvedValue(undefined as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function renderApp(initialProps: UsePipecatAppOptions = {}) {
  const utils = renderHook(
    (props: UsePipecatAppOptions) => usePipecatApp(props),
    {
      initialProps,
    },
  );
  await waitFor(() => expect(utils.result.current.client).not.toBeNull());
  return utils;
}

describe("usePipecatApp", () => {
  it("builds a client for the default transport", async () => {
    const onClient = vi.fn();
    const { result } = await renderApp({ onClient });
    expect(transports.createTransport).toHaveBeenCalledWith(
      "smallwebrtc",
      undefined,
    );
    expect(onClient).toHaveBeenCalledTimes(1);
    expect(onClient).toHaveBeenCalledWith(result.current.client);
    expect(result.current.error).toBeNull();
  });

  it("leaves exactly one live client under StrictMode", async () => {
    const onClient = vi.fn();
    const { result, unmount } = renderHook(() => usePipecatApp({ onClient }), {
      wrapper: StrictMode,
    });
    await waitFor(() => expect(result.current.client).not.toBeNull());
    // The aborted first effect run bails before construction, so only one
    // client is ever created and nothing needed disconnecting.
    expect(onClient).toHaveBeenCalledTimes(1);
    unmount();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it("surfaces transport load failures instead of spinning forever", async () => {
    transports.createTransport.mockRejectedValueOnce(
      new Error(
        'Failed to load transport "daily". Make sure the package is installed: npm install @pipecat-ai/daily-transport.',
      ),
    );
    const { result } = renderHook(() =>
      usePipecatApp({ transportType: "daily" }),
    );
    await waitFor(() =>
      expect(result.current.error).toContain(
        "npm install @pipecat-ai/daily-transport",
      ),
    );
    expect(result.current.client).toBeNull();
  });

  it("routes endpoint-shaped connectParams to startBotAndConnect", async () => {
    const connectParams = { endpoint: "/api/start" };
    const { result } = await renderApp({ connectParams });
    await act(() => result.current.connect());
    expect(startBotAndConnectSpy).toHaveBeenCalledWith(connectParams);
    expect(connectSpy).not.toHaveBeenCalled();
  });

  it("connects directly with plain connectParams", async () => {
    const connectParams = { webrtcUrl: "http://localhost:7860/api/offer" };
    const { result } = await renderApp({ connectParams });
    await act(() => result.current.connect());
    expect(connectSpy).toHaveBeenCalledWith(connectParams);
    expect(startBotAndConnectSpy).not.toHaveBeenCalled();
  });

  it("runs the startBot flow with transformer and smallwebrtc iceConfig", async () => {
    const iceServers = [{ urls: "stun:stun.example.com" }];
    startBotSpy.mockResolvedValue({ iceConfig: { iceServers } } as never);
    const transformer = vi.fn((response: unknown) => ({
      transformed: true,
      response,
    }));
    const { result } = await renderApp({
      startBotParams: { endpoint: "/api/bot" },
      startBotResponseTransformer:
        transformer as UsePipecatAppOptions["startBotResponseTransformer"],
    });
    await act(() => result.current.connect());
    expect(startBotSpy).toHaveBeenCalledWith({
      requestData: {},
      endpoint: "/api/bot",
    });
    expect(
      (lastTransport as unknown as { iceServers?: unknown })?.iceServers,
    ).toEqual(iceServers);
    expect(transformer).toHaveBeenCalledTimes(1);
    expect(connectSpy).toHaveBeenCalledWith(
      expect.objectContaining({ transformed: true }),
    );
    expect(result.current.rawStartBotResponse).toEqual({
      iceConfig: { iceServers },
    });
    expect(result.current.transformedStartBotResponse).toEqual(
      expect.objectContaining({ transformed: true }),
    );
  });

  it("surfaces the real connect error message and clears it", async () => {
    connectSpy.mockRejectedValueOnce(new Error("bot exploded") as never);
    const { result } = await renderApp({});
    await act(() => result.current.connect());
    expect(result.current.error).toBe("Failed to start session: bot exploded");
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it("ignores connect() while in a non-connectable state", async () => {
    const { result } = await renderApp({});
    lastTransport!.state = "connecting";
    await act(() => result.current.connect());
    expect(connectSpy).not.toHaveBeenCalled();
    expect(startBotAndConnectSpy).not.toHaveBeenCalled();
  });

  it("sequences initDevicesOnMount before connectOnMount", async () => {
    const order: string[] = [];
    initDevicesSpy.mockImplementation(async () => {
      order.push("initDevices");
    });
    connectSpy.mockImplementation((async () => {
      order.push("connect");
    }) as never);
    await renderApp({ initDevicesOnMount: true, connectOnMount: true });
    await waitFor(() => expect(order).toEqual(["initDevices", "connect"]));
  });

  it("rebuilds only when transportType changes", async () => {
    const onClient = vi.fn();
    const { result, rerender } = await renderApp({ onClient });
    const firstClient = result.current.client;

    rerender({ onClient, connectParams: { endpoint: "/changed" } });
    await waitFor(() => expect(result.current.client).toBe(firstClient));
    expect(onClient).toHaveBeenCalledTimes(1);
    expect(disconnectSpy).not.toHaveBeenCalled();

    rerender({ onClient, transportType: "websocket" });
    await waitFor(() => expect(onClient).toHaveBeenCalledTimes(2));
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(transports.createTransport).toHaveBeenLastCalledWith(
      "websocket",
      undefined,
    );
  });
});
