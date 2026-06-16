import { withApiHandler } from "@/lib/api/response";
import { requireFundraiseAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ReadinessReport } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fundraiseId: string }> },
) {
  return withApiHandler(async () => {
    const { fundraiseId } = await params;
    await requireFundraiseAccess(fundraiseId);

    const fundraise = await prisma.fundraise.findUniqueOrThrow({
      where: { id: fundraiseId },
      include: { company: { include: { founder: true } } },
    });

    return {
      id: fundraise.id,
      targetAmount: fundraise.targetAmount,
      readinessScore: fundraise.readinessScore,
      readinessVerdict: fundraise.readinessVerdict,
      readinessReport: fundraise.readinessReport as ReadinessReport,
      targetingStrategy: fundraise.targetingStrategy,
      company: fundraise.company,
    };
  });
}
