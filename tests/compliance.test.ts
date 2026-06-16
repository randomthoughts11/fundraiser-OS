import { describe, it, expect } from "vitest";
import { runComplianceQC } from "@/lib/compliance/qc-engine";
import { RegExemption } from "@/generated/prisma/client";

describe("compliance QC", () => {
  it("flags hype language", () => {
    const result = runComplianceQC({
      subject: "Investment opportunity",
      body: "This is a guaranteed returns opportunity. Unsubscribe anytime.",
      regExemption: RegExemption.RULE_506B,
    });
    expect(result.passed).toBe(false);
    expect(result.flags.some((f) => f.code === "HYPE_LANGUAGE")).toBe(true);
  });

  it("passes clean professional email", () => {
    const result = runComplianceQC({
      subject: "Quick intro — B2B workflow automation",
      body: "Hi Jane, I noticed your recent investment in developer tooling. We are building workflow automation for enterprise teams. Would love to share more if relevant. Happy to unsubscribe if not a fit.",
      regExemption: RegExemption.RULE_506B,
    });
    expect(result.passed).toBe(true);
  });

  it("flags 506b general solicitation language", () => {
    const result = runComplianceQC({
      subject: "Open round",
      body: "This is a public offering open to all investors. Unsubscribe here.",
      regExemption: RegExemption.RULE_506B,
    });
    expect(result.flags.some((f) => f.code === "506B_GENERAL_SOLICITATION")).toBe(true);
  });
});
