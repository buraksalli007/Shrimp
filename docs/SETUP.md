# Shrimp Bridge – Production Setup

Bu dokümanda Shrimp Bridge’i production ortamında çalıştırmak için gereken tüm API anahtarları ve bağlantılar listelenir.

---

## 1. Zorunlu (Core)

### Cursor API
- **CURSOR_API_KEY** – Cursor Dashboard > Integrations’dan alınır. Cloud Agent başlatmak için gerekli.
- **CURSOR_WEBHOOK_SECRET** – Webhook imza doğrulaması için (min 32 karakter).

### Orchestration URL
- **ORCHESTRATION_URL** – Public URL (örn. `https://www.shrimpbridge.com`). Cursor webhook’larının bu adrese gelmesi için.

---

## 2. Önerilen (OpenClaw)

### OpenClaw
- **OPENCLAW_HOOKS_TOKEN** – OpenClaw gateway’e mesaj göndermek ve webhook doğrulaması için.
- **OPENCLAW_GATEWAY_URL** – Varsayılan: `http://127.0.0.1:18789`. Production’da OpenClaw gateway adresi.

---

## 3. GitHub & Verification

### GitHub
- **GITHUB_TOKEN** – Private repo clone için. `ghp_` veya `github_pat_` ile başlar.

---

## 4. LLM (Fix Prompt)

### OpenAI
- **OPENAI_API_KEY** – Verification hatalarında fix prompt üretmek için. `sk-` ile başlar.

---

## 5. Monetization (Stripe)

### Stripe
- **STRIPE_SECRET_KEY** – `sk_live_` veya `sk_test_`
- **STRIPE_WEBHOOK_SECRET** – `whsec_` (Stripe Dashboard > Webhooks)
- **STRIPE_STARTER_PRICE_ID** – Starter plan price ID (`price_`)
- **STRIPE_PRO_PRICE_ID** – Pro plan price ID (`price_`)

### API Keys (Ücretli Erişim)
- **API_KEYS** – Virgülle ayrılmış geçerli API anahtarları. Örn: `key1,key2,key3`  
  Boş bırakılırsa demo modu (auth yok).

---

## 6. Opsiyonel

### CORS
- **CORS_ORIGIN** – İzin verilen origin. Varsayılan: `*`. Production’da `https://www.shrimpbridge.com` önerilir.

### Database
- **DATABASE_URL** – SQLite: `file:./prisma/dev.db`. Postgres: `postgresql://user:pass@host:5432/db`

### Diğer
- **NODE_ENV** – `production` veya `development`
- **PORT** – Varsayılan: 3000
- **MAX_ITERATIONS** – Task başına max retry (varsayılan: 10)
- **VERIFICATION_TIMEOUT_MS** – Verification timeout (varsayılan: 120000)

---

## .env Örneği (Production)

```env
NODE_ENV=production
PORT=3000

# Core
CURSOR_API_KEY=cur_xxx
CURSOR_WEBHOOK_SECRET=your_32_char_secret
ORCHESTRATION_URL=https://www.shrimpbridge.com

# OpenClaw
OPENCLAW_HOOKS_TOKEN=your_token
OPENCLAW_GATEWAY_URL=https://your-openclaw-gateway

# GitHub
GITHUB_TOKEN=ghp_xxx

# LLM
OPENAI_API_KEY=sk-xxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx

# API Keys (virgülle ayır)
API_KEYS=sk_live_xxx,sk_live_yyy
```

---

## Vercel Environment Variables

Vercel Dashboard > Project > Settings > Environment Variables:

Yukarıdaki tüm değişkenleri ekleyin. `DATABASE_URL` için SQLite yerine Vercel Postgres veya external Postgres kullanın.

---

## Webhook URL’leri

- **Cursor:** `https://www.shrimpbridge.com/webhooks/cursor`
- **OpenClaw:** `https://www.shrimpbridge.com/webhooks/openclaw`
- **Stripe:** `https://www.shrimpbridge.com/webhooks/stripe`

Stripe webhook’ta `checkout.session.completed`, `customer.subscription.*`, `invoice.*` event’lerini seçin.
