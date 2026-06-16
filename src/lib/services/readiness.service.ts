import { computeReadinessScore } from "@/lib/readiness/scoring";
import { prisma } from "@/lib/prisma";
import type { FundraiseMode, Sector, CompanyStage } from "@/generated/prisma/client";
import type { ReadinessReport } from "@/lib/types";

export const readinessService = {
  compute(input: {
    sector: Sector;
    stage: CompanyStage;
    fundraiseMode: FundraiseMode;
    targetAmount: number;
    metrics: Record<string, number | string | undefined>;
  }): ReadinessReport {
    return computeReadinessScore(input);
  },

  async computeForFundraise(fundraiseId: string): Promise<ReadinessReport> {
    const fundraise = await prisma.fundraise.findUniqueOrThrow({
      where: { id: fundraiseId },
      include: { company: { include: { metrics: true } } },
    });

    const metricMap = Object.fromEntries(
      fundraise.company.metrics.map((m) => [m.key, m.value ?? m.valueText ?? undefined]),
    );

    const report = computeReadinessScore({
      sector: fundraise.company.sector,
      stage: fundraise.company.stage,
      fundraiseMode: fundraise.company.fundraiseMode,
      targetAmount: fundraise.targetAmount,
      metrics: metricMap,
    });

    await prisma.fundraise.update({
      where: { id: fundraiseId },
      data: {
        readinessScore: report.score,
        readinessVerdict: report.verdict,
        readinessReport: report as object,
        narrative: report.narrativeRecommendation,
      },
    });

    return report;
  },

  canStartOutreach(verdict: string): boolean {
    return verdict !== "DO_NOT_RAISE_YET";
  },
};
