import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/response";
import { requireFundraiseAccess } from "@/lib/auth";
import { getCampaignFunnel } from "@/lib/learning/aggregate-stats";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const fundraiseId = request.nextUrl.searchParams.get("fundraiseId");
    if (!fundraiseId) throw new Error("fundraiseId required");

    await requireFundraiseAccess(fundraiseId);
    return getCampaignFunnel(fundraiseId);
  });
}
