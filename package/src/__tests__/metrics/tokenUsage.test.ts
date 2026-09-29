import { describe, expect, it } from "vitest";
import { addTokenUsage } from "@/components/metrics/tokenUsage";

const usage = { completion_tokens: 5, prompt_tokens: 10, total_tokens: 15 };

describe("addTokenUsage", () => {
  it("adds usage to existing totals", () => {
    expect(
      addTokenUsage(
        { completion_tokens: 1, prompt_tokens: 2, total_tokens: 3 },
        usage,
        {},
      ),
    ).toEqual({ completion_tokens: 6, prompt_tokens: 12, total_tokens: 18 });
  });

  it("starts from zero when no totals exist yet", () => {
    expect(addTokenUsage({}, usage, {})).toEqual({
      completion_tokens: 5,
      prompt_tokens: 10,
      total_tokens: 15,
    });
  });

  it("does not produce NaN when a usage field is missing", () => {
    expect(addTokenUsage({}, { prompt_tokens: 4 }, {})).toEqual({
      completion_tokens: 0,
      prompt_tokens: 4,
      total_tokens: 0,
    });
  });

  it("skips excluded counters", () => {
    expect(
      addTokenUsage({}, usage, { noPromptTokens: true, noTotalTokens: true }),
    ).toEqual({ completion_tokens: 5, prompt_tokens: 0, total_tokens: 0 });
  });
});
