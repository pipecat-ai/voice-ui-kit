import type { PipecatClient } from "@pipecat-ai/client-js";
import { RTVIEvent } from "@pipecat-ai/client-js";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  usePipecatEventStream,
  usePipecatEventStreamStore,
} from "@/hooks/use-pipecat-event-stream";

const hooks = vi.hoisted(() => ({
  usePipecatClient: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
  usePipecatClient: hooks.usePipecatClient,
}));

function makeFakeClient() {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
  return {
    handlers,
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    }),
    off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers.get(event)?.delete(handler);
    }),
    emit(event: string, ...args: unknown[]) {
      handlers.get(event)?.forEach((handler) => handler(...args));
    },
  };
}

let fakeClient: ReturnType<typeof makeFakeClient>;

function emit(event: string, ...args: unknown[]) {
  act(() => {
    fakeClient.emit(event, ...args);
  });
}

/** Capture is rAF-batched (shimmed onto a 16ms timeout in setup). */
async function flushed<T>(read: () => T, expected: (value: T) => void) {
  await waitFor(() => expected(read()));
}

beforeEach(() => {
  vi.clearAllMocks();
  fakeClient = makeFakeClient();
  hooks.usePipecatClient.mockReturnValue(
    fakeClient as unknown as PipecatClient,
  );
  // clear() also drops the module-level pending rAF batch between tests.
  usePipecatEventStreamStore.getState().clear();
  usePipecatEventStreamStore.setState({
    events: [],
    paused: false,
    maxEvents: 500,
  });
});

describe("usePipecatEventStream", () => {
  it("captures RTVI events with type, data, and timestamp", async () => {
    const { result } = renderHook(() => usePipecatEventStream());
    emit(RTVIEvent.BotStartedSpeaking);
    emit(RTVIEvent.ServerMessage, { hello: true });
    await flushed(
      () => result.current.events,
      (events) => expect(events).toHaveLength(2),
    );
    expect(result.current.events[0]).toMatchObject({
      type: "botStartedSpeaking",
    });
    expect(result.current.events[1]).toMatchObject({
      type: "serverMessage",
      data: { hello: true },
    });
    expect(result.current.events[1]!.timestamp).toBeInstanceOf(Date);
  });

  it("never captures LocalAudioLevel", async () => {
    const { result } = renderHook(() => usePipecatEventStream());
    expect(
      fakeClient.on.mock.calls.some(
        ([event]) => event === RTVIEvent.LocalAudioLevel,
      ),
    ).toBe(false);
    emit(RTVIEvent.BotStartedSpeaking);
    await flushed(
      () => result.current.events,
      (events) => expect(events).toHaveLength(1),
    );
  });

  it("evicts oldest events beyond the cap", async () => {
    usePipecatEventStreamStore.setState({ maxEvents: 3 });
    const { result } = renderHook(() => usePipecatEventStream());
    for (let i = 0; i < 5; i++) emit(RTVIEvent.UserStartedSpeaking);
    await flushed(
      () => result.current.events,
      (events) => expect(events).toHaveLength(3),
    );
  });

  it("lets the largest requested maxEvents win", () => {
    renderHook(() => usePipecatEventStream({ maxEvents: 2000 }));
    renderHook(() => usePipecatEventStream({ maxEvents: 100 }));
    expect(usePipecatEventStreamStore.getState().maxEvents).toBe(2000);
  });

  it("filters per subscriber, includeEvents winning over ignoreEvents", async () => {
    const withBoth = renderHook(() =>
      usePipecatEventStream({
        includeEvents: [RTVIEvent.BotStartedSpeaking],
        ignoreEvents: [RTVIEvent.BotStartedSpeaking],
      }),
    );
    const withIgnore = renderHook(() =>
      usePipecatEventStream({
        ignoreEvents: [RTVIEvent.BotStartedSpeaking],
      }),
    );
    emit(RTVIEvent.BotStartedSpeaking);
    emit(RTVIEvent.UserStartedSpeaking);
    await flushed(
      () => withBoth.result.current.events,
      (events) => expect(events).toHaveLength(1),
    );
    expect(withBoth.result.current.events[0]!.type).toBe("botStartedSpeaking");
    expect(withIgnore.result.current.events).toHaveLength(1);
    expect(withIgnore.result.current.events[0]!.type).toBe(
      "userStartedSpeaking",
    );
  });

  it("gives late subscribers the shared backlog", async () => {
    const first = renderHook(() => usePipecatEventStream());
    emit(RTVIEvent.BotStartedSpeaking);
    await flushed(
      () => first.result.current.events,
      (events) => expect(events).toHaveLength(1),
    );

    const late = renderHook(() => usePipecatEventStream());
    expect(late.result.current.events).toHaveLength(1);
  });

  it("groups consecutive events by key", async () => {
    const { result } = renderHook(() =>
      usePipecatEventStream({ groupConsecutive: true }),
    );
    emit(RTVIEvent.BotTranscript, { text: "a" });
    emit(RTVIEvent.BotTranscript, { text: "b" });
    emit(RTVIEvent.UserStartedSpeaking);
    await flushed(
      () => result.current.groups,
      (groups) => expect(groups).toHaveLength(2),
    );
    expect(result.current.groups[0]!.events).toHaveLength(2);
    expect(result.current.groups[0]!.type).toBe("botTranscript");
    expect(result.current.groups[1]!.events).toHaveLength(1);
  });

  it("pauses capture without detaching listeners", async () => {
    const { result } = renderHook(() => usePipecatEventStream());
    act(() => result.current.setPaused(true));
    emit(RTVIEvent.BotStartedSpeaking);
    // Give the (suppressed) flush a beat before asserting nothing arrived.
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(result.current.events).toHaveLength(0);
    expect(fakeClient.off).not.toHaveBeenCalled();

    act(() => result.current.setPaused(false));
    emit(RTVIEvent.BotStartedSpeaking);
    await flushed(
      () => result.current.events,
      (events) => expect(events).toHaveLength(1),
    );
  });

  it("clears on demand and automatically on a new session", async () => {
    const { result } = renderHook(() => usePipecatEventStream());
    emit(RTVIEvent.BotStartedSpeaking);
    await flushed(
      () => result.current.events,
      (events) => expect(events.length).toBeGreaterThan(0),
    );
    act(() => result.current.clear());
    expect(result.current.events).toHaveLength(0);

    emit(RTVIEvent.BotStartedSpeaking);
    emit(RTVIEvent.TransportStateChanged, "disconnected");
    emit(RTVIEvent.TransportStateChanged, "initializing");
    // The auto-clear drops everything captured before the new session.
    await flushed(
      () => result.current.events,
      (events) =>
        expect(events.every((e) => e.type !== "botStartedSpeaking")).toBe(true),
    );
  });

  it("fires onEvent for new filter-passing events only, skipping backlog", async () => {
    const first = renderHook(() => usePipecatEventStream());
    emit(RTVIEvent.BotStartedSpeaking);
    await flushed(
      () => first.result.current.events,
      (events) => expect(events).toHaveLength(1),
    );

    const onEvent = vi.fn();
    const { result } = renderHook(() =>
      usePipecatEventStream({
        onEvent,
        includeEvents: [RTVIEvent.UserStartedSpeaking],
      }),
    );
    expect(onEvent).not.toHaveBeenCalled();

    emit(RTVIEvent.BotStoppedSpeaking); // filtered out for this subscriber
    emit(RTVIEvent.UserStartedSpeaking);
    await flushed(
      () => result.current.events,
      (events) => expect(events).toHaveLength(1),
    );
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent.mock.calls[0]![0]).toMatchObject({
      type: "userStartedSpeaking",
    });
  });

  it("attaches one listener set per client and detaches with the last subscriber", () => {
    const first = renderHook(() => usePipecatEventStream());
    const second = renderHook(() => usePipecatEventStream());
    const metricsOnCalls = fakeClient.on.mock.calls.filter(
      ([event]) => event === RTVIEvent.BotStartedSpeaking,
    );
    expect(metricsOnCalls).toHaveLength(1);

    first.unmount();
    expect(fakeClient.off).not.toHaveBeenCalled();
    second.unmount();
    expect(
      fakeClient.off.mock.calls.some(
        ([event]) => event === RTVIEvent.BotStartedSpeaking,
      ),
    ).toBe(true);
  });
});
