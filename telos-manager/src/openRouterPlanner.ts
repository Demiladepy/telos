import { OPENROUTER_API_KEY, OPENROUTER_MODEL } from "./config.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function stripCodeFence(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * Ask OpenRouter for a single JSON object: { "capability", "path" }.
 * `capabilities` should come from the registry; if empty, the model is nudged toward `weather` only.
 */
export async function planPromptWithOpenRouter(
  userPrompt: string,
  capabilities: string[],
): Promise<{ capability: string; path: string }> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const capList =
    capabilities.length > 0
      ? capabilities.join(", ")
      : "weather (no agents in registry yet; use capability weather and paths like /weather/testnet?city=CityName)";

  const system = `You route user requests to paid agent HTTP endpoints. Respond with a single JSON object only — no markdown, no code fences, no explanation.
Fields:
- "capability": string — must be exactly one of the allowed capabilities (case-sensitive as listed).
- "path": string — must start with / and include a query string when needed. Use + for spaces in query values (e.g. /weather/testnet?city=San+Francisco).

Allowed capabilities: ${capList}`;

  const referer = process.env.OPENROUTER_HTTP_REFERER?.trim();
  const title = process.env.OPENROUTER_APP_TITLE?.trim() ?? "telos-manager";

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENROUTER_API_KEY}`,
      ...(referer ? { "HTTP-Referer": referer } : {}),
      "X-Title": title,
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`OpenRouter HTTP ${res.status}: ${rawText.slice(0, 500)}`);
  }

  const data = JSON.parse(rawText) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenRouter returned empty message content");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(content));
  } catch {
    throw new Error(`OpenRouter returned non-JSON: ${content.slice(0, 200)}`);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { capability?: unknown }).capability !== "string" ||
    typeof (parsed as { path?: unknown }).path !== "string"
  ) {
    throw new Error("Planner JSON must have string fields capability and path");
  }

  const { capability, path } = parsed as { capability: string; path: string };
  if (!path.startsWith("/")) {
    throw new Error(`path must start with /, got: ${path}`);
  }

  if (capabilities.length > 0 && !capabilities.includes(capability)) {
    throw new Error(`capability "${capability}" is not in the registry list`);
  }

  return { capability, path };
}
