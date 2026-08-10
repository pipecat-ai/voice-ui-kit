import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Metric } from "@/components/pipecat/metric";

describe("Metric", () => {
  it("renders label, formatted value, and unit", () => {
    render(<Metric label="TTFB · tts" value={231.84} unit="ms" />);
    const metric = screen.getByText("TTFB · tts").closest("[data-slot=metric]");
    expect(metric).toHaveAttribute("data-state", "live");
    expect(screen.getByText("231.8")).toBeInTheDocument();
    expect(screen.getByText("ms")).toBeInTheDocument();
  });

  it("renders the empty state for missing or non-finite values", () => {
    const { rerender } = render(<Metric label="TTFB" value={null} />);
    const metric = screen.getByText("TTFB").closest("[data-slot=metric]");
    expect(metric).toHaveAttribute("data-state", "empty");
    expect(screen.getByText("–")).toBeInTheDocument();

    rerender(<Metric label="TTFB" value={Number.NaN} />);
    expect(metric).toHaveAttribute("data-state", "empty");
  });

  it("applies a custom formatter and empty node", () => {
    const { rerender } = render(
      <Metric label="Cost" value={0.0382} format={(v) => `$${v.toFixed(3)}`} />,
    );
    expect(screen.getByText("$0.038")).toBeInTheDocument();
    rerender(<Metric label="Cost" value={null} empty="n/a" />);
    expect(screen.getByText("n/a")).toBeInTheDocument();
  });

  it("memoizes formatting per value", () => {
    const format = vi.fn((value: number) => value.toFixed(0));
    const { rerender } = render(
      <Metric label="Count" value={42} format={format} />,
    );
    rerender(<Metric label="Count (renamed)" value={42} format={format} />);
    expect(format).toHaveBeenCalledTimes(1);
    rerender(<Metric label="Count (renamed)" value={43} format={format} />);
    expect(format).toHaveBeenCalledTimes(2);
  });

  it("formats large numbers with locale grouping by default", () => {
    render(<Metric label="Total tokens" value={16796} />);
    expect(screen.getByText("16,796")).toBeInTheDocument();
  });
});
