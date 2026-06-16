import { inngest } from "../client";
import { matchingService } from "@/lib/services/matching.service";

export const generateMatches = inngest.createFunction(
  { id: "generate-matches", triggers: [{ event: "fundraise/generate-matches" }] },
  async ({ event }) => {
    const { fundraiseId } = event.data as { fundraiseId: string };
    return matchingService.persistMatches(fundraiseId);
  },
);
