# Deployment Rehberi

## Production Build

```bash
npm run build
```

Bu komut `prisma generate`, backend (tsc) ve web dashboard'u derler. Çıktı:
- `dist/` - Backend (Node.js)
- `web/dist/` - Frontend (static)

## Çalıştırma

```bash
npm start
```

Server varsayılan olarak port 3000'de başlar. Web dashboard `http://localhost:3000` adresinde sunulur.

## Vercel Deployment

1. Projeyi Vercel'a bağla (GitHub repo)
2. **Settings > Environment Variables:** docs/VERCEL_ENV.md'deki tüm değişkenleri ekle
3. **DATABASE_URL:** Vercel Storage > Postgres > Connect > POSTGRES_URL
4. İlk deploy sonrası: `DATABASE_URL="postgres://..." npx prisma migrate deploy`
5. Cursor webhook: `https://www.shrimpbridge.com/webhooks/cursor`
6. OpenClaw public erişim: docs/OPENCLAW_NGROK.md

## Ortam Değişkenleri

Production için `.env` dosyasında:

- `CURSOR_API_KEY` - Cursor Dashboard > Integrations
- `CURSOR_WEBHOOK_SECRET` - Webhook imza doğrulama
- `OPENCLAW_HOOKS_TOKEN` - OpenClaw hooks token
- `OPENCLAW_GATEWAY_URL` - OpenClaw adresi (Vercel'da ngrok URL)
- `ORCHESTRATION_URL` - Public URL (Vercel: `https://www.shrimpbridge.com`)
- `GITHUB_TOKEN` - Private repo için
- `DATABASE_URL` - PostgreSQL (Vercel Postgres)
- `PORT` - Server port (varsayılan 3000)

## Webhook URL

- Cursor: `https://www.shrimpbridge.com/webhooks/cursor`
- OpenClaw: `https://www.shrimpbridge.com/webhooks/openclaw`
- Stripe: `https://www.shrimpbridge.com/webhooks/stripe`

## Geliştirme

**Backend:**
```bash
npm run dev
```

**Web (ayrı terminal):**
```bash
npm run dev:web
```

Web dev server port 5173'te çalışır, API istekleri proxy ile backend'e yönlendirilir.
