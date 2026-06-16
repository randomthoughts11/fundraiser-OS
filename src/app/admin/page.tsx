"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type IngestionStats = {
  firmCount: number;
  personCount: number;
  signalCount: number;
  staleSignals: number;
  recentJobs: Array<{ id: string; jobType: string; status: string; recordsProcessed: number }>;
};

export default function AdminPage() {
  const [stats, setStats] = useState<IngestionStats | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/ingestion")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => null);
  }, []);

  async function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setImporting(true);
    const form = new FormData(e.currentTarget);
    await fetch("/api/admin/investors/import", { method: "POST", body: form });
    setImporting(false);
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">Admin — Ingestion</h1>

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Firms", stats.firmCount],
            ["Partners", stats.personCount],
            ["Signals", stats.signalCount],
            ["Stale", stats.staleSignals],
          ].map(([label, value]) => (
            <Card key={label as string} className="p-4 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-zinc-500">{label}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Bulk investor CSV import</CardTitle>
          <p className="text-sm text-zinc-500">
            Format: name, website, sectors (pipe-separated), stages (pipe-separated), checkMin,
            checkMax
          </p>
        </CardHeader>
        <form onSubmit={handleImport} className="space-y-4">
          <input type="file" name="file" accept=".csv" required />
          <button
            type="submit"
            disabled={importing}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            {importing ? "Importing..." : "Import investors"}
          </button>
        </form>
      </Card>

      {stats?.recentJobs && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent ingestion jobs</CardTitle>
          </CardHeader>
          <ul className="space-y-2 text-sm">
            {stats.recentJobs.map((job) => (
              <li key={job.id} className="flex justify-between">
                <span>{job.jobType}</span>
                <span className="text-zinc-500">
                  {job.status} — {job.recordsProcessed} records
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
