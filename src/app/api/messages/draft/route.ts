import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    await requireAuth();
    const { matchId, fundraiseId } = await request.json();

    const match = await prisma.investorMatch.findUniqueOrThrow({
      where: { id: matchId },
      include: { fundraise: { include: { company: true } } },
    });

    let campaign = await prisma.campaign.findFirst({
      where: { fundraiseId: fundraiseId ?? match.fundraiseId },
    });

    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: {
          companyId: match.fundraise.companyId,
          fundraiseId: match.fundraiseId,
          name: "Outreach Wave 1",
          wave: 1,
        },
      });
    }

    await inngest.send({
      name: "message/draft",
      data: { matchId, campaignId: campaign.id },
    });

    return { queued: true, campaignId: campaign.id };
  });
}
