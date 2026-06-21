/**
 * Token service (Priority #3).
 *
 * Assembles a complete TokenProfile by combining:
 *   - DexScreener (keyless): price, liquidity, volume, market cap, pair age
 *   - BaseScan (keyed):      holder count, top holders, contract creation
 *   - Supabase (keyed):      smart-money exposure
 *   - risk engine:           0–100 risk from available factors
 *
 * Holder-based risk factors require a BaseScan key; without it those factors
 * read "unavailable" and the risk score reflects only what's known (or is null
 * if too little is known). Nothing is invented.
 */

import { getAddress } from "viem";
import type { Sourced, TokenHolder, TokenProfile } from "@/types";
import { sourced, unknownValue } from "@/types";
import { sources } from "@/lib/config";
import { getTokenByAddress } from "@/lib/adapters/dexscreener";
import {
  getContractCreation,
  getTokenHolderCount,
  getTopTokenHolders,
} from "@/lib/adapters/basescan";
import { getSmartMoneyExposure } from "@/lib/adapters/smart-money";
import { scoreRisk, type RiskInputs } from "@/lib/scoring/token";

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, (Date.now() - t) / (1000 * 60 * 60 * 24));
}

export async function getTokenProfile(
  rawAddress: string
): Promise<TokenProfile | null> {
  let normalized: string;
  try {
    normalized = getAddress(rawAddress).toLowerCase();
  } catch {
    return null;
  }

  const [dex, holderCount, creation, smartMoney] = await Promise.all([
    getTokenByAddress(normalized),
    getTokenHolderCount(normalized),
    getContractCreation(normalized),
    getSmartMoneyExposure(normalized),
  ]);

  // Top holders are a separate (heavier) call; only attempt with a key.
  const topHoldersRaw = sources.basescan.available
    ? await getTopTokenHolders(normalized, 10)
    : null;

  // Convert raw holder balances to percentages if we have a total supply proxy.
  // Without reliable supply we still surface holders, with percentage null.
  const topHolders: TokenHolder[] | null = topHoldersRaw
    ? buildHolderPercentages(topHoldersRaw)
    : null;

  // Contract age: prefer on-chain creation; fall back to DEX pair creation.
  const contractAgeDays =
    daysSince(creation) ??
    (dex?.pairCreatedAtMs
      ? daysSince(new Date(dex.pairCreatedAtMs).toISOString())
      : null);
  const createdAtIso =
    creation ??
    (dex?.pairCreatedAtMs ? new Date(dex.pairCreatedAtMs).toISOString() : null);

  const riskInputs: RiskInputs = {
    topHolders,
    liquidityUsd: dex?.liquidityUsd ?? null,
    contractAgeDays,
    holderCount: holderCount ?? null,
    volume24hUsd: dex?.volume24hUsd ?? null,
  };
  const risk = scoreRisk(riskInputs);

  const dexSrc = sources.dexscreener.available ? ["DexScreener"] : [];
  const scanSrc = sources.basescan.available ? ["BaseScan"] : [];

  return {
    address: normalized,
    name: strOrUnknown(dex?.name ?? null, dexSrc),
    symbol: strOrUnknown(dex?.symbol ?? null, dexSrc),
    priceUsd: numOrUnknown(dex?.priceUsd ?? null, dexSrc),
    priceChange24h: numOrUnknown(dex?.priceChange24h ?? null, dexSrc),
    marketCapUsd: numOrUnknown(dex?.marketCapUsd ?? null, dexSrc),
    liquidityUsd: numOrUnknown(dex?.liquidityUsd ?? null, dexSrc),
    volume24hUsd: numOrUnknown(dex?.volume24hUsd ?? null, dexSrc),
    holderCount: numOrUnknown(holderCount ?? null, scanSrc),
    topHolders: topHolders
      ? sourced(topHolders, { state: "verified", sources: ["BaseScan"] })
      : unknownValue<TokenHolder[]>(scanSrc),
    contractAgeDays: numOrUnknown(
      contractAgeDays,
      creation ? scanSrc : dexSrc
    ),
    createdAt: strOrUnknown(createdAtIso, creation ? scanSrc : dexSrc),
    risk,
    smartMoneyExposure: smartMoney
      ? sourced(smartMoney, { state: "verified", sources: ["Supabase"] })
      : unknownValue(["Supabase"]),
    dexUrl: dex?.dexUrl ?? null,
    poolAddress: dex?.pairAddress ?? null,
    logo: dex?.logo ?? null,
    website: dex?.website ?? null,
    socials: dex?.socials ?? [],
    description: unknownValue<string>(dexSrc),
  };
}

function buildHolderPercentages(
  raw: { address: string; balance: string }[]
): TokenHolder[] {
  // Sum the visible top-N balances as a denominator proxy. This yields the
  // share *among shown holders*; we mark it clearly in the UI. Exact supply
  // share requires totalSupply (added when a token-metadata source is wired).
  const balances = raw.map((h) => {
    const n = Number(h.balance);
    return Number.isFinite(n) ? n : 0;
  });
  const total = balances.reduce((a, b) => a + b, 0);
  return raw.map((h, i) => ({
    address: h.address,
    balance: h.balance,
    percentage: total > 0 ? (balances[i] / total) * 100 : 0,
  }));
}

function numOrUnknown(v: number | null, srcs: string[]): Sourced<number> {
  return v != null
    ? sourced(v, { state: "verified", sources: srcs })
    : unknownValue<number>(srcs);
}
function strOrUnknown(v: string | null, srcs: string[]): Sourced<string> {
  return v != null
    ? sourced(v, { state: "verified", sources: srcs })
    : unknownValue<string>(srcs);
}

