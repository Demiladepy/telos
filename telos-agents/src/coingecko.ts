import { COINGECKO_API_KEY, COINGECKO_PRO } from "./config.js";

const DEMO_BASE = "https://api.coingecko.com/api/v3";
const PRO_BASE = "https://pro-api.coingecko.com/api/v3";

/** Common tickers → CoinGecko `ids` for /simple/price */
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  XLM: "stellar",
  SOL: "solana",
  DOGE: "dogecoin",
  ADA: "cardano",
  DOT: "polkadot",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  POL: "matic-network",
  LINK: "chainlink",
  UNI: "uniswap",
  ATOM: "cosmos",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  XRP: "ripple",
  TRX: "tron",
  SHIB: "shiba-inu",
  USDT: "tether",
  USDC: "usd-coin",
  TON: "the-open-network",
  NEAR: "near",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
};

export type CoinGeckoQuote = {
  coingecko_id: string;
  price_usd: number;
  usd_24h_change: number | null;
  usd_market_cap: number | null;
  last_updated_at: number | null;
};

export function symbolToCoingeckoId(symbol: string): string {
  const u = symbol.toUpperCase();
  return SYMBOL_TO_ID[u] ?? symbol.toLowerCase();
}

function coingeckoFetchHeaders(): { base: string; headerName: string } {
  const base = COINGECKO_PRO ? PRO_BASE : DEMO_BASE;
  const headerName = COINGECKO_PRO ? "x-cg-pro-api-key" : "x-cg-demo-api-key";
  return { base, headerName };
}

export type CryptoSentimentResult = {
  symbol_input: string;
  coingecko_id: string;
  name?: string;
  sentiment: "bullish" | "bearish" | "neutral";
  score: number;
  market: {
    price_usd: number | null;
    price_change_24h_pct: number | null;
    price_change_7d_pct: number | null;
    market_cap_rank: number | null;
  };
  community_sentiment_up_pct: number | null;
  source: "coingecko";
};

/**
 * Market-driven sentiment from CoinGecko `/coins/{id}` (24h move + optional community vote %).
 */
export async function fetchCryptoSentiment(symbol: string): Promise<CryptoSentimentResult | null> {
  if (!COINGECKO_API_KEY) return null;

  const id = symbolToCoingeckoId(symbol);
  const { base, headerName } = coingeckoFetchHeaders();
  const url =
    `${base}/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true` +
    `&community_data=true&developer_data=false&sparkline=false`;

  const res = await fetch(url, {
    headers: { [headerName]: COINGECKO_API_KEY },
  });

  if (!res.ok) {
    return null;
  }

  const coin = (await res.json()) as {
    id: string;
    name?: string;
    sentiment_votes_up_percentage?: number;
    market_data?: {
      current_price?: { usd?: number };
      price_change_percentage_24h?: number;
      price_change_percentage_7d?: number;
      market_cap_rank?: number;
    };
  };

  const md = coin.market_data;
  const pct24 = md?.price_change_percentage_24h ?? null;
  const pct7 = md?.price_change_percentage_7d ?? null;
  const priceUsd = md?.current_price?.usd ?? null;
  const rank = md?.market_cap_rank ?? null;

  let score = 0.5;
  if (pct24 != null) {
    if (pct24 >= 5) score = 0.72;
    else if (pct24 >= 2) score = 0.62;
    else if (pct24 > 0) score = 0.56;
    else if (pct24 > -2) score = 0.48;
    else if (pct24 > -5) score = 0.38;
    else score = 0.28;
  }

  const votes = coin.sentiment_votes_up_percentage;
  if (votes != null && typeof votes === "number") {
    const v = Math.min(100, Math.max(0, votes)) / 100;
    score = pct24 != null ? 0.65 * score + 0.35 * v : v;
  }

  const sentiment: CryptoSentimentResult["sentiment"] =
    score >= 0.55 ? "bullish" : score <= 0.45 ? "bearish" : "neutral";

  return {
    symbol_input: symbol.toUpperCase(),
    coingecko_id: coin.id,
    name: coin.name,
    sentiment,
    score: Number(score.toFixed(3)),
    market: {
      price_usd: priceUsd,
      price_change_24h_pct: pct24,
      price_change_7d_pct: pct7 ?? null,
      market_cap_rank: rank ?? null,
    },
    community_sentiment_up_pct: votes ?? null,
    source: "coingecko",
  };
}

/**
 * Live USD quote from CoinGecko `/simple/price`. Returns null if key missing, bad id, or HTTP error.
 */
export async function fetchCoinGeckoUsd(symbol: string): Promise<CoinGeckoQuote | null> {
  if (!COINGECKO_API_KEY) return null;

  const id = symbolToCoingeckoId(symbol);
  const { base, headerName } = coingeckoFetchHeaders();

  const params = new URLSearchParams({
    ids: id,
    vs_currencies: "usd",
    include_24hr_change: "true",
    include_market_cap: "true",
    include_last_updated_at: "true",
  });

  const url = `${base}/simple/price?${params.toString()}`;
  const res = await fetch(url, {
    headers: { [headerName]: COINGECKO_API_KEY },
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as Record<
    string,
    {
      usd?: number;
      usd_24h_change?: number;
      usd_market_cap?: number;
      last_updated_at?: number;
    }
  >;

  const row = data[id];
  if (row?.usd === undefined || typeof row.usd !== "number") {
    return null;
  }

  return {
    coingecko_id: id,
    price_usd: row.usd,
    usd_24h_change: row.usd_24h_change ?? null,
    usd_market_cap: row.usd_market_cap ?? null,
    last_updated_at: row.last_updated_at ?? null,
  };
}
