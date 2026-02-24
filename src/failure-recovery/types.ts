export type FailureCategory =
  | "dependency"
  | "syntax"
  | "architecture"
  | "environment"
  | "unknown";

export interface FailureAnalysis {
  category: FailureCategory;
  rootCauseHint: string;
  retryStrategy: RetryStrategy;
  suggestedPrompt?: string;
  shouldEscalate: boolean;
}

export interface RetryStrategy {
  action: "retry" | "escalate" | "abort";
  maxAttempts: number;
  attemptNumber: number;
  modifiedPrompt?: string;
}
