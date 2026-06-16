import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { extractDeck } from "@/inngest/functions/extract-deck";
import { ingestEdgar } from "@/inngest/functions/ingest-edgar";
import { crawlPortfolio } from "@/inngest/functions/crawl-portfolio";
import { refreshSignals } from "@/inngest/functions/refresh-signals";
import { generateMatches } from "@/inngest/functions/generate-matches";
import { mapWarmIntros } from "@/inngest/functions/map-warm-intros";
import { draftEmail } from "@/inngest/functions/draft-email";
import { classifyReply } from "@/inngest/functions/classify-reply";
import { followUpReminder } from "@/inngest/functions/follow-up-reminder";
import { weeklyLearning } from "@/inngest/functions/weekly-learning";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    extractDeck,
    ingestEdgar,
    crawlPortfolio,
    refreshSignals,
    generateMatches,
    mapWarmIntros,
    draftEmail,
    classifyReply,
    followUpReminder,
    weeklyLearning,
  ],
});
