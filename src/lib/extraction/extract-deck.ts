import { structuredCompletion } from "@/lib/ai/client";
import { DECK_EXTRACTION_PROMPT_V1 } from "@/lib/ai/prompts/deck-extraction-v1";
import {
  companyProfileSchema,
  companyProfileJsonSchema,
  type CompanyProfile,
} from "@/lib/ai/schemas/company-profile";
import { chunkText } from "@/lib/extraction/deck-parser";
import { prisma } from "@/lib/prisma";
import { readinessService } from "@/lib/services/readiness.service";
import { createEmbedding } from "@/lib/ai/client";

export async function extractDeckProfile(deckId: string, text: string) {
  await prisma.deck.update({
    where: { id: deckId },
    data: { extractionStatus: "PROCESSING" },
  });

  try {
    const raw = await structuredCompletion<CompanyProfile>({
      system: DECK_EXTRACTION_PROMPT_V1,
      user: `Extract company profile from this pitch deck text:\n\n${chunkText(text)}`,
      schema: companyProfileJsonSchema,
      schemaName: "company_profile",
    });

    const profile = companyProfileSchema.parse(raw);
    const deck = await prisma.deck.findUniqueOrThrow({
      where: { id: deckId },
      include: { company: { include: { fundraises: { where: { isActive: true }, take: 1 } } } },
    });

    await prisma.company.update({
      where: { id: deck.companyId },
      data: {
        oneLiner: profile.oneLiner ?? deck.company.oneLiner,
        description: profile.description ?? deck.company.description,
        competitors: profile.competitors.length > 0 ? profile.competitors : deck.company.competitors,
      },
    });

    if (profile.metrics.length > 0) {
      await prisma.metric.createMany({
        data: profile.metrics.map((m) => ({
          companyId: deck.companyId,
          key: m.key,
          value: m.value,
          valueText: m.valueText,
          unit: m.unit,
          source: "deck_extraction",
        })),
      });
    }

    const thesisText = [profile.oneLiner, profile.description, ...profile.narrativeHooks]
      .filter(Boolean)
      .join(" ");
    const embedding = thesisText ? await createEmbedding(thesisText) : [];

    await prisma.deck.update({
      where: { id: deckId },
      data: {
        extractionStatus: "COMPLETED",
        extractedData: profile as object,
        weakSlides: profile.weakSlides,
      },
    });

    const activeFundraise = deck.company.fundraises[0];
    if (activeFundraise) {
      await readinessService.computeForFundraise(activeFundraise.id);

      if (profile.weakSlides.length > 0) {
        await prisma.objection.createMany({
          data: profile.weakSlides.map((slide) => ({
            companyId: deck.companyId,
            objection: `Weak slide: ${slide}`,
            response: "Strengthen evidence or reframe narrative for this slide",
            deckFix: `Revise slide: ${slide}`,
          })),
        });
      }
    }

    return { profile, embedding };
  } catch (error) {
    await prisma.deck.update({
      where: { id: deckId },
      data: { extractionStatus: "FAILED" },
    });
    throw error;
  }
}
