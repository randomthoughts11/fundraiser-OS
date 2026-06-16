import type { RawInvestorRecord } from "../entity-resolution";

const EDGAR_SEARCH_URL = "https://efts.sec.gov/LATEST/search-index";

export type EdgarFiling = {
  companyName: string;
  formType: string;
  filedAt: string;
  accessionNumber: string;
};

export async function searchEdgarFormD(query: string): Promise<EdgarFiling[]> {
  try {
    const url = `${EDGAR_SEARCH_URL}?q="${encodeURIComponent(query)}"&forms=FormD`;
    const response = await fetch(url, {
      headers: { "User-Agent": "FundraiseOS/1.0 (contact@fundraiseos.com)" },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      hits?: { hits?: Array<{ _source: Record<string, string> }> };
    };

    return (
      data.hits?.hits?.map((hit) => ({
        companyName: hit._source.display_names?.[0] ?? hit._source.entity_name ?? "Unknown",
        formType: hit._source.form_type ?? "FormD",
        filedAt: hit._source.file_date ?? new Date().toISOString(),
        accessionNumber: hit._source.adsh ?? "",
      })) ?? []
    );
  } catch {
    return [];
  }
}

export async function ingestEdgarSample(): Promise<RawInvestorRecord[]> {
  const filings = await searchEdgarFormD("venture capital");
  return filings.slice(0, 50).map((f) => ({
    name: f.companyName,
    sourceUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${f.accessionNumber}`,
    sourceType: "SEC_EDGAR",
  }));
}
