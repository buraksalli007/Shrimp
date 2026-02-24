import type { Task } from "../types/index.js";
import type { ReasoningEntry } from "./types.js";
import { createReasoningEntry } from "./reasoning-logger.js";

const MAX_MVP_TASKS = 8;
const MAX_TASK_PROMPT_LENGTH = 1500;

export function evaluateScope(
  tasks: Task[],
  reasoningLog: ReasoningEntry[]
): { passed: boolean; approved: Task[]; rejected: Task[]; reasons: string[] } {
  const reasons: string[] = [];
  const approved: Task[] = [];
  const rejected: Task[] = [];

  if (tasks.length > MAX_MVP_TASKS) {
    reasoningLog.push(
      createReasoningEntry(
        "scope_gate_max_tasks",
        { count: tasks.length, max: MAX_MVP_TASKS },
        `Rejected: ${tasks.length} tasks exceeds MVP limit of ${MAX_MVP_TASKS}`,
        1
      )
    );
    reasons.push(`Scope explosion: ${tasks.length} tasks exceeds MVP limit (${MAX_MVP_TASKS})`);
    const toApprove = tasks.slice(0, MAX_MVP_TASKS);
    const toReject = tasks.slice(MAX_MVP_TASKS);
    return { passed: false, approved: toApprove, rejected: toReject, reasons };
  }

  for (const task of tasks) {
    const promptLen = (task.prompt ?? "").length;
    if (promptLen > MAX_TASK_PROMPT_LENGTH) {
      reasoningLog.push(
        createReasoningEntry(
          "scope_gate_prompt_length",
          { taskId: task.id, length: promptLen },
          `Task ${task.id} prompt too long (${promptLen} chars)`,
          0.9
        )
      );
      rejected.push(task);
      reasons.push(`Task "${task.title}" has oversized prompt`);
    } else {
      approved.push(task);
    }
  }

  return {
    passed: rejected.length === 0,
    approved,
    rejected,
    reasons,
  };
}
