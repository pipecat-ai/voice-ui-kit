export interface TokenMetrics {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
}

export interface TokenUsageExclusions {
  noCompletionTokens?: boolean;
  noPromptTokens?: boolean;
  noTotalTokens?: boolean;
}

/**
 * Adds one usage report to the running token totals.
 *
 * The running totals start empty when the component mounts after the
 * connection is already established, so a missing counter counts as zero.
 */
export function addTokenUsage(
  prev: Partial<TokenMetrics>,
  usage: Partial<TokenMetrics>,
  { noCompletionTokens, noPromptTokens, noTotalTokens }: TokenUsageExclusions,
): TokenMetrics {
  return {
    completion_tokens:
      (prev.completion_tokens ?? 0) +
      (noCompletionTokens ? 0 : usage.completion_tokens || 0),
    prompt_tokens:
      (prev.prompt_tokens ?? 0) +
      (noPromptTokens ? 0 : usage.prompt_tokens || 0),
    total_tokens:
      (prev.total_tokens ?? 0) + (noTotalTokens ? 0 : usage.total_tokens || 0),
  };
}
