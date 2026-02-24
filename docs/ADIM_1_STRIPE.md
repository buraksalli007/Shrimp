# Adım 1: Stripe Price ID Kurulumu

Ödeme akışının çalışması için Stripe Dashboard'da ürün oluşturup Price ID'leri almanız gerekiyor.

---

## 1.1 Stripe Hesabı

1. https://dashboard.stripe.com adresine gidin
2. Giriş yapın veya hesap açın
3. **Test modu** ile başlayın (sağ üstte "Test mode" açık olsun)

---

## 1.2 Starter Planı Oluşturma

1. **Products** → **Add product**
2. **Name:** `Starter`
3. **Description:** (opsiyonel) `Shrimp Bridge Starter plan`
4. **Pricing:**
   - **One time** yerine **Recurring** seçin
   - **Monthly** seçin
   - **Price:** `19` USD
5. **Save product**
6. Oluşan **Price** satırındaki **Price ID**'yi kopyalayın (`price_1ABC...` formatında)
7. Bu değeri `.env` dosyanıza ekleyin: `STRIPE_STARTER_PRICE_ID=price_xxx`

---

## 1.3 Pro Planı Oluşturma

1. **Products** → **Add product**
2. **Name:** `Pro`
3. **Pricing:**
   - **Recurring** → **Monthly**
   - **Price:** `49` USD
4. **Save product**
5. **Price ID** kopyalayın
6. `.env` dosyanıza ekleyin: `STRIPE_PRO_PRICE_ID=price_xxx`

---

## 1.4 .env Güncellemesi

`.env` dosyanızda şu satırlar olmalı:

```
STRIPE_SECRET_KEY=sk_test_...       # Developers > API keys > Secret key
STRIPE_WEBHOOK_SECRET=whsec_...     # Developers > Webhooks > Signing secret
STRIPE_STARTER_PRICE_ID=price_xxx   # Yukarıda kopyaladığınız Starter Price ID
STRIPE_PRO_PRICE_ID=price_xxx       # Yukarıda kopyaladığınız Pro Price ID
```

---

## 1.5 Vercel (Production) İçin

shrimpbridge.com Vercel'da host ediliyorsa:

1. Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. Her bir değişkeni ekleyin (Production, Preview, Development için)
3. Deploy sonrası değişkenler aktif olur

---

## 1.6 Doğrulama

Checkout endpoint'i Price ID olmadan 501 döner. Ekledikten sonra:

```bash
curl -X POST http://localhost:3000/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"priceId": "price_xxx"}'
```

`url` dönerse Stripe Checkout sayfasına yönlendirme başarılı demektir.

---

## Sonraki Adım

Stripe tamamlandıktan sonra: [Adım 2: Database Migration](ADIM_2_DB_MIGRATE.md)
