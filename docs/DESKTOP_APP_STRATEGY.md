# Shrimp Bridge → Cursor Benzeri Ürün Stratejisi

## Hedef Model

| Bileşen | Rol | Örnek (Cursor) |
|---------|-----|----------------|
| **Web sitesi** | Üyelik, ödeme, tanıtım, dokümantasyon | cursor.com |
| **Masaüstü uygulama** | Asıl iş: proje yönetimi, AI orkestrasyonu | Cursor IDE |

---

## Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WEB SİTESİ (cursor.com benzeri)                       │
│  • Landing, fiyatlandırma, özellikler                                        │
│  • Kayıt / Giriş (Auth)                                                      │
│  • Ödeme (Stripe) – Free / Starter / Pro                                     │
│  • Dokümantasyon, blog                                                       │
│  • Dashboard (sadece hesap, fatura, proje listesi)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ API key, session token
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MASAÜSTÜ UYGULAMA (Mac + Windows)                         │
│                    Shrimp Bridge Desktop                                      │
│                                                                              │
│  • Giriş / API key yönetimi                                                 │
│  • Proje oluşturma, yönetim                                                 │
│  • Task listesi, approval flow                                               │
│  • Cursor / OpenClaw entegrasyonu                                            │
│  • Gerçek zamanlı durum                                                      │
│  • Tray icon, bildirimler                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ REST API
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (mevcut orchestrator)                         │
│  • Express API                                                               │
│  • Stripe webhook                                                            │
│  • Auth / API key validation                                                 │
│  • Proje, task, memory, agent router                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Web Sitesi (Yeni / Ayrı)

### Teknoloji
- **Next.js** veya **Astro** – SEO, hızlı sayfa
- **Stripe** – Checkout, subscription
- **Auth** – Clerk, Supabase Auth veya **custom** (JWT + API key)

### Sayfalar
| Sayfa | URL | İçerik |
|------|-----|--------|
| Landing | `/` | Hero, özellikler, karşılaştırma, CTA |
| Fiyatlandırma | `/pricing` | Free / Starter / Pro, Stripe Checkout |
| Giriş | `/login` | Email + şifre veya OAuth |
| Kayıt | `/signup` | Kayıt + plan seçimi |
| Dashboard | `/dashboard` | Hesap, API key, fatura, proje listesi (sadece özet) |
| Dokümantasyon | `/docs` | Kurulum, API, kullanım |

### Ödeme Modeli
- **Free**: Aylık 3 proje, temel özellikler
- **Starter ($19/ay)**: 20 proje, Builder modu
- **Pro ($49/ay)**: Sınırsız proje, Autopilot, öncelikli destek

### Kullanıcı Verisi
- `users` tablosu, `subscriptions` (Stripe ile)
- Her kullanıcıya **API key** üretilir (dashboard’dan görüntülenir)
- Masaüstü uygulama bu API key ile backend’e bağlanır

---

## 2. Masaüstü Uygulama (Mac + Windows)

### Teknoloji Seçenekleri

| Seçenek | Avantaj | Dezavantaj |
|---------|---------|------------|
| **Electron** | Geniş ekosistem, React/Vue kolay | Büyük boyut (~150MB), bellek |
| **Tauri** | Küçük boyut (~15MB), hızlı, Rust | Daha az hazır, Rust backend |
| **Flutter** | Tek kod tabanı, güzel UI | Desktop desteği daha yeni |

**Öneri:** **Electron + React** – Hızlı geliştirme, mevcut web UI’ı kolayca taşınabilir.

### Tauri
- Daha küçük paket, daha az bellek
- Rust backend ile güvenli
- Cursor da Electron kullanıyor; Tauri alternatif olarak düşünülebilir

### Uygulama Özellikleri
1. **Giriş / Onboarding**
   - API key ile giriş (web’den alınan)
   - veya OAuth ile giriş (web’den token alınıp kullanılır)

2. **Ana Ekran**
   - Proje listesi (backend’den)
   - Yeni proje oluşturma
   - Idea, repo, branch, autonomy mode

3. **Proje Detay**
   - Task listesi, durum
   - Approve / retry
   - Memory (kararlar, hatalar, prompt’lar)

4. **Sistem**
   - Tray icon (minimize ederken)
   - Bildirimler (task tamamlandı, approval bekliyor)
   - Otomatik güncelleme (electron-updater)

5. **Ayarlar**
   - API key değiştirme
   - Cursor / OpenClaw credential’ları (BYOK)

### Paket Yapısı (Electron)
```
shrimp-desktop/
├── package.json
├── electron/
│   ├── main.ts          # Electron main process
│   ├── preload.ts
│   └── ipc.ts
├── src/
│   ├── App.tsx          # React UI (mevcut web’den taşınır)
│   ├── components/
│   ├── pages/
│   └── api.ts           # Backend API client
├── public/
└── resources/           # icon, installer
```

---

## 3. Backend (Mevcut)

- **Değişiklik yok** – API aynı kalır
- **Auth:** API key ile zaten `requireApiKey` middleware var
- **Stripe:** Starter/Pro price ID’leri ve webhook ayarları
- **Kullanıcı:** Web sitesi kullanıcı oluşturur → API key üretir → masaüstü bu key ile bağlanır

---

## 4. Uygulama Planı

### Faz 1: Web sitesi (2–3 hafta)
1. Next.js veya Astro ile landing + pricing
2. Auth (Clerk veya custom)
3. Stripe Checkout + webhook
4. Dashboard: API key, proje listesi

### Faz 2: Masaüstü uygulama (2–3 hafta)
1. Electron + React scaffold
2. Mevcut web UI’ı masaüstüne taşıma
3. API key ile giriş
4. Proje CRUD, start, approve, memory

### Faz 3: Entegrasyon
1. Tray, bildirimler
2. Otomatik güncelleme
3. Code signing (Mac: notarize, Windows: Authenticode)

### Faz 4: Yayın
1. Web: Vercel
2. Desktop: macOS (dmg), Windows (exe/msi)
3. Dağıtım: GitHub Releases, kendi site

---

## 5. Klasör Yapısı (Monorepo)

```
SHRIMP/
├── openclaw-cursor-orchestrator/   # Backend (mevcut)
├── shrimp-web/                     # Web sitesi (yeni)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
├── shrimp-desktop/                 # Masaüstü uygulama (yeni)
│   ├── electron/
│   ├── src/
│   └── package.json
├── packages/
│   └── shared/                     # Shared types, API client (opsiyonel)
└── docs/
```

---

## 6. Özet

| Önce | Sonra |
|------|-------|
| Web dashboard = ana arayüz | Web = marketing + ödeme + hesap |
| Tek proje | Desktop app = ana iş arayüzü |
| API key ile doğrudan | Üyelik → API key → Desktop’ta kullanım |

---

## Uygulama Durumu (Güncel)

- [x] **Backend** – Auth (register, login), API key, Stripe webhook, tier güncelleme
- [x] **Web sitesi** – Next.js landing, login, signup, dashboard, checkout
- [x] **Desktop** – Electron + React, API key giriş, proje yönetimi

Detaylı kurulum: `docs/FULL_STACK_SETUP.md`
