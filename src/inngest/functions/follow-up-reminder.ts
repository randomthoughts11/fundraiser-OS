import { inngest } from "../client";
import { prisma } from "@/lib/prisma";

export const followUpReminder = inngest.createFunction(
  { id: "follow-up-reminder", triggers: [{ cron: "0 9 * * *" }] },
  async () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);

    const staleMessages = await prisma.message.findMany({
      where: {
        status: "SENT",
        sentAt: { lt: fiveDaysAgo },
        replies: { none: {} },
      },
      include: { match: true },
      take: 100,
    });

    return {
      remindersNeeded: staleMessages.length,
      messageIds: staleMessages.map((m) => m.id),
    };
  },
);
