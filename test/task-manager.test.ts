import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  createProject,
  getProject,
  getNextTask,
  recordCompletion,
  getAllProjects,
  updateProjectWithTasks,
  resetForTesting,
} from "../src/services/task-manager.js";

describe("task-manager", () => {
  beforeEach(() => {
    resetForTesting();
  });

  it("createProject returns state with correct defaults", () => {
    const state = createProject({
      idea: "Test app",
      githubRepo: "owner/repo",
      tasks: [{ id: "t1", title: "T1", description: "D1", prompt: "P1" }],
    });
    assert.ok(state.projectId.startsWith("proj_"));
    assert.strictEqual(state.idea, "Test app");
    assert.strictEqual(state.githubRepo, "owner/repo");
    assert.strictEqual(state.branch, "main");
    assert.strictEqual(state.status, "running");
    assert.strictEqual(state.currentIndex, 0);
    assert.strictEqual(state.tasks.length, 1);
  });

  it("getNextTask returns first task", () => {
    const state = createProject({
      idea: "App",
      githubRepo: "a/b",
      tasks: [
        { id: "t1", title: "T1", prompt: "P1" },
        { id: "t2", title: "T2", prompt: "P2" },
      ],
    });
    const next = getNextTask(state.projectId);
    assert.ok(next);
    assert.strictEqual(next!.id, "t1");
  });

  it("recordCompletion advances to next task on success", () => {
    const state = createProject({
      idea: "App",
      githubRepo: "a/b",
      tasks: [
        { id: "t1", title: "T1", prompt: "P1" },
        { id: "t2", title: "T2", prompt: "P2" },
      ],
    });
    const r = recordCompletion(state.projectId, { success: true, errors: [] });
    assert.strictEqual(r.shouldContinue, true);
    assert.strictEqual(r.nextTask?.id, "t2");
    const s = getProject(state.projectId);
    assert.strictEqual(s?.currentIndex, 1);
  });

  it("recordCompletion sets awaiting_approval when last task succeeds", () => {
    const state = createProject({
      idea: "App",
      githubRepo: "a/b",
      tasks: [{ id: "t1", title: "T1", prompt: "P1" }],
    });
    const r = recordCompletion(state.projectId, { success: true, errors: [] });
    assert.strictEqual(r.shouldContinue, false);
    assert.strictEqual(r.status, "awaiting_approval");
    assert.strictEqual(getProject(state.projectId)?.status, "awaiting_approval");
  });

  it("recordCompletion sets failed when max iterations reached", () => {
    const state = createProject({
      idea: "App",
      githubRepo: "a/b",
      maxIterations: 1,
      tasks: [{ id: "t1", title: "T1", prompt: "P1" }],
    });
    const r = recordCompletion(state.projectId, { success: false, errors: ["err"] });
    assert.strictEqual(r.status, "failed");
    assert.strictEqual(getProject(state.projectId)?.status, "failed");
  });

  it("getAllProjects filters by userId", () => {
    const s1 = createProject({
      idea: "A",
      githubRepo: "a/b",
      tasks: [{ id: "t1", prompt: "p" }],
      userId: "u1",
      apiKeyId: "k1",
    });
    createProject({
      idea: "B",
      githubRepo: "c/d",
      tasks: [{ id: "t1", prompt: "p" }],
      userId: "u2",
      apiKeyId: "k2",
    });
    const all = getAllProjects({ userId: "u1" });
    assert.strictEqual(all.length, 1);
    assert.strictEqual(all[0].projectId, s1.projectId);
  });

  it("getAllProjects filters by apiKeyId", () => {
    const s1 = createProject({
      idea: "A",
      githubRepo: "a/b",
      tasks: [{ id: "t1", prompt: "p" }],
      userId: "u1",
      apiKeyId: "key_abc",
    });
    createProject({
      idea: "B",
      githubRepo: "c/d",
      tasks: [{ id: "t1", prompt: "p" }],
      userId: "u1",
      apiKeyId: "key_xyz",
    });
    const all = getAllProjects({ apiKeyId: "key_abc" });
    assert.strictEqual(all.length, 1);
    assert.strictEqual(all[0].projectId, s1.projectId);
  });

  it("getAllProjects returns all when no filter", () => {
    createProject({ idea: "A", githubRepo: "a/b", tasks: [{ id: "t1", prompt: "p" }] });
    createProject({ idea: "B", githubRepo: "c/d", tasks: [{ id: "t1", prompt: "p" }] });
    const all = getAllProjects();
    assert.strictEqual(all.length, 2);
  });

  it("updateProjectWithTasks only works for pending_plan", () => {
    const state = createProject({
      idea: "App",
      githubRepo: "a/b",
      status: "pending_plan",
      tasks: [{ id: "t1", prompt: "old" }],
    });
    const ok = updateProjectWithTasks(state.projectId, [
      { id: "t1", title: "New", prompt: "new prompt" },
    ]);
    assert.strictEqual(ok, true);
    const s = getProject(state.projectId);
    assert.strictEqual(s?.tasks[0].prompt, "new prompt");
    assert.strictEqual(s?.status, "running");
  });

  it("updateProjectWithTasks returns false for running project", () => {
    const state = createProject({
      idea: "App",
      githubRepo: "a/b",
      status: "running",
      tasks: [{ id: "t1", prompt: "p" }],
    });
    const ok = updateProjectWithTasks(state.projectId, [{ id: "t1", prompt: "x" }]);
    assert.strictEqual(ok, false);
  });
});
