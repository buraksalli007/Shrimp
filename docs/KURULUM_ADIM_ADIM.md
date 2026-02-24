# Shrimp Bridge – Adım Adım Kurulum Rehberi

Web sitesinin tam çalışması için Stripe, OpenClaw ve ngrok kurulumu.

---

## Genel Bakış

| Bileşen | Amaç |
|---------|------|
| **Stripe** | Ödeme (checkout, abonelik) |
| **OpenClaw** | Planlama, fix prompt, onay bildirimi |
| **ngrok** | OpenClaw'ı internete açmak (Vercel'dan erişilebilir yapmak) |

**Not:** Site Vercel'da (shrimpbridge.com) çalışıyor. Stripe webhook'ları doğrudan siteye gider – ngrok gerekmez. ngrok sadece **OpenClaw Gateway** için gerekli (OpenClaw senin bilgisayarında çalışıyor, Vercel ona ulaşamıyor).

---

## BÖLÜM 1: Stripe Kurulumu

### Adım 1.1 – Stripe Hesabı

1. https://dashboard.stripe.com → Hesap aç veya giriş yap
2. **Test modu** ile başla (sağ üstte "Test mode" açık olsun)

### Adım 1.2 – API Anahtarları

1. Stripe Dashboard → **Developers** → **API keys**
2. **Secret key** kopyala (`sk_test_...` veya `sk_live_...`)
3. Bu değeri sakla → `.env` ve Vercel için `STRIPE_SECRET_KEY`

### Adım 1.3 – Ürün ve Fiyat Oluşturma

1. Stripe Dashboard → **Products** → **Add product**
2. **Starter** planı:
   - Name: `Starter`
   - Price: `$29` / month (recurring)
   - Kaydet → **Price ID** kopyala (`price_...`) → `STRIPE_STARTER_PRICE_ID`
3. **Pro** planı:
   - Name: `Pro`
   - Price: `$99` / month (recurring)
   - Kaydet → **Price ID** kopyala → `STRIPE_PRO_PRICE_ID`

### Adım 1.4 – Webhook Endpoint

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL:** `https://www.shrimpbridge.com/webhooks/stripe`
3. **Events to send:** Şunları seç:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. **Add endpoint** → **Signing secret** kopyala (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

### Adım 1.5 – Vercel'a Stripe Değişkenlerini Ekle

Vercel Dashboard → Project → **Settings** → **Environment Variables**:

| Key | Value |
|-----|-------|
| STRIPE_SECRET_KEY | sk_test_... veya sk_live_... |
| STRIPE_WEBHOOK_SECRET | whsec_... |
| STRIPE_STARTER_PRICE_ID | price_... |
| STRIPE_PRO_PRICE_ID | price_... |

---

## BÖLÜM 2: OpenClaw Kurulumu

### Adım 2.1 – OpenClaw Kurulu mu?

OpenClaw'ın kurulu ve çalışır durumda olduğundan emin ol. Gateway port: **18789**.

### Adım 2.2 – Hooks Token Oluştur

1. OpenClaw config: `~/.openclaw/openclaw.json`
2. Hooks bölümünde `token` değeri → bu senin `OPENCLAW_HOOKS_TOKEN` değerin
3. Yoksa rastgele güçlü bir token oluştur (örn. `openssl rand -hex 32`)
4. Config'e ekle:

```json
{
  "hooks": {
    "enabled": true,
    "token": "BURAYA_OLUSTURDUGUN_TOKEN",
    "path": "/hooks",
    "allowedAgentIds": ["main"]
  }
}
```

### Adım 2.3 – Vercel'a OpenClaw Değişkenlerini Ekle

| Key | Value |
|-----|-------|
| OPENCLAW_HOOKS_TOKEN | (Adım 2.2'deki token) |

---

## BÖLÜM 3: ngrok Kurulumu (OpenClaw için)

OpenClaw senin bilgisayarında `localhost:18789`'da çalışıyor. Vercel (bulut) localhost'a erişemez. ngrok ile OpenClaw'ı internete açarız.

### Adım 3.1 – ngrok Kur

```bash
brew install ngrok
```

### Adım 3.2 – ngrok Hesabı ve Token

1. https://ngrok.com → Ücretsiz hesap aç
2. Dashboard → **Your Authtoken** kopyala
3. Terminalde:

```bash
ngrok config add-authtoken SENIN_AUTHTOKEN
```

### Adım 3.3 – OpenClaw'ı Başlat

OpenClaw'ın çalıştığından emin ol (port 18789).

### Adım 3.4 – ngrok Tüneli Aç

Yeni bir terminalde:

```bash
ngrok http 18789
```

Çıktıda şöyle bir satır göreceksin:

```
Forwarding   https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:18789
```

**Bu URL'i kopyala** → `OPENCLAW_GATEWAY_URL`

### Adım 3.5 – Vercel'a OPENCLAW_GATEWAY_URL Ekle

Vercel Dashboard → Environment Variables:

| Key | Value |
|-----|-------|
| OPENCLAW_GATEWAY_URL | https://xxxx.ngrok-free.app (ngrok çıktısındaki URL) |

**Önemli:** Ücretsiz ngrok'ta her `ngrok http 18789` çalıştırdığında URL değişir. Her seferinde Vercel'da güncellemen gerekir.

**Sabit URL için:** ngrok ücretli planda "Reserved Domain" al, örn. `shrimp-openclaw.ngrok-free.app`. Sonra `ngrok http 18789 --domain=shrimp-openclaw.ngrok-free.app` kullan.

---

## BÖLÜM 4: Özet – Senden İhtiyacım Olan Bilgiler

Kurulumu tamamlamak için aşağıdakileri hazırla. **Hassas bilgileri buraya yazma** – sadece nereden alacağını biliyorum. Kendi .env ve Vercel ayarlarına ekleyeceksin.

### Stripe
- [ ] STRIPE_SECRET_KEY (Stripe Dashboard > API keys)
- [ ] STRIPE_WEBHOOK_SECRET (Webhooks > Add endpoint > Signing secret)
- [ ] STRIPE_STARTER_PRICE_ID (Products > Starter > Price ID)
- [ ] STRIPE_PRO_PRICE_ID (Products > Pro > Price ID)

### OpenClaw
- [ ] OPENCLAW_HOOKS_TOKEN (openclaw.json hooks.token veya kendin oluştur)

### ngrok
- [ ] ngrok kuruldu, authtoken eklendi
- [ ] OpenClaw çalışıyor (port 18789)
- [ ] `ngrok http 18789` çalıştırıldı
- [ ] OPENCLAW_GATEWAY_URL = ngrok çıktısındaki https://... URL

### Vercel (tümü)
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] STRIPE_STARTER_PRICE_ID
- [ ] STRIPE_PRO_PRICE_ID
- [ ] OPENCLAW_HOOKS_TOKEN
- [ ] OPENCLAW_GATEWAY_URL
- [ ] ORCHESTRATION_URL = https://www.shrimpbridge.com (zaten olmalı)
- [ ] CURSOR_API_KEY, CURSOR_WEBHOOK_SECRET (proje başlatma için)
- [ ] DATABASE_URL (Vercel Postgres)

---

## Çalışma Sırası (Her Gün / Her Oturum)

1. **OpenClaw**'ı başlat
2. **ngrok** çalıştır: `ngrok http 18789`
3. URL değiştiyse Vercel'da `OPENCLAW_GATEWAY_URL` güncelle
4. Site hazır: https://www.shrimpbridge.com

Stripe ve Cursor webhook'ları doğrudan shrimpbridge.com'a gider – ngrok gerekmez.
