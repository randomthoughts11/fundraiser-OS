import { z } from "zod";

export const emailDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
  citations: z.array(
    z.object({
      sentence: z.string(),
      signalId: z.string().optional(),
      sourceUrl: z.string().optional(),
      confidence: z.number(),
    }),
  ),
});

export type EmailDraft = z.infer<typeof emailDraftSchema>;

export const emailDraftJsonSchema = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
    citations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sentence: { type: "string" },
          signalId: { type: "string" },
          sourceUrl: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["sentence", "confidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["subject", "body", "citations"],
  additionalProperties: false,
} as const;
