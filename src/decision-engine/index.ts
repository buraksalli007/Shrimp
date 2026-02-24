import type { DecisionInput, DecisionResult, AutonomyMode } from "./types.js";
import { evaluateScope } from "./scope-gate.js";
import { scoreComplexity } from "./complexity-scorer.js";
import { evaluateMvpFirst } from "./mvp-evaluator.js";

const COMPLEXITY_THRESHOLD = 0.75;
const SCOPE_STRICTNESS: Record<AutonomyMode, number> = {
  assist: 0.5,
  builder: 0.7,
  autopilot: 0.9,
};

export async function evaluateDecision(input: DecisionInput): Promise<DecisionResult> {
  const reasoningLog: DecisionResult["reasoningLog"] = [];
  const rejectedReasons: string[] = [];
  let approvedTasks = [...input.proposedTasks];
  let postponedTasks: typeof approvedTasks = [];

  const strictness = SCOPE_STRICTNESS[input.mode];

  const scopeResult = evaluateScope(approvedTasks, reasoningLog);
  if (!scopeResult.passed) {
    approvedTasks = scopeResult.approved;
    postponedTasks = [...scopeResult.rejected];
    rejectedReasons.push(...scopeResult.reasons);
  }

  const mvpResult = evaluateMvpFirst(approvedTasks, reasoningLog);
  approvedTasks = mvpResult.mvpTasks;
  postponedTasks = [...postponedTasks, ...mvpResult.deferredTasks];

  const { score: complexityScore } = scoreComplexity(approvedTasks, reasoningLog);
  if (complexityScore > COMPLEXITY_THRESHOLD * strictness) {
    const excess = approvedTasks.splice(-1);
    postponedTasks = [...postponedTasks, ...excess];
    rejectedReasons.push(`Complexity too high (${complexityScore.toFixed(2)}), deferred last task`);
  }

  const outcome: DecisionResult["outcome"] =
    approvedTasks.length === 0 ? "reject" : postponedTasks.length > 0 ? "approve" : "approve";

  const scopeScore = 1 - approvedTasks.length / Math.max(input.proposedTasks.length, 1);

  return {
    outcome,
    approvedTasks,
    postponedTasks,
    rejectedReasons,
    reasoningLog,
    scopeScore,
    complexityScore,
  };
}
