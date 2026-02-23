# Shrimp Bridge – Product Specification

## Vision

Shrimp Bridge is a **production-grade orchestration platform** that connects Cursor (code) and OpenClaw (research/planning) to deliver automated app development from idea to App Store, with real monetization, error-fix loops, and OpenClaw-native integration.

---

## 1. Core Capabilities

### 1.1 Cursor + OpenClaw Orchestration
- **Idea → Plan:** OpenClaw researches (Brave Search), produces task list
- **Plan → Code:** Cursor implements each task via Cloud Agents
- **Verify → Fix:** On each completion: verify → if errors, generate fix prompt (OpenClaw-assisted) → retry
- **Approve → Deploy:** User approves → EAS uploads to App Store

### 1.2 OpenClaw Error-Fix Assistance
When verification fails:
1. Send errors + context to OpenClaw
2. OpenClaw researches (Brave Search) for solutions
3. OpenClaw returns improved fix prompt
4. Cursor retries with that prompt

### 1.3 OpenClaw Tool
Native OpenClaw tool so users can:
- Start projects from OpenClaw chat
- Approve projects from OpenClaw
- Get status updates in OpenClaw

---

## 2. Monetization

### 2.1 Subscription Tiers
| Tier       | Price  | API Keys | Runs/mo | OpenClaw Tool |
|-----------|--------|----------|---------|---------------|
| Starter   | $29/mo | 1        | 50      | No            |
| Pro       | $99/mo | 5        | Unlimited | Yes         |
| Enterprise| Custom | Unlimited| Custom  | Yes + SLA     |

### 2.2 Payment Flow
- Stripe Checkout for subscriptions
- Stripe Customer Portal for management
- Webhook for subscription events (created, updated, cancelled)
- Usage tracked per project run; overage alerts (Pro)

### 2.3 API Key Billing
- Each API key tied to a Stripe subscription
- Requests require `Authorization: Bearer <api_key>`
- Unauthenticated requests: 401
- Over-quota: 429 with Retry-After

---

## 3. Technical Architecture

### 3.1 Data Layer
- **Users:** id, email, stripeCustomerId, createdAt
- **API Keys:** id, userId, keyHash, name, createdAt
- **Projects:** id, userId, idea, githubRepo, branch, status, tasks (JSON), iteration, maxIterations, createdAt, updatedAt
- **Usage:** projectId, timestamp, event (start, approve, etc.)

### 3.2 Auth
- API key: `Bearer <key>` → lookup by hash, validate subscription
- Dashboard: email/password or OAuth (future)
- Session: JWT for web, API key for programmatic

### 3.3 OpenClaw Integration
- **Outbound:** `sendToOpenClaw({ message, ... })` – already exists
- **Inbound:** `POST /webhooks/openclaw` – plan callback, approval, error-fix response
- **Callback flow:** 
  - Start with idea → create pending project → request plan from OpenClaw
  - OpenClaw responds with JSON tasks → parse → update project → launch first Cursor agent
- **Error-fix flow:**
  - Verification fails → send to OpenClaw: "Research fix for: [errors]. Context: [task]. Return Cursor prompt."
  - OpenClaw responds → use as fix prompt for Cursor

### 3.4 Verification Enhancements
- Expo-specific: `expo-doctor`, `npx expo export`
- TypeScript: `tsc --noEmit`
- Lint: ESLint
- Test: Jest/Vitest if configured
- Extract errors from stderr/stdout; pass to OpenClaw for research

---

## 4. OpenClaw Tool Definition

```json
{
  "name": "shrimp_bridge",
  "description": "Start and manage Shrimp Bridge projects. Cursor + OpenClaw orchestration.",
  "actions": [
    {
      "name": "start_project",
      "description": "Start a new app project. Provide idea and GitHub repo.",
      "params": { "idea": "string", "githubRepo": "string", "branch": "string?" }
    },
    {
      "name": "approve_project",
      "description": "Approve a project for App Store upload.",
      "params": { "projectId": "string" }
    },
    {
      "name": "get_project_status",
      "description": "Get status of a project.",
      "params": { "projectId": "string" }
    }
  ]
}
```

---

## 5. Implementation Phases

### Phase 1: Persistence & Auth (Current)
- [ ] Prisma + SQLite/Postgres
- [ ] Users, API keys, projects in DB
- [ ] API key middleware
- [ ] Migrate task-manager to DB

### Phase 2: Monetization
- [ ] Stripe products/prices
- [ ] Checkout session endpoint
- [ ] Webhook handler
- [ ] Usage tracking
- [ ] Quota enforcement

### Phase 3: OpenClaw Callback Flow
- [ ] Pending project state
- [ ] Plan callback: parse JSON tasks from OpenClaw
- [ ] Launch Cursor after plan received

### Phase 4: OpenClaw Error-Fix
- [ ] On verification fail: request fix from OpenClaw
- [ ] Parse response, use as Cursor prompt
- [ ] Fallback to OpenAI/static if OpenClaw unavailable

### Phase 5: OpenClaw Tool
- [ ] Tool definition for OpenClaw
- [ ] Action handlers: start_project, approve_project, get_status
- [ ] Auth via API key in tool config

### Phase 6: Production Polish
- [ ] Rate limiting
- [ ] Structured logging
- [ ] Admin dashboard
- [ ] Docs site

---

## 6. Environment Variables (Production)

```
# Auth & DB
DATABASE_URL=postgresql://...
JWT_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# Existing
CURSOR_API_KEY=...
CURSOR_WEBHOOK_SECRET=...
OPENCLAW_HOOKS_TOKEN=...
OPENCLAW_GATEWAY_URL=...
ORCHESTRATION_URL=https://www.shrimpbridge.com
GITHUB_TOKEN=...
OPENAI_API_KEY=...
```
