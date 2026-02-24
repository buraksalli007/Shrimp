#!/usr/bin/env npx tsx
/**
 * E2E User Simulation – Yeni kullanıcı akışı ve uygulama geliştirme denemesi
 * Çalıştırma: API_URL=http://localhost:3000 npx tsx scripts/e2e-user-simulation.ts
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

function ok(name: string, cond: boolean, detail?: string): void {
  const s = cond ? "✓" : "✗";
  console.log(`  ${s} ${name}${detail ? `: ${detail}` : ""}`);
  if (!cond) throw new Error(`Assertion failed: ${name}`);
}

async function main(): Promise<void> {
  console.log("\n=== E2E User Simulation ===\n");
  const timestamp = Date.now();
  const email = `simuser_${timestamp}@test.local`;
  const password = "SecurePass123!";

  let apiKey: string;

  // --- 1. Yeni kullanıcı kaydı ---
  console.log("1. Yeni kullanıcı kaydı (register)");
  const reg = await fetchApi("/auth/register", {
    method: "POST",
    body: { email, password },
  });
  ok("Register 201", reg.status === 201, `status=${reg.status}`);
  ok("apiKey döndü", typeof reg.data.apiKey === "string");
  apiKey = reg.data.apiKey as string;
  ok("apiKey sb_ ile başlıyor", apiKey.startsWith("sb_"));
  console.log(`   API Key: ${apiKey.slice(0, 20)}...`);

  // --- 2. Login (aynı kullanıcı) ---
  console.log("\n2. Login");
  const login = await fetchApi("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  ok("Login 200", login.status === 200);
  ok("Login apiKey", typeof login.data.apiKey === "string");
  const loginKey = login.data.apiKey as string;

  // --- 3. /auth/me (Desktop: API key ile giriş simülasyonu) ---
  console.log("\n3. /auth/me (Desktop giriş simülasyonu)");
  const me = await fetchApi("/auth/me", {
    headers: { Authorization: `Bearer ${loginKey}` },
  });
  ok("Me 200", me.status === 200);
  ok("Me email", me.data.email === email);
  ok("Me tier", typeof me.data.tier === "string");

  // --- 4. Yeni API key oluştur ---
  console.log("\n4. Yeni API key oluştur");
  const newKey = await fetchApi("/auth/keys", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { name: "desktop-key" },
  });
  ok("Create key 201", newKey.status === 201);
  ok("Yeni key döndü", typeof newKey.data.apiKey === "string");

  // --- 5. API key listesi ---
  console.log("\n5. API key listesi");
  const keys = await fetchApi("/auth/keys", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  ok("Keys 200", keys.status === 200);
  const keyList = keys.data.keys as Array<{ id: string; name: string }>;
  ok("En az 1 key", Array.isArray(keyList) && keyList.length >= 1);

  // --- 6. /status (Desktop: config kontrolü) ---
  console.log("\n6. /status (config)");
  const status = await fetchApi("/status");
  ok("Status 200", status.status === 200);
  ok("cursorConfigured boolean", typeof status.data.cursorConfigured === "boolean");

  // --- 7. Assist mode – sadece öneri (Cursor key gerekmez) ---
  console.log("\n7. Assist mode – öneri al (Cursor key gerekmez)");
  const assist = await fetchApi("/start", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      idea: "Fitness tracker with daily goals",
      githubRepo: "testuser/fitness-app",
      autonomyMode: "assist",
    },
  });
  ok("Assist 200", assist.status === 200);
  ok("mode assist", assist.data.mode === "assist");
  ok("outcome var", !!assist.data.outcome);
  ok("mvpFeatures array", Array.isArray((assist.data.outcome as Json)?.mvpFeatures));

  // --- 8. Builder mode – Cursor key yok, hata beklenir ---
  console.log("\n8. Builder mode – Cursor key yok (hata beklenir)");
  const builderNoKey = await fetchApi("/start", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      idea: "Todo app",
      githubRepo: "testuser/todo-app",
      autonomyMode: "builder",
    },
  });
  ok("Builder 400 (Cursor key gerekli)", builderNoKey.status === 400);
  ok("Hata mesajı anlamlı", String(builderNoKey.data.error || "").includes("Cursor"));

  // --- 9. Proje listesi (boş olmalı – proje oluşturulmadı) ---
  console.log("\n9. Proje listesi");
  const projects = await fetchApi("/projects", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  ok("Projects 200", projects.status === 200);
  const projList = projects.data.projects as Array<unknown>;
  ok("Proje listesi array", Array.isArray(projList));
  ok("Boş liste (assist proje oluşturmaz)", projList.length === 0);

  // --- 10. Outcome endpoint ---
  console.log("\n10. Outcome (fikir analizi)");
  const outcome = await fetchApi(`/outcome?idea=${encodeURIComponent("E-commerce mobile app")}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  ok("Outcome 200", outcome.status === 200);
  ok("mvpFeatures", Array.isArray(outcome.data.mvpFeatures));
  ok("developmentPhases", Array.isArray(outcome.data.developmentPhases));

  // --- 11. Builder + Cursor credentials (mock) – proje oluşur, agent başlamayabilir ---
  console.log("\n11. Builder + credentials – proje oluştur");
  const startWithCreds = await fetchApi("/start", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      idea: "Simple counter app",
      githubRepo: "testuser/counter",
      autonomyMode: "builder",
      credentials: {
        cursorApiKey: "ck_test_invalid_key_for_e2e",
        githubToken: "ghp_test_invalid",
      },
    },
  });
  ok("Start 202 (başarılı) veya 500 (agent hatası)", startWithCreds.status === 202 || startWithCreds.status === 500);
  const pid = startWithCreds.data.projectId as string | undefined;

  // --- 12. Proje listesi (credentials ile proje oluşturuluyor) ---
  console.log("\n12. Proje listesi (start sonrası)");
  const projectsAfter = await fetchApi("/projects", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  ok("Projects 200", projectsAfter.status === 200);
  const listAfter = projectsAfter.data.projects as Array<{ projectId: string; idea: string }>;
  ok("Proje listesi array", Array.isArray(listAfter));

  const found = listAfter.find((p) => p.idea === "Simple counter app");
  ok("Counter app projesi listede", !!found);
  const projectId = pid ?? found?.projectId;

  // --- 13. Proje detayı ---
  if (projectId) {
    console.log("\n13. Proje detayı");
    const detail = await fetchApi(`/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    ok("Detail 200", detail.status === 200);
    ok("idea eşleşiyor", detail.data.idea === "Simple counter app");
    ok("status string", typeof detail.data.status === "string");
  }

  // --- 14. Başka projeye erişim (404) ---
  console.log("\n14. Başka projeye erişim (404)");
  const other = await fetchApi("/projects/proj_9999999999_nonexist", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  ok("404", other.status === 404);

  // --- 15. Approve – olmayan proje (404) ---
  console.log("\n15. Approve – olmayan proje");
  const approveBad = await fetchApi("/approve", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { projectId: "proj_nonexistent_xyz" },
  });
  ok("Approve 404", approveBad.status === 404);

  // --- 16. Approve – body eksik (400) ---
  console.log("\n16. Approve – body eksik");
  const approveNoBody = await fetchApi("/approve", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {},
  });
  ok("Approve 400", approveNoBody.status === 400);

  // --- 16b. Approve – proje awaiting_approval değil (400) ---
  if (projectId) {
    const approveWrongStatus = await fetchApi("/approve", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: { projectId },
    });
    ok("Approve 400 (status uygun değil)", approveWrongStatus.status === 400);
  }

  // --- 17. Proje memory (varsa) ---
  if (projectId) {
    console.log("\n17. Proje memory");
    const mem = await fetchApi(`/projects/${projectId}/memory`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    ok("Memory 200", mem.status === 200);
    ok("architectureDecisions array", Array.isArray(mem.data.architectureDecisions));
  }

  // --- 18. Geçersiz API key (401/403) ---
  console.log("\n18. Geçersiz API key");
  const badKey = await fetchApi("/projects", {
    headers: { Authorization: "Bearer sb_invalid_key_12345" },
  });
  ok("401 veya 403", badKey.status === 401 || badKey.status === 403);

  console.log("\n=== Tüm E2E testleri geçti ===\n");
}

main().catch((err) => {
  console.error("\nE2E HATA:", err.message);
  process.exit(1);
});
