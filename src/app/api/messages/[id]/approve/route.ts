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
        campaign: { include: { fundraise: true, company: true } },
        match: { include: { person: true } },
      },
    });

    const qc = await complianceService.validateMessageForSend({
      subject: message.subject,
      body: message.body,
      recipientEmail: message.match?.person?.email ?? undefined,
      regExemption: message.campaign.fundraise.regExemption,
      actorId: auth.userId,
    });

    if (!qc.passed) {
      throw new Error(`Compliance check failed: ${qc.flags.map((f) => f.message).join("; ")}`);
    }

    await prisma.message.update({
      where: { id },
      data: {
        founderApproved: true,
        approvedAt: new Date(),
        status: "APPROVED",
      },
    });

    await complianceService.logApproval({
      companyId: message.campaign.companyId,
      messageId: id,
      actorId: auth.userId,
    });

    if (message.matchId) {
      await prisma.investorMatch.update({
        where: { id: message.matchId },
        data: { pipelineStatus: "APPROVED" },
      });
    }

    return { approved: true };
  });
}
