import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    await requireAdmin();
    const { advisorId, companyId } = await request.json();

    const access = await prisma.advisorCompanyAccess.upsert({
      where: { advisorId_companyId: { advisorId, companyId } },
      create: { advisorId, companyId, readOnly: true },
      update: {},
    });

    return access;
  });
}
