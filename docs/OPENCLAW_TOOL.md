# Shrimp Bridge – OpenClaw Tool Definition

OpenClaw can integrate with Shrimp Bridge via a native tool. Configure this in your OpenClaw setup.

## Tool: shrimp_bridge

**Description:** Start and manage Shrimp Bridge projects. Orchestrates Cursor + OpenClaw for automated app development from idea to App Store.

### Actions

#### 1. start_project
Start a new app project.

**Parameters:**
- `idea` (string, required): App idea description
- `githubRepo` (string, required): GitHub repo in `owner/repo` format
- `branch` (string, optional): Branch name, default `main`

**Implementation:** `POST https://www.shrimpbridge.com/start` with body `{ idea, githubRepo, branch? }`

**Response:** `{ projectId, status, message }` – if OpenClaw is configured, status may be `pending_plan`; otherwise Cursor launches immediately.

#### 2. approve_project
Approve a project for App Store upload.

**Parameters:**
- `projectId` (string, required): Project ID from start_project

**Implementation:** `POST https://www.shrimpbridge.com/approve` with body `{ projectId }`

#### 3. get_project_status
Get status of a project.

**Parameters:**
- `projectId` (string, required): Project ID

**Implementation:** `GET https://www.shrimpbridge.com/projects/{projectId}`

**Response:** `{ projectId, idea, status, currentTaskIndex, totalTasks, iteration, ... }`

### Webhook Callbacks (OpenClaw → Shrimp Bridge)

When OpenClaw researches and produces output, it can send to:

`POST https://www.shrimpbridge.com/webhooks/openclaw`

**Headers:** `Authorization: Bearer {OPENCLAW_HOOKS_TOKEN}`

**Body formats:**

1. **Plan callback** (when project is `pending_plan`):
```json
{
  "projectId": "proj_xxx",
  "type": "plan",
  "tasks": [
    { "id": "task_1", "title": "...", "description": "...", "prompt": "..." }
  ]
}
```

2. **Fix callback** (when project is `pending_fix` after verification failure):
```json
{
  "projectId": "proj_xxx",
  "type": "fix",
  "fixPrompt": "Fix the following errors: ..."
}
```

3. **Approval** (when project is `awaiting_approval`):
```json
{
  "projectId": "proj_xxx"
}
```
Or send a message containing approval keywords (approve, onay, etc.) and projectId.
