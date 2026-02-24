#!/usr/bin/env npx tsx
/**
 * Tam Orchestrasyon Simülasyonu: OpenClaw plan → Cursor çalıştır → webhook → verify → fix döngüsü
 * Planlama, geliştirme promptları, fix döngüsü simüle edilir.
 *
 * Gereksinim: Sunucu ORCHESTRATION_SIMULATION=true ile çalışmalı
 * Çalıştırma: API_URL=http://localhost:3020 npx tsx scripts/e2e-orchestration-sim.ts
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
  console.log("\n=== Tam Orchestrasyon Simülasyonu ===\n");

  const ts = Date.now();
  const email = `orch_${ts}@sim.local`;
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

  // 2. OpenClaw plan modu ile proje başlat (sim/test repo)
  console.log("\n2. OpenClaw plan modu ile proje başlat");
  const start = await fetchApi("/start", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      idea: "Basit sayaç uygulaması - artır/azalt butonları",
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
  assert("status pending_plan", start.data.status === "pending_plan");
  console.log(`   projectId: ${projectId}`);

  // 3. OpenClaw plan webhook simülasyonu - plan gönder
  console.log("\n3. OpenClaw plan webhook (OpenClaw planlama simülasyonu)");
  const planTasks = [
    {
      id: "task_1",
      title: "Ana ekran",
      description: "Sayaç UI",
      prompt: "Create a simple counter screen with + and - buttons. Use React Native, Expo.",
    },
    {
      id: "task_2",
      title: "State yönetimi",
      description: "Sayaç state",
      prompt: "Add useState for counter value. Increment on +, decrement on -.",
    },
  ];

  const planRes = await fetchApi("/webhooks/openclaw", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: {
      projectId,
      type: "plan",
      tasks: planTasks,
    },
  });
  assert("Plan webhook 202", planRes.status === 202);

  // 4. Cursor agent başlatıldı (sim). Biraz bekle, sonra Cursor webhook ile tamamlandı simüle et
  await sleep(2000);

  // 5. Proje durumunu kontrol et - agent ID'yi bul
  console.log("\n4. Proje durumu");
  const projRes = await fetchApi(`/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  assert("Proje 200", projRes.status === 200);
  const currentAgentId = projRes.data.currentAgentId as string | undefined;
  assert("Agent ID var (Cursor başlatıldı)", !!currentAgentId);
  console.log(`   currentAgentId: ${currentAgentId}`);

  // 6. Cursor webhook - agent tamamlandı (FINISHED)
  console.log("\n5. Cursor webhook - agent tamamlandı");
  const cursorRes = await fetchApi("/webhooks/cursor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      event: "statusChange",
      id: currentAgentId,
      agentId: currentAgentId,
      status: "FINISHED",
      summary: "Counter screen implemented",
    },
  });
  assert("Cursor webhook 200", cursorRes.status === 200);

  // 7. Verify + recordCompletion async çalışır. Bekle
  await sleep(3000);

  // 8. Proje durumu - awaiting_approval veya running (sonraki task)
  console.log("\n6. Proje durumu (verify sonrası)");
  const projAfter = await fetchApi(`/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const status = projAfter.data.status as string;
  console.log(`   status: ${status}`);

  assert(
    "awaiting_approval veya running",
    status === "awaiting_approval" || status === "running"
  );

  if (status === "running") {
    // İkinci task için Cursor webhook
    const proj2 = await fetchApi(`/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const agent2 = proj2.data.currentAgentId as string;
    if (agent2) {
      await fetchApi("/webhooks/cursor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          event: "statusChange",
          id: agent2,
          agentId: agent2,
          status: "FINISHED",
          summary: "State management added",
        },
      });
      await sleep(3000);
    }
  }

  // 9. Final durum
  const final = await fetchApi(`/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const finalStatus = final.data.status as string;
  assert("awaiting_approval veya completed", finalStatus === "awaiting_approval" || finalStatus === "completed" || finalStatus === "running");

  console.log("\n=== Orchestrasyon simülasyonu tamamlandı ===");
  console.log(`Final status: ${finalStatus}`);
  console.log("");
}

main().catch((err) => {
  console.error("\nHATA:", err.message);
  process.exit(1);
});
