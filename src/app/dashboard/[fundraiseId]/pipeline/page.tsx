"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PipelineBoard, type PipelineItem } from "@/components/pipeline/pipeline-board";
import type { PipelineStatus } from "@/generated/prisma/client";

export default function PipelinePage({
  params,
}: {
  params: Promise<{ fundraiseId: string }>;
}) {
  const [fundraiseId, setFundraiseId] = useState<string | null>(null);
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ fundraiseId: id }) => setFundraiseId(id));
  }, [params]);

  useEffect(() => {
    if (!fundraiseId) return;
    fetch(`/api/pipeline?fundraiseId=${fundraiseId}`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [fundraiseId]);

  async function handleStatusChange(matchId: string, status: PipelineStatus) {
    await fetch(`/api/pipeline/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineStatus: status }),
    });
    setItems((prev) =>
      prev.map((item) => (item.id === matchId ? { ...item, pipelineStatus: status } : item)),
    );
  }

  async function handleDraft(matchId: string) {
    await fetch("/api/messages/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, fundraiseId }),
    });
    await handleStatusChange(matchId, "DRAFT_READY");
  }

  if (loading) return <p className="p-8 text-zinc-500">Loading pipeline...</p>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/${fundraiseId}`}
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Pipeline</h1>
        </div>
        <Link
          href={`/dashboard/${fundraiseId}/outreach`}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Outreach drafts
        </Link>
      </div>
      <PipelineBoard items={items} onStatusChange={handleStatusChange} onDraft={handleDraft} />
    </div>
  );
}
