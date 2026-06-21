/**
 * DexScreener adapter (KEYLESS).
 *
 * Powers:
 *  - free-text token search (resolve a symbol/name to a Base token address)
 *  - token price, liquidity, volume, market cap for the Token Analyzer
 *
 * Response shapes follow the documented DexScreener API. Each is mapped through
 * a narrow normalizer so any upstream shape drift is a one-line fix here, not
 * across the app.
 */

import { config, sources } from "@/lib/config";
import { fetchJson } from "@/lib/utils/fetch";

const BASE_CHAIN = "base";

// --- Raw upstream shapes (only the fields we read) --------------------------
interface DexPairRaw {
  chainId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; symbol: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number; // ms epoch
  url?: string;
  info?: {
    imageUrl?: string;
    websites?: { label?: string; url: string }[];
    socials?: { type?: string; platform?: string; url: string; handle?: string }[];
  };
}

interface DexSearchResponse {
  pairs: DexPairRaw[] | null;
}

interface DexTokensResponse {
  pairs: DexPairRaw[] | null;
}

// --- Normalized output ------------------------------------------------------
export interface DexTokenData {
  address: string;
  name: string;
  symbol: string;
  priceUsd: number | null;
  priceChange24h: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  marketCapUsd: number | null;
  pairCreatedAtMs: number | null;
  dexUrl: string | null;
  pairAddress: string | null;
  logo: string | null;
  website: string | null;
  socials: { type: string; url: string }[];
}

function pickBestPair(pairs: DexPairRaw[]): DexPairRaw | null {
  const basePairs = pairs.filter((p) => p.chainId === BASE_CHAIN);
  if (basePairs.length === 0) return null;
  // Highest liquidity pair is the most representative for price/volume.
  return basePairs.reduce((best, p) =>
    (p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? p : best
  );
}

function normalize(p: DexPairRaw): DexTokenData {
  return {
    address: p.baseToken.address,
    name: p.baseToken.name,
    symbol: p.baseToken.symbol,
    priceUsd: p.priceUsd ? Number(p.priceUsd) : null,
    priceChange24h: p.priceChange?.h24 ?? null,
    liquidityUsd: p.liquidity?.usd ?? null,
    volume24hUsd: p.volume?.h24 ?? null,
    marketCapUsd: p.marketCap ?? p.fdv ?? null,
    pairCreatedAtMs: p.pairCreatedAt ?? null,
    dexUrl: p.url ?? null,
    pairAddress: p.pairAddress ?? null,
    logo: p.info?.imageUrl ?? null,
    website: p.info?.websites?.[0]?.url ?? null,
    socials: (p.info?.socials ?? [])
      .filter((s) => s.url)
      .map((s) => ({ type: (s.type ?? s.platform ?? "link").toLowerCase(), url: s.url })),
  };
}

/** Look up token data by contract address (Base only). */
export async function getTokenByAddress(
  address: string
): Promise<DexTokenData | null> {
  if (!sources.dexscreener.available) return null;
  const url = `${config.dexscreener.apiUrl}/latest/dex/tokens/${address}`;
  const res = await fetchJson<DexTokensResponse>(url, { revalidate: 30 });
  if (!res.ok || !res.data.pairs?.length) return null;
  const best = pickBestPair(res.data.pairs);
  return best ? normalize(best) : null;
}

/**
 * Free-text search returning candidate Base tokens, ranked by liquidity.
 * Used by the search resolver to turn a symbol/name into a token address.
 */
export async function searchTokens(query: string): Promise<DexTokenData[]> {
  if (!sources.dexscreener.available) return [];
  const url = `${config.dexscreener.apiUrl}/latest/dex/search?q=${encodeURIComponent(query)}`;
  const res = await fetchJson<DexSearchResponse>(url, { revalidate: 30 });
  if (!res.ok || !res.data.pairs?.length) return [];

  const basePairs = res.data.pairs.filter((p) => p.chainId === BASE_CHAIN);
  // Collapse to one entry per token address (highest-liquidity pair wins).
  const byToken = new Map<string, DexPairRaw>();
  for (const p of basePairs) {
    const key = p.baseToken.address.toLowerCase();
    const existing = byToken.get(key);
    if (!existing || (p.liquidity?.usd ?? 0) > (existing.liquidity?.usd ?? 0)) {
      byToken.set(key, p);
    }
  }
  return Array.from(byToken.values())
    .map(normalize)
    .sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0))
    .slice(0, 8);
}


