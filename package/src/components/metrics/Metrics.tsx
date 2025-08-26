import { RTVIEvent } from "@pipecat-ai/client-js";
import {
  usePipecatClientTransportState,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";
import {
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useState } from "react";
import { Line } from "react-chartjs-2";

import { cn } from "@/lib/utils";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface ProcessingMetric {
  processor: string;
  value: number;
}

interface MetricData {
  timestamp: string;
  value: number;
}

interface MetricsState {
  [processorName: string]: MetricData[];
}

interface TokenMetrics {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
}

interface Props {
  chartOptions?: ChartOptions<"line">;
  classNames?: {
    container?: string;
    heading?: string;
    metricsContainer?: string;
    metricsCard?: string;
    metricsTitle?: string;
    metricsChart?: string;
    tokenContainer?: string;
    tokenCard?: string;
    tokenType?: string;
    tokenValue?: string;
  };
  ignoreProcessorNames?: string[];
  noPromptTokens?: boolean;
  noCompletionTokens?: boolean;
  noTotalTokens?: boolean;
}

export const Metrics: React.FC<Props> = ({
  chartOptions = {},
  classNames = {},
  ignoreProcessorNames = [],
  noPromptTokens = false,
  noCompletionTokens = false,
  noTotalTokens = false,
}) => {
  const [ttfbMetrics, setTtfbMetrics] = useState<MetricsState>({});
  const [tokenMetrics, setTokenMetrics] = useState<Partial<TokenMetrics>>({});

  const transportState = usePipecatClientTransportState();

  useRTVIClientEvent(RTVIEvent.Connected, () => {
    setTtfbMetrics({});
    setTokenMetrics({
      completion_tokens: 0,
      prompt_tokens: 0,
      total_tokens: 0,
    });
  });

  useRTVIClientEvent(RTVIEvent.Metrics, (data) => {
    // Handle processing metrics
    if (data?.ttfb && Array.isArray(data.ttfb)) {
      const timestamp = new Date().toISOString();

      setTtfbMetrics((prevMetrics) => {
        const newMetrics = { ...prevMetrics };

        (data.ttfb ?? []).forEach((item: ProcessingMetric) => {
          const { processor, value } = item;

          if (ignoreProcessorNames.includes(processor)) {
            return; // Skip ignored processors
          }

          if (!newMetrics[processor]) {
            newMetrics[processor] = [];
          }

          // Limit array to last 100 entries to prevent excessive memory use
          const updatedMetrics = [
            ...newMetrics[processor],
            { timestamp, value },
          ].slice(-100);

          newMetrics[processor] = updatedMetrics;
        });

        return newMetrics;
      });
    }

    // Handle token metrics
    // @ts-expect-error - tokens type not defined
    const tokens = data?.tokens;
    if (tokens && Array.isArray(tokens) && tokens.length > 0) {
      const tokenData = tokens[0];

      setTokenMetrics((prev) => ({
        completion_tokens:
          prev.completion_tokens +
          (noCompletionTokens ? 0 : tokenData.completion_tokens || 0),
        prompt_tokens:
          prev.prompt_tokens +
          (noPromptTokens ? 0 : tokenData.prompt_tokens || 0),
        total_tokens:
          prev.total_tokens + (noTotalTokens ? 0 : tokenData.total_tokens || 0),
      }));
    }
  });

  const generateChartData = (processorName: string, data: MetricData[]) => {
    return {
      labels: data.map((d) => {
        const date = new Date(d.timestamp);
        return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
      }),
      datasets: [
        {
          label: `TTFB (${processorName})`,
          data: data.map((d) => d.value * 1000), // Convert to ms for better readability
          borderColor: getColorForProcessor(processorName),
          backgroundColor: getColorForProcessor(processorName, 0.2),
          tension: 0.4,
        },
      ],
    };
  };

  // Simple function to generate consistent colors based on processor name
  const getColorForProcessor = (processor: string, alpha = 1) => {
    const hash = processor.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const h = Math.abs(hash) % 360;
    return `hsla(${h}, 70%, 50%, ${alpha})`;
  };

  const lineChartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        title: {
          display: true,
          text: "Time (ms)",
        },
        beginAtZero: true,
      },
      x: {
        title: {
          display: true,
          text: "Time",
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} ms`;
          },
        },
      },
    },
    ...chartOptions,
  };

  const isConnecting =
    transportState === "authenticating" || transportState === "connecting";
  const isConnected =
    transportState === "connected" || transportState === "ready";

  const hasTokenMetrics = Object.keys(tokenMetrics).length > 0;
  const hasMetrics = Object.keys(ttfbMetrics).length > 0;

  const tokenCardClassName = cn(
    "bg-card rounded-md p-3 shadow-sm",
    classNames.tokenCard,
  );
  const tokenTypeClassName = cn(
    "text-sm text-muted-foreground",
    classNames.tokenType,
  );
  const tokenValueClassName = cn("text-2xl font-medium", classNames.tokenValue);

  if (hasMetrics || hasTokenMetrics) {
    return (
      <div
        className={cn(
          "@container/metrics grid gap-6 items-start p-4 max-h-full overflow-auto",
          classNames.container,
        )}
      >
        {hasTokenMetrics && (
          <>
            <h2 className={cn("text-xl font-semibold", classNames.heading)}>
              Token Usage
            </h2>
            <div
              className={cn(
                "grid grid-cols-1 @xl/metrics:grid-cols-2 @3xl/metrics:grid-cols-3 gap-4",
                classNames.tokenContainer,
              )}
            >
              {!noPromptTokens && (
                <div className={tokenCardClassName}>
                  <div className={tokenTypeClassName}>Prompt Tokens</div>
                  <div className={tokenValueClassName}>
                    {tokenMetrics.prompt_tokens}
                  </div>
                </div>
              )}
              {!noCompletionTokens && (
                <div className={tokenCardClassName}>
                  <div className={tokenTypeClassName}>Completion Tokens</div>
                  <div className={tokenValueClassName}>
                    {tokenMetrics.completion_tokens}
                  </div>
                </div>
              )}
              {!noTotalTokens && (
                <div className={tokenCardClassName}>
                  <div className={tokenTypeClassName}>Total Tokens</div>
                  <div className={tokenValueClassName}>
                    {tokenMetrics.total_tokens}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {hasMetrics && (
          <>
            <h2 className={cn("text-xl font-semibold", classNames.heading)}>
              TTFB Metrics
            </h2>
            <div
              className={cn(
                "grid grid-cols-1 @xl/metrics:grid-cols-2 @3xl/metrics:grid-cols-3 gap-4",
                classNames.metricsContainer,
              )}
            >
              {Object.entries(ttfbMetrics).map(([processorName, data]) => (
                <div
                  key={processorName}
                  className={cn(
                    "bg-card border rounded-lg shadow-sm p-3 h-60",
                    classNames.metricsCard,
                  )}
                >
                  <h3 className={cn("mb-2", classNames.metricsTitle)}>
                    {processorName}
                  </h3>
                  <div className={cn("h-44", classNames.metricsChart)}>
                    <Line
                      data={generateChartData(processorName, data)}
                      options={lineChartOptions}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full text-muted-foreground text-sm",
          classNames.container,
        )}
      >
        Connecting to agent...
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full text-muted-foreground text-center",
          classNames.container,
        )}
      >
        <div className="p-4">
          <div className="mb-2">Not connected to agent</div>
          <p className="text-sm max-w-md">
            Connect to an agent to view metrics in real-time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center h-full text-muted-foreground text-sm",
        classNames.container,
      )}
    >
      Waiting for metrics data...
    </div>
  );
};

export default Metrics;
