import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { createServer } from "http";

let server: ReturnType<typeof createServer>;
let port: number;

describe("API integration", () => {
  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
    const { loadProjectsFromDb } = await import("../src/services/project-persistence.js");
    const app = (await import("../src/app.js")).default;
    await loadProjectsFromDb();
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === "object" && addr ? addr.port : 3000;
        resolve();
      });
    });
  });

  after(() => {
    server?.close();
  });

  it("GET /health returns 200", async () => {
    const res = await fetch(`http://localhost:${port}/health`);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as { status: string; service: string };
    assert.strictEqual(data.status, "ok");
    assert.strictEqual(data.service, "openclaw-cursor-orchestrator");
  });

  it("GET /status returns config flags", async () => {
    const res = await fetch(`http://localhost:${port}/status`);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as { cursorConfigured: boolean; openclawConfigured: boolean };
    assert.strictEqual(typeof data.cursorConfigured, "boolean");
    assert.strictEqual(typeof data.openclawConfigured, "boolean");
  });

  it("GET /projects without key returns 401", async () => {
    const res = await fetch(`http://localhost:${port}/projects`);
    assert.strictEqual(res.status, 401);
  });

  it("POST /start with invalid body returns 400", async () => {
    const reg = await fetch(`http://localhost:${port}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `apitest_${Date.now()}@test.local`, password: "Pass12345!" }),
    });
    const regData = (await reg.json()) as { apiKey?: string };
    const key = regData.apiKey;
    assert.ok(key, "Need API key for start test");
    const res = await fetch(`http://localhost:${port}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: "{}",
    });
    assert.strictEqual(res.status, 400);
  });

  it("POST /webhooks/openclaw without token returns 503", async () => {
    const res = await fetch(`http://localhost:${port}/webhooks/openclaw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: "proj_1", type: "plan", tasks: [] }),
    });
    assert.strictEqual(res.status, 503);
    const data = (await res.json()) as { error?: string };
    assert.ok(data.error?.includes("OPENCLAW_HOOKS_TOKEN"));
  });
});
