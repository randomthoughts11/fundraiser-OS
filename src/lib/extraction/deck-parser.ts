export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const mod = await import("pdf-parse");
    const pdfParse = ("default" in mod ? mod.default : mod) as (
      buf: Buffer,
    ) => Promise<{ text: string }>;
    const result = await pdfParse(buffer);
    return result.text ?? "";
  } catch {
    return buffer.toString("utf-8").slice(0, 50000);
  }
}

export function chunkText(text: string, maxChunkSize = 12000): string {
  if (text.length <= maxChunkSize) return text;
  return text.slice(0, maxChunkSize);
}
