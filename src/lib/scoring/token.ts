/**
 * Token risk scoring (Priority #3 support).
 *
 * Produces a 0–100 risk score (higher = riskier) from five factors. Each factor
 * is only included when its input is available. When too few factors are known
 * to be meaningful, the score is null and the label is "Unknown" — we never
 * present a confident risk score built on missing data.
 *
 * Factors (each contributes 0–100 risk):
 *   holder_concentration — top-10 holders' share of supply
 *   liquidity_size       — thin liquidity = higher risk
 *   contract_age         — very new = higher risk
 *   holder_count         — few holders = higher risk
 *   trading_activity     — negligible volume = higher risk
 */

import type { RiskBreakdown, RiskFactor, RiskLabel, TokenHolder } from "@/types";

export interface RiskInputs {
  topHolders: TokenHolder[] | null;
  liquidityUsd: number | null;
  contractAgeDays: number | null;
  holderCount: number | null;
  volume24hUsd: number | null;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function concentrationRisk(holders: TokenHolder[] | null): number | null {
  if (!holders || holders.length === 0) return null;
  const top10Share = holders
    .slice(0, 10)
    .reduce((sum, h) => sum + (h.percentage || 0), 0);
  // 0% concentration → 0 risk; 100% → 100 risk. Slightly convex.
  return clamp(Math.pow(top10Share / 100, 0.9) * 100);
}

function liquidityRisk(liq: number | null): number | null {
  if (liq == null) return null;
  // $1M+ liquidity → low risk; under $10k → very high.
  if (liq <= 0) return 100;
  const score = 100 - clamp((Math.log10(liq) - 4) / (6 - 4) * 100);
  return clamp(score);
}

function ageRisk(days: number | null): number | null {
  if (days == null) return null;
  // < 7 days → high risk; > 180 days → low.
  if (days <= 0) return 95;
  return clamp(100 - (Math.log1p(days) / Math.log1p(180)) * 100);
}

function holderCountRisk(count: number | null): number | null {
  if (count == null) return null;
  // 10k+ holders → low risk; < 50 → high.
  return clamp(100 - (Math.log1p(count) / Math.log1p(10_000)) * 100);
}

function activityRisk(vol: number | null): number | null {
  if (vol == null) return null;
  if (vol <= 0) return 90;
  // $1M+ daily volume → low; under $1k → high.
  return clamp(100 - clamp((Math.log10(vol) - 3) / (6 - 3) * 100));
}

const FACTOR_META: Record<
  RiskFactor["key"],
  { label: string; weight: number }
> = {
  holder_concentration: { label: "Holder concentration", weight: 0.3 },
  liquidity_size: { label: "Liquidity depth", weight: 0.25 },
  contract_age: { label: "Contract age", weight: 0.15 },
  holder_count: { label: "Number of holders", weight: 0.15 },
  trading_activity: { label: "Trading activity", weight: 0.15 },
};

function labelFor(score: number | null): RiskLabel {
  if (score == null) return "Unknown";
  if (score < 34) return "Low Risk";
  if (score < 67) return "Medium Risk";
  return "High Risk";
}

export function scoreRisk(inputs: RiskInputs): RiskBreakdown {
  const raw: Record<RiskFactor["key"], number | null> = {
    holder_concentration: concentrationRisk(inputs.topHolders),
    liquidity_size: liquidityRisk(inputs.liquidityUsd),
    contract_age: ageRisk(inputs.contractAgeDays),
    holder_count: holderCountRisk(inputs.holderCount),
    trading_activity: activityRisk(inputs.volume24hUsd),
  };

  const detail: Record<RiskFactor["key"], string> = {
    holder_concentration:
      inputs.topHolders && inputs.topHolders.length > 0
        ? `Top 10 hold ${inputs.topHolders
            .slice(0, 10)
            .reduce((s, h) => s + (h.percentage || 0), 0)
            .toFixed(1)}% of supply`
        : "Holder distribution unavailable",
    liquidity_size:
      inputs.liquidityUsd != null
        ? `$${Intl.NumberFormat("en-US", { notation: "compact" }).format(inputs.liquidityUsd)} pooled`
        : "Liquidity unavailable",
    contract_age:
      inputs.contractAgeDays != null
        ? `${Math.floor(inputs.contractAgeDays)} days old`
        : "Contract age unavailable (needs BaseScan key)",
    holder_count:
      inputs.holderCount != null
        ? `${Intl.NumberFormat("en-US").format(inputs.holderCount)} holders`
        : "Holder count unavailable (needs BaseScan key)",
    trading_activity:
      inputs.volume24hUsd != null
        ? `$${Intl.NumberFormat("en-US", { notation: "compact" }).format(inputs.volume24hUsd)} 24h volume`
        : "Volume unavailable",
  };

  const factors: RiskFactor[] = (
    Object.keys(FACTOR_META) as RiskFactor["key"][]
  ).map((key) => ({
    key,
    label: FACTOR_META[key].label,
    contribution: raw[key],
    detail: detail[key],
  }));

  // Weighted average over available factors.
  let weightedSum = 0;
  let weightTotal = 0;
  (Object.keys(raw) as RiskFactor["key"][]).forEach((key) => {
    const v = raw[key];
    if (v != null) {
      weightedSum += v * FACTOR_META[key].weight;
      weightTotal += FACTOR_META[key].weight;
    }
  });

  // Require at least ~half the weight present for a meaningful score.
  const score =
    weightTotal >= 0.5 ? Math.round(weightedSum / weightTotal) : null;

  return { score, label: labelFor(score), factors };
}
