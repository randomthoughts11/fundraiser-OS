import { inngest } from "../client";
import { generateEmailDraft } from "@/lib/outreach/draft-generator";
import { prisma } from "@/lib/prisma";

export const draftEmail = inngest.createFunction(
  { id: "draft-email", triggers: [{ event: "message/draft" }] },
  async ({ event }) => {
    const { matchId, campaignId } = event.data as { matchId: string; campaignId: string };
    const { draft, complianceFlags } = await generateEmailDraft(matchId);

    const message = await prisma.message.create({
      data: {
        campaignId,
        matchId,
        subject: draft.subject,
        body: draft.body,
        citations: draft.citations as object,
        complianceFlags: complianceFlags as object,
        templateVersion: "email-draft-v1",
        status: complianceFlags.passed ? "DRAFT" : "PENDING_APPROVAL",
      },
    });

    await prisma.investorMatch.update({
      where: { id: matchId },
      data: { pipelineStatus: "DRAFT_READY" },
    });

    return { messageId: message.id };
  },
);
