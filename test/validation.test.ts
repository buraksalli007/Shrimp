import { describe, it } from "node:test";
import assert from "node:assert";
import { startRequestSchema, approveRequestSchema } from "../src/validation/schemas.js";

describe("startRequestSchema", () => {
  it("accepts valid minimal payload", () => {
    const result = startRequestSchema.safeParse({
      idea: "Fitness app",
      githubRepo: "owner/repo",
    });
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.branch, "main");
      assert.strictEqual(result.data.platform, "cursor");
      assert.strictEqual(result.data.autonomyMode, "builder");
    }
  });

  it("accepts full payload with credentials", () => {
    const result = startRequestSchema.safeParse({
      idea: "Todo app",
      githubRepo: "user/todo",
      branch: "develop",
      platform: "cursor",
      autonomyMode: "autopilot",
      credentials: {
        cursorApiKey: "ck_xxx",
        openclawToken: "oc_xxx",
        openclawGatewayUrl: "https://gateway.example.com",
        githubToken: "ghp_xxx",
      },
    });
    assert.strictEqual(result.success, true);
  });

  it("rejects empty idea", () => {
    const result = startRequestSchema.safeParse({
      idea: "",
      githubRepo: "owner/repo",
    });
    assert.strictEqual(result.success, false);
  });

  it("rejects empty githubRepo", () => {
    const result = startRequestSchema.safeParse({
      idea: "App",
      githubRepo: "",
    });
    assert.strictEqual(result.success, false);
  });

  it("rejects idea over 2000 chars", () => {
    const result = startRequestSchema.safeParse({
      idea: "x".repeat(2001),
      githubRepo: "owner/repo",
    });
    assert.strictEqual(result.success, false);
  });

  it("rejects invalid platform", () => {
    const result = startRequestSchema.safeParse({
      idea: "App",
      githubRepo: "owner/repo",
      platform: "invalid",
    });
    assert.strictEqual(result.success, false);
  });

  it("rejects invalid autonomyMode", () => {
    const result = startRequestSchema.safeParse({
      idea: "App",
      githubRepo: "owner/repo",
      autonomyMode: "invalid",
    });
    assert.strictEqual(result.success, false);
  });

  it("accepts tasks array with prompt", () => {
    const result = startRequestSchema.safeParse({
      idea: "App",
      githubRepo: "owner/repo",
      tasks: [{ id: "t1", title: "Task", prompt: "Do something" }],
    });
    assert.strictEqual(result.success, true);
  });

  it("accepts tasks with optional fields", () => {
    const result = startRequestSchema.safeParse({
      idea: "App",
      githubRepo: "owner/repo",
      tasks: [{ id: "t1", prompt: "Valid" }, { id: "t2", title: "T2" }],
    });
    assert.strictEqual(result.success, true);
  });
});

describe("approveRequestSchema", () => {
  it("accepts valid projectId", () => {
    const result = approveRequestSchema.safeParse({ projectId: "proj_123_abc" });
    assert.strictEqual(result.success, true);
  });

  it("rejects empty projectId", () => {
    const result = approveRequestSchema.safeParse({ projectId: "" });
    assert.strictEqual(result.success, false);
  });

  it("rejects missing projectId", () => {
    const result = approveRequestSchema.safeParse({});
    assert.strictEqual(result.success, false);
  });
});
