import { prisma } from "@/lib/prisma";
import type { ComplianceEventType } from "@/generated/prisma/client";

export async function logComplianceEvent(input: {
  companyId?: string;
  eventType: ComplianceEventType;
  details: Record<string, unknown>;
  actorId?: string;
}) {
  return prisma.complianceLog.create({
    data: {
      companyId: input.companyId,
      eventType: input.eventType,
      details: input.details as object,
      actorId: input.actorId,
    },
  });
}
