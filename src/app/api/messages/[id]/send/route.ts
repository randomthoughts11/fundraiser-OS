import { withApiHandler } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { complianceService } from "@/lib/services/compliance.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withApiHandler(async () => {
    const auth = await requireAuth();
    const { id } = await params;

    const message = await prisma.message.findUniqueOrThrow({
      where: { id },
      include: {
        campaign: true,
        match: true,
      },
    });

    if (!message.founderApproved) {
      throw new Error("Message must be approved before marking as sent");
    }

    await prisma.message.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });

    await complianceService.logSent({
      companyId: message.campaign.companyId,
      messageId: id,
      actorId: auth.userId,
    });

    if (message.matchId) {
      await prisma.investorMatch.update({
        where: { id: message.matchId },
        data: { pipelineStatus: "SENT" },
      });

      await prisma.outcome.create({
        data: { matchId: message.matchId, sent: true },
      });
    }

    return { sent: true, note: "Founder-controlled send — copy to your email client or use Gmail integration" };
  });
}
