import type { Meta, StoryObj } from "@storybook/react-vite";

import { MetricsView } from "@/components/pipecat/metrics/metrics";
import { MetricsPerformanceView } from "@/components/pipecat/metrics/performance";
import { MetricsUsageView } from "@/components/pipecat/metrics/usage";
import type { MetricSeries, TokenTotals } from "@/hooks/use-pipecat-metrics";

const START = new Date("2026-01-01T10:00:00Z").getTime();

/** Deterministic point-sample series (latency-style values). */
function makeSeries(
  category: MetricSeries["category"],
  processor: string,
  base: number,
  spread: number,
  count = 24,
): MetricSeries {
  const points = Array.from({ length: count }, (_, i) => ({
    time: START + i * 4000,
    value: base + Math.abs(Math.sin(i * 1.7)) * spread,
  }));
  return {
    category,
    processor,
    latest: points[points.length - 1]!.value,
    points,
  };
}

/** Deterministic cumulative series (usage-style running totals). */
function makeCumulativeSeries(
  category: MetricSeries["category"],
  processor: string,
  delta: number,
  count = 24,
): MetricSeries {
  let total = 0;
  const points = Array.from({ length: count }, (_, i) => {
    total += delta * (0.5 + Math.abs(Math.sin(i * 2.3)));
    return { time: START + i * 4000, value: total };
  });
  return {
    category,
    processor,
    latest: points[points.length - 1]!.value,
    points,
  };
}

const SERIES: MetricSeries[] = [
  makeSeries("ttfb", "SmartTurnAnalyzer#0", 0.08, 0.05),
  makeSeries("ttfb", "GoogleLLMService#0", 0.35, 0.4),
  makeSeries("ttfb", "CartesiaTTSService#0", 0.12, 0.15),
  makeSeries("ttfa", "CartesiaTTSService#0", 0.18, 0.2),
  makeSeries("processing", "GoogleLLMService#0", 0.02, 0.03),
  makeSeries("processing", "CartesiaTTSService#0", 0.01, 0.02),
  makeCumulativeSeries("characters", "CartesiaTTSService#0", 42),
  makeCumulativeSeries("stt_usage", "DeepgramSTTService#0", 3.2),
];

const TOKENS: TokenTotals = {
  prompt: 12840,
  completion: 3956,
  total: 16796,
  cacheRead: 2048,
  reasoning: 512,
};

const meta = {
  title: "Blocks/Metrics",
  component: MetricsView,
} satisfies Meta<typeof MetricsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tabbed: Story = {
  args: { series: SERIES, tokens: TOKENS, className: "w-2xl" },
};

export const UsageTab: Story = {
  args: {
    series: SERIES,
    tokens: TOKENS,
    defaultTab: "usage",
    className: "w-2xl",
  },
};

export const AllPerformanceCategories: Story = {
  args: {
    series: SERIES,
    tokens: TOKENS,
    performanceProps: { categories: ["ttfb", "ttfa", "processing"] },
    className: "w-2xl",
  },
};

export const PerformanceSection: Story = {
  args: { series: SERIES },
  render: () => (
    <div className="w-2xl">
      <MetricsPerformanceView
        series={SERIES}
        categories={["ttfb", "processing"]}
      />
    </div>
  ),
};

export const UsageSection: Story = {
  args: { series: SERIES },
  render: () => (
    <div className="w-2xl">
      <MetricsUsageView series={SERIES} tokens={TOKENS} />
    </div>
  ),
};

export const EmptyState: Story = {
  args: { series: [], className: "w-2xl" },
};
