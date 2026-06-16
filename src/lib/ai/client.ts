import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export async function createEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    return [];
  }
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data[0]?.embedding ?? [];
}

export async function structuredCompletion<T>(input: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  schemaName: string;
}): Promise<T> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: input.schemaName,
        schema: input.schema,
        strict: true,
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No AI response");
  return JSON.parse(content) as T;
}
