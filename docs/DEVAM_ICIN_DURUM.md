# Devam İçin Durum Özeti

**Son güncelleme:** 24 Şubat 2025

---

## Tamamlananlar

### Adım 1: Stripe
- `.env.example` → `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID` eklendi
- `docs/ADIM_1_STRIPE.md` → Stripe Dashboard adımları (Starter $19, Pro $49)
- **Kullanıcı yapacak:** Stripe'da ürün oluştur, Price ID'leri `.env` ve Vercel'a ekle

### Adım 2: Database
- Prisma schema: `provider = "postgresql"` (SQLite kaldırıldı)
- `prisma.config.ts` → varsayılan `postgresql://shrimp:shrimp@localhost:5432/shrimp`
- `src/lib/db.ts` → PostgreSQL (PrismaBetterSqlite3 adapter kaldırıldı)
- `docs/ADIM_2_DB_MIGRATE.md` → Docker + migrate rehberi
- **Kullanıcı yapacak:** `docker compose up -d`, `DATABASE_URL` set, `npx prisma migrate deploy`

### Genel
- `docs/EKSIKLER_VE_ADIMLAR.md` güncellendi (Auth ✅, adım linkleri)
- Build başarılı, unit testler çalışıyor (1 test: POST /start API key gerektiriyor – mevcut)

---

## Bekleyen / Devam Edilecekler

### Öncelik sırasıyla:
1. **EAS Repo Clone** – `executeAppStoreUpload` repo yoksa GitHub'dan clone etmeli
2. **Usage tracking + Quota** – Plan bazlı limit kontrolü
3. **UserCredential persist** – Credential'ları DB'de saklama (UserCredential tablosu var)
4. **Gerçek E2E test** – Cursor + OpenClaw ile simülasyon dışı test
5. **shrimp-web** – Git remote ekle, push
6. **EKSIKLER doc** – ENCRYPTION_KEY, Cursor API key rehberi

### Teknik notlar
- `src/services/eas-controller.ts` → `repoPath = /tmp/orchestrator/{projectId}` – sunucu restart sonrası repo yok
- `src/memory/memory-store.ts` → `hasDb()` = `!!process.env.DATABASE_URL` – Postgres için DATABASE_URL zorunlu
- Test ortamında `DATABASE_URL` yoksa memory/project-persistence sessizce skip ediyor

---

## Proje Yapısı

```
SHRIMP/
├── openclaw-cursor-orchestrator/   # Ana repo (GitHub: buraksalli007/Shrimp)
│   ├── src/
│   ├── prisma/                     # PostgreSQL schema + migrations
│   ├── docs/                       # ADIM_1_STRIPE, ADIM_2_DB_MIGRATE, vb.
│   └── docker-compose.yml          # Postgres 16
├── shrimp-web/                     # Next.js site (git remote yok)
└── shrimp-desktop/                 # Electron app (git yok)
```

---

## Komutlar

```bash
# Local dev (Postgres gerekli)
docker compose up -d
DATABASE_URL=postgresql://shrimp:shrimp@localhost:5432/shrimp npm run dev

# Build
npm run build

# Test
npm test
npm run e2e:orch    # ORCHESTRATION_SIMULATION=true gerekli
npm run e2e:fix     # + SIMULATION_VERIFY_FAIL_COUNT=2
```

---

## Devam ederken kontrol edilecekler

1. Docker çalışıyor mu? (migrate için)
2. `.env` güncel mi? (DATABASE_URL, Stripe keys)
3. `docs/EKSIKLER_VE_ADIMLAR.md` – sıradaki madde hangisi?
