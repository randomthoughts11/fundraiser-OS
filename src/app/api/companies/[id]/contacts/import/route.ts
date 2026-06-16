import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/response";
import { requireCompanyAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withApiHandler(async () => {
    const { id: companyId } = await params;
    await requireCompanyAccess(companyId);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const gdprLawfulBasis = (formData.get("gdprLawfulBasis") as string) || "legitimate_interest";

    if (!file) throw new Error("CSV file required");

    const text = await file.text();
    const lines = text.split("\n").slice(1);
    const contacts = [];

    for (const line of lines) {
      const [name, email, role, relationship, employer] = line.split(",").map((s) => s?.trim());
      if (!name) continue;
      contacts.push({
        companyId,
        name,
        email: email || null,
        role: role || null,
        relationship: relationship || null,
        employer: employer || null,
        canIntro: relationship?.toLowerCase().includes("advisor") ?? false,
        gdprLawfulBasis,
      });
    }

    await prisma.contact.createMany({ data: contacts });

    await inngest.send({
      name: "company/map-warm-intros",
      data: { companyId },
    });

    return { imported: contacts.length };
  });
}
