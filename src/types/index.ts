/**
 * Core domain types for Onyx.
 *
 * Design principle: "Unknown is better than incorrect."
 * Every value sourced from an external API is wrapped so the UI always knows
 * whether data is VERIFIED, STALE, UNKNOWN, or ERRORED — it can never silently
 * present unverified data as fact.
 */

// ----------------------------------------------------------------------------
// Search detection
// ----------------------------------------------------------------------------

export type SearchEntityType =
  | "wallet"
  | "contract"
  | "token"
  | "project"
  | "quest"
  | "airdrop";

export interface SearchDetection {
  /** The raw query the user typed. */
  query: string;
  /** Best-guess entity type, or null if nothing matched. */
  type: SearchEntityType | null;
  /** 0–1 confidence in the detection. */
  confidence: number;
  /** The route the client should navigate to, or null if undetermined. */
  route: string | null;
  /** Normalized value (e.g. checksummed address, lowercased slug). */
  normalized: string;
  /** Human-readable reason, surfaced in the UI for transparency. */
  reason: string;
}

// ----------------------------------------------------------------------------
// Data freshness envelope
// ----------------------------------------------------------------------------

export type DataState = "verified" | "stale" | "unknown" | "error";

/** Wraps any externally-sourced value with provenance + freshness. */
export interface Sourced<T> {
  value: T | null;
  state: DataState;
  /** Which upstream providers contributed (e.g. ["dexscreener","base-rpc"]). */
  sources: string[];
  /** ISO timestamp of when this was fetched. */
  checkedAt: string;
  /** Present when state === "error". */
  error?: string;
}

export function sourced<T>(
  value: T | null,
  opts: { state: DataState; sources: string[]; error?: string }
): Sourced<T> {
  return {
    value,
    state: opts.state,
    sources: opts.sources,
    checkedAt: new Date().toISOString(),
    error: opts.error,
  };
}

export function unknownValue<T>(sources: string[] = []): Sourced<T> {
  return sourced<T>(null, { state: "unknown", sources });
}

// ----------------------------------------------------------------------------
// Risk + score primitives
// ----------------------------------------------------------------------------

export type RiskLabel = "Low Risk" | "Medium Risk" | "High Risk" | "Unknown";

export interface RiskBreakdown {
  /** 0–100, higher = riskier. null when not computable. */
  score: number | null;
  label: RiskLabel;
  factors: RiskFactor[];
}

export interface RiskFactor {
  key:
    | "holder_concentration"
    | "liquidity_size"
    | "contract_age"
    | "holder_count"
    | "trading_activity";
  label: string;
  /** 0–100 contribution to risk. null when the input was unavailable. */
  contribution: number | null;
  detail: string;
}

// ----------------------------------------------------------------------------
// Wallet
// ----------------------------------------------------------------------------

export type WalletBadge =
  | "Early Adopter"
  | "DeFi User"
  | "NFT User"
  | "Whale"
  | "OG Wallet"
  | "Active User";

export interface WalletScoreBreakdown {
  /** 0–100 composite. null when insufficient on-chain data. */
  score: number | null;
  components: {
    age: number | null;
    transactions: number | null;
    protocols: number | null;
    activity: number | null;
    volume: number | null;
    diversity: number | null;
  };
}

export interface WalletActivityItem {
  type: "swap" | "bridge" | "stake" | "protocol" | "transfer" | "contract";
  description: string;
  /** ISO timestamp. */
  timestamp: string;
  txHash: string;
  /** Block explorer URL. */
  url: string;
}

export interface WalletProfile {
  address: string;
  score: WalletScoreBreakdown;
  /** Account age in days. null when first tx can't be determined. */
  ageDays: Sourced<number>;
  firstSeen: Sourced<string>;
  transactionCount: Sourced<number>;
  protocolCount: Sourced<number>;
  badges: WalletBadge[];
  nativeBalance: Sourced<string>; // ETH on Base, formatted
  recentActivity: Sourced<WalletActivityItem[]>;
  protocolsUsed: Sourced<string[]>;
}

// ----------------------------------------------------------------------------
// Token
// ----------------------------------------------------------------------------

export interface TokenHolder {
  address: string;
  /** Percentage of supply held, 0–100. */
  percentage: number;
  balance: string;
}

export interface TokenProfile {
  address: string;
  name: Sourced<string>;
  symbol: Sourced<string>;
  priceUsd: Sourced<number>;
  priceChange24h: Sourced<number>;
  marketCapUsd: Sourced<number>;
  liquidityUsd: Sourced<number>;
  volume24hUsd: Sourced<number>;
  holderCount: Sourced<number>;
  topHolders: Sourced<TokenHolder[]>;
  contractAgeDays: Sourced<number>;
  createdAt: Sourced<string>;
  risk: RiskBreakdown;
  smartMoneyExposure: Sourced<SmartMoneyExposure>;
  dexUrl: string | null;
  /** Best Base pool address (for GeckoTerminal chart links). */
  poolAddress: string | null;
  logo: string | null;
  website: string | null;
  socials: { type: string; url: string }[];
  description: Sourced<string>;
}

export interface SmartMoneyExposure {
  /** Number of tracked wallets interacting. null when labels unavailable. */
  trackedWalletCount: number | null;
  recentInteractions: WalletActivityItem[];
}

// ----------------------------------------------------------------------------
// Project / Protocol
// ----------------------------------------------------------------------------

export interface ProjectProfile {
  slug: string;
  name: string;
  category: Sourced<string>;
  description: Sourced<string>;
  website: Sourced<string>;
  socials: Sourced<{ twitter?: string; discord?: string; telegram?: string }>;
  ageDays: Sourced<number>;
  tvlUsd: Sourced<number>;
  volume24hUsd: Sourced<number>;
  smartMoneyExposure: Sourced<SmartMoneyExposure>;
  isNew: boolean; // < 30 days
}

// ----------------------------------------------------------------------------
// Airdrops + Quests
// ----------------------------------------------------------------------------

export type CampaignStatus = "ongoing" | "ended" | "upcoming" | "unknown";

export type CampaignSource = "Galxe" | "Layer3" | "Zealy" | "Intract";

export interface Campaign {
  id: string;
  name: string;
  kind: "airdrop" | "quest";
  source: CampaignSource;
  status: CampaignStatus;
  reward: string | null;
  startDate: string | null; // ISO
  endDate: string | null; // ISO
  /** When this record's status was last verified against source. */
  lastCheckedAt: string;
  url: string | null;
  projectSlug: string | null;
}

// ----------------------------------------------------------------------------
// Smart Money leaderboards
// ----------------------------------------------------------------------------

export type LeaderboardKind =
  | "top_active"
  | "whale"
  | "early_adopter"
  | "rising"
  | "diversified";

export interface LeaderboardEntry {
  rank: number;
  address: string;
  score: number | null;
  ageDays: number | null;
  protocolCount: number | null;
  badges: WalletBadge[];
  /** Metric relevant to this board, e.g. volume for whales. */
  metric: { label: string; value: string };
}

// ----------------------------------------------------------------------------
// Discover
// ----------------------------------------------------------------------------

export interface DiscoverData {
  trendingProjects: ProjectSummary[];
  newProjects: ProjectSummary[];
  activeQuests: Campaign[];
  endingSoon: Campaign[];
  recentlyEnded: Campaign[];
  upcomingCampaigns: Campaign[];
}

export interface ProjectSummary {
  slug: string;
  name: string;
  category: string | null;
  tvlUsd: number | null;
  volume24hUsd: number | null;
  change24h: number | null;
  ageDays: number | null;
  isNew: boolean;
  logo: string | null;
}

// ----------------------------------------------------------------------------
// API response wrapper
// ----------------------------------------------------------------------------

export interface ApiResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
  /** ISO timestamp of response generation. */
  generatedAt: string;
}


