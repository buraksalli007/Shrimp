import type { ReasoningEntry } from "./types.js";

export function createReasoningEntry(
  rule: string,
  input: unknown,
  output: string,
  confidence: number
): ReasoningEntry {
  return {
    timestamp: new Date().toISOString(),
    rule,
    input,
    output,
    confidence,
  };
}
