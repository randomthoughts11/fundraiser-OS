import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PipelineStatus } from "@/generated/prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  return withApiHandler(async () => {
    await requireAuth();
    const { matchId } = await params;
    const body = await request.json();

    const match = await prisma.investorMatch.findUniqueOrThrow({
      where: { id: matchId },
      include: { fundraise: { include: { company: true } } },
    });

    const updated = await prisma.investorMatch.update({
      where: { id: matchId },
      data: {
        pipelineStatus: body.pipelineStatus as PipelineStatus | undefined,
        pipelineNotes: body.pipelineNotes,
      },
    });

    if (body.passReason && body.pipelineStatus === "PASSED") {
      const existing = await prisma.outcome.findFirst({ where: { matchId } });
      if (existing) {
        await prisma.outcome.update({
          where: { id: existing.id },
          data: { passed: true, passReason: body.passReason },
        });
      } else {
        await prisma.outcome.create({
          data: { matchId, passed: true, passReason: body.passReason },
        });
      }
    }

    return updated;
  });
}
