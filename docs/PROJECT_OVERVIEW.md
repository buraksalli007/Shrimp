# Shrimp Bridge – Tam Proje Özeti

Bu doküman, Shrimp Bridge yazılımının tüm amacını, mimarisini ve bileşenlerini detaylı şekilde açıklar.

---

## 1. Proje Amacı

**Shrimp Bridge**, Cursor Cloud Agents ile OpenClaw arasında köprü kuran bir **orchestration servisidir**. Fikirden App Store'a kadar **tam otomatik uygulama geliştirme döngüsünü** yönetir.

### Ana Akış

```
Fikir → OpenClaw (araştırma, plan) → Cursor (kod) → Webhook → Doğrulama
  → Hata varsa: Fix prompt → Cursor → Döngü
  → Hata yoksa: Sonraki task veya Onay Bekliyor
  → Kullanıcı onayı → EAS → App Store
```

### Temel Özellikler

| Özellik | Açıklama |
|---------|----------|
| **Cursor entegrasyonu** | Cursor Cloud Agent API ile proje başlatma, webhook ile tamamlanma takibi |
| **OpenClaw entegrasyonu** | Araştırma, task planlama, fix prompt üretimi, onay bildirimi |
| **Verification engine** | `bun install`, lint, test, `expo-doctor` ile doğrulama |
| **Error-fix loop** | Hata durumunda OpenClaw veya OpenAI ile fix prompt üretimi, Cursor'a tekrar gönderim |
| **Stripe** | Checkout, abonelik yönetimi |
| **EAS** | App Store upload (onay sonrası) |

---

## 2. Teknik Mimari

### Proje Yapısı

```
openclaw-cursor-orchestrator/
├── src/                    # Backend (Express + TypeScript)
│   ├── index.ts            # Ana Express app, route tanımları
│   ├── config/             # env.ts, constants.ts
│   ├── api/                # cursor-api.ts, openclaw-api.ts
│   ├── webhooks/           # cursor, openclaw, stripe
│   ├── services/           # task-manager, verification-engine, prompt-generator, eas-controller
│   ├── middleware/        # auth, security
│   ├── routes/             # checkout (Stripe)
│   ├── validation/         # Zod şemaları
│   ├── lib/                # db.ts (Prisma)
│   └── types/
├── web/                    # React dashboard (Vite)
│   ├── src/
│   │   ├── pages/          # Landing, Dashboard
│   │   ├── components/     # StartForm, ProjectList, ProjectDetail, Header
│   │   └── api.ts         # API client
│   └── vite.config.ts
├── prisma/                 # PostgreSQL şeması
└── docs/
```

### Veri Katmanı

- **Prisma + PostgreSQL**: User, ApiKey, Project modelleri
- **task-manager**: Şu an in-memory (Map), DB persistence planlanıyor

### Proje Durumları (status)

| Status | Açıklama |
|--------|----------|
| `pending_plan` | OpenClaw plan bekleniyor |
| `pending_fix` | Verification hatası, fix prompt bekleniyor |
| `running` | Cursor agent çalışıyor |
| `awaiting_approval` | Kullanıcı onayı bekleniyor |
| `completed` | Tamamlandı |
| `failed` | Max iteration aşıldı |

---

## 3. API Endpoints

| Method | Path | Açıklama |
|--------|------|----------|
| GET | /health | Sağlık kontrolü |
| GET | /status | Konfigürasyon durumu |
| GET | /projects | Proje listesi (API key gerekli) |
| GET | /projects/:id | Proje detayı |
| POST | /start | Proje başlat |
| POST | /approve | Onay ver, EAS tetikle |
| POST | /checkout | Stripe checkout session |
| POST | /webhooks/cursor | Cursor agent tamamlanma |
| POST | /webhooks/openclaw | OpenClaw plan/fix/approval |
| POST | /webhooks/stripe | Stripe events |

---

## 4. Webhook Akışları

### Cursor Webhook

1. Cursor agent işi bitirir → `POST /webhooks/cursor`
2. Orchestrator repo'yu clone/pull eder, verification çalıştırır
3. Hata varsa → fix prompt (OpenClaw veya OpenAI) → Cursor'a tekrar gönder
4. Başarılıysa → sonraki task veya `awaiting_approval`

### OpenClaw Webhook

1. **Plan**: `{ type: "plan", projectId, tasks }` → Cursor'a ilk task gönder
2. **Fix**: `{ type: "fix", projectId, fixPrompt }` → Cursor'a fix prompt ile tekrar gönder
3. **Approval**: Onay mesajı → EAS upload → `completed`

---

## 5. Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| CURSOR_API_KEY | Cursor Dashboard API anahtarı |
| CURSOR_WEBHOOK_SECRET | Webhook imza doğrulama |
| OPENCLAW_HOOKS_TOKEN | OpenClaw webhook auth |
| OPENCLAW_GATEWAY_URL | OpenClaw adresi |
| ORCHESTRATION_URL | Public URL (Vercel: https://www.shrimpbridge.com) |
| GITHUB_TOKEN | Private repo clone için |
| OPENAI_API_KEY | Fix prompt fallback |
| DATABASE_URL | PostgreSQL |
| API_KEYS | Virgülle ayrılmış API anahtarları |
| STRIPE_* | Stripe checkout |

---

## 6. Bağlantılar

- **Site:** https://www.shrimpbridge.com
- **GitHub:** https://github.com/buraksalli007/Shrimp
- **Local:** /Users/buraksalli/Desktop/SHRIMP/openclaw-cursor-orchestrator
