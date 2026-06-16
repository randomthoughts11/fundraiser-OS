import type { RegExemption } from "@/generated/prisma/client";

type RegRule = {
  code: string;
  message: string;
  pattern: RegExp;
  severity: "error" | "warning";
};

export function getRegExemptionRules(exemption: RegExemption): RegRule[] {
  if (exemption === "RULE_506C") {
    return [
      {
        code: "506C_BROAD_SOLICITATION",
        message:
          "506(c) allows broad solicitation only with accredited investor verification — ensure your counsel has approved this language",
        pattern: /invest now|limited spots|act fast/i,
        severity: "warning",
      },
    ];
  }

  if (exemption === "RULE_506B") {
    return [
      {
        code: "506B_GENERAL_SOLICITATION",
        message:
          "506(b) generally prohibits general solicitation — review message with counsel before sending broadly",
        pattern: /public offering|open to all investors/i,
        severity: "error",
      },
    ];
  }

  return [];
}
