# Vercel Environment Variables

`.env` dosyası git'e push edilmez. Vercel'da çalışması için bu değişkenleri **Vercel Dashboard > Project > Settings > Environment Variables** bölümüne ekle.

## .env'deki değerleri kopyala

Masaüstündeki projede `.env` dosyasında zaten doldurduğun değerleri Vercel'a ekle:

| Vercel Key | .env'deki değer |
|------------|-----------------|
| CURSOR_API_KEY | (mevcut) |
| CURSOR_WEBHOOK_SECRET | (mevcut) |
| OPENCLAW_HOOKS_TOKEN | (mevcut) |
| OPENCLAW_GATEWAY_URL | Ngrok URL (örn. `https://xxx.ngrok-free.app`) – bkz. docs/OPENCLAW_NGROK.md |
| OPENAI_API_KEY | (mevcut) |
| ORCHESTRATION_URL | **https://www.shrimpbridge.com** (Vercel için bunu kullan) |
| GITHUB_TOKEN | (private repo için) |
| DATABASE_URL | Vercel Storage > Postgres > Connect > POSTGRES_URL |

**Önemli:** Vercel'da `ORCHESTRATION_URL` mutlaka `https://www.shrimpbridge.com` olmalı (localhost değil).

**Migration:** İlk deploy sonrası `DATABASE_URL` ile `npx prisma migrate deploy` çalıştırılmalı
