import { inngest } from "../client";
import { extractDeckProfile } from "@/lib/extraction/extract-deck";
import { downloadFromS3 } from "@/lib/storage/s3";
import { extractTextFromPdf } from "@/lib/extraction/deck-parser";
import { prisma } from "@/lib/prisma";
import { matchingService } from "@/lib/services/matching.service";

export const extractDeck = inngest.createFunction(
  { id: "extract-deck", triggers: [{ event: "deck/extract" }] },
  async ({ event }) => {
    const { deckId, s3Key } = event.data as { deckId: string; s3Key: string };

    let text = "";
    try {
      const buffer = await downloadFromS3(s3Key);
      text = await extractTextFromPdf(buffer);
    } catch {
      text = "Deck content unavailable — using metadata only.";
    }

    await extractDeckProfile(deckId, text);

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: { company: { include: { fundraises: { where: { isActive: true }, take: 1 } } } },
    });

    const fundraiseId = deck?.company.fundraises[0]?.id;
    if (fundraiseId) {
      await matchingService.persistMatches(fundraiseId);
    }

    return { deckId, status: "completed" };
  },
);
