import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { evaluate } from "mathjs";
import { z } from "zod";
import {
  COINGECKO_API_KEY,
  DEEP_RESEARCH_MODEL,
  getDeepResearchHireUrl,
  isHiringWalletConfigured,
  OPENROUTER_API_KEY,
  OPENROUTER_MODEL,
  WEBSITE_BUILDER_MODEL,
} from "./config.js";
import { fetchCoinGeckoUsd, fetchCryptoSentiment } from "./coingecko.js";
import { runDeepResearchLlm } from "./deepResearchLlm.js";
import { hireDeepResearch, hirePaidAgent, hireRegistryAgent } from "./hiring.js";
import { runWebsiteBuilderLlm } from "./websiteBuilderLlm.js";

const OPEN_METEO_GEO = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_FC = "https://api.open-meteo.com/v1/forecast";

const WMO: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  61: "slight rain",
  63: "moderate rain",
  95: "thunderstorm",
};

const hireExternalSchema = z.object({
  url: z.string().url().max(2048),
  method: z.enum(["GET", "POST"]).default("POST"),
  body: z.unknown().optional(),
});

const hireFromRegistrySchema = z.object({
  agentId: z.string().min(1).max(128),
  path: z.string().min(1).max(512),
  method: z.enum(["GET", "POST"]).default("POST"),
  body: z.unknown().optional(),
});

const mathBody = z.object({
  expr: z.string().min(1).max(500),
  /** Explicit hire: pays deep-research endpoint (x402) from AGENT_HIRING_STELLAR_SECRET. */
  delegateResearch: z.object({ prompt: z.string().min(1).max(8000) }).optional(),
  /** If true and expr looks "technical", auto-builds a research prompt and hires deep-research. */
  autoDelegateResearch: z.boolean().optional(),
  /** Hire any allowlisted x402 HTTP agent by absolute URL. */
  hireExternal: hireExternalSchema.optional(),
  /** Hire via telos-registry agent id + path (set REGISTRY_URL). */
  hireFromRegistry: hireFromRegistrySchema.optional(),
});
const textBody = z.object({ text: z.string().min(1).max(50_000) });

const cryptoSentimentBody = z
  .object({
    /** Ticker, e.g. BTC — used with CoinGecko when COINGECKO_API_KEY is set */
    symbol: z.string().min(1).max(32).optional(),
    /** Optional narrative; combined with market data or keyword fallback */
    text: z.string().min(1).max(50_000).optional(),
  })
  .refine((d) => Boolean(d.symbol?.trim()) || Boolean(d.text?.trim()), {
    message: "Provide symbol (e.g. BTC) and/or text",
  });

const TICKER_IN_TEXT = /\b(BTC|ETH|XLM|SOL|DOGE|ADA|DOT|AVAX|LINK|UNI|SHIB|XRP|MATIC|POL|LTC|ATOM)\b/i;

function guessSymbolFromText(text: string): string | null {
  const m = text.match(TICKER_IN_TEXT);
  return m ? m[1]!.toUpperCase() : null;
}

function keywordSentimentAdjust(text: string): number {
  const t = text.toLowerCase();
  const bullish = ["moon", "bull", "buy", "up", "pump", "rocket"].some((k) => t.includes(k));
  const bearish = ["bear", "sell", "crash", "down", "dump", "rug"].some((k) => t.includes(k));
  if (bullish && !bearish) return 0.06;
  if (bearish && !bullish) return -0.06;
  return 0;
}
const symbolQuery = z.object({ symbol: z.string().min(1).max(32).optional() });
const promptBodyFixed = z.object({ prompt: z.string().min(1).max(8000) });

const deepResearchBody = z.object({
  prompt: z.string().min(1).max(8000),
  /** fast = shorter; standard = balanced; deep = longer analysis (more tokens). */
  depth: z.enum(["fast", "standard", "deep"]).optional().default("standard"),
});

function technicalMathResearchPrompt(expr: string): string | null {
  if (
    !/\b(integrat|derivative|lim\b|tensor|manifold|proof|theorem|eigen|jacobian|ODE|PDE|∫|∑|gradient|hessian)\b/i.test(
      expr,
    )
  ) {
    return null;
  }
  return `Mathematical query: "${expr}". Give a short research-style outline: core concepts, common pitfalls, and what to read next.`;
}

export function agentRouter(): Router {
  const r = createRouter();

  r.get("/weather/testnet", async (req: Request, res: Response) => {
    const city = String(req.query.city ?? "").trim();
    if (!city) {
      res.status(400).json({ error: "missing_query", message: "Add ?city=Name" });
      return;
    }
    try {
      const geo = await fetch(`${OPEN_METEO_GEO}?name=${encodeURIComponent(city)}&count=1&format=json`);
      if (!geo.ok) {
        res.status(502).json({ error: "geocode_failed" });
        return;
      }
      const g = (await geo.json()) as { results?: { name: string; latitude: number; longitude: number; country: string }[] };
      const loc = g.results?.[0];
      if (!loc) {
        res.status(404).json({ error: "city_not_found", city });
        return;
      }
      const fc = await fetch(
        `${OPEN_METEO_FC}?latitude=${loc.latitude}&longitude=${loc.longitude}` +
          `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
          `&temperature_unit=fahrenheit&wind_speed_unit=mph`,
      );
      if (!fc.ok) {
        res.status(502).json({ error: "forecast_failed" });
        return;
      }
      const f = (await fc.json()) as {
        current?: { temperature_2m: number; weather_code: number; relative_humidity_2m: number; wind_speed_10m: number };
      };
      const cur = f.current;
      if (!cur) {
        res.status(502).json({ error: "no_current" });
        return;
      }
      res.json({
        agent: "weather-oracle",
        city: loc.name,
        country: loc.country,
        current: {
          summary: WMO[cur.weather_code] ?? `code ${cur.weather_code}`,
          temperature_f: cur.temperature_2m,
          humidity_pct: cur.relative_humidity_2m,
          wind_speed_mph: cur.wind_speed_10m,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      res.status(502).json({ error: "upstream", message: String(e) });
    }
  });

  r.post("/math/testnet", async (req: Request, res: Response) => {
    const parsed = mathBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", details: parsed.error.flatten() });
      return;
    }
    const { expr, delegateResearch, autoDelegateResearch, hireExternal, hireFromRegistry } = parsed.data;
    try {
      const value = evaluate(expr) as number | bigint;
      const n = typeof value === "bigint" ? Number(value) : value;

      let researchPrompt = delegateResearch?.prompt;
      if (!researchPrompt && autoDelegateResearch) {
        researchPrompt = technicalMathResearchPrompt(expr) ?? undefined;
      }

      const wantsHire =
        Boolean(researchPrompt) || Boolean(hireExternal) || Boolean(hireFromRegistry);

      type HireEntry = {
        kind: "deep_research" | "external_url" | "registry";
        target: string;
        response: unknown;
        settlement?: { transaction?: string; transactionUrl?: string };
      };

      let autonomousEconomy: Record<string, unknown> | undefined;

      if (wantsHire) {
        if (!isHiringWalletConfigured()) {
          autonomousEconomy = {
            hires: [] as HireEntry[],
            skipped: true,
            reason:
              "Set AGENT_HIRING_STELLAR_SECRET (funded + USDC trustline) and allowlist partner origins in HIRING_ALLOWED_ORIGINS.",
          };
        } else {
          const tasks: Promise<HireEntry>[] = [];
          if (researchPrompt) {
            const target = getDeepResearchHireUrl();
            tasks.push(
              hireDeepResearch(researchPrompt).then((r) => ({
                kind: "deep_research" as const,
                target,
                response: r.response,
                settlement: r.settlement,
              })),
            );
          }
          if (hireExternal) {
            const h = hireExternal;
            const init: RequestInit = { method: h.method };
            if (h.method === "POST") {
              init.headers = { "content-type": "application/json" };
              init.body = h.body !== undefined ? JSON.stringify(h.body) : undefined;
            }
            tasks.push(
              hirePaidAgent(h.url, init).then((r) => ({
                kind: "external_url" as const,
                target: h.url,
                response: r.response,
                settlement: r.settlement,
              })),
            );
          }
          if (hireFromRegistry) {
            const h = hireFromRegistry;
            tasks.push(
              hireRegistryAgent(h.agentId, h.path, { method: h.method, body: h.body }).then((r) => ({
                kind: "registry" as const,
                target: `${h.agentId} → ${h.path}`,
                response: r.response,
                settlement: r.settlement,
              })),
            );
          }
          try {
            const hires = await Promise.all(tasks);
            autonomousEconomy = { hires };
          } catch (e) {
            res.status(502).json({
              agent: "mathsolver",
              expr,
              result: n,
              error: "hiring_failed",
              message: String(e),
            });
            return;
          }
        }
      }

      res.json({
        agent: "mathsolver",
        expr,
        result: n,
        ...(autonomousEconomy ? { autonomousEconomy } : {}),
      });
    } catch (e) {
      res.status(400).json({ agent: "mathsolver", error: "eval_failed", message: String(e) });
    }
  });

  r.post("/summarize/testnet", async (req: Request, res: Response) => {
    const parsed = textBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", details: parsed.error.flatten() });
      return;
    }
    const text = parsed.data.text;
    if (OPENROUTER_API_KEY) {
      try {
        const out = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "X-Title": "telos-agents-summarizer",
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
              {
                role: "system",
                content: "Summarize the user's text in 3-6 bullet points. Be concise. Plain text only.",
              },
              { role: "user", content: text },
            ],
            temperature: 0.3,
          }),
        });
        const raw = await out.text();
        if (!out.ok) {
          res.status(502).json({ agent: "summarizer-pro", error: "openrouter", detail: raw.slice(0, 400) });
          return;
        }
        const data = JSON.parse(raw) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const summary = data.choices?.[0]?.message?.content?.trim() ?? "";
        res.json({ agent: "summarizer-pro", summary, model: OPENROUTER_MODEL });
        return;
      } catch (e) {
        res.status(502).json({ agent: "summarizer-pro", error: "openrouter_failed", message: String(e) });
        return;
      }
    }
    const words = text.split(/\s+/).length;
    const summary = `[offline] ${words} words — set OPENROUTER_API_KEY for LLM summaries. Preview: ${text.slice(0, 160)}${text.length > 160 ? "…" : ""}`;
    res.json({ agent: "summarizer-pro", summary, offline: true });
  });

  r.post("/crypto-sentiment/testnet", async (req: Request, res: Response) => {
    const parsed = cryptoSentimentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", details: parsed.error.flatten() });
      return;
    }
    const { symbol: bodySymbol, text } = parsed.data;
    const symbol =
      bodySymbol?.trim().toUpperCase() ?? (text ? guessSymbolFromText(text) : null) ?? "BTC";

    if (COINGECKO_API_KEY) {
      try {
        const cg = await fetchCryptoSentiment(symbol);
        if (cg) {
          let score = cg.score;
          if (text) {
            score = Math.min(0.95, Math.max(0.05, score + keywordSentimentAdjust(text)));
          }
          const sentiment =
            score >= 0.55 ? "bullish" : score <= 0.45 ? "bearish" : "neutral";
          res.json({
            agent: "crypto-sentiment",
            source: "coingecko",
            symbol,
            sentiment,
            score: Number(score.toFixed(3)),
            coingecko: cg,
            ...(text ? { text_context: true } : {}),
            note: "Market + community signals from CoinGecko; optional text nudges score slightly. Not financial advice.",
          });
          return;
        }
      } catch {
        /* fall through */
      }
    }

    const t = (text ?? "").toLowerCase();
    const bullish = ["moon", "bull", "buy", "up", "pump"].some((k) => t.includes(k));
    const bearish = ["bear", "sell", "crash", "down", "dump"].some((k) => t.includes(k));
    const score = bullish && !bearish ? 0.65 : bearish && !bullish ? 0.35 : 0.5;
    res.json({
      agent: "crypto-sentiment",
      source: "keyword_fallback",
      symbol,
      sentiment: score >= 0.55 ? "bullish" : score <= 0.45 ? "bearish" : "neutral",
      score,
      note: "Set COINGECKO_API_KEY for live market-based sentiment from CoinGecko.",
    });
  });

  r.post("/deep-research/testnet", async (req: Request, res: Response) => {
    const parsed = deepResearchBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", details: parsed.error.flatten() });
      return;
    }
    const { prompt, depth } = parsed.data;

    if (OPENROUTER_API_KEY) {
      try {
        const report = await runDeepResearchLlm(prompt, depth);
        res.json({
          agent: "deepresearchai",
          topic: prompt,
          depth,
          model: DEEP_RESEARCH_MODEL,
          report,
        });
        return;
      } catch (e) {
        res.status(502).json({
          agent: "deepresearchai",
          error: "research_failed",
          message: String(e),
        });
        return;
      }
    }

    res.json({
      agent: "deepresearchai",
      topic: prompt,
      depth,
      outline: [
        "Problem definition and scope",
        "Prior work / market landscape",
        "TELOS-style agent economy on Stellar",
        "Risks, costs (x402), and next steps",
      ],
      note: "Set OPENROUTER_API_KEY for LLM deep research (structured JSON report).",
    });
  });

  r.get("/market/testnet", async (req: Request, res: Response) => {
    const parsed = symbolQuery.safeParse({ symbol: req.query.symbol });
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", details: parsed.error.flatten() });
      return;
    }
    const symbol = (parsed.data.symbol ?? "XLM").toUpperCase();
    const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    let priceUsd = (seed % 1000) / 10 + 0.01;
    let priceSource: "coingecko" | "demo" = "demo";
    let coingeckoQuote: Awaited<ReturnType<typeof fetchCoinGeckoUsd>> | undefined;

    if (COINGECKO_API_KEY) {
      try {
        const q = await fetchCoinGeckoUsd(symbol);
        if (q) {
          priceUsd = q.price_usd;
          priceSource = "coingecko";
          coingeckoQuote = q;
        }
      } catch {
        /* keep demo fallback */
      }
    }

    const hireFlag = String(req.query.hire_deep_research ?? "").toLowerCase();
    const wantsResearch = hireFlag === "1" || hireFlag === "true";
    const researchTopic = String(req.query.research_topic ?? "").trim();
    const hireAgentUrlRaw = String(req.query.hire_agent_url ?? "").trim();
    let hireAgentUrl = hireAgentUrlRaw;
    if (hireAgentUrlRaw) {
      try {
        hireAgentUrl = decodeURIComponent(hireAgentUrlRaw);
      } catch {
        hireAgentUrl = hireAgentUrlRaw;
      }
    }
    const hireAgentMethod = String(req.query.hire_agent_method ?? "POST").toUpperCase() === "GET" ? "GET" : "POST";
    const hireRegistryAgentId = String(req.query.hire_registry_agent_id ?? "").trim();
    const hireRegistryPath = String(req.query.hire_registry_path ?? "").trim();

    type HireEntry = {
      kind: "deep_research" | "external_url" | "registry";
      target: string;
      response: unknown;
      settlement?: { transaction?: string; transactionUrl?: string };
    };

    let autonomousEconomy: Record<string, unknown> | undefined;
    if (wantsResearch) {
      if (!researchTopic) {
        autonomousEconomy = {
          hires: [] as HireEntry[],
          skipped: true,
          reason: "Add research_topic=... when hire_deep_research=1",
        };
      } else if (!isHiringWalletConfigured()) {
        autonomousEconomy = {
          hires: [] as HireEntry[],
          skipped: true,
          reason: "Set AGENT_HIRING_STELLAR_SECRET to pay downstream agents.",
        };
      } else {
        const marketPrompt = `Market symbol ${symbol} (${priceSource === "coingecko" ? "CoinGecko" : "demo"} ~${priceUsd} USD). Research angle: ${researchTopic}`;
        try {
          let hired: HireEntry;
          if (hireAgentUrl) {
            const init: RequestInit = { method: hireAgentMethod };
            if (hireAgentMethod === "POST") {
              init.headers = { "content-type": "application/json" };
              init.body = JSON.stringify({ prompt: marketPrompt });
            }
            const r = await hirePaidAgent(hireAgentUrl, init);
            hired = {
              kind: "external_url",
              target: hireAgentUrl,
              response: r.response,
              settlement: r.settlement,
            };
          } else if (hireRegistryAgentId && hireRegistryPath) {
            const r = await hireRegistryAgent(hireRegistryAgentId, hireRegistryPath, {
              method: "POST",
              body: { prompt: marketPrompt },
            });
            hired = {
              kind: "registry",
              target: `${hireRegistryAgentId} → ${hireRegistryPath}`,
              response: r.response,
              settlement: r.settlement,
            };
          } else {
            const r = await hireDeepResearch(marketPrompt);
            hired = {
              kind: "deep_research",
              target: getDeepResearchHireUrl(),
              response: r.response,
              settlement: r.settlement,
            };
          }
          autonomousEconomy = { hires: [hired] };
        } catch (e) {
          res.status(502).json({
            agent: "market-oracle",
            error: "hiring_failed",
            message: String(e),
          });
          return;
        }
      }
    }

    res.json({
      agent: "market-oracle",
      symbol,
      price_usd: priceSource === "coingecko" ? priceUsd : Number(priceUsd.toFixed(4)),
      source: priceSource,
      ...(coingeckoQuote ? { coingecko: coingeckoQuote } : {}),
      timestamp: new Date().toISOString(),
      note:
        priceSource === "coingecko"
          ? "USD spot from CoinGecko (rate limits per your plan)."
          : "Demo pseudo-price — set COINGECKO_API_KEY for live data, or use a mapped symbol (BTC, ETH, XLM, …).",
      ...(autonomousEconomy ? { autonomousEconomy } : {}),
    });
  });

  r.post("/website-builder/testnet", async (req: Request, res: Response) => {
    const parsed = promptBodyFixed.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", details: parsed.error.flatten() });
      return;
    }
    const prompt = parsed.data.prompt;

    if (OPENROUTER_API_KEY) {
      try {
        const html = await runWebsiteBuilderLlm(
          `Build a single-page marketing section for: ${prompt}`,
        );
        res.json({
          agent: "website-builder",
          model: WEBSITE_BUILDER_MODEL,
          html,
          note: "LLM-generated fragment; review before production. No full sanitizer.",
        });
        return;
      } catch (e) {
        res.status(502).json({
          agent: "website-builder",
          error: "llm_failed",
          message: String(e),
        });
        return;
      }
    }

    const safe = prompt.replace(/</g, "&lt;").slice(0, 200);
    res.json({
      agent: "website-builder",
      html: `<main class="p-4"><h1>Landing</h1><p>${safe}</p><footer class="text-sm text-gray-500">Built by telos-agents (offline)</footer></main>`,
      note: "Set OPENROUTER_API_KEY for LLM-generated HTML sections.",
    });
  });

  return r;
}
