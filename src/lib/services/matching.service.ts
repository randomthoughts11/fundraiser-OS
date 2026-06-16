import { prisma } from "@/lib/prisma";
import { rankMatches, groupByBucket } from "@/lib/matching/engine";
import { getOutcomeWeights } from "@/lib/matching/outcome-weights";
import { buildRoundStrategy } from "@/lib/strategy/round-planner";
import type { InvestorMatchResult } from "@/lib/types";
import type { InvestorBucket } from "@/generated/prisma/client";

export const matchingService = {
  async generateMatches(fundraiseId: string): Promise<InvestorMatchResult[]> {
    const fundraise = await prisma.fundraise.findUniqueOrThrow({
      where: { id: fundraiseId },
      include: {
        company: {
          include: {
            warmPaths: { include: { contact: true, targetPerson: true } },
          },
        },
      },
    });

    const firms = await prisma.investorFirm.findMany({
      include: {
        partners: true,
        portfolio: true,
        signals: { orderBy: { observedAt: "desc" }, take: 5 },
        theses: { take: 1 },
      },
    });

    const warmIntroStrength = fundraise.company.warmPaths.length > 0
      ? Math.max(...fundraise.company.warmPaths.map((p) => p.strength))
      : 0;

    const outcomeWeights = await getOutcomeWeights();

    const matches = rankMatches(firms, {
      sector: fundraise.company.sector,
      stage: fundraise.company.stage,
      geography: fundraise.company.geography,
      targetAmount: fundraise.targetAmount,
      competitors: fundraise.company.competitors,
      excludedInvestors: fundraise.company.excludedInvestors,
      warmIntroStrength,
      outcomeWeights,
      companyThesisEmbedding: null,
    });

    return matches;
  },

  async persistMatches(fundraiseId: string, limit = 100) {
    const matches = await this.generateMatches(fundraiseId);

    await prisma.investorMatch.deleteMany({ where: { fundraiseId } });

    if (matches.length > 0) {
      await prisma.investorMatch.createMany({
        data: matches.slice(0, limit).map((m) => ({
          fundraiseId,
          firmId: m.firmId,
          personId: m.personId ?? null,
          fitScore: m.fitScore,
          accessScore: m.accessScore,
          timingScore: m.timingScore,
          confidenceScore: m.confidenceScore,
          conflictRisk: m.conflictRisk,
          priorityScore: m.priorityScore,
          bucket: m.bucket,
          whyMatched: m.explanation.reasons,
          whyNow: m.explanation.whyNow,
          suggestedAngle: m.explanation.suggestedAngle,
          bestContactPath: m.explanation.bestContactPath,
          potentialConcern: m.explanation.potentialConcern,
        })),
      });
    }

    const strategy = buildRoundStrategy(matches);
    await prisma.fundraise.update({
      where: { id: fundraiseId },
      data: { targetingStrategy: strategy as object },
    });

    return { saved: Math.min(matches.length, limit), strategy };
  },

  async getMatches(
    fundraiseId: string,
    refresh = false,
  ): Promise<{
    matches: InvestorMatchResult[];
    grouped: Record<InvestorBucket, InvestorMatchResult[]>;
    fromDb: boolean;
  }> {
    if (!refresh) {
      const stored = await prisma.investorMatch.findMany({
        where: { fundraiseId },
        include: {
          firm: { include: { signals: { take: 3, orderBy: { observedAt: "desc" } } } },
          person: true,
        },
        orderBy: { priorityScore: "desc" },
      });

      if (stored.length > 0) {
        const matches: InvestorMatchResult[] = stored.map((m) => ({
          firmId: m.firmId,
          firmName: m.firm.name,
          personId: m.personId ?? undefined,
          personName: m.person?.name,
          fitScore: m.fitScore,
          accessScore: m.accessScore,
          timingScore: m.timingScore,
          confidenceScore: m.confidenceScore,
          conflictRisk: m.conflictRisk,
          priorityScore: m.priorityScore,
          bucket: m.bucket,
          explanation: {
            reasons: (m.whyMatched as InvestorMatchResult["explanation"]["reasons"]) ?? [],
            whyNow: (m.whyNow as InvestorMatchResult["explanation"]["whyNow"]) ?? [],
            suggestedAngle: m.suggestedAngle ?? "",
            bestContactPath: m.bestContactPath ?? undefined,
            potentialConcern: m.potentialConcern ?? undefined,
          },
        }));
        return { matches, grouped: groupByBucket(matches), fromDb: true };
      }
    }

    const matches = await this.generateMatches(fundraiseId);
    return { matches, grouped: groupByBucket(matches), fromDb: false };
  },
};
