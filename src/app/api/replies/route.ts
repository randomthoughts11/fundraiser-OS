import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { inngest } from "@/inngest/client";

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    await requireAuth();
    const { messageId, body } = await request.json();

    await inngest.send({
      name: "reply/classify",
      data: { messageId, body },
    });

    return { queued: true };
  });
}
