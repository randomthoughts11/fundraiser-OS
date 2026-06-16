import { describe, it, expect } from "vitest";
import { normalizeInvestorName, dedupeKey } from "@/lib/ingestion/entity-resolution";

describe("entity resolution", () => {
  it("normalizes investor names", () => {
    expect(normalizeInvestorName("Acme Ventures LLC")).toBe("acme");
    expect(normalizeInvestorName("Beta Capital")).toBe("beta");
  });

  it("creates consistent dedup keys", () => {
    const key1 = dedupeKey({ name: "Acme Ventures", website: "https://acme.vc" });
    const key2 = dedupeKey({ name: "Acme Ventures LLC", website: "https://www.acme.vc" });
    expect(key1).toBe(key2);
  });
});
