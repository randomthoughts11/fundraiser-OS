import { VERDICT_LABELS, type ReadinessReport } from "@/lib/types";
import { cn, formatCurrency, formatScore } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReadinessVerdict } from "@/generated/prisma/client";

const VERDICT_STYLES: Record<ReadinessVerdict, string> = {
  RAISE_NOW: "text-emerald-600",
  RAISE_ANGELS_ONLY: "text-blue-600",
  RAISE_PRE_SEED: "text-blue-600",
  RAISE_SEED: "text-indigo-600",
  DO_NOT_RAISE_YET: "text-red-600",
  NEED_LEAD_FIRST: "text-amber-600",
  STRATEGIC_CAPITAL_FIT: "text-purple-600",
};

export function ReadinessReportCard({ report }: { report: ReadinessReport }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardDescription>Fundraise readiness</CardDescription>
          <div className="flex items-end gap-4">
            <CardTitle className="text-4xl">{formatScore(report.score)}</CardTitle>
            <p className={cn("pb-1 text-lg font-medium", VERDICT_STYLES[report.verdict])}>
              {VERDICT_LABELS[report.verdict]}
            </p>
          </div>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-zinc-500">Target investor category</p>
            <p className="font-medium">{report.targetInvestorCategory}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Likely check size</p>
            <p className="font-medium">
              {formatCurrency(report.likelyCheckSizeRange.min)} –{" "}
              {formatCurrency(report.likelyCheckSizeRange.max)}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Narrative recommendation</CardTitle>
          </CardHeader>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {report.narrativeRecommendation}
          </p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What investors will ask</CardTitle>
          </CardHeader>
          <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {report.investorQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </Card>
      </div>

      {report.missingEvidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Missing evidence</CardTitle>
          </CardHeader>
          <ul className="flex flex-wrap gap-2">
            {report.missingEvidence.map((item) => (
              <li
                key={item}
                className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"
              >
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {report.milestonesBeforeOutreach.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Before you outreach</CardTitle>
          </CardHeader>
          <ul className="list-inside list-decimal space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {report.milestonesBeforeOutreach.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
