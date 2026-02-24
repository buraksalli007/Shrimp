import type { Task } from "../types/index.js";
import type { ReasoningEntry } from "./types.js";
import { createReasoningEntry } from "./reasoning-logger.js";

const COMPLEXITY_KEYWORDS = [
  "authentication",
  "payment",
  "real-time",
  "websocket",
  "database migration",
  "third-party api",
  "oauth",
  "push notification",
  "background",
  "multi-tenant",
];

const VALUE_KEYWORDS = [
  "core",
  "main",
  "basic",
  "simple",
  "list",
  "detail",
  "form",
  "navigation",
  "home",
  "screen",
];

export function scoreComplexity(
  tasks: Task[],
  reasoningLog: ReasoningEntry[]
): { score: number; breakdown: Record<string, number> } {
  let total = 0;
  const breakdown: Record<string, number> = {};

  for (const task of tasks) {
    const text = `${task.title ?? ""} ${task.description ?? ""} ${task.prompt ?? ""}`.toLowerCase();
    let complexity = 0;
    let value = 0;

    for (const kw of COMPLEXITY_KEYWORDS) {
      if (text.includes(kw)) {
        complexity += 0.2;
      }
    }
    for (const kw of VALUE_KEYWORDS) {
      if (text.includes(kw)) {
        value += 0.15;
      }
    }

    const taskScore = Math.min(1, Math.max(0, complexity - value * 0.5 + 0.3));
    breakdown[task.id ?? "unknown"] = taskScore;
    total += taskScore;
  }

  const avgScore = tasks.length > 0 ? total / tasks.length : 0;
  reasoningLog.push(
    createReasoningEntry(
      "complexity_scorer",
      { taskCount: tasks.length, breakdown },
      `Average complexity score: ${avgScore.toFixed(2)}`,
      0.85
    )
  );

  return { score: avgScore, breakdown };
}
