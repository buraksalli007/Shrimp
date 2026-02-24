#!/usr/bin/env npx tsx
/**
 * Kapsamlı E2E Simülasyonlar – Tüm edge case ve açıkları tespit etmek için
 * Çalıştırma: API_URL=http://localhost:3000 npx tsx scripts/e2e-simulations.ts
 */

const API_URL = process.env.API_URL ?? "http://localhost:3000";

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
  console.log(`    ${s} ${name}${detail ? `: ${detail}` : ""}`);
  if (!cond) throw new Error(`FAIL: ${name}`);
}

async function runSimulation(name: string, fn: () => Promise<void>): Promise<boolean> {
  try {
    console.log(`\n--- ${name} ---`);
    await fn();
    console.log(`  OK: ${name}`);
    return true;
  } catch (err) {
    console.error(`  HATA: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function main(): Promise<void> {
  console.log("\n=== Kapsamlı E2E Simülasyonlar ===\n");
  const ts = Date.now();
  const results: { name: string; ok: boolean }[] = [];

  // ========== SİMÜLASYON 1: Auth Edge Cases ==========
  results.push({
    name: "Auth Edge",
    ok: await runSimulation("Auth Edge Cases", async () => {
      const r1 = await fetchApi("/auth/register", { method: "POST", body: { email: "ab", password: "12345678" } });
      assert("Kısa email 400", r1.status === 400);

      const r2 = await fetchApi("/auth/register", { method: "POST", body: { email: "a@b.co", password: "123" } });
      assert("Kısa şifre 400", r2.status === 400);

      const r3 = await fetchApi("/auth/register", { method: "POST", body: {} });
      assert("Eksik body 400", r3.status === 400);

      const r4 = await fetchApi("/auth/login", { method: "POST", body: { email: "nonexist@x.co", password: "pass12345" } });
      assert("Yanlış login 401", r4.status === 401);

      const r5 = await fetchApi("/auth/me", { headers: { Authorization: "Bearer sb_fake_key_xyz" } });
      assert("Geçersiz key ile /me 401", r5.status === 401);

      const r6 = await fetchApi("/auth/me");
      assert("Key olmadan /me 401", r6.status === 401);
    }),
  });

  // ========== SİMÜLASYON 2: Duplicate Email ==========
  results.push({
    name: "Duplicate Email",
    ok: await runSimulation("Duplicate Email (409)", async () => {
      const email = `dup_${ts}@test.local`;
      await fetchApi("/auth/register", { method: "POST", body: { email, password: "Pass12345!" } });
      const r = await fetchApi("/auth/register", { method: "POST", body: { email, password: "Pass12345!" } });
      assert("Duplicate email 409", r.status === 409);
    }),
  });

  // ========== SİMÜLASYON 3: Start Validation ==========
  let validKey = "";
  results.push({
    name: "Start Validation",
    ok: await runSimulation("Start Validation Edge", async () => {
      const reg = await fetchApi("/auth/register", {
        method: "POST",
        body: { email: `startval_${ts}@test.local`, password: "Pass12345!" },
      });
      validKey = (reg.data.apiKey as string) ?? "";

      const r1 = await fetchApi("/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${validKey}` },
        body: {},
      });
      assert("Boş body 400", r1.status === 400);

      const r2 = await fetchApi("/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${validKey}` },
        body: { idea: "", githubRepo: "a/b" },
      });
      assert("Boş idea 400", r2.status === 400);

      const r3 = await fetchApi("/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${validKey}` },
        body: { idea: "App", githubRepo: "" },
      });
      assert("Boş githubRepo 400", r3.status === 400);

      const r4 = await fetchApi("/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${validKey}` },
        body: { idea: "x".repeat(2001), githubRepo: "a/b" },
      });
      assert("Uzun idea 400", r4.status === 400);

      const r5 = await fetchApi("/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${validKey}` },
        body: { idea: "App", githubRepo: "a/b", autonomyMode: "invalid" },
      });
      assert("Geçersiz autonomyMode 400", r5.status === 400);
    }),
  });

  // ========== SİMÜLASYON 4: Outcome Edge ==========
  results.push({
    name: "Outcome Edge",
    ok: await runSimulation("Outcome Edge Cases", async () => {
      const key = validKey || (await fetchApi("/auth/register", { method: "POST", body: { email: `out_${ts}@test.local`, password: "Pass12345!" } })).data.apiKey as string;
      const r1 = await fetchApi("/outcome", { headers: { Authorization: `Bearer ${key}` } });
      assert("idea yok 400", r1.status === 400);

      const r2 = await fetchApi("/outcome?idea=", { headers: { Authorization: `Bearer ${key}` } });
      assert("Boş idea 400", r2.status === 400);

      const r3 = await fetchApi("/outcome?idea=Test", { headers: { Authorization: `Bearer ${key}` } });
      assert("Outcome 200 (key ile)", r3.status === 200);
    }),
  });

  // ========== SİMÜLASYON 5: Proje İzolasyonu (User A vs User B) ==========
  results.push({
    name: "Project Isolation",
    ok: await runSimulation("Proje İzolasyonu", async () => {
      const regA = await fetchApi("/auth/register", {
        method: "POST",
        body: { email: `userA_${ts}@test.local`, password: "Pass12345!" },
      });
      const keyA = regA.data.apiKey as string;

      const regB = await fetchApi("/auth/register", {
        method: "POST",
        body: { email: `userB_${ts}@test.local`, password: "Pass12345!" },
      });
      const keyB = regB.data.apiKey as string;

      const startA = await fetchApi("/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${keyA}` },
        body: {
          idea: "User A secret app",
          githubRepo: "usera/secret",
          credentials: { cursorApiKey: "ck_x", githubToken: "gh_x" },
        },
      });
      assert("User A proje oluşturdu", startA.status === 202 || startA.status === 500);

      const projA = await fetchApi("/projects", { headers: { Authorization: `Bearer ${keyA}` } });
      const listA = (projA.data.projects as Array<{ idea: string }>) ?? [];
      const foundA = listA.find((p) => p.idea === "User A secret app");
      assert("User A kendi projesini görüyor", !!foundA);

      const projB = await fetchApi("/projects", { headers: { Authorization: `Bearer ${keyB}` } });
      const listB = (projB.data.projects as Array<{ idea: string }>) ?? [];
      const foundB = listB.find((p) => p.idea === "User A secret app");
      assert("User B User A projesini GÖRMÜYOR", !foundB);

      if (foundA) {
        const pid = (projA.data.projects as Array<{ projectId: string }>)[0]?.projectId;
        if (pid) {
          const detailB = await fetchApi(`/projects/${pid}`, { headers: { Authorization: `Bearer ${keyB}` } });
          assert("User B başka projeye 404", detailB.status === 404);
        }
      }
    }),
  });

  // ========== SİMÜLASYON 6: API Key Revoke ==========
  results.push({
    name: "API Key Revoke",
    ok: await runSimulation("API Key Revoke", async () => {
      const reg = await fetchApi("/auth/register", {
        method: "POST",
        body: { email: `revoke_${ts}@test.local`, password: "Pass12345!" },
      });
      const key1 = reg.data.apiKey as string;

      const newKey = await fetchApi("/auth/keys", {
        method: "POST",
        headers: { Authorization: `Bearer ${key1}` },
        body: { name: "to-revoke" },
      });
      const key2 = newKey.data.apiKey as string;

      const keysRes = await fetchApi("/auth/keys", { headers: { Authorization: `Bearer ${key1}` } });
      const keys = (keysRes.data.keys as Array<{ id: string; name: string }>) ?? [];
      const revokeKey = keys.find((k) => k.name === "to-revoke");
      assert("Revoke edilecek key bulundu", !!revokeKey);

      if (revokeKey) {
        const rev = await fetchApi(`/auth/keys/${revokeKey.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${key1}` },
        });
        assert("Revoke 200", rev.status === 200);

        const meAfter = await fetchApi("/auth/me", { headers: { Authorization: `Bearer ${key2}` } });
        assert("Revoke edilmiş key 401", meAfter.status === 401);
      }
    }),
  });

  // ========== SİMÜLASYON 7: Start API Key Gerekli ==========
  results.push({
    name: "Start Requires Key",
    ok: await runSimulation("Start API Key Gerekli", async () => {
      const r = await fetchApi("/start", {
        method: "POST",
        body: { idea: "App", githubRepo: "a/b", credentials: { cursorApiKey: "ck_x" } },
      });
      assert("Key olmadan start 401", r.status === 401);
    }),
  });

  // ========== SİMÜLASYON 8: Memory Olmayan Proje ==========
  results.push({
    name: "Memory 404",
    ok: await runSimulation("Memory Olmayan Proje", async () => {
      const reg = await fetchApi("/auth/register", {
        method: "POST",
        body: { email: `mem_${ts}@test.local`, password: "Pass12345!" },
      });
      const key = reg.data.apiKey as string;
      const r = await fetchApi("/projects/proj_nonexistent_999/memory", {
        headers: { Authorization: `Bearer ${key}` },
      });
      assert("Memory 404", r.status === 404);
    }),
  });

  // ========== SİMÜLASYON 9: OpenClaw Webhook Validation ==========
  results.push({
    name: "OpenClaw Webhook",
    ok: await runSimulation("OpenClaw Webhook Edge", async () => {
      const r1 = await fetchApi("/webhooks/openclaw", {
        method: "POST",
        body: {},
      });
      assert("Token yok 503", r1.status === 503);

      const r2 = await fetchApi("/webhooks/openclaw", {
        method: "POST",
        headers: { Authorization: "Bearer any_token_16chars!!" },
        body: { projectId: "proj_1" },
      });
      assert("Geçersiz token 401 veya 503", r2.status === 401 || r2.status === 503);

      const r3 = await fetchApi("/webhooks/openclaw", {
        method: "POST",
        headers: { Authorization: "Bearer any_token_16chars!!" },
        body: { projectId: "proj_nonexistent", type: "plan", tasks: [] },
      });
      assert("Plan tasks boş veya 404", r3.status === 202 || r3.status === 404 || r3.status === 401 || r3.status === 503);
    }),
  });

  // ========== SİMÜLASYON 10: Custom Tasks Start ==========
  results.push({
    name: "Custom Tasks",
    ok: await runSimulation("Özel Tasks ile Start", async () => {
      const reg = await fetchApi("/auth/register", {
        method: "POST",
        body: { email: `tasks_${ts}@test.local`, password: "Pass12345!" },
      });
      const key = reg.data.apiKey as string;

      const r = await fetchApi("/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: {
          idea: "Custom task app",
          githubRepo: "user/repo",
          autonomyMode: "assist",
          tasks: [
            { id: "t1", title: "Setup", prompt: "Setup project" },
            { id: "t2", title: "Feature", prompt: "Add feature" },
          ],
        },
      });
      assert("Custom tasks assist 200", r.status === 200);
      assert("outcome veya approvedTasks", !!r.data.outcome || !!r.data.decision);
    }),
  });

  // ========== SİMÜLASYON 11: Health / Status Public ==========
  results.push({
    name: "Public Endpoints",
    ok: await runSimulation("Public Endpoints", async () => {
      const h = await fetchApi("/health");
      assert("Health 200 key olmadan", h.status === 200);

      const s = await fetchApi("/status");
      assert("Status 200 key olmadan", s.status === 200);
    }),
  });

  // ========== SİMÜLASYON 12: Revoke Olmayan Key ==========
  results.push({
    name: "Revoke 404",
    ok: await runSimulation("Revoke Olmayan Key", async () => {
      const reg = await fetchApi("/auth/register", {
        method: "POST",
        body: { email: `rev404_${ts}@test.local`, password: "Pass12345!" },
      });
      const key = reg.data.apiKey as string;
      const r = await fetchApi("/auth/keys/nonexistent_key_id_xyz", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${key}` },
      });
      assert("Revoke 404", r.status === 404);
    }),
  });

  // ========== SİMÜLASYON 13: Auth Keys Key Olmadan ==========
  results.push({
    name: "Auth Keys 401",
    ok: await runSimulation("Auth Keys Key Olmadan", async () => {
      const r = await fetchApi("/auth/keys");
      assert("Keys 401", r.status === 401);
    }),
  });

  // ========== SİMÜLASYON 14: Malformed JSON ==========
  results.push({
    name: "Malformed JSON",
    ok: await runSimulation("Malformed JSON Body", async () => {
      const reg = await fetchApi("/auth/register", {
        method: "POST",
        body: { email: `mal_${ts}@test.local`, password: "Pass12345!" },
      });
      const key = reg.data.apiKey as string;
      const r = await fetch(`${API_URL}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: "{ invalid json }",
      });
      assert("Malformed JSON 400 veya 500", r.status === 400 || r.status === 500);
    }),
  });

  // ========== SİMÜLASYON 15: Autopilot Mode ==========
  results.push({
    name: "Autopilot Mode",
    ok: await runSimulation("Autopilot Mode", async () => {
      const reg = await fetchApi("/auth/register", {
        method: "POST",
        body: { email: `auto_${ts}@test.local`, password: "Pass12345!" },
      });
      const key = reg.data.apiKey as string;

      const r = await fetchApi("/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: {
          idea: "Autopilot app",
          githubRepo: "user/repo",
          autonomyMode: "autopilot",
        },
      });
      assert("Autopilot Cursor key yok 400", r.status === 400);
    }),
  });

  // ========== ÖZET ==========
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log("\n=== ÖZET ===");
  console.log(`Geçen: ${passed}/${results.length}`);
  if (failed.length > 0) {
    console.log("Başarısız simülasyonlar:", failed.map((f) => f.name).join(", "));
    process.exit(1);
  }
  console.log("\nTüm simülasyonlar geçti.\n");
}

main().catch((err) => {
  console.error("\nHATA:", err.message);
  process.exit(1);
});
