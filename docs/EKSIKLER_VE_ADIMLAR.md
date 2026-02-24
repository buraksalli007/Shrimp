# Tam Çalışma İçin Eksiklikler ve Adımlar

## Yapılanlar ✅

- Kullanıcı kendi Cursor ve OpenClaw credential'larını girebiliyor
- Platform seçimi: Cursor, Vibecode
- Fiyatlandırma güncellendi (Free $0, Starter $19, Pro $49)
- Per-user credentials ile orchestration çalışıyor
- Auth: Kayıt, giriş, API key (register, login, me, keys)
- PostgreSQL + Prisma migrate desteği

---

## Adım Adım Rehberler

| Adım | Dosya | Açıklama |
|------|-------|----------|
| 1 | [ADIM_1_STRIPE.md](ADIM_1_STRIPE.md) | Stripe Price ID kurulumu |
| 2 | [ADIM_2_DB_MIGRATE.md](ADIM_2_DB_MIGRATE.md) | Database migration (Docker + Vercel) |

---

## Senden İhtiyaç Duyulanlar (Adım Adım)

### 1. Stripe Ürünleri (Ödeme için)

Stripe Dashboard'da şu ürünleri oluştur:

| Plan | Fiyat | Price ID |
|------|-------|----------|
| Starter | $19/ay | price_xxx |
| Pro | $49/ay | price_xxx |

**Adımlar:**
1. stripe.com → Products → Add product
2. Starter: $19/month recurring → Price ID kopyala
3. Pro: $49/month recurring → Price ID kopyala
4. Vercel'a ekle: STRIPE_STARTER_PRICE_ID, STRIPE_PRO_PRICE_ID

---

### 2. Kullanıcı Kayıt/Giriş (Auth) ✅

- [x] Kayıt: `POST /auth/register` (email + şifre)
- [x] Giriş: `POST /auth/login` (API key döner)
- [x] Me: `GET /auth/me` (API key ile)
- [x] API key yönetimi: `POST /auth/keys`, `GET /auth/keys`, `DELETE /auth/keys/:keyId`
- [ ] Credential'ları DB'de şifreli saklama (UserCredential tablosu var, ENCRYPTION_KEY ile)

---

### 3. Cursor API Key Alma

Kullanıcılar kendi Cursor key'lerini nereden alacak:

1. cursor.com → Dashboard
2. Settings → Integrations
3. API key oluştur

**Bilgi:** Dashboard'da bu linki göster: https://cursor.com/settings (veya API key sayfası)

---

### 4. OpenClaw Token

Kullanıcılar OpenClaw kullanacaksa:

- [ ] OpenClaw kurulu ve çalışıyor
- [ ] `~/.openclaw/openclaw.json` içinde hooks.token
- [ ] ngrok ile gateway URL (kendi ngrok'ları veya senin sağladığın)

---

### 5. Database Migration

Prisma schema güncellendi. Migration çalıştır:

```bash
cd openclaw-cursor-orchestrator
npx prisma migrate deploy
```

(Vercel Postgres için DATABASE_URL gerekli)

---

### 6. ENCRYPTION_KEY (Opsiyonel)

Credential'ları DB'de şifreli saklamak için:

Vercel'a ekle: `ENCRYPTION_KEY` = rastgele 32+ karakter

---

## Özet Checklist

- [ ] Stripe Starter + Pro price ID'leri → [ADIM_1_STRIPE.md](ADIM_1_STRIPE.md)
- [x] Auth (kayıt/giriş)
- [ ] Prisma migrate deploy → [ADIM_2_DB_MIGRATE.md](ADIM_2_DB_MIGRATE.md)
- [ ] ENCRYPTION_KEY (DB credential storage için)
- [ ] Cursor API key alma sayfası linki (docs)
