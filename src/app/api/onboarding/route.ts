import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeReadinessScore } from "@/lib/readiness/scoring";
import { onboardingSchema } from "@/lib/validations/onboarding";
import { logComplianceEvent } from "@/lib/api/audit";
import type { FundraiseMode, Sector } from "@/generated/prisma/client";
import { inngest } from "@/inngest/client";

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const auth = await requireAuth();
    const body = await request.json();
    const data = onboardingSchema.parse(body);

    const founder = await prisma.founder.upsert({
      where: { email: data.founderEmail },
      create: {
        email: data.founderEmail,
        name: data.founderName,
        userId: auth.userId,
      },
      update: { name: data.founderName, userId: auth.userId },
    });

    const company = await prisma.company.create({
      data: {
        founderId: founder.id,
        name: data.companyName,
        oneLiner: data.oneLiner,
        description: data.description,
        website: data.website || null,
        sector: data.sector,
        stage: data.stage,
        geography: data.geography,
        fundraiseMode: data.fundraiseMode,
        competitors: data.competitors,
        excludedInvestors: data.excludedInvestors,
      },
    });

    if (data.metrics.length > 0) {
      await prisma.metric.createMany({
        data: data.metrics.map((m) => ({
          companyId: company.id,
          key: m.key,
          value: m.value,
          valueText: m.valueText,
          unit: m.unit,
        })),
      });
    }

    const metricMap = Object.fromEntries(
      data.metrics.map((m) => [m.key, m.value ?? m.valueText]),
    );

    const readinessReport = computeReadinessScore({
      sector: data.sector as Sector,
      stage: data.stage,
      fundraiseMode: data.fundraiseMode as FundraiseMode,
      targetAmount: data.targetAmount,
      metrics: metricMap,
    });

    const fundraise = await prisma.fundraise.create({
      data: {
        companyId: company.id,
        targetAmount: data.targetAmount,
        instrument: data.instrument,
        regExemption: data.regExemption,
        hasCounsel: data.hasCounsel,
        roundUnlocks: data.roundUnlocks,
        readinessScore: readinessReport.score,
        readinessVerdict: readinessReport.verdict,
        readinessReport: readinessReport as object,
        narrative: readinessReport.narrativeRecommendation,
        targetingStrategy: {
          category: readinessReport.targetInvestorCategory,
          checkSizeRange: readinessReport.likelyCheckSizeRange,
        },
      },
    });

    await logComplianceEvent({
      companyId: company.id,
      eventType: "FOUNDER_ACKNOWLEDGMENT",
      actorId: auth.userId,
      details: {
        regExemption: data.regExemption,
        hasCounsel: data.hasCounsel,
        action: "onboarding_completed",
      },
    });

    if (readinessReport.verdict !== "DO_NOT_RAISE_YET") {
      await inngest.send({
        name: "fundraise/generate-matches",
        data: { fundraiseId: fundraise.id },
      });
    }

    return {
      companyId: company.id,
      fundraiseId: fundraise.id,
      readiness: readinessReport,
    };
  });
}
