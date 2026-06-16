import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { structuredCompletion } from "@/lib/ai/client";
import { REPLY_CLASSIFIER_PROMPT_V1 } from "@/lib/ai/prompts/deck-extraction-v1";
import type { ReplySentiment } from "@/generated/prisma/client";

type ReplyClassification = {
  sentiment: ReplySentiment;
  meetingRequested: boolean;
  passReason?: string;
};

export const classifyReply = inngest.createFunction(
  { id: "classify-reply", triggers: [{ event: "reply/classify" }] },
  async ({ event }) => {
    const { messageId, body } = event.data as { messageId: string; body: string };

    let classification: ReplyClassification = {
      sentiment: "NEUTRAL",
      meetingRequested: false,
    };

    if (process.env.OPENAI_API_KEY) {
      classification = await structuredCompletion<ReplyClassification>({
        system: REPLY_CLASSIFIER_PROMPT_V1,
        user: body,
        schema: {
          type: "object",
          properties: {
            sentiment: {
              type: "string",
              enum: ["POSITIVE", "NEUTRAL", "NEGATIVE", "PASS", "MEETING_REQUEST"],
            },
            meetingRequested: { type: "boolean" },
            passReason: { type: "string" },
          },
          required: ["sentiment", "meetingRequested"],
          additionalProperties: false,
        },
        schemaName: "reply_classification",
      });
    } else {
      if (/meet|call|chat|coffee/i.test(body)) {
        classification = { sentiment: "MEETING_REQUEST", meetingRequested: true };
      } else if (/pass|not a fit|decline/i.test(body)) {
        classification = { sentiment: "PASS", meetingRequested: false, passReason: body.slice(0, 200) };
      }
    }

    const reply = await prisma.reply.create({
      data: {
        messageId,
        body,
        sentiment: classification.sentiment,
        classified: classification as object,
      },
    });

    const message = await prisma.message.findUniqueOrThrow({
      where: { id: messageId },
      include: { match: true },
    });

    await prisma.message.update({
      where: { id: messageId },
      data: { status: "REPLIED" },
    });

    if (message.matchId) {
      const pipelineStatus =
        classification.meetingRequested ? "MEETING" :
        classification.sentiment === "PASS" ? "PASSED" : "REPLIED";

      await prisma.investorMatch.update({
        where: { id: message.matchId },
        data: { pipelineStatus },
      });

      const existing = await prisma.outcome.findFirst({
        where: { matchId: message.matchId },
      });

      const outcomeData = {
        sent: true,
        replied: true,
        positiveReply: classification.sentiment === "POSITIVE" || classification.sentiment === "MEETING_REQUEST",
        meetingBooked: classification.meetingRequested,
        passed: classification.sentiment === "PASS",
        passReason: classification.passReason,
      };

      if (existing) {
        await prisma.outcome.update({ where: { id: existing.id }, data: outcomeData });
      } else {
        await prisma.outcome.create({ data: { matchId: message.matchId, ...outcomeData } });
      }
    }

    return { replyId: reply.id, classification };
  },
);
