/**
 * Wallet scoring (Priority #2 support).
 *
 * Produces a 0–100 composite from real on-chain inputs. Each component is
 * computed only when its input is available; missing inputs yield `null`
 * components and the composite is the weighted average of *available* signals.
 * If nothing is available, the score is null — never a fabricated number.
 *
 * Components (each 0–100):
 *   age        — older accounts score higher (log-scaled to ~3yr)
 *   txCount    — more activity scores higher (log-scaled)
 *   protocols  — broader protocol usage scores higher
 *   activity   — recent activity recency
 *   volume     — native + token volume (when available)
 *   diversity  — spread across protocol categories
 */

import type { WalletBadge, WalletScoreBreakdown } from "@/types";

export interface ScoreInputs {
  ageDays: number | null;
  txCount: number | null;
  protocolCount: number | null;
  /** Days since most recent activity; lower = more active. */
  daysSinceLastActivity: number | null;
  volumeUsd: number | null;
  /** Distinct protocol categories used. */
  categoryCount: number | null;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

/** log-scale a value to 0–100 against a "great" reference point. */
function logScore(value: number, reference: number): number {
  if (value <= 0) return 0;
  return clamp((Math.log1p(value) / Math.log1p(reference)) * 100);
}

export function scoreWallet(inputs: ScoreInputs): WalletScoreBreakdown {
  const age =
    inputs.ageDays != null ? logScore(inputs.ageDays, 365 * 3) : null; // ~3yr = excellent
  const transactions =
    inputs.txCount != null ? logScore(inputs.txCount, 2000) : null;
  const protocols =
    inputs.protocolCount != null ? logScore(inputs.protocolCount, 40) : null;
  const activity =
    inputs.daysSinceLastActivity != null
      ? clamp(100 - logScore(inputs.daysSinceLastActivity, 180) )
      : null;
  const volume =
    inputs.volumeUsd != null ? logScore(inputs.volumeUsd, 1_000_000) : null;
  const diversity =
    inputs.categoryCount != null ? logScore(inputs.categoryCount, 8) : null;

  const components = { age, transactions, protocols, activity, volume, diversity };

  // Weighted average of available components only.
  const weights: Record<keyof typeof components, number> = {
    age: 0.2,
    transactions: 0.2,
    protocols: 0.2,
    activity: 0.15,
    volume: 0.15,
    diversity: 0.1,
  };

  let weightedSum = 0;
  let weightTotal = 0;
  (Object.keys(components) as (keyof typeof components)[]).forEach((k) => {
    const v = components[k];
    if (v != null) {
      weightedSum += v * weights[k];
      weightTotal += weights[k];
    }
  });

  const score =
    weightTotal > 0 ? Math.round(weightedSum / weightTotal) : null;

  return { score, components };
}

/**
 * Badge derivation from real signals. A badge is awarded only when its
 * threshold is met with available data; absent data means no badge (not a
 * default-on badge).
 */
export function deriveBadges(
  inputs: ScoreInputs & { isWhaleLabeled?: boolean; usesNft?: boolean | null }
): WalletBadge[] {
  const badges: WalletBadge[] = [];

  if (inputs.ageDays != null && inputs.ageDays >= 365) badges.push("OG Wallet");
  if (inputs.ageDays != null && inputs.ageDays >= 180 && inputs.ageDays < 365)
    badges.push("Early Adopter");
  if (inputs.protocolCount != null && inputs.protocolCount >= 5)
    badges.push("DeFi User");
  if (
    inputs.daysSinceLastActivity != null &&
    inputs.daysSinceLastActivity <= 7
  )
    badges.push("Active User");
  if (
    inputs.isWhaleLabeled === true ||
    (inputs.volumeUsd != null && inputs.volumeUsd >= 250_000)
  )
    badges.push("Whale");
  if (inputs.usesNft === true) badges.push("NFT User");

  return badges;
}
