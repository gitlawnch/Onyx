import type { Address } from "viem";
import { getAddress } from "viem";
import type {
  Sourced,
  WalletActivityItem,
  WalletProfile,
} from "@/types";
import { sourced, unknownValue } from "@/types";
import { sources } from "@/lib/config";
import {
  getNativeBalance,
  getNonce,
  isContract,
} from "@/lib/adapters/base-rpc";
import {
  getFirstSeen,
  getInteractedContracts,
  getTransactionCount,
} from "@/lib/adapters/basescan";
import { getWalletSummary, getRecentActivity } from "@/lib/adapters/alchemy";
import { getTrackedWallet } from "@/lib/adapters/smart-money";
import { deriveBadges, scoreWallet, type ScoreInputs } from "@/lib/scoring/wallet";

function daysBetween(fromIso: string | null, to = Date.now()): number | null {
  if (!fromIso) return null;
  const from = new Date(fromIso).getTime();
  if (!Number.isFinite(from)) return null;
  return Math.max(0, (to - from) / (1000 * 60 * 60 * 24));
}

export async function getWalletProfile(
  rawAddress: string
): Promise<WalletProfile | null> {
  let address: Address;
  try {
    address = getAddress(rawAddress);
  } catch {
    return null;
  }
  const normalized = address.toLowerCase();

  const [
    balance,
    nonce,
    contractFlag,
    firstSeen,
    txCount,
    contracts,
    tracked,
    alchemy,
    activity,
  ] = await Promise.all([
    getNativeBalance(address),
    getNonce(address),
    isContract(address),
    getFirstSeen(normalized),
    getTransactionCount(normalized),
    getInteractedContracts(normalized),
    getTrackedWallet(normalized),
    getWalletSummary(normalized),
    getRecentActivity(normalized),
  ]);

  void contractFlag;

  const effectiveFirstSeen = alchemy?.firstSeenIso ?? firstSeen;
  const effectiveTxCount =
    alchemy?.txCount != null ? alchemy.txCount : txCount;
  const effectiveProtocols = alchemy?.protocols ?? contracts;
  const effectiveProtocolCount =
    alchemy?.protocolCount != null
      ? alchemy.protocolCount
      : contracts?.length ?? null;

  const ageDays = daysBetween(effectiveFirstSeen);

  const recentActivity = buildRecentActivity(tracked);
  const daysSinceLast =
    alchemy?.lastSeenIso != null
      ? daysBetween(alchemy.lastSeenIso)
      : recentActivity.length > 0
      ? daysBetween(recentActivity[0].timestamp)
      : null;

  const volumeUsd = tracked?.volume_usd ?? null;
  const categoryCount = null;

  const scoreInputs: ScoreInputs = {
    ageDays,
    txCount: effectiveTxCount ?? (nonce != null ? nonce : null),
    protocolCount: effectiveProtocolCount,
    daysSinceLastActivity: daysSinceLast,
    volumeUsd,
    categoryCount,
  };

  const score = scoreWallet(scoreInputs);
  const badges = deriveBadges({
    ...scoreInputs,
    isWhaleLabeled: tracked?.is_whale ?? false,
    usesNft: null,
  });

  const rpcSrc = sources.baseRpc.available ? ["Base RPC"] : [];
  const alcSrc = sources.alchemy.available ? ["Alchemy"] : [];
  const scanSrc = sources.basescan.available ? ["BaseScan"] : [];
  const histSrc =
    alchemy != null ? alcSrc : scanSrc.length ? scanSrc : [];

  return {
    address: normalized,
    score,
    ageDays: numOrUnknown(ageDays, histSrc),
    firstSeen: strOrUnknown(effectiveFirstSeen, histSrc),
    transactionCount: numOrUnknown(
      effectiveTxCount ?? null,
      histSrc.length ? histSrc : rpcSrc
    ),
    protocolCount: numOrUnknown(effectiveProtocolCount, histSrc),
    badges,
    nativeBalance: strOrUnknown(balance, rpcSrc),
    recentActivity:
      activity && activity.length > 0
        ? sourced(activity as WalletActivityItem[], { state: "verified", sources: ["Alchemy"] })
        : activity != null
        ? sourced([] as WalletActivityItem[], { state: "verified", sources: ["Alchemy"] })
        : unknownValue<WalletActivityItem[]>(["Alchemy"]),
    protocolsUsed: effectiveProtocols
      ? sourced(effectiveProtocols, { state: "verified", sources: histSrc })
      : unknownValue<string[]>(histSrc),
  };
}

function buildRecentActivity(
  tracked: Awaited<ReturnType<typeof getTrackedWallet>>
): WalletActivityItem[] {
  void tracked;
  return [];
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
