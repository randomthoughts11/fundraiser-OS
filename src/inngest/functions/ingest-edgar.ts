import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { ingestEdgarSample } from "@/lib/ingestion/edgar/client";
import { dedupeKey, normalizeInvestorName, slugify } from "@/lib/ingestion/entity-resolution";
import { SourceType } from "@/generated/prisma/client";

export const ingestEdgar = inngest.createFunction(
  { id: "ingest-edgar", triggers: [{ cron: "0 2 * * *" }, { event: "ingest/edgar" }] },
  async () => {
    const job = await prisma.ingestionJob.create({
      data: { jobType: "edgar_form_d", status: "RUNNING", startedAt: new Date() },
    });

    try {
      const records = await ingestEdgarSample();
      let processed = 0;

      for (const record of records) {
        const key = dedupeKey(record);
        const existing = await prisma.investorFirm.findFirst({
          where: { normalizedName: normalizeInvestorName(record.name) },
        });

        const sourceDoc = await prisma.sourceDocument.create({
          data: {
            url: record.sourceUrl,
            title: record.name,
            sourceType: SourceType.SEC_EDGAR,
            contentHash: key,
          },
        });

        if (existing) {
          await prisma.investorSignal.create({
            data: {
              firmId: existing.id,
              signalType: "edgar_filing",
              title: `Form D filing activity: ${record.name}`,
              sourceUrl: record.sourceUrl,
              sourceType: SourceType.SEC_EDGAR,
              sourceDocId: sourceDoc.id,
              confidence: 0.7,
            },
          });
        } else {
          const firm = await prisma.investorFirm.create({
            data: {
              name: record.name,
              slug: slugify(record.name),
              normalizedName: normalizeInvestorName(record.name),
              dataConfidence: 0.5,
              signals: {
                create: {
                  signalType: "edgar_filing",
                  title: `Form D filing: ${record.name}`,
                  sourceUrl: record.sourceUrl,
                  sourceType: SourceType.SEC_EDGAR,
                  sourceDocId: sourceDoc.id,
                  confidence: 0.6,
                },
              },
            },
          });
          void firm;
        }
        processed++;
      }

      await prisma.ingestionJob.update({
        where: { id: job.id },
        data: { status: "COMPLETED", completedAt: new Date(), recordsProcessed: processed },
      });

      return { processed };
    } catch (error) {
      await prisma.ingestionJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        },
      });
      throw error;
    }
  },
);
