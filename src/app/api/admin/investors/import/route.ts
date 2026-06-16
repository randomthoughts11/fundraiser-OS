import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeInvestorName, slugify } from "@/lib/ingestion/entity-resolution";
import { inngest } from "@/inngest/client";

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new Error("CSV file required");

    const text = await file.text();
    const lines = text.split("\n").slice(1);
    let imported = 0;

    for (const line of lines) {
      const [name, website, sectors, stages, checkMin, checkMax] = line
        .split(",")
        .map((s) => s?.trim());
      if (!name) continue;

      const normalized = normalizeInvestorName(name);
      const existing = await prisma.investorFirm.findFirst({
        where: { normalizedName: normalized },
      });

      if (!existing) {
        await prisma.investorFirm.create({
          data: {
            name,
            slug: slugify(name),
            normalizedName: normalized,
            website: website || null,
            sectorFocus: sectors ? sectors.split("|") as never[] : [],
            stageFocus: stages ? stages.split("|") as never[] : [],
            checkSizeMin: checkMin ? parseInt(checkMin, 10) : null,
            checkSizeMax: checkMax ? parseInt(checkMax, 10) : null,
            dataConfidence: 0.6,
          },
        });
        imported++;
      }
    }

    return { imported };
  });
}

export async function PUT() {
  return withApiHandler(async () => {
    await requireAdmin();
    await inngest.send({ name: "ingest/edgar", data: {} });
    return { triggered: true };
  });
}
