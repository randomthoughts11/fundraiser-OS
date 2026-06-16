import type { PipelineStatus } from "@/generated/prisma/client";

export const PIPELINE_COLUMNS: Array<{
  status: PipelineStatus;
  label: string;
  nextStatus?: PipelineStatus;
}> = [
  { status: "SHORTLISTED", label: "Shortlisted", nextStatus: "DRAFT_READY" },
  { status: "DRAFT_READY", label: "Draft Ready", nextStatus: "APPROVED" },
  { status: "APPROVED", label: "Approved", nextStatus: "SENT" },
  { status: "SENT", label: "Sent", nextStatus: "REPLIED" },
  { status: "REPLIED", label: "Replied", nextStatus: "MEETING" },
  { status: "MEETING", label: "Meeting" },
  { status: "PASSED", label: "Passed" },
];
