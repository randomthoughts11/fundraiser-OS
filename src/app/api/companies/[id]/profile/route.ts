import { withApiHandler } from "@/lib/api/response";
import { requireCompanyAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withApiHandler(async () => {
    const { id: companyId } = await params;
    await requireCompanyAccess(companyId);

    const company = await prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      include: {
        metrics: true,
        decks: { orderBy: { uploadedAt: "desc" }, take: 1 },
        objections: true,
      },
    });

    const latestDeck = company.decks[0];
    const extracted = latestDeck?.extractedData as Record<string, unknown> | null;

    return {
      manual: {
        name: company.name,
        oneLiner: company.oneLiner,
        description: company.description,
        sector: company.sector,
        stage: company.stage,
        competitors: company.competitors,
      },
      extracted: extracted ?? null,
      extractionStatus: latestDeck?.extractionStatus ?? null,
      metrics: company.metrics,
      objections: company.objections,
      confirmed: !!latestDeck?.confirmedAt,
    };
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withApiHandler(async () => {
    const { id: companyId } = await params;
    await requireCompanyAccess(companyId);

    const deck = await prisma.deck.findFirst({
      where: { companyId },
      orderBy: { uploadedAt: "desc" },
    });

    if (deck) {
      await prisma.deck.update({
        where: { id: deck.id },
        data: { confirmedAt: new Date() },
      });
    }

    return { confirmed: true };
  });
}
