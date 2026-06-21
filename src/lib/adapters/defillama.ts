/**
 * DefiLlama adapter (KEYLESS).
 *
 * Powers:
 *  - the Base protocol universe (for project search + Discover trending/new)
 *  - per-protocol TVL and 24h change
 *
 * DefiLlama returns all protocols in one call; we filter to those deployed on
 * Base. Results are cached for several minutes since TVL moves slowly.
 */

import { config, sources } from "@/lib/config";
import { fetchJson } from "@/lib/utils/fetch";

interface LlamaProtocolRaw {
  name: string;
  slug: string;
  category?: string;
  url?: string;
  description?: string;
  logo?: string;
  chains?: string[];
  chainTvls?: Record<string, number>;
  tvl?: number;
  change_1d?: number;
  change_7d?: number;
  twitter?: string;
  listedAt?: number; // unix seconds
}

export interface LlamaProtocol {
  name: string;
  slug: string;
  category: string | null;
  url: string | null;
  description: string | null;
  twitter: string | null;
  /** TVL on Base specifically, falling back to total when not split out. */
  baseTvlUsd: number | null;
  change24h: number | null;
  listedAtMs: number | null;
  logo: string | null;
}

function isOnBase(p: LlamaProtocolRaw): boolean {
  return Boolean(p.chains?.some((c) => c.toLowerCase() === "base"));
}

function normalize(p: LlamaProtocolRaw): LlamaProtocol {
  const baseTvl =
    p.chainTvls?.["Base"] ??
    p.chainTvls?.["base"] ??
    (p.chains?.length === 1 && isOnBase(p) ? p.tvl ?? null : null);
  return {
    name: p.name,
    slug: p.slug,
    category: p.category ?? null,
    url: p.url ?? null,
    description: p.description ?? null,
    twitter: p.twitter ? `https://x.com/${p.twitter}` : null,
    baseTvlUsd: baseTvl ?? null,
    change24h: p.change_1d ?? null,
    listedAtMs: p.listedAt ? p.listedAt * 1000 : null,
    logo: p.logo ?? null,
  };
}

let _cache: { at: number; data: LlamaProtocol[] } | null = null;
const CACHE_MS = 5 * 60 * 1000;

/** All protocols deployed on Base, normalized. Cached in-process. */
export async function getBaseProtocols(): Promise<LlamaProtocol[]> {
  if (!sources.defillama.available) return [];
  if (_cache && Date.now() - _cache.at < CACHE_MS) return _cache.data;

  const url = `${config.defillama.apiUrl}/protocols`;
  const res = await fetchJson<LlamaProtocolRaw[]>(url, { revalidate: false });
  if (!res.ok) return _cache?.data ?? [];

  const baseProtocols = res.data.filter(isOnBase).map(normalize);
  _cache = { at: Date.now(), data: baseProtocols };
  return baseProtocols;
}

export async function getProtocolBySlug(
  slug: string
): Promise<LlamaProtocol | null> {
  const all = await getBaseProtocols();
  return all.find((p) => p.slug === slug.toLowerCase()) ?? null;
}

/** Free-text project search against Base protocols by name/slug. */
export async function searchProtocols(query: string): Promise<LlamaProtocol[]> {
  const all = await getBaseProtocols();
  const q = query.toLowerCase();
  return all
    .filter((p) => p.name.toLowerCase().includes(q) || p.slug.includes(q))
    .sort((a, b) => (b.baseTvlUsd ?? 0) - (a.baseTvlUsd ?? 0))
    .slice(0, 8);
}

// ---- Detail lengkap satu protokol (untuk halaman project) ------------------
export interface LlamaProtocolDetail {
  name: string;
  description: string | null;
  url: string | null;
  twitter: string | null;
  category: string | null;
  symbol: string | null;
  tokenAddress: string | null; // alamat kontrak di Base (jika ada)
  audits: number | null;       // jumlah audit (0/1/2/3..)
  geckoId: string | null;
  logo: string | null;
}

/** Ambil detail kaya dari endpoint /protocol/{slug}. Field kosong -> null. */
export async function getProtocolDetail(
  slug: string
): Promise<LlamaProtocolDetail | null> {
  const url = `${config.defillama.apiUrl}/protocol/${slug.toLowerCase()}`;
  const res = await fetchJson<any>(url, { revalidate: false });
  if (!res.ok || !res.data || !res.data.name) return null;
  const d = res.data;

  // address sering berformat "base:0x..." -> ambil bagian 0x-nya saja.
  let tokenAddress: string | null = null;
  if (typeof d.address === "string" && d.address.includes("0x")) {
    const m = d.address.match(/0x[a-fA-F0-9]{40}/);
    tokenAddress = m ? m[0].toLowerCase() : null;
  }

  const auditsNum =
    d.audits != null && !Number.isNaN(Number(d.audits)) ? Number(d.audits) : null;

  return {
    name: d.name,
    description: d.description ?? null,
    url: d.url ?? null,
    twitter: d.twitter ? `https://x.com/${d.twitter}` : null,
    category: d.category ?? null,
    symbol: d.symbol && d.symbol !== "-" ? d.symbol : null,
    tokenAddress,
    audits: auditsNum,
    geckoId: d.gecko_id || null,
    logo: d.logo ?? null,
  };
}

