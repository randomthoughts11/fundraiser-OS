import type { InvestorMatchResult } from "@/lib/types";

export type RoundStrategy = {
  roundSize: number;
  targetCloseDate: string | null;
  minimumViableRaise: number;
  idealLeadProfile: string;
  firstWave: string[];
  secondWave: string[];
  angelWave: string[];
  followUpScheduleDays: number[];
  narrativeAngle: string;
  metricsToEmphasize: string[];
  metricsToAvoid: string[];
  nextRoundMilestones: string[];
};

export function buildRoundStrategy(matches: InvestorMatchResult[]): RoundStrategy {
  const leads = matches
    .filter((m) => m.bucket === "MUST_REACH" || m.bucket === "HIGH_FIT_LEAD")
    .slice(0, 20)
    .map((m) => m.firmName);

  const followOns = matches
    .filter((m) => m.bucket === "GOOD_FOLLOW_ON")
    .slice(0, 30)
    .map((m) => m.firmName);

  const angels = matches
    .filter((m) => m.bucket === "HIGH_FIT_ANGEL")
    .slice(0, 20)
    .map((m) => m.firmName);

  return {
    roundSize: 0,
    targetCloseDate: null,
    minimumViableRaise: 0,
    idealLeadProfile: "Seed-stage lead with sector expertise and recent activity in your category",
    firstWave: leads,
    secondWave: followOns,
    angelWave: angels,
    followUpScheduleDays: [5, 10, 14],
    narrativeAngle: matches[0]?.explanation.suggestedAngle ?? "Lead with traction and timing",
    metricsToEmphasize: ["growth_rate", "retention", "arr"],
    metricsToAvoid: ["vanity_metrics", "unverified_projections"],
    nextRoundMilestones: [
      "Hit $1M ARR",
      "Demonstrate repeatable sales motion",
      "Land 3 anchor enterprise logos",
    ],
  };
}
