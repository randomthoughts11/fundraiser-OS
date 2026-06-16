export async function crawlPortfolioPage(url: string): Promise<{
  companies: string[];
  contentHash: string;
}> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "FundraiseOS/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { companies: [], contentHash: "" };
    }

    const html = await response.text();
    const contentHash = Buffer.from(html).toString("base64").slice(0, 32);

    const companyPattern = /<(?:h[2-4]|li|a)[^>]*>([^<]{2,60})<\/(?:h[2-4]|li|a)>/gi;
    const companies: string[] = [];
    let match;
    while ((match = companyPattern.exec(html)) !== null && companies.length < 50) {
      const name = match[1].trim();
      if (name.length > 2 && !name.includes("http")) {
        companies.push(name);
      }
    }

    return { companies: [...new Set(companies)], contentHash };
  } catch {
    return { companies: [], contentHash: "" };
  }
}
