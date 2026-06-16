"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type MessageItem = {
  id: string;
  subject: string;
  body: string;
  status: string;
  complianceFlags?: { passed: boolean; flags: Array<{ message: string }> };
};

export default function OutreachPage({
  params,
}: {
  params: Promise<{ fundraiseId: string }>;
}) {
  const [fundraiseId, setFundraiseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);

  useEffect(() => {
    params.then(({ fundraiseId: id }) => setFundraiseId(id));
  }, [params]);

  useEffect(() => {
    if (!fundraiseId) return;
    fetch(`/api/pipeline?fundraiseId=${fundraiseId}`)
      .then((r) => r.json())
      .then((items) => {
        const msgs = (Array.isArray(items) ? items : [])
          .filter((i: { latestMessage?: MessageItem }) => i.latestMessage)
          .map((i: { latestMessage: MessageItem }) => i.latestMessage);
        setMessages(msgs);
      });
  }, [fundraiseId]);

  async function approve(id: string) {
    await fetch(`/api/messages/${id}/approve`, { method: "POST" });
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "APPROVED" } : m)),
    );
  }

  async function markSent(id: string) {
    await fetch(`/api/messages/${id}/send`, { method: "POST" });
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "SENT" } : m)),
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">Outreach drafts</h1>

      {messages.length === 0 ? (
        <p className="text-zinc-500">No drafts yet. Generate from the pipeline board.</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card key={msg.id}>
              <CardHeader>
                <CardTitle className="text-base">{msg.subject}</CardTitle>
                <p className="text-xs text-zinc-500">Status: {msg.status}</p>
              </CardHeader>
              <pre className="mb-4 whitespace-pre-wrap text-sm text-zinc-600">{msg.body}</pre>
              <div className="flex gap-2">
                {msg.status === "DRAFT" && (
                  <Button size="sm" onClick={() => approve(msg.id)}>
                    Approve
                  </Button>
                )}
                {msg.status === "APPROVED" && (
                  <Button size="sm" onClick={() => markSent(msg.id)}>
                    Mark as sent
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-zinc-500">
        Founder-controlled outreach. You send all investor communications. This platform does not
        raise capital on your behalf.
      </p>
    </div>
  );
}
