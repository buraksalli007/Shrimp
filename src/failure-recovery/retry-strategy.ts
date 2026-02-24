import type { FailureCategory, FailureAnalysis, RetryStrategy } from "./types.js";
import { classifyFailure } from "./failure-classifier.js";

const MAX_ATTEMPTS_BY_CATEGORY: Record<FailureCategory, number> = {
  dependency: 2,
  syntax: 3,
  architecture: 2,
  environment: 1,
  unknown: 2,
};

export function analyzeFailure(
  errors: string[],
  stderr: string | undefined,
  taskPrompt: string,
  attemptNumber: number
): FailureAnalysis {
  const category = classifyFailure(errors, stderr);
  const maxAttempts = MAX_ATTEMPTS_BY_CATEGORY[category];

  const rootCauseHints: Record<FailureCategory, string> = {
    dependency: "Missing or incompatible package. Try: bun install or npm install, check package.json.",
    syntax: "Code syntax or type error. Check file and line number in error.",
    architecture: "Structural issue: circular import, wrong export, or hook usage.",
    environment: "Environment or config issue: paths, permissions, or Expo config.",
    unknown: "Unclassified error. Manual review recommended.",
  };

  const shouldEscalate = attemptNumber >= maxAttempts;
  const action: RetryStrategy["action"] = shouldEscalate
    ? category === "environment"
      ? "abort"
      : "escalate"
    : "retry";

  let suggestedPrompt: string | undefined;
  if (category === "dependency" && !shouldEscalate) {
    suggestedPrompt = `Fix dependency error. Run: bun install (or npm install). Then fix any import errors. Error: ${errors.slice(0, 2).join(" ")}`;
  } else if (category === "syntax" && !shouldEscalate) {
    suggestedPrompt = `Fix the TypeScript/syntax error. Check the exact file and line. Error: ${errors.slice(0, 2).join(" ")}`;
  }

  return {
    category,
    rootCauseHint: rootCauseHints[category],
    retryStrategy: {
      action,
      maxAttempts,
      attemptNumber,
      modifiedPrompt: suggestedPrompt,
    },
    suggestedPrompt,
    shouldEscalate,
  };
}
