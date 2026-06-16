export function normalizeInvestorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(llc|lp|inc|ltd|corp|co)\b\.?/gi, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+(ventures|capital|partners|fund|vc)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type RawInvestorRecord = {
  name: string;
  website?: string;
  sectorFocus?: string[];
  stageFocus?: string[];
  checkSizeMin?: number;
  checkSizeMax?: number;
  sourceUrl?: string;
  sourceType?: string;
};

export function dedupeKey(record: RawInvestorRecord): string {
  const normalized = normalizeInvestorName(record.name);
  const domain = record.website
    ? new URL(record.website.startsWith("http") ? record.website : `https://${record.website}`)
        .hostname.replace("www.", "")
    : "";
  return `${normalized}:${domain}`;
}
