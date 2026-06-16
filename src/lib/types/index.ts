import type {
  CompanyStage,
  FundraiseMode,
  InvestorBucket,
  ReadinessVerdict,
  Sector,
} from "@/generated/prisma/client";

export type ReadinessReport = {
  score: number;
  verdict: ReadinessVerdict;
  targetInvestorCategory: string;
  likelyCheckSizeRange: { min: number; max: number };
  missingEvidence: string[];
  weaknesses: string[];
  narrativeRecommendation: string;
  milestonesBeforeOutreach: string[];
  deckProblems: string[];
  investorQuestions: string[];
};

export type MatchExplanation = {
  reasons: Array<{
    text: string;
    sourceUrl?: string;
    sourceDate?: string;
    confidence: number;
    snippet?: string;
  }>;
  whyNow: Array<{
    signal: string;
    sourceUrl?: string;
    observedAt?: string;
  }>;
  suggestedAngle: string;
  bestContactPath?: string;
  potentialConcern?: string;
};

export type InvestorMatchResult = {
  firmId: string;
  firmName: string;
  personId?: string;
  personName?: string;
  fitScore: number;
  accessScore: number;
  timingScore: number;
  confidenceScore: number;
  conflictRisk: number;
  priorityScore: number;
  bucket: InvestorBucket;
  explanation: MatchExplanation;
};

export type CompanyProfileInput = {
  name: string;
  oneLiner?: string;
  description?: string;
  website?: string;
  sector: Sector;
  stage: CompanyStage;
  geography?: string;
  fundraiseMode: FundraiseMode;
  targetAmount: number;
  instrument?: string;
  regExemption?: string;
  competitors?: string[];
  excludedInvestors?: string[];
  metrics?: Array<{ key: string; value?: number; valueText?: string; unit?: string }>;
  teamBackground?: string;
  existingInvestors?: string[];
  targetInvestorType?: string;
  priorOutreach?: unknown;
  hasCounsel?: boolean;
  roundUnlocks?: string;
};

export const SECTOR_LABELS: Record<Sector, string> = {
  AI_INFRA: "AI / AI Infrastructure",
  B2B_SAAS: "B2B SaaS",
  FINTECH: "Fintech",
  CLIMATE: "Climate",
  HEALTHCARE: "Healthcare",
  DEVTOOLS: "Devtools",
  CYBERSECURITY: "Cybersecurity",
  DEFENSE_TECH: "Defense Tech",
  CONSUMER: "Consumer",
  MARKETPLACE: "Marketplace",
  DEEPTECH: "Deeptech",
  BIOTECH: "Biotech",
  OTHER: "Other",
};

export const STAGE_LABELS: Record<CompanyStage, string> = {
  IDEA: "Idea",
  PRE_SEED: "Pre-seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  SERIES_B_PLUS: "Series B+",
};

export const BUCKET_LABELS: Record<InvestorBucket, string> = {
  MUST_REACH: "Must Reach",
  HIGH_FIT_LEAD: "High-fit Lead Candidates",
  HIGH_FIT_ANGEL: "High-fit Angels / Operators",
  GOOD_FOLLOW_ON: "Good Follow-on Investors",
  STRATEGIC: "Strategic Investors",
  LOW_PRIORITY: "Low Priority",
  DO_NOT_CONTACT: "Do Not Contact",
};

export const VERDICT_LABELS: Record<ReadinessVerdict, string> = {
  RAISE_NOW: "Raise now",
  RAISE_ANGELS_ONLY: "Raise from angels only",
  RAISE_PRE_SEED: "Raise from pre-seed funds",
  RAISE_SEED: "Strong enough for seed funds",
  DO_NOT_RAISE_YET: "Do not raise yet — fix gaps first",
  NEED_LEAD_FIRST: "You need a lead investor before broad outreach",
  STRATEGIC_CAPITAL_FIT: "Better fit for strategic capital than traditional VC",
};
