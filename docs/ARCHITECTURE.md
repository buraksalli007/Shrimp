# Shrimp Bridge – Mimari

## Genel Bakış

Shrimp Bridge, Cursor Cloud Agents ile OpenClaw arasında köprü kuran bir orchestration servisidir. Fikirden App Store'a kadar otomatik uygulama geliştirme döngüsünü yönetir.

**Site:** https://www.shrimpbridge.com  
**GitHub:** https://github.com/buraksalli007/Shrimp

---

## Akış Diyagramı

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Kullanıcı  │────▶│  Shrimp Bridge   │────▶│  OpenClaw   │
│  (Dashboard) │     │  (Orchestrator)  │     │  (Araştırma)│
└─────────────┘     └────────┬─────────┘     └──────┬──────┘
                             │                      │
                             │  plan callback       │
                             │◀────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Cursor Cloud     │
                    │  Agent (Kod)     │
                    └────────┬─────────┘
                             │
                             │  webhook (tamamlandı)
                             │◀────────────────────
                             │
                             ▼
                    ┌──────────────────┐
                    │  Verification    │
                    │  (expo-doctor)   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │ hata         │ başarılı     │
              ▼              ▼              │
       ┌─────────────┐  ┌─────────────┐   │
       │ Fix prompt  │  │ Sonraki     │   │
       │ (OpenAI/    │  │ task veya   │   │
       │  OpenClaw)  │  │ Onay Bekliyor│   │
       └──────┬──────┘  └──────┬──────┘   │
              │                │          │
              └────────────────┴──────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  EAS / App Store │
                    └──────────────────┘
```

---

## Proje Yapısı

```
openclaw-cursor-orchestrator/
├── src/
│   ├── index.ts              # Express app, route tanımları
│   ├── config/
│   │   ├── env.ts            # Ortam değişkenleri (Zod)
│   │   └── constants.ts
│   ├── api/
│   │   ├── cursor-api.ts     # Cursor Cloud Agent başlatma
│   │   └── openclaw-api.ts   # OpenClaw'a mesaj gönderme
│   ├── webhooks/
│   │   ├── cursor-webhook.ts # Agent tamamlanma
│   │   ├── openclaw-webhook.ts # Plan, fix, approval callback
│   │   ├── openclaw-bridge.ts  # Plan isteği gönderme
│   │   └── stripe-webhook.ts   # Stripe events
│   ├── services/
│   │   ├── task-manager.ts   # In-memory proje state
│   │   ├── prompt-generator.ts # Fix prompt (OpenAI)
│   │   ├── verification-engine.ts
│   │   └── eas-controller.ts
│   ├── middleware/
│   │   ├── auth.ts           # API key doğrulama
│   │   └── security.ts       # Helmet, rate limit
│   ├── routes/
│   │   └── checkout.ts       # Stripe checkout
│   ├── validation/
│   │   └── schemas.ts        # Zod şemaları
│   ├── lib/
│   │   └── db.ts             # Prisma client
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── logger.ts
│       └── retry.ts
├── web/                      # React dashboard (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   └── Dashboard.tsx
│   │   └── components/
│   ├── vite.config.ts
│   └── package.json
├── prisma/
│   ├── schema.prisma         # PostgreSQL şeması
│   └── migrations/
├── docs/
└── package.json
```

---

## Veri Katmanı

### Prisma (PostgreSQL)

- **User:** email, stripeCustomerId
- **ApiKey:** userId, keyHash, tier
- **Project:** projectId, idea, githubRepo, status, tasksJson, currentIndex, iteration

**Not:** Şu an `task-manager` in-memory çalışıyor. DB persistence planlanıyor.

### Proje Durumları

| Status | Açıklama |
|--------|----------|
| `pending_plan` | OpenClaw plan bekleniyor |
| `pending_fix` | Verification hatası, fix prompt bekleniyor |
| `running` | Cursor agent çalışıyor |
| `awaiting_approval` | Kullanıcı onayı bekleniyor |
| `completed` | Tamamlandı |
| `failed` | Hata |

---

## API Endpoints

| Method | Path | Açıklama |
|--------|------|----------|
| GET | /health | Sağlık kontrolü |
| GET | /status | Konfigürasyon durumu |
| GET | /projects | Proje listesi (API key gerekli) |
| GET | /projects/:id | Proje detayı |
| POST | /start | Proje başlat |
| POST | /approve | Onay ver |
| POST | /checkout | Stripe checkout session |
| POST | /webhooks/cursor | Cursor agent tamamlanma |
| POST | /webhooks/openclaw | OpenClaw plan/fix/approval |
| POST | /webhooks/stripe | Stripe events |

---

## Webhook Akışları

### Cursor Webhook

1. Cursor agent işi bitirir
2. Cursor `POST /webhooks/cursor` çağırır (imza: CURSOR_WEBHOOK_SECRET)
3. Orchestrator verification çalıştırır
4. Hata varsa → fix prompt → Cursor'a tekrar gönder
5. Başarılıysa → sonraki task veya `awaiting_approval`

### OpenClaw Webhook

1. **Plan:** `{ type: "plan", projectId, tasks }` → Cursor'a ilk task gönder
2. **Fix:** `{ type: "fix", projectId, fixPrompt }` → Cursor'a fix prompt ile tekrar gönder
3. **Approval:** `{ projectId }` → `awaiting_approval` → `completed`

---

## Deployment (Vercel)

- **Backend:** Vercel Serverless Functions
- **Web:** Static (web/dist)
- **Database:** Vercel Postgres
- **Domain:** shrimpbridge.com, www.shrimpbridge.com

`vercel.json` ile API routes `/api/*` altında sunulur.
