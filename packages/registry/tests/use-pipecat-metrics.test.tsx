import type { PipecatClient, PipecatMetricsData } from "@pipecat-ai/client-js";
import { RTVIEvent } from "@pipecat-ai/client-js";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  usePipecatMetrics,
  usePipecatMetricsStore,
  usePipecatMetricValue,
  usePipecatTokenTotals,
} from "@/hooks/use-pipecat-metrics";

const hooks = vi.hoisted(() => ({
  usePipecatClient: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
  usePipecatClient: hooks.usePipecatClient,
}));

/** Fake emitter standing in for the client's event surface. */
function makeFakeClient() {
  const handlers = new Map<string, Set<(payload?: unknown) => void>>();
  return {
    handlers,
    on: vi.fn((event: string, handler: (payload?: unknown) => void) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    }),
    off: vi.fn((event: string, handler: (payload?: unknown) => void) => {
      handlers.get(event)?.delete(handler);
    }),
    emit(event: string, payload?: unknown) {
      handlers.get(event)?.forEach((handler) => handler(payload));
    },
  };
}

let fakeClient: ReturnType<typeof makeFakeClient>;

function emitMetrics(data: PipecatMetricsData) {
  act(() => {
    fakeClient.emit(RTVIEvent.Metrics, data);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  fakeClient = makeFakeClient();
  hooks.usePipecatClient.mockReturnValue(
    fakeClient as unknown as PipecatClient,
  );
  usePipecatMetricsStore.setState({
    series: {},
    tokens: { prompt: 0, completion: 0, total: 0, cacheRead: 0, reasoning: 0 },
    hasTokens: false,
    maxPoints: 100,
  });
});

describe("usePipecatMetrics", () => {
  it("ingests ttfb, processing, and characters series", () => {
    const { result } = renderHook(() => usePipecatMetrics());
    emitMetrics({
      ttfb: [{ processor: "tts", value: 0.21 }],
      processing: [{ processor: "llm", value: 0.05 }],
      characters: [{ processor: "tts", value: 42 }],
    });
    expect(result.current.series).toHaveLength(3);
    const ttfb = result.current.series.find((s) => s.category === "ttfb");
    expect(ttfb).toMatchObject({ processor: "tts", latest: 0.21 });
    expect(ttfb!.points).toHaveLength(1);
  });

  it("accumulates points per processor and keeps latest", () => {
    const { result } = renderHook(() => usePipecatMetrics());
    emitMetrics({ ttfb: [{ processor: "tts", value: 0.2 }] });
    emitMetrics({ ttfb: [{ processor: "tts", value: 0.3 }] });
    const [series] = result.current.series;
    expect(series!.points.map((p) => p.value)).toEqual([0.2, 0.3]);
    expect(series!.latest).toBe(0.3);
  });

  it("caps series at maxPoints", () => {
    usePipecatMetricsStore.setState({ maxPoints: 5 });
    const { result } = renderHook(() => usePipecatMetrics());
    for (let i = 0; i < 8; i++) {
      emitMetrics({ ttfb: [{ processor: "tts", value: i }] });
    }
    const [series] = result.current.series;
    expect(series!.points).toHaveLength(5);
    expect(series!.points[0]!.value).toBe(3);
  });

  it("lets the largest requested maxPoints win", () => {
    renderHook(() => usePipecatMetrics({ maxPoints: 250 }));
    renderHook(() => usePipecatMetrics({ maxPoints: 50 }));
    expect(usePipecatMetricsStore.getState().maxPoints).toBe(250);
  });

  it("accumulates token totals defensively", () => {
    const { result } = renderHook(() => usePipecatMetrics());
    emitMetrics({
      tokens: [{ prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 }],
    } as PipecatMetricsData);
    emitMetrics({
      tokens: [{ prompt_tokens: 6, completion_tokens: "bad", total_tokens: 6 }],
    } as unknown as PipecatMetricsData);
    emitMetrics({ tokens: "nonsense" } as unknown as PipecatMetricsData);
    expect(result.current.tokens).toEqual({
      prompt: 16,
      completion: 4,
      total: 20,
      cacheRead: 0,
      reasoning: 0,
    });
    expect(result.current.hasTokens).toBe(true);
  });

  it("accumulates cache-read and reasoning token counts when reported", () => {
    const { result } = renderHook(() => usePipecatMetrics());
    emitMetrics({
      tokens: [
        {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 400,
          cache_read_input_tokens: 250,
          reasoning_tokens: 20,
        },
      ],
    } as unknown as PipecatMetricsData);
    expect(result.current.tokens).toMatchObject({
      total: 400,
      cacheRead: 250,
      reasoning: 20,
    });
  });

  it("ingests ttfa from its headline field (pipecat >= 1.7)", () => {
    const { result } = renderHook(() => usePipecatMetrics());
    emitMetrics({
      ttfa: [
        {
          processor: "tts",
          ttfa: 0.31,
          ttfb: 0.21,
          leading_silence: 0.1,
        },
      ],
    } as unknown as PipecatMetricsData);
    const ttfa = result.current.series.find((s) => s.category === "ttfa");
    expect(ttfa).toMatchObject({ processor: "tts", latest: 0.31 });
  });

  it("accumulates stt_usage audio-second deltas into a running total", () => {
    const { result } = renderHook(() => usePipecatMetrics());
    emitMetrics({
      stt_usage: [{ processor: "stt", value: { audio_seconds: 2.5 } }],
    } as unknown as PipecatMetricsData);
    emitMetrics({
      stt_usage: [{ processor: "stt", value: { audio_seconds: 1.5 } }],
    } as unknown as PipecatMetricsData);
    const usage = result.current.series.find((s) => s.category === "stt_usage");
    expect(usage!.latest).toBe(4);
    expect(usage!.points.map((p) => p.value)).toEqual([2.5, 4]);
  });

  it("ignores malformed series entries", () => {
    const { result } = renderHook(() => usePipecatMetrics());
    emitMetrics({
      ttfb: [
        { processor: "tts", value: Number.NaN },
        { processor: 42, value: 1 },
        { processor: "ok", value: 0.5 },
      ],
    } as unknown as PipecatMetricsData);
    expect(result.current.series).toHaveLength(1);
    expect(result.current.series[0]!.processor).toBe("ok");
  });

  it("resets on a new session's Connected event", () => {
    const { result } = renderHook(() => usePipecatMetrics());
    emitMetrics({ ttfb: [{ processor: "tts", value: 0.2 }] });
    act(() => {
      fakeClient.emit(RTVIEvent.Connected);
    });
    expect(result.current.series).toHaveLength(0);
    expect(result.current.hasTokens).toBe(false);
  });

  it("attaches one listener per client regardless of subscriber count", () => {
    const first = renderHook(() => usePipecatMetrics());
    const second = renderHook(() => usePipecatMetricValue("ttfb", "tts"));
    const third = renderHook(() => usePipecatTokenTotals());
    expect(
      fakeClient.on.mock.calls.filter(([event]) => event === RTVIEvent.Metrics),
    ).toHaveLength(1);

    first.unmount();
    second.unmount();
    expect(fakeClient.off).not.toHaveBeenCalled();
    third.unmount();
    expect(
      fakeClient.off.mock.calls.filter(
        ([event]) => event === RTVIEvent.Metrics,
      ),
    ).toHaveLength(1);
  });
});

describe("usePipecatMetricValue", () => {
  it("reads a specific processor and falls back to null", () => {
    const { result } = renderHook(() => usePipecatMetricValue("ttfb", "tts"));
    expect(result.current).toBeNull();
    emitMetrics({ ttfb: [{ processor: "tts", value: 0.42 }] });
    expect(result.current).toBe(0.42);
  });

  it("follows the most recently updated processor when unspecified", () => {
    const { result } = renderHook(() => usePipecatMetricValue("ttfb"));
    emitMetrics({ ttfb: [{ processor: "a", value: 0.1 }] });
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 1000);
    emitMetrics({ ttfb: [{ processor: "b", value: 0.9 }] });
    vi.useRealTimers();
    expect(result.current).toBe(0.9);
  });
});
