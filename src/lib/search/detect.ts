/**
 * Search detection — Priority #1.
 *
 * Two layers:
 *  1. `detectShape` (this file): pure, synchronous. Classifies the *form* of the
 *     input — is it an address? a tx hash? an ENS-like name? a free-text name?
 *  2. `resolveQuery` (resolver.ts): async. For an address, checks on-chain
 *     whether code exists (contract vs. wallet). For free text, looks it up
 *     across tokens / projects / campaigns to pick the right destination.
 *
 * Splitting them keeps classification testable and instant, while the network
 * work stays isolated and cancellable.
 */

import type { SearchDetection, SearchEntityType } from "@/types";
import { getAddress, isAddress, isHex } from "viem";

export type QueryShape =
  | "address" // 0x + 40 hex — could be wallet OR contract, needs on-chain check
  | "tx_hash" // 0x + 64 hex
  | "ens_name" // *.eth or *.base.eth
  | "text"; // anything else — token symbol, project/quest/airdrop name

export interface ShapeResult {
  shape: QueryShape;
  normalized: string;
  /** Only set for `address` shape: checksummed form. */
  checksummed?: string;
}

/** Classify the raw form of a query without any network calls. */
export function detectShape(raw: string): ShapeResult {
  const q = raw.trim();

  // Full 0x-prefixed hex strings.
  if (q.startsWith("0x") && isHex(q)) {
    const hexLen = q.length - 2;
    if (hexLen === 40 && isAddress(q)) {
      return { shape: "address", normalized: q.toLowerCase(), checksummed: getAddress(q) };
    }
    if (hexLen === 64) {
      return { shape: "tx_hash", normalized: q.toLowerCase() };
    }
  }

  // ENS / Basenames.
  if (/^[a-z0-9-]+\.(base\.eth|eth)$/i.test(q)) {
    return { shape: "ens_name", normalized: q.toLowerCase() };
  }

  return { shape: "text", normalized: q.toLowerCase() };
}

/**
 * Map a resolved entity type to its canonical route.
 * Centralized so routing is consistent across the app.
 */
export function routeFor(type: SearchEntityType, normalized: string): string {
  switch (type) {
    case "wallet":
      return `/wallet/${normalized}`;
    case "contract":
    case "token":
      // Tokens resolve by contract address under /token.
      return `/token/${normalized}`;
    case "project":
      return `/project/${normalized}`;
    case "quest":
    case "airdrop":
      return `/airdrop/${normalized}`;
  }
}

/** Build a detection result for cases resolvable without a network call. */
export function shapeToDetection(raw: string, shape: ShapeResult): SearchDetection {
  const base = {
    query: raw,
    normalized: shape.normalized,
    confidence: 0,
    type: null as SearchEntityType | null,
    route: null as string | null,
    reason: "",
  };

  switch (shape.shape) {
    case "tx_hash":
      return {
        ...base,
        confidence: 1,
        reason:
          "Looks like a transaction hash. Open it on BaseScan to inspect the transaction.",
        route: `https://basescan.org/tx/${shape.normalized}`,
      };
    case "address":
      // Ambiguous until on-chain check — handled by the resolver.
      return {
        ...base,
        confidence: 0.5,
        reason: "Valid Base address — checking whether it's a contract or wallet…",
      };
    case "ens_name":
      return {
        ...base,
        confidence: 0.7,
        reason: "Looks like a Basename/ENS — resolving to an address…",
      };
    case "text":
      return {
        ...base,
        confidence: 0.3,
        reason: "Searching tokens, projects, quests and airdrops…",
      };
  }
}
