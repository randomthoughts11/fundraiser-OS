import { inngest } from "../client";
import { prisma } from "@/lib/prisma";

export const refreshSignals = inngest.createFunction(
  { id: "refresh-signals", triggers: [{ cron: "0 3 * * *" }] },
  async () => {
    const staleThreshold = new Date(Date.now() - 90 * 86400000);

    const result = await prisma.investorSignal.updateMany({
      where: {
        observedAt: { lt: staleThreshold },
        isStale: false,
      },
      data: { isStale: true },
    });

    return { markedStale: result.count };
  },
);
