# Senkronizasyon Rehberi

Bu doküman, Shrimp Bridge projesinin **masaüstü**, **GitHub** ve **web sitesi** arasında nasıl senkron tutulacağını açıklar.

---

## Üç Nokta

| Konum | Yol / URL | Rol |
|-------|-----------|-----|
| **Masaüstü** | `/Users/buraksalli/Desktop/SHRIMP/openclaw-cursor-orchestrator` | Kaynak kod, geliştirme |
| **GitHub** | https://github.com/buraksalli007/Shrimp | Versiyon kontrolü, yedek |
| **Web sitesi** | https://www.shrimpbridge.com | Production deployment |

---

## Senkronizasyon Akışı

```
Masaüstü (değişiklik) → git push → GitHub → Vercel (otomatik deploy) → shrimpbridge.com
```

1. **Değişiklikler masaüstündeki projede yapılır**
2. **Git push** ile GitHub'a gönderilir
3. **Vercel** GitHub repo'ya bağlıysa, her push'ta otomatik deploy yapar
4. **shrimpbridge.com** güncel hale gelir

---

## Her Değişiklikten Sonra Yapılacaklar

```bash
cd /Users/buraksalli/Desktop/SHRIMP/openclaw-cursor-orchestrator

# 1. Değişiklikleri stage et
git add -A

# 2. Commit
git commit -m "Açıklayıcı commit mesajı"

# 3. GitHub'a push
git push origin main
```

**Not:** Vercel, `main` branch'ine push yapıldığında otomatik deploy tetikler.

---

## Vercel Bağlantısı

Vercel projesi GitHub repo'ya bağlı olmalı:

1. Vercel Dashboard → Project → Settings → Git
2. Connected Repository: `buraksalli007/Shrimp`
3. Production Branch: `main`
4. Environment Variables: `docs/VERCEL_ENV.md` dosyasına bak

---

## Özet Checklist

- [ ] Kod değişikliği masaüstü projede yapıldı
- [ ] `git add -A && git commit -m "..." && git push`
- [ ] GitHub'da commit görünüyor
- [ ] Vercel deploy tamamlandı (Vercel Dashboard'dan kontrol)
- [ ] shrimpbridge.com güncel
