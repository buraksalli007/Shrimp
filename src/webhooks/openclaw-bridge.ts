import { sendToOpenClaw } from "../api/openclaw-api.js";

const PLAN_PROMPT = `Bu uygulama fikrini araştır (Brave Search ile), detaylı planla ve JSON formatında task listesi oluştur.
Her task için: { "id": "task_1", "title": "Başlık", "description": "Açıklama", "prompt": "Cursor agent'a verilecek talimat" }.
prompt alanı Expo/React Native geliştirirken kullanılacak, net ve uygulanabilir olmalı.
Sadece JSON array döndür, başka metin ekleme.`;

export async function requestPlanFromOpenClaw(idea: string): Promise<void> {
  await sendToOpenClaw({
    message: `${PLAN_PROMPT}\n\nFikir: ${idea}`,
    name: "Orchestrator",
    timeoutSeconds: 180,
  });
}
