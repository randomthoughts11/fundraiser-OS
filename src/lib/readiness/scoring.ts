import {
  CompanyStage,
  FundraiseMode,
  ReadinessVerdict,
  Sector,
} from "@/generated/prisma/client";
import type { ReadinessReport } from "@/lib/types";

type MetricMap = Record<string, number | string | undefined>;

const SAAS_KEYS = [
  "arr",
  "mrr",
  "growth_rate",
  "retention",
  "pipeline",
  "cac_payback",
  "expansion_revenue",
];

const CONSUMER_KEYS = [
  "user_growth",
  "retention",
  "engagement",
  "organic_acquisition",
  "waitlist_size",
];

const DEEPTECH_KEYS = [
  "technical_milestone",
  "ip_count",
  "prototype_maturity",
  "grants",
  "strategic_partners",
];

const BIOTECH_KEYS = [
  "clinical_stage",
  "scientific_validation",
  "kol_support",
  "ip_count",
  "trial_roadmap",
];

const MARKETPLACE_KEYS = [
  "gmv",
  "take_rate",
  "repeat_usage",
  "supply_liquidity",
  "demand_liquidity",
];

function getSectorMetricKeys(sector: Sector): string[] {
  switch (sector) {
    case Sector.B2B_SAAS:
    case Sector.FINTECH:
    case Sector.DEVTOOLS:
    case Sector.CYBERSECURITY:
    case Sector.AI_INFRA:
      return SAAS_KEYS;
    case Sector.CONSUMER:
      return CONSUMER_KEYS;
    case Sector.DEEPTECH:
    case Sector.DEFENSE_TECH:
      return DEEPTECH_KEYS;
    case Sector.BIOTECH:
    case Sector.HEALTHCARE:
      return BIOTECH_KEYS;
    case Sector.MARKETPLACE:
      return MARKETPLACE_KEYS;
    default:
      return SAAS_KEYS;
  }
}

function scoreMetricPresence(
  metrics: MetricMap,
  keys: string[],
): { score: number; missing: string[] } {
  const missing: string[] = [];
  let present = 0;

  for (const key of keys) {
    if (metrics[key] !== undefined && metrics[key] !== "") {
      present++;
    } else {
      missing.push(key.replace(/_/g, " "));
    }
  }

  return {
    score: keys.length > 0 ? (present / keys.length) * 100 : 50,
    missing,
  };
}

function scoreTraction(metrics: MetricMap, mode: FundraiseMode): number {
  if (mode === FundraiseMode.PRE_MARKET_READY) {
    const signals = [
      metrics.design_partners,
      metrics.lois,
      metrics.waitlist_quality,
      metrics.prototype_credibility,
      metrics.team_credibility,
      metrics.customer_discovery,
    ].filter((v) => v !== undefined && v !== "");

    return Math.min(100, 30 + signals.length * 12);
  }

  const arr = Number(metrics.arr ?? metrics.mrr ?? 0);
  const growth = Number(metrics.growth_rate ?? 0);
  const retention = Number(metrics.retention ?? 0);

  let score = 20;
  if (arr >= 1_000_000) score += 35;
  else if (arr >= 250_000) score += 25;
  else if (arr >= 50_000) score += 15;
  else if (arr > 0) score += 8;

  if (growth >= 15) score += 25;
  else if (growth >= 8) score += 15;
  else if (growth > 0) score += 5;

  if (retention >= 90) score += 20;
  else if (retention >= 75) score += 10;

  return Math.min(100, score);
}

function determineVerdict(
  score: number,
  stage: CompanyStage,
  mode: FundraiseMode,
): ReadinessVerdict {
  if (score < 35) return ReadinessVerdict.DO_NOT_RAISE_YET;
  if (score < 50) {
    return mode === FundraiseMode.PRE_MARKET_READY
      ? ReadinessVerdict.RAISE_ANGELS_ONLY
      : ReadinessVerdict.DO_NOT_RAISE_YET;
  }
  if (score < 65) {
    return mode === FundraiseMode.PRE_MARKET_READY
      ? ReadinessVerdict.RAISE_PRE_SEED
      : ReadinessVerdict.RAISE_ANGELS_ONLY;
  }
  if (score < 80) {
    if (stage === CompanyStage.SERIES_A) return ReadinessVerdict.RAISE_SEED;
    return ReadinessVerdict.RAISE_SEED;
  }
  if (stage === CompanyStage.SERIES_A && score < 88) return ReadinessVerdict.NEED_LEAD_FIRST;
  return ReadinessVerdict.RAISE_NOW;
}

function checkSizeRange(
  stage: CompanyStage,
  mode: FundraiseMode,
): { min: number; max: number } {
  if (mode === FundraiseMode.PRE_MARKET_READY) {
    return { min: 250_000, max: 2_000_000 };
  }
  switch (stage) {
    case CompanyStage.PRE_SEED:
      return { min: 500_000, max: 3_000_000 };
    case CompanyStage.SEED:
      return { min: 1_500_000, max: 8_000_000 };
    case CompanyStage.SERIES_A:
      return { min: 5_000_000, max: 20_000_000 };
    default:
      return { min: 250_000, max: 5_000_000 };
  }
}

function targetCategory(
  verdict: ReadinessVerdict,
  mode: FundraiseMode,
): string {
  const map: Record<ReadinessVerdict, string> = {
    [ReadinessVerdict.RAISE_NOW]:
      mode === FundraiseMode.MARKET_READY
        ? "Seed / Series A lead funds"
        : "Pre-seed funds and operator angels",
    [ReadinessVerdict.RAISE_ANGELS_ONLY]: "Angels, operator angels, and scouts",
    [ReadinessVerdict.RAISE_PRE_SEED]: "Pre-seed funds, accelerators, and angels",
    [ReadinessVerdict.RAISE_SEED]: "Seed funds and sector-specialist VCs",
    [ReadinessVerdict.DO_NOT_RAISE_YET]: "None — focus on validation sprint",
    [ReadinessVerdict.NEED_LEAD_FIRST]: "1–2 lead candidates before broad outreach",
    [ReadinessVerdict.STRATEGIC_CAPITAL_FIT]: "Strategic investors and corporate venture",
  };
  return map[verdict];
}

export function computeReadinessScore(input: {
  sector: Sector;
  stage: CompanyStage;
  fundraiseMode: FundraiseMode;
  targetAmount: number;
  metrics: MetricMap;
}): ReadinessReport {
  const sectorKeys = getSectorMetricKeys(input.sector);
  const { score: evidenceScore, missing } = scoreMetricPresence(
    input.metrics,
    sectorKeys,
  );
  const tractionScore = scoreTraction(input.metrics, input.fundraiseMode);
  const score = Math.round(evidenceScore * 0.4 + tractionScore * 0.6);
  const verdict = determineVerdict(score, input.stage, input.fundraiseMode);
  const checkRange = checkSizeRange(input.stage, input.fundraiseMode);

  const weaknesses: string[] = [];
  if (missing.length > 3) {
    weaknesses.push(`Missing ${missing.length} key evidence points for ${input.sector.replace(/_/g, " ")}`);
  }
  if (input.targetAmount > checkRange.max * 1.5) {
    weaknesses.push("Round size may exceed what your traction supports");
  }
  if (input.fundraiseMode === FundraiseMode.PRE_MARKET_READY && Number(input.metrics.arr ?? 0) === 0) {
    weaknesses.push("No revenue yet — narrative must sell insight, team, and timing");
  }

  const deckProblems: string[] = [];
  if (!input.metrics.icp_clarity) deckProblems.push("ICP / customer definition unclear");
  if (verdict === ReadinessVerdict.DO_NOT_RAISE_YET) deckProblems.push("Traction slide likely weak for claimed stage");

  const investorQuestions: string[] = [
    "Why is this venture-scale?",
    "Why now?",
    "What is your wedge against incumbents?",
  ];
  if (input.fundraiseMode === FundraiseMode.MARKET_READY) {
    investorQuestions.push("What is your retention and expansion motion?");
    investorQuestions.push("Why does this round size match your milestones?");
  }

  const narrativeRecommendation =
    input.fundraiseMode === FundraiseMode.PRE_MARKET_READY
      ? "Lead with founder-market fit, technical moat, and asymmetric upside. Do not fake traction."
      : "Lead with evidence: revenue, growth, retention, and customer pull. Emphasize why now.";

  const milestonesBeforeOutreach: string[] = [];
  if (verdict === ReadinessVerdict.DO_NOT_RAISE_YET) {
    milestonesBeforeOutreach.push("Run 10+ customer discovery calls");
    milestonesBeforeOutreach.push("Secure 2–3 design partners or LOIs");
    milestonesBeforeOutreach.push("Sharpen ICP and problem urgency narrative");
  } else if (verdict === ReadinessVerdict.NEED_LEAD_FIRST) {
    milestonesBeforeOutreach.push("Identify and warm up 3 lead candidates");
    milestonesBeforeOutreach.push("Prepare data room with unit economics");
  }

  return {
    score,
    verdict,
    targetInvestorCategory: targetCategory(verdict, input.fundraiseMode),
    likelyCheckSizeRange: checkRange,
    missingEvidence: missing.slice(0, 5),
    weaknesses,
    narrativeRecommendation,
    milestonesBeforeOutreach,
    deckProblems,
    investorQuestions,
  };
}
