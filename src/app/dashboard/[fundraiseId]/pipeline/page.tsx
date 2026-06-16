"use client";

import { useEffect, useState } from "react";
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
      <h1 className="mb-6 text-2xl font-bold">Pipeline</h1>
      <PipelineBoard items={items} onStatusChange={handleStatusChange} onDraft={handleDraft} />
    </div>
  );
}
