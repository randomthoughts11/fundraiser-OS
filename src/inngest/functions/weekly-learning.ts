import { inngest } from "../client";
import { aggregateLearningStats } from "@/lib/learning/aggregate-stats";

export const weeklyLearning = inngest.createFunction(
  { id: "weekly-learning", triggers: [{ cron: "0 4 * * 0" }] },
  async () => {
    const weights = await aggregateLearningStats();
    return { snapshot: weights };
  },
);
