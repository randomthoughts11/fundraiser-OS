"use client";

import { PIPELINE_COLUMNS } from "@/lib/types/pipeline";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineStatus } from "@/generated/prisma/client";

export type PipelineItem = {
  id: string;
  firmName: string;
  personName?: string | null;
  bucket: string;
  pipelineStatus: PipelineStatus;
  pipelineNotes?: string | null;
  priorityScore: number;
  latestMessage?: { id: string; subject: string; status: string } | null;
};

export function PipelineBoard({
  items,
  onStatusChange,
  onDraft,
}: {
  items: PipelineItem[];
  onStatusChange: (matchId: string, status: PipelineStatus) => void;
  onDraft: (matchId: string) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_COLUMNS.map((col) => (
        <div key={col.status} className="min-w-[280px] flex-shrink-0">
          <h3 className="mb-3 text-sm font-semibold text-zinc-500">{col.label}</h3>
          <div className="space-y-2">
            {items
              .filter((item) => item.pipelineStatus === col.status)
              .map((item) => (
                <Card key={item.id} className="p-4">
                  <CardHeader className="mb-2 p-0">
                    <CardTitle className="text-sm">{item.firmName}</CardTitle>
                    {item.personName && (
                      <p className="text-xs text-zinc-500">{item.personName}</p>
                    )}
                  </CardHeader>
                  <p className="mb-2 text-xs text-zinc-400">
                    Priority: {Math.round(item.priorityScore)}
                  </p>
                  {item.latestMessage && (
                    <p className="mb-2 truncate text-xs">{item.latestMessage.subject}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {col.status === "SHORTLISTED" && (
                      <button
                        type="button"
                        onClick={() => onDraft(item.id)}
                        className="rounded bg-zinc-900 px-2 py-1 text-xs text-white"
                      >
                        Draft email
                      </button>
                    )}
                    {col.nextStatus && (
                      <button
                        type="button"
                        onClick={() => onStatusChange(item.id, col.nextStatus!)}
                        className="rounded border px-2 py-1 text-xs"
                      >
                        → {PIPELINE_COLUMNS.find((c) => c.status === col.nextStatus)?.label}
                      </button>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
