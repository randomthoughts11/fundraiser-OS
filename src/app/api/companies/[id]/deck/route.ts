import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/response";
import { requireCompanyAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/storage/s3";
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
    if (!file) throw new Error("No file provided");

    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `decks/${companyId}/${Date.now()}-${file.name}`;
    const fileUrl = await uploadToS3(s3Key, buffer, file.type || "application/pdf");

    const deck = await prisma.deck.create({
      data: {
        companyId,
        fileName: file.name,
        fileUrl,
        s3Key,
        extractionStatus: "PENDING",
      },
    });

    await inngest.send({
      name: "deck/extract",
      data: { deckId: deck.id, s3Key },
    });

    return { deckId: deck.id, status: "processing" };
  });
}
