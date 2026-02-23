import { z } from "zod";

export const startRequestSchema = z.object({
  idea: z.string().min(1, "idea is required").max(2000),
  githubRepo: z.string().min(1, "githubRepo is required").max(500),
  branch: z.string().max(100).optional().default("main"),
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
});

export const approveRequestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
});

export type StartRequestValidated = z.infer<typeof startRequestSchema>;
export type ApproveRequestValidated = z.infer<typeof approveRequestSchema>;
