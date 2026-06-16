import { inngest } from "../client";
import { persistWarmIntroPaths } from "@/lib/intro/path-finder";
import { matchingService } from "@/lib/services/matching.service";
import { prisma } from "@/lib/prisma";

export const mapWarmIntros = inngest.createFunction(
  { id: "map-warm-intros", triggers: [{ event: "company/map-warm-intros" }] },
  async ({ event }) => {
    const { companyId } = event.data as { companyId: string };
    const paths = await persistWarmIntroPaths(companyId);

    const fundraise = await prisma.fundraise.findFirst({
      where: { companyId, isActive: true },
    });

    if (fundraise) {
      await matchingService.persistMatches(fundraise.id);
    }

    return { pathsFound: paths.length };
  },
);
