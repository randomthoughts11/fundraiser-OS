import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { crawlPortfolioPage } from "@/lib/ingestion/crawler/portfolio-crawler";
import { SourceType } from "@/generated/prisma/client";

export const crawlPortfolio = inngest.createFunction(
  { id: "crawl-portfolio", triggers: [{ event: "investor/crawl-portfolio" }] },
  async ({ event }) => {
    const { firmId } = event.data as { firmId: string };

    const firm = await prisma.investorFirm.findUniqueOrThrow({ where: { id: firmId } });
    if (!firm.website) return { skipped: true };

    const { companies, contentHash } = await crawlPortfolioPage(firm.website);

    const existing = await prisma.sourceDocument.findFirst({
      where: { contentHash, url: firm.website },
    });
    if (existing) return { skipped: true, reason: "unchanged" };

    const sourceDoc = await prisma.sourceDocument.create({
      data: {
        url: firm.website,
        title: `${firm.name} portfolio`,
        sourceType: SourceType.PORTFOLIO_PAGE,
        contentHash,
      },
    });

    for (const name of companies.slice(0, 30)) {
      const exists = await prisma.portfolioCompany.findFirst({
        where: { firmId, name },
      });
      if (!exists) {
        await prisma.portfolioCompany.create({ data: { firmId, name } });
      }
    }

    await prisma.investorSignal.create({
      data: {
        firmId,
        signalType: "portfolio_update",
        title: `Portfolio page lists ${companies.length} companies`,
        sourceUrl: firm.website,
        sourceType: SourceType.PORTFOLIO_PAGE,
        sourceDocId: sourceDoc.id,
        confidence: 0.75,
      },
    });

    return { companiesFound: companies.length };
  },
);
