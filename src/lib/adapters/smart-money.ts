/**
 * Smart-money adapter (Priority #6).
 *
 * "Smart money" wallet labeling is a proprietary dataset (Nansen-style). There
 * is no free public API. Onyx reads labeled wallets from Supabase's
 * `tracked_wallets` table, which you populate from your own labeling pipeline.
 *
 * TODO(labeling): build a pipeline that classifies wallets and writes rows with
 * scores/badges/metrics. With an empty table, leaderboards render an honest
 * empty state and `getSmartMoneyExposure` returns null (â†’ "unknown" in the UI).
 * No wallet is ever invented or labeled without real data.
 */

import type {
  LeaderboardEntry,
  LeaderboardKind,
  SmartMoneyExposure,
  WalletBadge,
} from "@/types";
import { serverSupabase } from "@/lib/supabase/server";

interface TrackedWalletRow {
  address: string;
  score: number | null;
  age_days: number | null;
  protocol_count: number | null;
  badges: string[] | null;
  volume_usd: number | null;
  tx_count: number | null;
  diversity_score: number | null;
  is_whale: boolean | null;
  is_early_adopter: boolean | null;
  is_rising: boolean | null;
  updated_at: string;
}

interface WalletInteractionRow {
  wallet_address: string;
  target: string;
  action: string;
  description: string;
  tx_hash: string;
  occurred_at: string;
}

function mapBadges(raw: string[] | null): WalletBadge[] {
  const valid: WalletBadge[] = [
    "Early Adopter",
    "DeFi User",
    "NFT User",
    "Whale",
    "OG Wallet",
    "Active User",
  ];
  return (raw ?? []).filter((b): b is WalletBadge =>
    valid.includes(b as WalletBadge)
  );
}

interface BoardConfig {
  filter?: (r: TrackedWalletRow) => boolean;
  orderColumn: keyof TrackedWalletRow;
  metric: (r: TrackedWalletRow) => { label: string; value: string };
}

const BOARDS: Record<LeaderboardKind, BoardConfig> = {
  top_active: {
    orderColumn: "tx_count",
    metric: (r) => ({ label: "Transactions", value: fmtInt(r.tx_count) }),
  },
  whale: {
    filter: (r) => r.is_whale === true,
    orderColumn: "volume_usd",
    metric: (r) => ({ label: "Volume", value: fmtUsd(r.volume_usd) }),
  },
  early_adopter: {
    filter: (r) => r.is_early_adopter === true,
    orderColumn: "age_days",
    metric: (r) => ({
      label: "Age",
      value: r.age_days != null ? `${r.age_days}d` : "â€”",
    }),
  },
  rising: {
    filter: (r) => r.is_rising === true,
    orderColumn: "score",
    metric: (r) => ({ label: "Score", value: r.score != null ? String(r.score) : "â€”" }),
  },
  diversified: {
    orderColumn: "diversity_score",
    metric: (r) => ({ label: "Protocols", value: fmtInt(r.protocol_count) }),
  },
};

export async function getLeaderboard(
  kind: LeaderboardKind,
  limit = 25
): Promise<LeaderboardEntry[]> {
  const sb = serverSupabase();
  if (!sb) return [];
  const cfg = BOARDS[kind];

  let query = sb.from("tracked_wallets").select("*");
  // Apply board-specific boolean filters server-side where possible.
  if (kind === "whale") query = query.eq("is_whale", true);
  if (kind === "early_adopter") query = query.eq("is_early_adopter", true);
  if (kind === "rising") query = query.eq("is_rising", true);

  const { data, error } = await query
    .order(cfg.orderColumn as string, { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error || !data) return [];

  const rows = (data as TrackedWalletRow[]).filter(cfg.filter ?? (() => true));
  return rows.map((r, i) => ({
    rank: i + 1,
    address: r.address,
    score: r.score,
    ageDays: r.age_days,
    protocolCount: r.protocol_count,
    badges: mapBadges(r.badges),
    metric: cfg.metric(r),
  }));
}

/** Is a given wallet tracked (smart money)? Returns row or null. */
export async function getTrackedWallet(
  address: string
): Promise<TrackedWalletRow | null> {
  const sb = serverSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("tracked_wallets")
    .select("*")
    .ilike("address", address)
    .maybeSingle();
  if (error || !data) return null;
  return data as TrackedWalletRow;
}

/**
 * Smart-money exposure for a token/project: how many tracked wallets interacted
 * with it, plus recent interactions. Null when labels aren't available.
 */
export async function getSmartMoneyExposure(
  target: string
): Promise<SmartMoneyExposure | null> {
  const sb = serverSupabase();
  if (!sb) return null;

  const { data, error, count } = await sb
    .from("wallet_interactions")
    .select("*", { count: "exact" })
    .ilike("target", target)
    .order("occurred_at", { ascending: false })
    .limit(10);
  if (error) return null;

  const rows = (data ?? []) as WalletInteractionRow[];
  return {
    trackedWalletCount: count ?? rows.length,
    recentInteractions: rows.map((r) => ({
      type: normalizeAction(r.action),
      description: r.description,
      timestamp: r.occurred_at,
      txHash: r.tx_hash,
      url: `https://basescan.org/tx/${r.tx_hash}`,
    })),
  };
}

function normalizeAction(
  a: string
): "swap" | "bridge" | "stake" | "protocol" | "transfer" | "contract" {
  const k = a.toLowerCase();
  if (k.includes("swap") || k.includes("buy") || k.includes("sell")) return "swap";
  if (k.includes("bridge")) return "bridge";
  if (k.includes("stake")) return "stake";
  if (k.includes("transfer")) return "transfer";
  if (k.includes("protocol") || k.includes("join")) return "protocol";
  return "contract";
}

function fmtInt(n: number | null): string {
  return n != null ? new Intl.NumberFormat("en-US").format(n) : "â€”";
}
function fmtUsd(n: number | null): string {
  return n != null
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
      }).format(n)
    : "â€”";
}
