# Shrimp Bridge – Sana İhtiyacım Olan Bağlantılar ve API Anahtarları

Uygulamanın tam çalışması için aşağıdaki değerleri sağlaman gerekiyor. Bunları `.env` dosyasına ekleyeceksin (veya Vercel Environment Variables).

---

## Zorunlu (Core – Projeyi Çalıştırmak İçin)

| Değişken | Nereden Alınır | Açıklama |
|----------|----------------|----------|
| **CURSOR_API_KEY** | Cursor Dashboard > Integrations | Cloud Agent başlatmak için |
| **CURSOR_WEBHOOK_SECRET** | Kendin oluştur (min 32 karakter) | Webhook güvenliği |
| **ORCHESTRATION_URL** | `https://www.shrimpbridge.com` | Public URL (Vercel deployment) |

---

## Önerilen (OpenClaw Entegrasyonu)

| Değişken | Nereden Alınır | Açıklama |
|----------|----------------|----------|
| **OPENCLAW_HOOKS_TOKEN** | OpenClaw Gateway ayarları | Plan ve fix callback’leri için |
| **OPENCLAW_GATEWAY_URL** | OpenClaw kurulumu | Varsayılan: `http://127.0.0.1:18789` |

---

## GitHub (Private Repo İçin)

| Değişken | Nereden Alınır | Açıklama |
|----------|----------------|----------|
| **GITHUB_TOKEN** | GitHub > Settings > Developer settings > Personal access tokens | Repo clone için |

---

## LLM (Fix Prompt Üretimi)

| Değişken | Nereden Alınır | Açıklama |
|----------|----------------|----------|
| **OPENAI_API_KEY** | platform.openai.com > API keys | Verification hatalarında fix prompt |

---

## Para Kazanma (Stripe)

| Değişken | Nereden Alınır | Açıklama |
|----------|----------------|----------|
| **STRIPE_SECRET_KEY** | Stripe Dashboard > Developers > API keys | `sk_live_` veya `sk_test_` |
| **STRIPE_WEBHOOK_SECRET** | Stripe Dashboard > Webhooks > Add endpoint | `whsec_` |
| **STRIPE_STARTER_PRICE_ID** | Stripe > Products > Starter plan > Price | `price_` |
| **STRIPE_PRO_PRICE_ID** | Stripe > Products > Pro plan > Price | `price_` |

---

## API Anahtarları (Ücretli Erişim)

| Değişken | Açıklama |
|----------|----------|
| **API_KEYS** | Virgülle ayrılmış geçerli anahtarlar. Örn: `key1,key2` |

Boş bırakırsan demo modu (auth yok) çalışır.

---

## Özet – Minimum Çalıştırma İçin

```
CURSOR_API_KEY=cur_xxx
CURSOR_WEBHOOK_SECRET=32_karakter_minimum_secret
ORCHESTRATION_URL=https://www.shrimpbridge.com
```

Bu üçü ile proje başlatılabilir. OpenClaw, GitHub, OpenAI ve Stripe ekledikçe özellikler artar.
