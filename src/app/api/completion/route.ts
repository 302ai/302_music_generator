import { env } from "@/env";
import { normalizeUrl } from "@/utils/api";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  const { prompt, apiKey }: { prompt: string; apiKey: string } =
    await req.json();

  const openai = createOpenAI({
    apiKey,
    baseURL: normalizeUrl(env.NEXT_PUBLIC_API_URL) + "/v1",
  });

  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    system:
      "You generate three styles for a music lyrics, language is the same as the lyrics.",
    prompt,
    schema: z.object({
      styles: z.array(z.string().describe("A style for a music lyrics.")),
    }),
  });

  return result.toJsonResponse();
}
