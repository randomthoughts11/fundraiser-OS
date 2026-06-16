import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/response";
import { requireFundraiseAccess } from "@/lib/auth";
import { matchingService } from "@/lib/services/matching.service";
import { inngest } from "@/inngest/client";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const fundraiseId = request.nextUrl.searchParams.get("fundraiseId");
    if (!fundraiseId) throw new Error("fundraiseId required");

    await requireFundraiseAccess(fundraiseId);

    const refresh = request.nextUrl.searchParams.get("refresh") === "true";
    const result = await matchingService.getMatches(fundraiseId, refresh);

    return {
      fundraiseId,
      total: result.matches.length,
      grouped: result.grouped,
      top: result.matches.slice(0, 25),
      fromDb: result.fromDb,
    };
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const { fundraiseId } = await request.json();
    await requireFundraiseAccess(fundraiseId);

    const result = await matchingService.persistMatches(fundraiseId);
    return result;
  });
}

export async function PUT(request: NextRequest) {
  return withApiHandler(async () => {
    const { fundraiseId } = await request.json();
    await requireFundraiseAccess(fundraiseId);

    await inngest.send({
      name: "fundraise/generate-matches",
      data: { fundraiseId },
    });

    return { queued: true };
  });
}
