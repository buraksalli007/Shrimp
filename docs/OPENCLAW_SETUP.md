# OpenClaw Konfigürasyonu

## Güvenlik

- **OPENCLAW_HOOKS_TOKEN** zorunludur (min 16 karakter). Tanımlı değilse webhook 503 döner.
- Token `Authorization: Bearer <token>` veya `X-OpenClaw-Token: <token>` header ile gönderilir.
- Timing-safe karşılaştırma kullanılır; token tahmin saldırılarına karşı korunur.
- Gateway URL sadece `http`/`https` kabul edilir; internal IP (192.168.x, 10.x) bloklanır (SSRF koruması).

## Hooks Ayarı

`~/.openclaw/openclaw.json` dosyasına ekleyin:

```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    path: "/hooks",
    allowedAgentIds: ["main"],
    defaultSessionKey: "hook:orchestrator",
  },
}
```

## Orchestrator Webhook Mapping (Opsiyonel)

Kullanıcı "onay" yazdığında OpenClaw'ın orchestrator'a POST atması için `hooks.mappings` eklenebilir:

```json5
{
  hooks: {
    mappings: {
      "orchestrator-approve": {
        match: { source: "orchestrator-approve" },
        action: "agent",
        message: "{{message}}",
        name: "OrchestratorApprove",
        deliver: false,
      },
    },
  },
}
```

Bu mapping, harici bir sistemden `POST /hooks/orchestrator-approve` ile tetiklenebilir.

## Skill / Rule Önerisi

OpenClaw agent'ına eklenebilecek kural:

"Orchestrator servisinden gelen mesajları işle. Kullanıcı 'onay' veya 'onaylıyorum' yazdığında, mesajda geçen projectId ile birlikte orchestrator'ın /webhooks/openclaw endpoint'ine POST at."

Bu, OpenClaw'ın kendi webhook veya tool'u ile yapılandırılabilir.
