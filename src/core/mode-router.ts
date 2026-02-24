export type AutonomyMode = "assist" | "builder" | "autopilot";

export interface ModeBehavior {
  planning: "suggest" | "execute" | "execute";
  coding: "suggest" | "execute_approval" | "execute";
  deployment: "suggest" | "approval_required" | "auto";
  decisionStrictness: "lenient" | "moderate" | "strict";
}

export const MODE_BEHAVIORS: Record<AutonomyMode, ModeBehavior> = {
  assist: {
    planning: "suggest",
    coding: "suggest",
    deployment: "suggest",
    decisionStrictness: "lenient",
  },
  builder: {
    planning: "execute",
    coding: "execute_approval",
    deployment: "approval_required",
    decisionStrictness: "moderate",
  },
  autopilot: {
    planning: "execute",
    coding: "execute",
    deployment: "auto",
    decisionStrictness: "strict",
  },
};

export function getModeBehavior(mode: AutonomyMode): ModeBehavior {
  return MODE_BEHAVIORS[mode];
}

export function requiresApproval(mode: AutonomyMode, phase: keyof ModeBehavior): boolean {
  const behavior = MODE_BEHAVIORS[mode];
  const value = behavior[phase];
  return value === "execute_approval" || value === "approval_required";
}
