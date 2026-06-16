import { BUCKET_LABELS, type InvestorMatchResult } from "@/lib/types";
import { cn, formatScore } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvestorBucket } from "@/generated/prisma/client";

const BUCKET_STYLES: Record<InvestorBucket, string> = {
  MUST_REACH: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  HIGH_FIT_LEAD: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  HIGH_FIT_ANGEL: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  GOOD_FOLLOW_ON: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  STRATEGIC: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  LOW_PRIORITY: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  DO_NOT_CONTACT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function InvestorMatchCard({ match }: { match: InvestorMatchResult }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{match.firmName}</CardTitle>
            {match.personName && (
              <CardDescription className="mt-1">
                Partner: {match.personName}
              </CardDescription>
            )}
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
              BUCKET_STYLES[match.bucket],
            )}
          >
            {BUCKET_LABELS[match.bucket]}
          </span>
        </div>
      </CardHeader>

      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-zinc-500">Fit</p>
          <p className="font-semibold">{formatScore(match.fitScore)}</p>
        </div>
        <div>
          <p className="text-zinc-500">Access</p>
          <p className="font-semibold">{formatScore(match.accessScore)}</p>
        </div>
        <div>
          <p className="text-zinc-500">Priority</p>
          <p className="font-semibold">{formatScore(match.priorityScore)}</p>
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="mb-2 font-medium">Why this investor</p>
          <ul className="space-y-2">
            {match.explanation.reasons.map((reason, i) => (
              <li key={i} className="text-zinc-600 dark:text-zinc-400">
                <span>{reason.text}</span>
                {reason.sourceUrl && (
                  <a
                    href={reason.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-xs text-blue-600 hover:underline"
                  >
                    Source ({Math.round(reason.confidence * 100)}%)
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {match.explanation.whyNow.length > 0 && (
          <div>
            <p className="mb-2 font-medium">Why now</p>
            <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
              {match.explanation.whyNow.map((signal, i) => (
                <li key={i}>• {signal.signal}</li>
              ))}
            </ul>
          </div>
        )}

        {match.explanation.potentialConcern && (
          <div className="rounded-lg bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
            <p className="font-medium">Potential concern</p>
            <p className="mt-1">{match.explanation.potentialConcern}</p>
          </div>
        )}

        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <p className="font-medium">Suggested angle</p>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {match.explanation.suggestedAngle}
          </p>
        </div>

        {match.explanation.bestContactPath && (
          <p className="text-zinc-500">
            Best route: {match.explanation.bestContactPath}
          </p>
        )}
      </div>
    </Card>
  );
}
