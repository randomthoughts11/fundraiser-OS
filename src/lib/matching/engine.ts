import {
  CompanyStage,
  InvestorBucket,
  LeadFollowBehavior,
  Sector,
  type InvestorFirm,
  type InvestorPerson,
  type InvestorSignal,
} from "@/generated/prisma/client";
import type { InvestorMatchResult, MatchExplanation } from "@/lib/types";

import type { OutcomeWeights } from "@/lib/matching/outcome-types";
import { applyOutcomeMultiplier } from "@/lib/matching/outcome-types";

type MatchInput = {
  sector: Sector;
  stage: CompanyStage;
  geography: string;
  targetAmount: number;
  competitors: string[];
  excludedInvestors: string[];
  warmIntroStrength?: number;
  outcomeWeights?: OutcomeWeights;
  companyThesisEmbedding?: number[] | null;
};

type FirmWithRelations = InvestorFirm & {
  partners: InvestorPerson[];
  portfolio: Array<{ name: string; sector: Sector | null; isConflict: boolean }>;
  signals: InvestorSignal[];
  theses?: Array<{ summary: string; embedding?: unknown }>;
};

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function thesisFit(
  firm: FirmWithRelations,
  companyEmbedding: number[] | null | undefined,
): number {
  if (!companyEmbedding?.length) return 0;
  const firmEmbedding = firm.thesisEmbedding as number[] | null;
  if (firmEmbedding?.length) {
    return cosineSimilarity(companyEmbedding, firmEmbedding) * 100;
  }
  const thesis = firm.theses?.[0];
  const thesisEmb = thesis?.embedding as number[] | undefined;
  if (thesisEmb?.length) {
    return cosineSimilarity(companyEmbedding, thesisEmb) * 100;
  }
  return 0;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function stageFit(firm: FirmWithRelations, stage: CompanyStage): number {
  if (firm.stageFocus.length === 0) return 60;
  if (firm.stageFocus.includes(stage)) return 95;
  const adjacent: Record<CompanyStage, CompanyStage[]> = {
    IDEA: ["PRE_SEED"],
    PRE_SEED: ["IDEA", "SEED"],
    SEED: ["PRE_SEED", "SERIES_A"],
    SERIES_A: ["SEED", "SERIES_B_PLUS"],
    SERIES_B_PLUS: ["SERIES_A"],
  };
  if (adjacent[stage]?.some((s) => firm.stageFocus.includes(s))) return 70;
  return 25;
}

function sectorFit(firm: FirmWithRelations, sector: Sector): number {
  if (firm.sectorFocus.length === 0) return 55;
  if (firm.sectorFocus.includes(sector)) return 92;
  const related: Partial<Record<Sector, Sector[]>> = {
    AI_INFRA: ["DEVTOOLS", "B2B_SAAS"],
    DEVTOOLS: ["AI_INFRA", "B2B_SAAS", "CYBERSECURITY"],
    B2B_SAAS: ["FINTECH", "DEVTOOLS"],
    CYBERSECURITY: ["DEVTOOLS", "DEFENSE_TECH"],
  };
  if (related[sector]?.some((s) => firm.sectorFocus.includes(s))) return 72;
  return 20;
}

function checkSizeFit(firm: FirmWithRelations, targetAmount: number): number {
  if (!firm.checkSizeMin && !firm.checkSizeMax) return 65;
  const min = firm.checkSizeMin ?? 0;
  const max = firm.checkSizeMax ?? Infinity;
  if (targetAmount >= min && targetAmount <= max) return 95;
  if (targetAmount >= min * 0.5 && targetAmount <= max * 1.5) return 70;
  return 30;
}

function conflictRisk(
  firm: FirmWithRelations,
  competitors: string[],
): number {
  const names = competitors.map((c) => c.toLowerCase());
  for (const pc of firm.portfolio) {
    if (pc.isConflict) return 90;
    if (names.some((n) => pc.name.toLowerCase().includes(n))) return 75;
  }
  return 0;
}

function timingSignal(signals: InvestorSignal[]): number {
  const recent = signals.filter(
    (s) => !s.isStale && Date.now() - s.observedAt.getTime() < 90 * 86400000,
  );
  if (recent.length >= 3) return 1.2;
  if (recent.length >= 1) return 1.1;
  return 1.0;
}

function accessScore(
  firm: FirmWithRelations,
  partner: InvestorPerson | undefined,
  warmIntroStrength: number,
  input: MatchInput,
): number {
  let score = 30;
  if (partner?.email) score += 20;
  if (partner?.investsCold) score += 15;
  if (partner?.responsiveness) score += partner.responsiveness * 0.3;
  if (warmIntroStrength > 0) score += warmIntroStrength * 40;
  if (firm.lastActivityAt) {
    const daysSince =
      (Date.now() - firm.lastActivityAt.getTime()) / 86400000;
    if (daysSince < 30) score += 15;
    else if (daysSince > 180) score -= 20;
  }
  if (input.outcomeWeights) {
    const multiplier = applyOutcomeMultiplier(
      input.outcomeWeights,
      partner?.id,
      input.sector,
    );
    score *= multiplier;
  }
  return clamp(score);
}

function assignBucket(
  priorityScore: number,
  fitScore: number,
  conflict: number,
  leadBehavior: string,
): InvestorBucket {
  if (conflict >= 70) return InvestorBucket.DO_NOT_CONTACT;
  if (priorityScore >= 75 && leadBehavior === LeadFollowBehavior.LEAD) return InvestorBucket.MUST_REACH;
  if (priorityScore >= 65 && fitScore >= 80) return InvestorBucket.HIGH_FIT_LEAD;
  if (priorityScore >= 55 && fitScore >= 70) return InvestorBucket.HIGH_FIT_ANGEL;
  if (priorityScore >= 45) return InvestorBucket.GOOD_FOLLOW_ON;
  if (priorityScore >= 30) return InvestorBucket.LOW_PRIORITY;
  return InvestorBucket.DO_NOT_CONTACT;
}

function buildExplanation(
  firm: FirmWithRelations,
  partner: InvestorPerson | undefined,
  fitScore: number,
): MatchExplanation {
  const reasons = [];
  if (firm.stageFocus.length > 0) {
    reasons.push({
      text: `Invests in ${firm.stageFocus.join(", ").replace(/_/g, " ").toLowerCase()} stage companies`,
      confidence: 0.85,
    });
  }
  if (firm.sectorFocus.length > 0) {
    reasons.push({
      text: `Portfolio focus includes ${firm.sectorFocus.slice(0, 3).join(", ").replace(/_/g, " ")}`,
      confidence: 0.8,
    });
  }
  for (const signal of firm.signals.slice(0, 2)) {
    reasons.push({
      text: signal.title,
      sourceUrl: signal.sourceUrl ?? undefined,
      sourceDate: signal.observedAt.toISOString().split("T")[0],
      confidence: signal.confidence,
      snippet: signal.snippet ?? undefined,
    });
  }
  if (partner) {
    reasons.push({
      text: `${partner.name}${partner.title ? ` (${partner.title})` : ""} is the best partner contact`,
      confidence: 0.75,
    });
  }

  const whyNow = firm.signals
    .filter((s) => !s.isStale)
    .slice(0, 3)
    .map((s) => ({
      signal: s.title,
      sourceUrl: s.sourceUrl ?? undefined,
      observedAt: s.observedAt.toISOString().split("T")[0],
    }));

  return {
    reasons,
    whyNow,
    suggestedAngle: fitScore >= 80
      ? "Emphasize sector fit, recent traction, and why this round unlocks the next milestone."
      : "Lead with team insight and timing; acknowledge stage-appropriate proof points.",
    bestContactPath: partner?.email ? `Direct: ${partner.email}` : undefined,
    potentialConcern:
      firm.portfolio.some((p) => p.isConflict)
        ? "Portfolio includes adjacent company — review conflict risk."
        : undefined,
  };
}

export function scoreInvestorMatch(
  firm: FirmWithRelations,
  input: MatchInput,
): InvestorMatchResult | null {
  if (input.excludedInvestors.some((e) => firm.name.toLowerCase().includes(e.toLowerCase()))) {
    return null;
  }

  const partner =
    firm.partners.find((p) => p.sectorFocus.includes(input.sector)) ??
    firm.partners[0];

  const thesisScore = thesisFit(firm, input.companyThesisEmbedding);
  const tagFit =
    stageFit(firm, input.stage) * 0.25 +
    sectorFit(firm, input.sector) * 0.3 +
    checkSizeFit(firm, input.targetAmount) * 0.2 +
    (firm.lastActivityAt ? 80 : 50) * 0.1;

  const fit = thesisScore > 0 ? tagFit * 0.6 + thesisScore * 0.4 : tagFit;

  const conflict = conflictRisk(firm, input.competitors);
  const access = accessScore(firm, partner, input.warmIntroStrength ?? 0, input);
  const timing = timingSignal(firm.signals);
  const confidence = firm.dataConfidence * 100;
  const priority = clamp(
    (fit / 100) * (access / 100) * timing * (confidence / 100) * 100 - conflict * 0.3,
  );

  const bucket = assignBucket(priority, fit, conflict, firm.leadBehavior);

  return {
    firmId: firm.id,
    firmName: firm.name,
    personId: partner?.id,
    personName: partner?.name,
    fitScore: clamp(fit),
    accessScore: access,
    timingScore: timing,
    confidenceScore: confidence,
    conflictRisk: conflict,
    priorityScore: priority,
    bucket,
    explanation: buildExplanation(firm, partner, fit),
  };
}

export function rankMatches(
  firms: FirmWithRelations[],
  input: MatchInput,
): InvestorMatchResult[] {
  return firms
    .map((firm) => scoreInvestorMatch(firm, input))
    .filter((m): m is InvestorMatchResult => m !== null)
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function groupByBucket(
  matches: InvestorMatchResult[],
): Record<InvestorBucket, InvestorMatchResult[]> {
  const groups: Record<string, InvestorMatchResult[]> = {};
  for (const match of matches) {
    if (!groups[match.bucket]) groups[match.bucket] = [];
    groups[match.bucket].push(match);
  }
  return groups as Record<InvestorBucket, InvestorMatchResult[]>;
}
