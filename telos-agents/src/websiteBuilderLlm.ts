import { OPENROUTER_API_KEY, WEBSITE_BUILDER_MODEL } from "./config.js";

const SYSTEM = `You output ONLY a single HTML fragment (no markdown, no code fences).
Rules:
- No <!DOCTYPE>, <html>, <head>, or <body> wrappers.
- No <script>, <iframe>, <object>, <embed>, or event handler attributes (onclick=, onerror=, etc.).
- Use semantic tags: main, section, header, h1-h3, p, ul, li, a (href only https: or relative #), button (type="button" only).
- You may use class="..." with Tailwind-style utility names for layout (flex, grid, p-4, text-gray-600, etc.).
- Keep under 4000 characters of HTML.`;

function stripOuterFence(s: string): string {
  return s
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/** Remove obvious XSS vectors (best-effort; not a full sanitizer). */
export function sanitizeHtmlFragment(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\sjavascript:/gi, "")
    .slice(0, 12_000);
}

export async function runWebsiteBuilderLlm(userPrompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "X-Title": "telos-agents-website-builder",
    },
    body: JSON.stringify({
      model: WEBSITE_BUILDER_MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 3500,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`OpenRouter HTTP ${res.status}: ${raw.slice(0, 400)}`);
  }

  const data = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenRouter returned empty content");
  }

  return sanitizeHtmlFragment(stripOuterFence(content));
}
