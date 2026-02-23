# OpenClaw-Cursor Orchestrator

OpenClaw ile Cursor Cloud Agents arasında köprü kuran, fikirden App Store'a kadar tam otomatik uygulama geliştirme döngüsünü yöneten orchestration servisi.

## Akış

```
Fikir → OpenClaw (araştırma, plan) → Cursor (kod) → Webhook → Doğrulama
  → Hata varsa: Fix prompt → Cursor → Döngü
  → Hata yoksa: Sonraki task veya Onay Bekliyor
  → Kullanıcı onayı → EAS → App Store
```

## Kurulum

1. `.env.example` → `.env` kopyala, değerleri doldur
2. `npm install`
3. `npm run build`
4. `npm start`

Local webhook için: `ngrok http 3000` çalıştır, `ORCHESTRATION_URL` olarak ngrok URL'ini kullan.

## Ortam Değişkenleri

`.env.example` dosyasına bak. Tam akış için: `CURSOR_API_KEY`, `OPENCLAW_HOOKS_TOKEN`. Opsiyonel: `OPENAI_API_KEY`, `GITHUB_TOKEN`.

## API

- `GET /health` - Sağlık kontrolü
- `POST /start` - Proje başlat: `{ "idea": "...", "githubRepo": "owner/repo", "tasks": [...] }`
- `GET /projects` - Proje listesi
- `GET /projects/:id` - Proje detayı
- `POST /approve` - Onay: `{ "projectId": "..." }`
- `POST /webhooks/cursor` - Cursor webhook (agent bittiğinde)
- `POST /webhooks/openclaw` - OpenClaw onay webhook

Detaylı API: [docs/API.md](docs/API.md)

## Web Dashboard

Proje build edildikten sonra `npm start` ile çalıştırıldığında web arayüzü `http://localhost:3000` adresinde sunulur. Proje başlatma, listeleme ve onay işlemleri web üzerinden yapılabilir.
