# Adım 2: Database Migration

Proje PostgreSQL kullanıyor. Local geliştirme için Docker, production için Vercel Postgres (veya benzeri) kullanılır.

---

## 2.1 Local Geliştirme (Docker)

1. **PostgreSQL başlat:**
   ```bash
   cd openclaw-cursor-orchestrator
   docker compose up -d
   ```

2. **`.env` dosyasında DATABASE_URL:**
   ```
   DATABASE_URL=postgresql://shrimp:shrimp@localhost:5432/shrimp
   ```

3. **Migration çalıştır:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Doğrulama:**
   ```bash
   npx prisma db pull  # Schema ile DB senkron mu kontrol
   npm run dev         # Sunucu başlamalı
   ```

---

## 2.2 Production (Vercel Postgres)

1. **Vercel Dashboard** → Project → **Storage** → **Create Database** → **Postgres**

2. **Connection string** kopyala (`.env` formatında gelir):
   ```
   DATABASE_URL=postgresql://...
   ```

3. **Vercel Environment Variables** ekle:
   - `DATABASE_URL` = kopyaladığınız connection string

4. **Migration (local'den Vercel DB'ye):**
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```
   (Vercel Postgres connection string'i buraya yapıştırın)

5. **Deploy** sonrası DB hazır.

---

## 2.3 Migration Komutları

| Komut | Açıklama |
|-------|----------|
| `npx prisma migrate deploy` | Bekleyen migration'ları uygular |
| `npx prisma migrate dev` | Yeni migration oluşturur (dev) |
| `npx prisma generate` | Prisma Client'ı yeniden üretir |
| `npx prisma studio` | DB'yi tarayıcıda görüntüler |

---

## 2.4 Sorun Giderme

**"Can't reach database server"**
- Docker çalışıyor mu: `docker ps`
- Port 5432 açık mı: `nc -zv localhost 5432`

**"Migration failed"**
- DB boş olmalı veya önceki migration'lar uygulanmış olmalı
- `npx prisma migrate resolve` ile migration durumunu düzeltin

---

## Sonraki Adım

DB tamamlandıktan sonra eksikler listesindeki sıradaki maddeye geçin (EAS repo clone, Usage tracking vb.).
