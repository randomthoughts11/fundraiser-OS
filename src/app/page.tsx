import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Target,
  Shield,
  Brain,
  BarChart3,
  Mail,
  Users,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Fundraise readiness score",
    description:
      "Know whether you are ready for angels, pre-seed, or seed — before burning investor leads.",
  },
  {
    icon: Brain,
    title: "Investor intelligence graph",
    description:
      "Partner-level matching with source-backed signals, not generic tag matching.",
  },
  {
    icon: Target,
    title: "Fit × access scoring",
    description:
      "Separate strategic fit from realistic access. Prioritized buckets, not 500-name lists.",
  },
  {
    icon: Mail,
    title: "Founder-approved outreach",
    description:
      "AI drafts grounded in real investor signals. You review and send every message.",
  },
  {
    icon: Users,
    title: "Warm intro mapping",
    description:
      "Identify the best intro path — or when cold outreach beats a weak connection.",
  },
  {
    icon: Shield,
    title: "Compliance-safe workflow",
    description:
      "Audit logs, suppression lists, and Reg D-aware controls. No success fees.",
  },
];

export default function HomePage() {
  return (
    <div className="flex-1">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium text-zinc-500">
            Fundraising intelligence platform
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Run a sharper, data-backed fundraise — not spray-and-pray outreach
          </h1>
          <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400">
            The fundraising intelligence and execution platform for U.S. startups raising
            pre-seed, seed, and Series A. Avoid targeting the wrong investors, pitching too
            early, or running legally risky campaigns.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/onboarding">
              <Button size="lg">Analyze readiness</Button>
            </Link>
            <Link href="/onboarding">
              <Button size="lg" variant="outline">
                Build investor shortlist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-2xl font-bold">
            Better than generic investor databases
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="mb-2 h-5 w-5 text-zinc-500" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pre-market-ready mode</CardTitle>
              <CardDescription>For startups without strong revenue yet</CardDescription>
            </CardHeader>
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <li>Founder-market fit, moat, and timing</li>
              <li>Design partners, LOIs, waitlist quality</li>
              <li>Match to pre-seed funds, angels, scouts</li>
              <li>Narrative sells insight — not fake traction</li>
            </ul>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Market-ready mode</CardTitle>
              <CardDescription>For startups with product in market</CardDescription>
            </CardHeader>
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <li>Revenue, growth, retention, unit economics</li>
              <li>Match to seed and Series A lead funds</li>
              <li>Evidence-heavy narrative with traction proof</li>
              <li>Round size aligned to milestones</li>
            </ul>
          </Card>
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <p className="text-center text-xs text-zinc-500">
          Software that helps founders organize fundraising research, prepare materials,
          identify potentially relevant investors, draft communications, and manage their own
          outreach. Not a broker-dealer or placement agent.
        </p>
      </footer>
    </div>
  );
}
