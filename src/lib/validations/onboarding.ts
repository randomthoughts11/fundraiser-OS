import { z } from "zod";

export const onboardingSchema = z.object({
  founderName: z.string().min(1),
  founderEmail: z.string().email(),
  companyName: z.string().min(1),
  oneLiner: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  sector: z.enum([
    "AI_INFRA",
    "B2B_SAAS",
    "FINTECH",
    "CLIMATE",
    "HEALTHCARE",
    "DEVTOOLS",
    "CYBERSECURITY",
    "DEFENSE_TECH",
    "CONSUMER",
    "MARKETPLACE",
    "DEEPTECH",
    "BIOTECH",
    "OTHER",
  ]),
  stage: z.enum(["IDEA", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B_PLUS"]),
  fundraiseMode: z.enum(["PRE_MARKET_READY", "MARKET_READY"]),
  geography: z.string().default("US"),
  targetAmount: z.number().min(100_000),
  instrument: z
    .enum(["SAFE", "PRICED_ROUND", "CONVERTIBLE_NOTE", "UNDECIDED"])
    .default("SAFE"),
  regExemption: z
    .enum(["RULE_506B", "RULE_506C", "REG_CF", "UNDECIDED"])
    .default("UNDECIDED"),
  competitors: z.array(z.string()).default([]),
  excludedInvestors: z.array(z.string()).default([]),
  hasCounsel: z.boolean().default(false),
  roundUnlocks: z.string().optional(),
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

export type OnboardingInput = z.infer<typeof onboardingSchema>;
