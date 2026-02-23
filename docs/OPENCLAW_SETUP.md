# OpenClaw Konfigürasyonu

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
