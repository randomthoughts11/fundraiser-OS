export type OutcomeWeights = {
  partnerReplyRates: Record<string, number>;
  sectorReplyRates: Record<string, number>;
  globalReplyRate: number;
};

export const DEFAULT_OUTCOME_WEIGHTS: OutcomeWeights = {
  partnerReplyRates: {},
  sectorReplyRates: {},
  globalReplyRate: 0.15,
};

export function applyOutcomeMultiplier(
  weights: OutcomeWeights,
  personId?: string,
  sector?: string,
): number {
  if (personId && weights.partnerReplyRates[personId]) {
    return 0.5 + weights.partnerReplyRates[personId];
  }
  if (sector && weights.sectorReplyRates[sector]) {
    return 0.5 + weights.sectorReplyRates[sector];
  }
  return 0.5 + weights.globalReplyRate;
}
