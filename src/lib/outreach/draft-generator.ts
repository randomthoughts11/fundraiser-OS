import { structuredCompletion } from "@/lib/ai/client";
import { EMAIL_DRAFT_PROMPT_V1 } from "@/lib/ai/prompts/deck-extraction-v1";
import {
  emailDraftSchema,
  emailDraftJsonSchema,
  type EmailDraft,
} from "@/lib/ai/schemas/email-draft";
import { prisma } from "@/lib/prisma";
import { runComplianceQC } from "@/lib/compliance/qc-engine";

export async function generateEmailDraft(matchId: string): Promise<{
  draft: EmailDraft;
  complianceFlags: ReturnType<typeof runComplianceQC>;
}> {
  const match = await prisma.investorMatch.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      firm: { include: { signals: { take: 5, orderBy: { observedAt: "desc" } } } },
      person: true,
      fundraise: { include: { company: true } },
    },
  });

  const signals = match.firm.signals.map((s) => ({
    id: s.id,
    title: s.title,
    snippet: s.snippet,
    sourceUrl: s.sourceUrl,
    observedAt: s.observedAt.toISOString(),
    confidence: s.confidence,
    isStale: s.isStale,
  }));

  const company = match.fundraise.company;

  const raw = await structuredCompletion<EmailDraft>({
    system: EMAIL_DRAFT_PROMPT_V1,
    user: JSON.stringify({
      company: {
        name: company.name,
        oneLiner: company.oneLiner,
        sector: company.sector,
        stage: company.stage,
      },
      investor: {
        firm: match.firm.name,
        partner: match.person?.name,
        suggestedAngle: match.suggestedAngle,
      },
      signals,
    }),
    schema: emailDraftJsonSchema,
    schemaName: "email_draft",
  });

  const draft = emailDraftSchema.parse(raw);
  const staleCitations = signals.some((s) => s.isStale);

  const complianceFlags = runComplianceQC({
    subject: draft.subject,
    body: draft.body,
    regExemption: match.fundraise.regExemption,
    staleCitations,
  });

  return { draft, complianceFlags };
}
