import { DEEP_RESEARCH_MODEL, OPENROUTER_API_KEY, OPENROUTER_MODEL } from "./config.js";

export type ResearchDepth = "fast" | "standard" | "deep";

export type DeepResearchResult = {
  executive_summary: string;
  sections: Array<{ title: string; content: string }>;
  key_terms: Array<{ term: string; definition: string }>;
  limitations: string;
  further_questions: string[];
};

const SYSTEM = `You are a careful research assistant. Use your training knowledge; do not invent specific paper titles, URLs, or dates unless you are confident they exist.

Respond with ONLY valid JSON (no markdown code fences, no commentary). Schema:
{
  "executive_summary": string (3-5 sentences),
  "sections": [ { "title": string, "content": string (2-4 paragraphs of substantive analysis) } ] (3-5 sections),
  "key_terms": [ { "term": string, "definition": string } ] (4-8 items),
  "limitations": string (what you could not verify or what the user should double-check),
  "further_questions": string[] (3-6 follow-up questions for deeper work)
}

Write clearly for a technical reader. If the topic is ambiguous, state assumptions in limitations.`;

function stripJsonFence(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function maxTokensForDepth(depth: ResearchDepth): number {
  switch (depth) {
    case "fast":
      return 1800;
    case "deep":
      return 8000;
    default:
      return 4500;
  }
}

function temperatureForDepth(depth: ResearchDepth): number {
  return depth === "deep" ? 0.45 : 0.35;
}

/**
 * Structured deep research via OpenRouter. Requires OPENROUTER_API_KEY.
 */
export async function runDeepResearchLlm(
  topic: string,
  depth: ResearchDepth = "standard",
): Promise<DeepResearchResult> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const model = DEEP_RESEARCH_MODEL || OPENROUTER_MODEL;
  const userPrompt =
    depth === "fast"
      ? `Topic: ${topic}\nProvide a concise but structured analysis (depth: fast).`
      : depth === "deep"
        ? `Topic: ${topic}\nProvide a thorough analysis (depth: deep). Include nuance, tradeoffs, and edge cases.`
        : `Topic: ${topic}\nProvide a balanced analysis (depth: standard).`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "X-Title": "telos-agents-deep-research",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
      temperature: temperatureForDepth(depth),
      max_tokens: maxTokensForDepth(depth),
    }),
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`OpenRouter HTTP ${res.status}: ${rawText.slice(0, 400)}`);
  }

  const data = JSON.parse(rawText) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenRouter returned empty content");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(content));
  } catch {
    throw new Error(`Model did not return valid JSON. Raw (truncated): ${content.slice(0, 300)}`);
  }

  const o = parsed as Record<string, unknown>;
  if (typeof o.executive_summary !== "string" || !Array.isArray(o.sections)) {
    throw new Error("JSON missing executive_summary or sections");
  }

  return parsed as DeepResearchResult;
}
