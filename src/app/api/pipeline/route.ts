import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/response";
import { requireFundraiseAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const fundraiseId = request.nextUrl.searchParams.get("fundraiseId");
    if (!fundraiseId) throw new Error("fundraiseId required");

    await requireFundraiseAccess(fundraiseId);

    const matches = await prisma.investorMatch.findMany({
      where: { fundraiseId },
      include: {
        firm: true,
        person: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        outcomes: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
      orderBy: { priorityScore: "desc" },
    });

    return matches.map((m) => ({
      id: m.id,
      firmName: m.firm.name,
      personName: m.person?.name,
      bucket: m.bucket,
      pipelineStatus: m.pipelineStatus,
      pipelineNotes: m.pipelineNotes,
      priorityScore: m.priorityScore,
      latestMessage: m.messages[0] ?? null,
      outcome: m.outcomes[0] ?? null,
    }));
  });
}
