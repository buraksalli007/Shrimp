#!/usr/bin/env npx tsx
/**
 * Fix Flow Simülasyonu: Verification fail → OpenClaw fix → fix webhook → Cursor tekrar → verify pass
 *
 * Gereksinim: Sunucu ORCHESTRATION_SIMULATION=true SIMULATION_VERIFY_FAIL_COUNT=2 ile çalışmalı
 * Çalıştırma: API_URL=http://localhost:3000 OPENCLAW_HOOKS_TOKEN="sim_token_16chars_min!!" npx tsx scripts/e2e-fix-flow-sim.ts
 */

const API_URL = process.env.API_URL ?? "http://localhost:3000";
const OPENCLAW_TOKEN = process.env.OPENCLAW_HOOKS_TOKEN ?? "sim_token_16chars_min!!";

type Json = Record<string, unknown>;

async function fetchApi(
  path: string,
  options?: { method?: string; body?: Json; headers?: Record<string, string> }
): Promise<{ status: number; data: Json }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as Json;
  return { status: res.status, data };
}

function assert(name: string, cond: boolean, detail?: string): void {
  const s = cond ? "✓" : "✗";
  console.log(`  ${s} ${name}${detail ? `: ${detail}` : ""}`);
  if (!cond) throw new Error(`FAIL: ${name}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
  console.log("\n=== Fix Flow Simülasyonu ===\n");

  const ts = Date.now();
  const email = `fix_${ts}@sim.local`;
  const password = "Pass12345!";

  // 1. Kayıt + API key
  console.log("1. Kullanıcı kaydı");
  const reg = await fetchApi("/auth/register", {
    method: "POST",
    body: { email, password },
  });
  assert("Register 201", reg.status === 201);
  const apiKey = reg.data.apiKey as string;
  assert("API key var", !!apiKey);

  // 2. Proje başlat
  console.log("\n2. OpenClaw plan modu ile proje başlat");
  const start = await fetchApi("/start", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      idea: "Basit todo uygulaması",
      githubRepo: "sim/test",
      branch: "main",
      autonomyMode: "builder",
      credentials: {
        cursorApiKey: "ck_sim",
        openclawToken: OPENCLAW_TOKEN,
        githubToken: "gh_sim",
      },
    },
  });
  assert("Start 202 (pending_plan)", start.status === 202);
  const projectId = start.data.projectId as string;
  assert("projectId var", !!projectId);

  // 3. Plan webhook
  console.log("\n3. OpenClaw plan webhook");
  const planTasks = [
    {
      id: "task_1",
      title: "Ana ekran",
      description: "Todo listesi",
      prompt: "Create a simple todo list screen with add/remove.",
    },
  ];
  const planRes = await fetchApi("/webhooks/openclaw", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: { projectId, type: "plan", tasks: planTasks },
  });
  assert("Plan webhook 202", planRes.status === 202);

  await sleep(2000);

  // 4. Agent ID al
  console.log("\n4. Proje durumu");
  const projRes = await fetchApi(`/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  assert("Proje 200", projRes.status === 200);
  const agentId1 = projRes.data.currentAgentId as string;
  assert("Agent ID var", !!agentId1);

  // 5. Cursor webhook - ilk run tamamlandı (verify fail → Cursor retry)
  console.log("\n5. Cursor webhook - ilk run (verify fail → retry)");
  const cursor1 = await fetchApi("/webhooks/cursor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      event: "statusChange",
      id: agentId1,
      agentId: agentId1,
      status: "FINISHED",
      summary: "Todo screen implemented",
    },
  });
  assert("Cursor webhook 200", cursor1.status === 200);

  await sleep(3500);

  // 5b. İkinci run (retry) - agent 2
  const projRetry = await fetchApi(`/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const agentIdRetry = projRetry.data.currentAgentId as string | undefined;
  if (agentIdRetry) {
    console.log("\n5c. Cursor webhook - retry run (verify fail → escalate)");
    await fetchApi("/webhooks/cursor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        event: "statusChange",
        id: agentIdRetry,
        agentId: agentIdRetry,
        status: "FINISHED",
        summary: "Retry attempt",
      },
    });
    await sleep(3500);
  }

  // 6. pending_fix olmalı (2. verify fail → escalate → requestFix)
  console.log("\n6. pending_fix kontrolü");
  const afterFail = await fetchApi(`/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const status1 = afterFail.data.status as string;
  assert("status pending_fix (verify fail x2 → escalate)", status1 === "pending_fix", `got: ${status1}`);

  // 7. OpenClaw fix webhook
  console.log("\n7. OpenClaw fix webhook");
  const fixRes = await fetchApi("/webhooks/openclaw", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: {
      projectId,
      type: "fix",
      fixPrompt: "Fix the simulated lint error: remove unused variable and fix test.",
    },
  });
  assert("Fix webhook 202", fixRes.status === 202);

  await sleep(2000);

  // 8. Fix agent ID
  console.log("\n8. Fix agent başlatıldı");
  const proj2 = await fetchApi(`/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const agentId2 = proj2.data.currentAgentId as string;
  assert("Fix agent ID var", !!agentId2);

  // 9. Cursor webhook - fix run tamamlandı
  console.log("\n9. Cursor webhook - fix run tamamlandı");
  const cursor2 = await fetchApi("/webhooks/cursor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      event: "statusChange",
      id: agentId2,
      agentId: agentId2,
      status: "FINISHED",
      summary: "Fixed lint and tests",
    },
  });
  assert("Cursor webhook 200", cursor2.status === 200);

  await sleep(3500);

  // 10. awaiting_approval olmalı (verify pass)
  console.log("\n10. Final durum");
  const final = await fetchApi(`/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const finalStatus = final.data.status as string;
  assert("awaiting_approval", finalStatus === "awaiting_approval", `got: ${finalStatus}`);

  console.log("\n=== Fix flow simülasyonu tamamlandı ===");
  console.log("");
}

main().catch((err) => {
  console.error("\nHATA:", err.message);
  process.exit(1);
});
