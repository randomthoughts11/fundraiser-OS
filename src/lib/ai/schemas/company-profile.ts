import { z } from "zod";

export const companyProfileSchema = z.object({
  oneLiner: z.string().optional(),
  description: z.string().optional(),
  sector: z.string().optional(),
  stage: z.string().optional(),
  competitors: z.array(z.string()).default([]),
  teamBackground: z.string().optional(),
  roundAsk: z.number().optional(),
  narrativeHooks: z.array(z.string()).default([]),
  weakSlides: z.array(z.string()).default([]),
  metrics: z
    .array(
      z.object({
        key: z.string(),
        value: z.number().optional(),
        valueText: z.string().optional(),
        unit: z.string().optional(),
      }),
    )
    .default([]),
});

export type CompanyProfile = z.infer<typeof companyProfileSchema>;

export const companyProfileJsonSchema = {
  type: "object",
  properties: {
    oneLiner: { type: "string" },
    description: { type: "string" },
    sector: { type: "string" },
    stage: { type: "string" },
    competitors: { type: "array", items: { type: "string" } },
    teamBackground: { type: "string" },
    roundAsk: { type: "number" },
    narrativeHooks: { type: "array", items: { type: "string" } },
    weakSlides: { type: "array", items: { type: "string" } },
    metrics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "number" },
          valueText: { type: "string" },
          unit: { type: "string" },
        },
        required: ["key"],
        additionalProperties: false,
      },
    },
  },
  required: ["competitors", "narrativeHooks", "weakSlides", "metrics"],
  additionalProperties: false,
} as const;
