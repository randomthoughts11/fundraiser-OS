"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SECTOR_LABELS } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"PRE_MARKET_READY" | "MARKET_READY">("MARKET_READY");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const metrics: Array<{ key: string; value?: number; valueText?: string }> = [];

    if (mode === "MARKET_READY") {
      const arr = form.get("arr");
      const growth = form.get("growth_rate");
      const retention = form.get("retention");
      if (arr) metrics.push({ key: "arr", value: Number(arr) });
      if (growth) metrics.push({ key: "growth_rate", value: Number(growth) });
      if (retention) metrics.push({ key: "retention", value: Number(retention) });
    } else {
      const designPartners = form.get("design_partners");
      const lois = form.get("lois");
      if (designPartners) metrics.push({ key: "design_partners", value: Number(designPartners) });
      if (lois) metrics.push({ key: "lois", value: Number(lois) });
    }

    const payload = {
      founderName: form.get("founderName"),
      founderEmail: form.get("founderEmail"),
      companyName: form.get("companyName"),
      oneLiner: form.get("oneLiner") || undefined,
      description: form.get("description") || undefined,
      website: form.get("website") || undefined,
      sector: form.get("sector"),
      stage: form.get("stage"),
      fundraiseMode: mode,
      geography: form.get("geography") || "US",
      targetAmount: Number(form.get("targetAmount")),
      instrument: form.get("instrument") || "SAFE",
      regExemption: form.get("regExemption") || "UNDECIDED",
      hasCounsel: form.get("hasCounsel") === "on",
      roundUnlocks: form.get("roundUnlocks") || undefined,
      metrics,
    };

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      router.push(`/dashboard/${data.fundraiseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Start your fundraise profile</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          We analyze readiness before matching you to investors — so you do not burn leads pitching too early.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <Button
          type="button"
          variant={mode === "PRE_MARKET_READY" ? "default" : "outline"}
          onClick={() => setMode("PRE_MARKET_READY")}
        >
          Pre-market-ready
        </Button>
        <Button
          type="button"
          variant={mode === "MARKET_READY" ? "default" : "outline"}
          onClick={() => setMode("MARKET_READY")}
        >
          Market-ready
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Founder</CardTitle>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="founderName">Name</Label>
              <Input id="founderName" name="founderName" required />
            </div>
            <div>
              <Label htmlFor="founderEmail">Email</Label>
              <Input id="founderEmail" name="founderEmail" type="email" required />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company name</Label>
              <Input id="companyName" name="companyName" required />
            </div>
            <div>
              <Label htmlFor="oneLiner">One-liner</Label>
              <Input id="oneLiner" name="oneLiner" placeholder="What you do in one sentence" />
            </div>
            <div>
              <Label htmlFor="description">Product description</Label>
              <Textarea id="description" name="description" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="sector">Sector</Label>
                <Select id="sector" name="sector" required defaultValue="B2B_SAAS">
                  {Object.entries(SECTOR_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="stage">Stage</Label>
                <Select id="stage" name="stage" required defaultValue="SEED">
                  <option value="IDEA">Idea</option>
                  <option value="PRE_SEED">Pre-seed</option>
                  <option value="SEED">Seed</option>
                  <option value="SERIES_A">Series A</option>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Round</CardTitle>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="targetAmount">Target raise (USD)</Label>
              <Input id="targetAmount" name="targetAmount" type="number" defaultValue={2000000} required />
            </div>
            <div>
              <Label htmlFor="instrument">Instrument</Label>
              <Select id="instrument" name="instrument" defaultValue="SAFE">
                <option value="SAFE">SAFE</option>
                <option value="PRICED_ROUND">Priced round</option>
                <option value="CONVERTIBLE_NOTE">Convertible note</option>
                <option value="UNDECIDED">Undecided</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="regExemption">Reg D exemption (per counsel)</Label>
              <Select id="regExemption" name="regExemption" defaultValue="UNDECIDED">
                <option value="RULE_506B">506(b)</option>
                <option value="RULE_506C">506(c)</option>
                <option value="REG_CF">Reg CF</option>
                <option value="UNDECIDED">Undecided</option>
              </Select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="hasCounsel" />
                Working with counsel
              </label>
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="roundUnlocks">What will this round unlock?</Label>
            <Textarea id="roundUnlocks" name="roundUnlocks" placeholder="Hiring, GTM expansion, product milestones..." />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{mode === "MARKET_READY" ? "Traction metrics" : "Early proof points"}</CardTitle>
            <CardDescription>
              {mode === "MARKET_READY"
                ? "Revenue, growth, and retention drive readiness scoring."
                : "Design partners, LOIs, and team credibility — no fake traction."}
            </CardDescription>
          </CardHeader>
          {mode === "MARKET_READY" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="arr">ARR (USD)</Label>
                <Input id="arr" name="arr" type="number" placeholder="500000" />
              </div>
              <div>
                <Label htmlFor="growth_rate">MoM growth (%)</Label>
                <Input id="growth_rate" name="growth_rate" type="number" placeholder="12" />
              </div>
              <div>
                <Label htmlFor="retention">Net retention (%)</Label>
                <Input id="retention" name="retention" type="number" placeholder="110" />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="design_partners">Design partners</Label>
                <Input id="design_partners" name="design_partners" type="number" placeholder="3" />
              </div>
              <div>
                <Label htmlFor="lois">LOIs</Label>
                <Input id="lois" name="lois" type="number" placeholder="1" />
              </div>
            </div>
          )}
        </Card>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "Analyzing readiness..." : "Analyze readiness & continue"}
        </Button>

        <p className="text-center text-xs text-zinc-500">
          After creating your profile, upload your pitch deck from the dashboard for AI extraction.
        </p>
      </form>
    </div>
  );
}
