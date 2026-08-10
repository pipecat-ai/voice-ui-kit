import type { PipecatClient } from "@pipecat-ai/client-js";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Metrics, MetricsView } from "@/components/pipecat/metrics/metrics";
import { MetricsPerformanceView } from "@/components/pipecat/metrics/performance";
import { MetricsUsageView } from "@/components/pipecat/metrics/usage";
import {
  usePipecatMetricsStore,
  type MetricSeries,
  type TokenTotals,
} from "@/hooks/use-pipecat-metrics";

const hooks = vi.hoisted(() => ({
  usePipecatClient: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
  usePipecatClient: hooks.usePipecatClient,
}));

const SERIES: MetricSeries[] = [
  {
    category: "ttfb",
    processor: "GoogleLLMService#0",
    latest: 0.5,
    points: [
      { time: 1000, value: 0.4 },
      { time: 2000, value: 0.5 },
    ],
  },
  {
    category: "ttfa",
    processor: "CartesiaTTSService#0",
    latest: 0.3,
    points: [{ time: 2000, value: 0.3 }],
  },
  {
    category: "processing",
    processor: "GoogleLLMService#0",
    latest: 0.02,
    points: [{ time: 2000, value: 0.02 }],
  },
  {
    category: "characters",
    processor: "CartesiaTTSService#0",
    latest: 4812,
    points: [
      { time: 1000, value: 2400 },
      { time: 2000, value: 4812 },
    ],
  },
  {
    category: "stt_usage",
    processor: "DeepgramSTTService#0",
    latest: 42.5,
    points: [{ time: 2000, value: 42.5 }],
  },
];

const TOKENS: TokenTotals = {
  prompt: 100,
  completion: 50,
  total: 150,
  cacheRead: 0,
  reasoning: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  hooks.usePipecatClient.mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as PipecatClient);
  usePipecatMetricsStore.setState({
    series: {},
    tokens: { prompt: 0, completion: 0, total: 0, cacheRead: 0, reasoning: 0 },
    hasTokens: false,
    maxPoints: 100,
  });
});

describe("MetricsView (tabbed)", () => {
  it("shows the performance tab by default and switches to usage", async () => {
    const user = userEvent.setup();
    render(<MetricsView series={SERIES} tokens={TOKENS} />);

    expect(screen.getByText("TTFB · GoogleLLMService#0")).toBeInTheDocument();
    // 0.5s renders as 500ms
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.queryByText("Prompt tokens")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Usage" }));
    expect(screen.getByText("Prompt tokens")).toBeInTheDocument();
    expect(
      screen.getByText("STT audio · DeepgramSTTService#0"),
    ).toBeInTheDocument();
  });

  it("honors defaultTab", () => {
    render(<MetricsView series={SERIES} tokens={TOKENS} defaultTab="usage" />);
    expect(screen.getByText("Total tokens")).toBeInTheDocument();
  });

  it("forwards section props", () => {
    const { container } = render(
      <MetricsView
        series={SERIES}
        performanceProps={{ categories: ["ttfb", "processing"] }}
      />,
    );
    const charts = container.querySelectorAll("[data-slot=metrics-chart]");
    expect(charts).toHaveLength(2);
  });
});

describe("MetricsPerformanceView", () => {
  it("renders tiles and charts only for selected categories", () => {
    const { container } = render(
      <MetricsPerformanceView series={SERIES} categories={["ttfb"]} />,
    );
    expect(screen.getByText("TTFB · GoogleLLMService#0")).toBeInTheDocument();
    expect(screen.queryByText(/TTFA/)).toBeNull();
    expect(screen.queryByText(/Processing/)).toBeNull();
    expect(
      container.querySelectorAll("[data-slot=metrics-chart]"),
    ).toHaveLength(1);
  });

  it("excludes ignored processors and empties when nothing remains", () => {
    render(
      <MetricsPerformanceView
        series={SERIES}
        categories={["ttfb"]}
        ignoreProcessors={["GoogleLLMService#0"]}
      />,
    );
    expect(screen.getByText("No metrics yet")).toBeInTheDocument();
  });
});

describe("MetricsUsageView", () => {
  it("renders token, character, and audio tiles with units", () => {
    render(<MetricsUsageView series={SERIES} tokens={TOKENS} />);
    expect(screen.getByText("Total tokens")).toBeInTheDocument();
    expect(
      screen.getByText("TTS characters · CartesiaTTSService#0"),
    ).toBeInTheDocument();
    expect(screen.getByText("4,812")).toBeInTheDocument();
    expect(screen.getByText("42.5")).toBeInTheDocument();
    expect(screen.getByText("s")).toBeInTheDocument();
  });

  it("shows cache-read and reasoning tiles only when nonzero", () => {
    const { rerender } = render(
      <MetricsUsageView series={[]} tokens={TOKENS} />,
    );
    expect(screen.queryByText("Cache read tokens")).toBeNull();
    rerender(
      <MetricsUsageView
        series={[]}
        tokens={{ ...TOKENS, cacheRead: 250, reasoning: 20 }}
      />,
    );
    expect(screen.getByText("Cache read tokens")).toBeInTheDocument();
    expect(screen.getByText("Reasoning tokens")).toBeInTheDocument();
  });

  it("renders the empty state without usage data", () => {
    const { container } = render(<MetricsUsageView series={[]} />);
    expect(
      container.querySelector("[data-slot=metrics-usage]"),
    ).toHaveAttribute("data-state", "empty");
  });
});

describe("Metrics (connected)", () => {
  it("reads the shared store", () => {
    usePipecatMetricsStore.setState({
      series: {
        "ttfb:tts": {
          category: "ttfb",
          processor: "tts",
          latest: 0.2,
          points: [{ time: 1000, value: 0.2 }],
        },
      },
    });
    render(<Metrics />);
    expect(screen.getByText("TTFB · tts")).toBeInTheDocument();
  });
});
