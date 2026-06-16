"use client";

import { useEffect, useState } from "react";
import { ReadinessReportCard } from "@/components/readiness/readiness-report";
import { InvestorMatchCard } from "@/components/investors/investor-match-card";
import { Button } from "@/components/ui/button";
import type { ReadinessReport, InvestorMatchResult } from "@/lib/types";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ fundraiseId: string }>;
}) {
  const [fundraiseId, setFundraiseId] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);
  const [matches, setMatches] = useState<InvestorMatchResult[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [funnel, setFunnel] = useState<{ sent: number; replied: number; replyRate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"readiness" | "investors">("readiness");

  useEffect(() => {
    params.then(({ fundraiseId: id }) => setFundraiseId(id));
  }, [params]);

  useEffect(() => {
    if (!fundraiseId) return;

    async function load() {
      setLoading(true);
      try {
        const [fundraiseRes, matchesRes, funnelRes] = await Promise.all([
          fetch(`/api/fundraise/${fundraiseId}`),
          fetch(`/api/matches?fundraiseId=${fundraiseId}`),
          fetch(`/api/analytics/funnel?fundraiseId=${fundraiseId}`),
        ]);

        if (fundraiseRes.ok) {
          const data = await fundraiseRes.json();
          setReadiness(data.readinessReport);
          setCompanyId(data.company?.id ?? null);
        }

        if (funnelRes.ok) {
          setFunnel(await funnelRes.json());
        }

        if (matchesRes.ok) {
          const data = await matchesRes.json();
          setMatches(data.top ?? []);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [fundraiseId]);

  async function uploadDeck(e: React.ChangeEvent<HTMLInputElement>) {
    if (!companyId || !e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    await fetch(`/api/companies/${companyId}/deck`, { method: "POST", body: formData });
    alert("Deck uploaded — extraction queued.");
  }

  async function persistMatches() {
    if (!fundraiseId) return;
    await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fundraiseId }),
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-zinc-500">Loading fundraise intelligence...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fundraise command center</h1>
        </div>
        <Button variant="outline" onClick={persistMatches}>
          Refresh matches
        </Button>
      </div>

      {funnel && funnel.sent > 0 && (
        <p className="mb-4 text-sm text-zinc-500">
          Campaign: {funnel.sent} sent · {funnel.replied} replied ·{" "}
          {Math.round(funnel.replyRate * 100)}% reply rate
        </p>
      )}

      {companyId && (
        <div className="mb-6">
          <label className="text-sm font-medium">Upload pitch deck (PDF)</label>
          <input type="file" accept=".pdf" onChange={uploadDeck} className="mt-1 block text-sm" />
        </div>
      )}

      <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setTab("readiness")}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "readiness"
              ? "border-zinc-900 dark:border-zinc-100"
              : "border-transparent text-zinc-500"
          }`}
        >
          Readiness
        </button>
        <button
          type="button"
          onClick={() => setTab("investors")}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "investors"
              ? "border-zinc-900 dark:border-zinc-100"
              : "border-transparent text-zinc-500"
          }`}
        >
          Investor matches ({matches.length})
        </button>
      </div>

      {tab === "readiness" && readiness && <ReadinessReportCard report={readiness} />}

      {tab === "investors" && (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <p className="text-zinc-500">
              No investor matches yet. Run the seed script to load sample investor data.
            </p>
          ) : (
            matches.map((match) => (
              <InvestorMatchCard key={`${match.firmId}-${match.personId}`} match={match} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
