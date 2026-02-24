import { z } from "zod";

export const startRequestSchema = z.object({
  idea: z.string().min(1, "idea is required").max(2000),
  githubRepo: z.string().min(1, "githubRepo is required").max(500),
  branch: z.string().max(100).optional().default("main"),
  platform: z.enum(["cursor", "vibecode"]).optional().default("cursor"),
  autonomyMode: z.enum(["assist", "builder", "autopilot"]).optional().default("builder"),
  tasks: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        prompt: z.string().min(1).optional(),
      })
    )
    .optional(),
  credentials: z
    .object({
      cursorApiKey: z.string().optional(),
      cursorWebhookSecret: z.string().optional(),
      openclawToken: z.string().optional(),
      openclawGatewayUrl: z.string().optional(),
      githubToken: z.string().optional(),
    })
    .optional(),
});

export const approveRequestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
});

export type StartRequestValidated = z.infer<typeof startRequestSchema>;
export type ApproveRequestValidated = z.infer<typeof approveRequestSchema>;
