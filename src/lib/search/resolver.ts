/**
 * Search resolver — the async half of Priority #1.
 *
 * Takes a raw query, classifies its shape, then performs the minimal network
 * work needed to choose the right destination:
 *  - address → on-chain bytecode check → /token (contract) or /wallet (EOA)
 *  - ENS/Basename → resolve to address → recurse
 *  - free text → race token / project / campaign lookups, pick the best match
 *
 * Returns a SearchDetection the client can navigate with. When nothing
 * resolves, `route` is null and `reason` explains why — no false routing.
 */

import type { SearchDetection } from "@/types";
import { getAddress, type Address } from "viem";
import {
  detectShape,
  routeFor,
  shapeToDetection,
} from "@/lib/search/detect";
import { resolveName } from "@/lib/adapters/base-rpc";
import { searchTokens, getTokenByAddress } from "@/lib/adapters/dexscreener";
import { searchProtocols } from "@/lib/adapters/defillama";
import { searchCampaigns } from "@/lib/adapters/campaigns";

export async function resolveQuery(raw: string): Promise<SearchDetection> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      query: raw,
      normalized: "",
      type: null,
      confidence: 0,
      route: null,
      reason: "Type a wallet, token, contract, project, quest or airdrop.",
    };
  }

  const shape = detectShape(trimmed);
  const baseDetection = shapeToDetection(trimmed, shape);

  switch (shape.shape) {
    case "tx_hash":
      // Already resolved to an external explorer link in shapeToDetection.
      return baseDetection;

    case "ens_name": {
      const resolved = await resolveName(shape.normalized);
      if (!resolved) {
        return {
          ...baseDetection,
          confidence: 0,
          route: null,
          reason: `Couldn't resolve "${trimmed}" to an address.`,
        };
      }
      // Recurse with the resolved address.
      return resolveAddress(getAddress(resolved), trimmed);
    }

    case "address":
      return resolveAddress(shape.checksummed as Address, trimmed);

    case "text":
      return resolveText(trimmed);
  }
}

/** Disambiguate an address into a contract (token) or wallet route. */
async function resolveAddress(
  address: Address,
  rawQuery: string
): Promise<SearchDetection> {
  const normalized = address.toLowerCase();
  // Route to the Token Analyzer only if this address is a REAL token
  // (has a DexScreener pair). Smart wallets have bytecode but are not tokens,
  // so a bytecode check would misroute them; we check for a token instead.
  const tokenPair = await getTokenByAddress(normalized).catch(() => null);

  if (tokenPair) {
    return {
      query: rawQuery,
      normalized,
      type: "contract",
      confidence: 0.95,
      route: routeFor("contract", normalized),
      reason: "Token found on Base - opening the Token Analyzer.",
    };
  }

  return {
    query: rawQuery,
    normalized,
    type: "wallet",
    confidence: 0.9,
    route: routeFor("wallet", normalized),
    reason: "No token pair found - opening the Wallet Analyzer.",
  };
}

/**
 * Resolve free text by checking tokens, projects, and campaigns in parallel.
 * Priority when multiple match: exact token symbol > project name > campaign.
 */
async function resolveText(rawQuery: string): Promise<SearchDetection> {
  const q = rawQuery.toLowerCase();

  const [tokens, projects, campaigns] = await Promise.all([
    searchTokens(rawQuery).catch(() => []),
    searchProtocols(rawQuery).catch(() => []),
    searchCampaigns(rawQuery).catch(() => []),
  ]);

  // Exact symbol match is the strongest signal.
  const exactToken = tokens.find((t) => t.symbol.toLowerCase() === q);
  if (exactToken) {
    return {
      query: rawQuery,
      normalized: exactToken.address.toLowerCase(),
      type: "token",
      confidence: 0.9,
      route: routeFor("token", exactToken.address.toLowerCase()),
      reason: `Matched token ${exactToken.symbol} on Base.`,
    };
  }

  // Exact project name match.
  const exactProject = projects.find((p) => p.name.toLowerCase() === q);
  if (exactProject) {
    return {
      query: rawQuery,
      normalized: exactProject.slug,
      type: "project",
      confidence: 0.85,
      route: routeFor("project", exactProject.slug),
      reason: `Matched project ${exactProject.name}.`,
    };
  }

  // Fall back to the strongest fuzzy match across categories.
  if (tokens.length > 0) {
    const t = tokens[0];
    return {
      query: rawQuery,
      normalized: t.address.toLowerCase(),
      type: "token",
      confidence: 0.6,
      route: routeFor("token", t.address.toLowerCase()),
      reason: `Closest token match: ${t.symbol}.`,
    };
  }
  if (projects.length > 0) {
    const p = projects[0];
    return {
      query: rawQuery,
      normalized: p.slug,
      type: "project",
      confidence: 0.55,
      route: routeFor("project", p.slug),
      reason: `Closest project match: ${p.name}.`,
    };
  }
  if (campaigns.length > 0) {
    const c = campaigns[0];
    return {
      query: rawQuery,
      normalized: c.id,
      type: c.kind === "quest" ? "quest" : "airdrop",
      confidence: 0.55,
      route: routeFor(c.kind === "quest" ? "quest" : "airdrop", c.id),
      reason: `Matched ${c.kind}: ${c.name}.`,
    };
  }

  return {
    query: rawQuery,
    normalized: q,
    type: null,
    confidence: 0,
    route: null,
    reason: `No Base token, project, quest or airdrop matched "${rawQuery}".`,
  };
}

/** Lightweight multi-category suggestions for the search dropdown. */
export async function suggestQuery(raw: string): Promise<{
  tokens: { address: string; symbol: string; name: string }[];
  projects: { slug: string; name: string; category: string | null; logo: string | null }[];
  campaigns: { id: string; name: string; kind: string }[];
}> {
  const trimmed = raw.trim();
  if (trimmed.length < 2) return { tokens: [], projects: [], campaigns: [] };

  const [tokens, projects, campaigns] = await Promise.all([
    searchTokens(trimmed).catch(() => []),
    searchProtocols(trimmed).catch(() => []),
    searchCampaigns(trimmed).catch(() => []),
  ]);

  return {
    tokens: tokens.slice(0, 5).map((t) => ({
      address: t.address,
      symbol: t.symbol,
      name: t.name,
    })),
    projects: projects.slice(0, 5).map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      logo: p.logo,
    })),
    campaigns: campaigns.slice(0, 5).map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
    })),
  };
}



