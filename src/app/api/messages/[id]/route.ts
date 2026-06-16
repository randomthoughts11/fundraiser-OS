import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withApiHandler(async () => {
    await requireAuth();
    const { id } = await params;
    const { subject, body } = await request.json();

    const message = await prisma.message.update({
      where: { id },
      data: { subject, body },
    });

    return message;
  });
}
