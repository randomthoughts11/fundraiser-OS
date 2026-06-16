import type { RegExemption } from "@/generated/prisma/client";
import { getRegExemptionRules } from "./reg-exemption-rules";

export type QCFlag = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type QCResult = {
  passed: boolean;
  flags: QCFlag[];
};

const HYPE_PATTERNS = [
  /guaranteed returns/i,
  /will 10x/i,
  /can't lose/i,
  /best investment/i,
  /once in a lifetime/i,
];

const UNVERIFIABLE_PATTERNS = [
  /leading the market/i,
  /dominant player/i,
  /no competition/i,
  /trillion.?dollar market/i,
];

export function runComplianceQC(input: {
  subject: string;
  body: string;
  regExemption: RegExemption;
  investorMismatch?: boolean;
  staleCitations?: boolean;
  duplicateContact?: boolean;
}): QCResult {
  const flags: QCFlag[] = [];
  const text = `${input.subject}\n${input.body}`;

  for (const pattern of HYPE_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        code: "HYPE_LANGUAGE",
        message: "Message contains hype language that may create legal risk",
        severity: "error",
      });
      break;
    }
  }

  for (const pattern of UNVERIFIABLE_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        code: "UNVERIFIABLE_CLAIM",
        message: "Message contains unverifiable market claims",
        severity: "warning",
      });
      break;
    }
  }

  if (!/unsubscribe|opt.?out/i.test(text)) {
    flags.push({
      code: "MISSING_OPT_OUT",
      message: "Commercial email should include opt-out language",
      severity: "warning",
    });
  }

  if (input.investorMismatch) {
    flags.push({
      code: "INVESTOR_MISMATCH",
      message: "Investor may not match company stage or sector",
      severity: "error",
    });
  }

  if (input.staleCitations) {
    flags.push({
      code: "STALE_CITATION",
      message: "Personalization cites stale investor signals (>90 days)",
      severity: "warning",
    });
  }

  if (input.duplicateContact) {
    flags.push({
      code: "DUPLICATE_CONTACT",
      message: "This investor was already contacted in this fundraise",
      severity: "error",
    });
  }

  const regRules = getRegExemptionRules(input.regExemption);
  for (const rule of regRules) {
    if (rule.pattern.test(text)) {
      flags.push({
        code: rule.code,
        message: rule.message,
        severity: rule.severity,
      });
    }
  }

  const hasErrors = flags.some((f) => f.severity === "error");
  return { passed: !hasErrors, flags };
}
