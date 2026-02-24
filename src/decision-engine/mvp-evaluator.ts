import type { Task } from "../types/index.js";
import type { ReasoningEntry } from "./types.js";
import { createReasoningEntry } from "./reasoning-logger.js";

export function evaluateMvpFirst(
  tasks: Task[],
  reasoningLog: ReasoningEntry[]
): { mvpTasks: Task[]; deferredTasks: Task[]; reasons: string[] } {
  const mvpTasks: Task[] = [];
  const deferredTasks: Task[] = [];
  const reasons: string[] = [];

  const mvpPatterns = [
    "setup",
    "scaffold",
    "navigation",
    "home",
    "list",
    "detail",
    "basic",
    "initial",
    "core",
    "main screen",
  ];

  const deferPatterns = [
    "analytics",
    "settings",
    "profile",
    "onboarding",
    "tutorial",
    "advanced",
    "optimization",
    "polish",
  ];

  for (const task of tasks) {
    const text = `${task.title ?? ""} ${task.description ?? ""}`.toLowerCase();
    const isMvp = mvpPatterns.some((p) => text.includes(p));
    const isDefer = deferPatterns.some((p) => text.includes(p));

    if (isMvp && !isDefer) {
      mvpTasks.push(task);
      reasons.push(`"${task.title}" identified as MVP core`);
    } else if (isDefer) {
      deferredTasks.push(task);
      reasons.push(`"${task.title}" deferred (non-MVP)`);
    } else {
      mvpTasks.push(task);
    }
  }

  reasoningLog.push(
    createReasoningEntry(
      "mvp_evaluator",
      { total: tasks.length, mvp: mvpTasks.length, deferred: deferredTasks.length },
      `MVP-first: ${mvpTasks.length} approved, ${deferredTasks.length} deferred`,
      0.8
    )
  );

  return { mvpTasks, deferredTasks, reasons };
}
