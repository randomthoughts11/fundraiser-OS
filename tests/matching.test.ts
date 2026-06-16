import { describe, it, expect } from "vitest";
import { scoreInvestorMatch } from "@/lib/matching/engine";
import {
  Sector,
  CompanyStage,
  LeadFollowBehavior,
  InvestorType,
  InvestorBucket,
} from "@/generated/prisma/client";

const mockFirm = {
  id: "firm-1",
  name: "Test Ventures",
  slug: "test-ventures",
  normalizedName: "test",
  website: "https://test.vc",
  geography: ["US"],
  stageFocus: [CompanyStage.SEED],
  sectorFocus: [Sector.B2B_SAAS],
  checkSizeMin: 500_000,
  checkSizeMax: 5_000_000,
  leadBehavior: LeadFollowBehavior.LEAD,
  investorType: InvestorType.VC_FUND,
  publicThesis: "B2B SaaS at seed",
  dryPowderProxy: 0.8,
  lastActivityAt: new Date(),
  dataConfidence: 0.9,
  thesisEmbedding: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  partners: [
    {
      id: "p-1",
      firmId: "firm-1",
      name: "Jane Doe",
      title: "Partner",
      email: "jane@test.vc",
      linkedIn: null,
      geography: "US",
      stageFocus: [CompanyStage.SEED],
      sectorFocus: [Sector.B2B_SAAS],
      investsCold: false,
      responsiveness: 70,
      lastActivityAt: new Date(),
      dataConfidence: 0.8,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  portfolio: [],
  signals: [
    {
      id: "s-1",
      firmId: "firm-1",
      personId: null,
      signalType: "recent_investment",
      title: "Backed B2B SaaS company",
      snippet: null,
      sourceUrl: "https://example.com",
      sourceType: "NEWS" as const,
      confidence: 0.9,
      observedAt: new Date(),
      isStale: false,
      sourceDocId: null,
    },
  ],
  theses: [],
};

describe("matching engine", () => {
  it("scores high fit for matching firm", () => {
    const result = scoreInvestorMatch(mockFirm, {
      sector: Sector.B2B_SAAS,
      stage: CompanyStage.SEED,
      geography: "US",
      targetAmount: 2_000_000,
      competitors: [],
      excludedInvestors: [],
    });

    expect(result).not.toBeNull();
    expect(result!.fitScore).toBeGreaterThan(70);
    expect(result!.bucket).not.toBe(InvestorBucket.DO_NOT_CONTACT);
  });

  it("excludes conflict investors", () => {
    const firmWithConflict = {
      ...mockFirm,
      portfolio: [{ name: "CompetitorCo", sector: Sector.B2B_SAAS, isConflict: true }],
    };

    const result = scoreInvestorMatch(firmWithConflict, {
      sector: Sector.B2B_SAAS,
      stage: CompanyStage.SEED,
      geography: "US",
      targetAmount: 2_000_000,
      competitors: ["CompetitorCo"],
      excludedInvestors: [],
    });

    expect(result!.conflictRisk).toBeGreaterThan(0);
  });
});
