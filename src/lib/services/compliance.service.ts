import { prisma } from "@/lib/prisma";
import { logComplianceEvent } from "@/lib/api/audit";
import { runComplianceQC } from "@/lib/compliance/qc-engine";
import { ForbiddenError } from "@/lib/api/errors";
import type { RegExemption } from "@/generated/prisma/client";

export const complianceService = {
  async isSuppressed(email: string): Promise<boolean> {
    const entry = await prisma.suppressionList.findUnique({ where: { email } });
    return !!entry;
  },

  async addSuppression(email: string, reason?: string, actorId?: string) {
    await prisma.suppressionList.upsert({
      where: { email },
      create: { email, reason },
      update: { reason },
    });
    await logComplianceEvent({
      eventType: "SUPPRESSION_ADDED",
      details: { email, reason },
      actorId,
    });
  },

  async validateMessageForSend(input: {
    subject: string;
    body: string;
    recipientEmail?: string;
    regExemption: RegExemption;
    actorId?: string;
  }) {
    if (input.recipientEmail) {
      const suppressed = await this.isSuppressed(input.recipientEmail);
      if (suppressed) {
        throw new ForbiddenError("Recipient is on suppression list");
      }
    }

    const qc = runComplianceQC({
      subject: input.subject,
      body: input.body,
      regExemption: input.regExemption,
    });

    if (!qc.passed) {
      await logComplianceEvent({
        eventType: "LEGAL_FLAG",
        details: { flags: qc.flags, subject: input.subject },
        actorId: input.actorId,
      });
    }

    return qc;
  },

  async logApproval(input: {
    companyId: string;
    messageId: string;
    actorId?: string;
  }) {
    return logComplianceEvent({
      companyId: input.companyId,
      eventType: "MESSAGE_APPROVED",
      details: { messageId: input.messageId },
      actorId: input.actorId,
    });
  },

  async logSent(input: {
    companyId: string;
    messageId: string;
    actorId?: string;
  }) {
    return logComplianceEvent({
      companyId: input.companyId,
      eventType: "MESSAGE_SENT",
      details: { messageId: input.messageId },
      actorId: input.actorId,
    });
  },
};
