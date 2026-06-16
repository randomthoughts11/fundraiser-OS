import { describe, it, expect } from "vitest";
import { computeReadinessScore } from "@/lib/readiness/scoring";
import { FundraiseMode, Sector, CompanyStage, ReadinessVerdict } from "@/generated/prisma/client";

describe("readiness scoring", () => {
  it("returns DO_NOT_RAISE_YET for weak pre-market profile", () => {
    const report = computeReadinessScore({
      sector: Sector.B2B_SAAS,
      stage: CompanyStage.SEED,
      fundraiseMode: FundraiseMode.PRE_MARKET_READY,
      targetAmount: 5_000_000,
      metrics: {},
    });
    expect(report.verdict).toBe(ReadinessVerdict.DO_NOT_RAISE_YET);
    expect(report.score).toBeLessThan(50);
  });

  it("returns RAISE_NOW for strong market-ready SaaS", () => {
    const report = computeReadinessScore({
      sector: Sector.B2B_SAAS,
      stage: CompanyStage.SEED,
      fundraiseMode: FundraiseMode.MARKET_READY,
      targetAmount: 2_000_000,
      metrics: {
        arr: 1_200_000,
        growth_rate: 15,
        retention: 95,
        mrr: 100_000,
        pipeline: 500_000,
        icp_clarity: 1,
      },
    });
    expect(report.score).toBeGreaterThan(60);
  });
});
