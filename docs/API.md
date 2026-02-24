# OpenClaw-Cursor Orchestrator API

## Base URL

`http://localhost:3000` (veya `ORCHESTRATION_URL`)

## Authentication

Tüm korumalı endpoint'ler `Authorization: Bearer YOUR_API_KEY` header gerektirir. API key kayıt veya login ile alınır.

## Endpoints

### GET /health

Sağlık kontrolü.

**Response:** `200`
```json
{"status":"ok","service":"openclaw-cursor-orchestrator","version":"1.0.0"}
```

---

### POST /start

Yeni proje başlatır. OpenClaw plan isteği gönderir (tasks yoksa), proje oluşturur, ilk Cursor agent'ı başlatır.

**Request Body:**
```json
{
  "idea": "Fitness takip uygulaması",
  "githubRepo": "owner/repo",
  "branch": "main",
  "tasks": [
    {
      "id": "task_1",
      "title": "Ana ekran",
      "description": "Ana ekran UI",
      "prompt": "Create main screen with..."
    }
  ]
}
```

- `idea` (required): Uygulama fikri
- `githubRepo` (required): GitHub repo (owner/repo veya tam URL)
- `branch` (optional): Varsayılan "main"
- `tasks` (optional): Task listesi. Yoksa OpenClaw'a plan isteği gönderilir ve varsayılan tek task kullanılır

**Response:** `202`
```json
{
  "projectId": "proj_123_abc",
  "agentId": "bc_xyz",
  "status": "running",
  "message": "First agent launched. Webhook will be triggered on completion."
}
```

---

### GET /projects

Tüm projelerin özet listesi.

**Response:** `200`
```json
{
  "projects": [
    {
      "projectId": "proj_123_abc",
      "idea": "Fitness app",
      "status": "running",
      "createdAt": "2025-02-23T12:00:00.000Z"
    }
  ]
}
```

---

### GET /projects/:projectId

Proje detayı.

**Response:** `200`
```json
{
  "projectId": "proj_123_abc",
  "idea": "Fitness app",
  "githubRepo": "owner/repo",
  "branch": "main",
  "status": "awaiting_approval",
  "currentTaskIndex": 3,
  "totalTasks": 4,
  "iteration": 2,
  "maxIterations": 10,
  "currentAgentId": "bc_xyz",
  "createdAt": "2025-02-23T12:00:00.000Z",
  "updatedAt": "2025-02-23T12:30:00.000Z"
}
```

---

### POST /approve

Kullanıcı onayı. Proje `awaiting_approval` durumunda olmalı. EAS build + App Store submit tetiklenir.

**Request Body:**
```json
{
  "projectId": "proj_123_abc"
}
```

**Response:** `200`
```json
{
  "projectId": "proj_123_abc",
  "status": "completed",
  "message": "App Store upload initiated"
}
```

---

### POST /webhooks/cursor

Cursor Cloud Agents webhook. Cursor tarafından çağrılır (agent FINISHED/ERROR). İç kullanım.

**Headers:** `X-Webhook-Signature` (CURSOR_WEBHOOK_SECRET ile HMAC-SHA256)

---

### POST /webhooks/openclaw

OpenClaw onay webhook. Kullanıcı OpenClaw üzerinden "onay" yazdığında OpenClaw bu endpoint'e POST atabilir.

**Request Body:**
```json
{
  "message": "onaylıyorum proj_123_abc",
  "projectId": "proj_123_abc"
}
```

`projectId` veya `message` içinde projectId olmalı. Onay anahtar kelimeleri: onay, onayla, approve, onaylıyorum, tamam, kabul.
