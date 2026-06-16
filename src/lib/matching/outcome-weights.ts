import { prisma } from "@/lib/prisma";
import {
  DEFAULT_OUTCOME_WEIGHTS,
  type OutcomeWeights,
} from "@/lib/matching/outcome-types";

export type { OutcomeWeights } from "@/lib/matching/outcome-types";
export { applyOutcomeMultiplier } from "@/lib/matching/outcome-types";

export async function getOutcomeWeights(): Promise<OutcomeWeights> {
  const snapshot = await prisma.matchWeightSnapshot.findFirst({
    orderBy: { snapshotAt: "desc" },
  });

  if (snapshot?.weights) {
    return snapshot.weights as OutcomeWeights;
  }

  const outcomes = await prisma.outcome.findMany({
    include: {
      match: {
        include: {
          person: true,
          fundraise: { include: { company: true } },
        },
      },
    },
  });

  if (outcomes.length === 0) return DEFAULT_OUTCOME_WEIGHTS;

  const partnerStats: Record<string, { sent: number; replied: number }> = {};
  const sectorStats: Record<string, { sent: number; replied: number }> = {};
  let totalSent = 0;
  let totalReplied = 0;

  for (const o of outcomes) {
    if (!o.sent) continue;
    totalSent++;
    if (o.replied) totalReplied++;

    const personId = o.match.personId;
    const sector = o.match.fundraise.company.sector;

    if (personId) {
      if (!partnerStats[personId]) partnerStats[personId] = { sent: 0, replied: 0 };
      partnerStats[personId].sent++;
      if (o.replied) partnerStats[personId].replied++;
    }

    if (!sectorStats[sector]) sectorStats[sector] = { sent: 0, replied: 0 };
    sectorStats[sector].sent++;
    if (o.replied) sectorStats[sector].replied++;
  }

  const partnerReplyRates: Record<string, number> = {};
  for (const [id, stats] of Object.entries(partnerStats)) {
    partnerReplyRates[id] = stats.sent > 0 ? stats.replied / stats.sent : 0.15;
  }

  const sectorReplyRates: Record<string, number> = {};
  for (const [sector, stats] of Object.entries(sectorStats)) {
    sectorReplyRates[sector] = stats.sent > 0 ? stats.replied / stats.sent : 0.15;
  }

  return {
    partnerReplyRates,
    sectorReplyRates,
    globalReplyRate: totalSent > 0 ? totalReplied / totalSent : 0.15,
  };
}
