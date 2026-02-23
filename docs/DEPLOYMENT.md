# Deployment Rehberi

## Production Build

```bash
npm run build
```

Bu komut hem backend hem web dashboard'u derler. Çıktı:
- `dist/` - Backend (Node.js)
- `web/dist/` - Frontend (static)

## Çalıştırma

```bash
npm start
```

Server varsayılan olarak port 3000'de başlar. Web dashboard `http://localhost:3000` adresinde sunulur.

## Ortam Değişkenleri

Production için `.env` dosyasında:

- `CURSOR_API_KEY` - Cursor Dashboard > Integrations
- `OPENCLAW_HOOKS_TOKEN` - OpenClaw hooks token
- `ORCHESTRATION_URL` - Public URL (ngrok veya domain)
- `GITHUB_TOKEN` - Private repo için
- `PORT` - Server port (varsayılan 3000)

## Webhook URL

Cursor webhook için `ORCHESTRATION_URL` kullanılır. Örnek:
- Local: `ngrok http 3000` → `https://xxx.ngrok.io`
- Production: `https://orchestrator.example.com`

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
