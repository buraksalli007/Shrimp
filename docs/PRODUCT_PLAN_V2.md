# Shrimp Bridge – Ürün Planı v2 (Para Kazanma Odaklı)

## Pazar Araştırması Özeti

| Platform | Fiyat | Hedef |
|----------|-------|-------|
| **Cursor Pro** | $20/ay | Bireysel geliştirici |
| **Cursor Pro+** | $60/ay | Yoğun kullanım |
| **Bolt.new Pro** | $25/ay | Hızlı prototipleme |
| **Lovable/v0** | Ücretsiz–$25 | AI prototyping |
| **Replit** | Kullanım bazlı | İşbirlikçi kodlama |

**Shrimp Bridge konumu:** Cursor + OpenClaw’ı bir araya getiren orchestration katmanı. Kullanıcılar kendi Cursor ve OpenClaw hesaplarını bağlar; Shrimp Bridge entegrasyon ve otomasyon sağlar.

---

## Fiyatlandırma (Pazar Uyumlu)

| Tier | Fiyat | Proje/ay | Özellikler |
|------|-------|----------|------------|
| **Free** | $0 | 2 | Cursor bağlantısı, temel orchestration |
| **Starter** | $19/ay | 25 | + OpenClaw, GitHub entegrasyonu |
| **Pro** | $49/ay | Sınırsız | + Vibecode, öncelikli işlem, API |
| **Enterprise** | Özel | Özel | SLA, özel entegrasyonlar |

**Gerekçe:** Cursor $20, Bolt $25 seviyesinde. Shrimp Bridge orchestration katmanı olarak $19–49 aralığı rekabetçi ve değer odaklı.

---

## Kullanıcı Akışı (Cursor ile Başlangıç)

1. **Kayıt** → Email veya OAuth
2. **Cursor bağlantısı** → Kullanıcı Cursor API key girer
3. **Platform seçimi** → Cursor ✓, GitHub (repo), Vibecode (ileride)
4. **Proje başlat** → Idea + GitHub repo → Orchestrator çalışır
5. **Ödeme** → Free tier veya abonelik

---

## Teknik Değişiklikler

### 1. Kullanıcı Credential’ları
- Her kullanıcı kendi Cursor API key’ini saklar
- Opsiyonel: OpenClaw token, GitHub token
- Şifreleme: En azından DB’de hash veya encrypt

### 2. Platform Seçimi
- **Cursor** (zorunlu): API key ile bağlantı
- **GitHub**: Repo erişimi (kullanıcı token veya public repo)
- **Vibecode**: İleride template seçimi

### 3. Orchestration Güncellemesi
- Proje başlatırken kullanıcının credential’ları kullanılır
- Admin/global key’ler fallback olarak kalabilir

---

## Eksiklikler ve Gereksinimler

### Zorunlu (Tam Çalışma İçin)
1. **Kullanıcı auth** – Kayıt/giriş (email+şifre veya OAuth)
2. **Credential storage** – Cursor key, OpenClaw token DB’de
3. **Credential UI** – Ayarlar sayfası, key girişi
4. **Per-user orchestration** – Proje başlatırken user credential kullanımı

### Önerilen
5. **Stripe Products** – Free/Starter/Pro planları
6. **Usage tracking** – Proje sayısı, kota kontrolü
7. **Vibecode template** – Platform seçiminde template

### İleride
8. **OAuth (Google/GitHub)** – Daha kolay giriş
9. **Team/organization** – Kurumsal kullanım
