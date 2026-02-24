# OpenClaw – Ngrok ile Public Erişim

Orchestrator Vercel'da çalışıyorsa, OpenClaw'ın `localhost:18789` adresine erişemez. OpenClaw'ı internete açmak için ngrok kullanılır.

---

## Ücretsiz Ngrok

### 1. Kurulum

```bash
brew install ngrok
```

### 2. Hesap ve Token

1. https://ngrok.com → Ücretsiz hesap aç
2. Dashboard → Your Authtoken kopyala
3. `ngrok config add-authtoken SENIN_TOKEN`

### 3. Tünel Aç

OpenClaw çalışırken:

```bash
ngrok http 18789
```

Çıktıdaki `https://xxx.ngrok-free.app` URL'ini kopyala.

### 4. Vercel Environment Variable

- **OPENCLAW_GATEWAY_URL** = `https://xxx.ngrok-free.app`

**Not:** Ücretsiz planda her ngrok başlatışında URL değişir. Her seferinde Vercel'da güncellemen gerekir.

---

## Ücretli Ngrok (Sabit Domain)

### 1. Plan

https://ngrok.com/pricing → Personal veya Pro

### 2. Reserved Domain

1. https://dashboard.ngrok.com/cloud-edge/domains
2. Create Domain → Örn: `shrimp-openclaw.ngrok-free.app`

### 3. Tünel

```bash
ngrok http 18789 --domain=shrimp-openclaw.ngrok-free.app
```

### 4. Vercel

**OPENCLAW_GATEWAY_URL** = `https://shrimp-openclaw.ngrok-free.app`

Bir kez ayarla, URL değişmez.

---

## Kullanım Akışı

1. OpenClaw Gateway'i başlat
2. `ngrok http 18789` (veya `--domain=...` ile) çalıştır
3. Orchestrator (Vercel) artık OpenClaw'a erişebilir
