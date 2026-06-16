import { prisma } from "@/lib/prisma";
import { getOutcomeWeights, type OutcomeWeights } from "@/lib/matching/outcome-weights";

export async function aggregateLearningStats(): Promise<OutcomeWeights> {
  const weights = await getOutcomeWeights();

  await prisma.matchWeightSnapshot.create({
    data: {
      weights: weights as object,
      metadata: {
        generatedAt: new Date().toISOString(),
        source: "weekly_cron",
      },
    },
  });

  return weights;
}

export async function getCampaignFunnel(fundraiseId: string) {
  const matches = await prisma.investorMatch.findMany({
    where: { fundraiseId },
    include: {
      outcomes: true,
      messages: true,
    },
  });

  let sent = 0;
  let replied = 0;
  let meetings = 0;
  let passed = 0;

  for (const match of matches) {
    for (const outcome of match.outcomes) {
      if (outcome.sent) sent++;
      if (outcome.replied) replied++;
      if (outcome.meetingBooked) meetings++;
      if (outcome.passed) passed++;
    }
  }

  return {
    totalMatches: matches.length,
    sent,
    replied,
    meetings,
    passed,
    replyRate: sent > 0 ? replied / sent : 0,
    meetingRate: sent > 0 ? meetings / sent : 0,
  };
}
