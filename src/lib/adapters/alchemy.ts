import { config, sources } from "@/lib/config";
import { fetchJson } from "@/lib/utils/fetch";

interface TransferRaw {
  blockNum: string;
  hash: string;
  from: string;
  to: string | null;
  category: string;
  metadata?: { blockTimestamp?: string };
}

interface TransfersResult {
  transfers: TransferRaw[];
  pageKey?: string;
}

interface RpcResponse<T> {
  result?: T;
  error?: { message: string };
}

const CATEGORIES = ["external", "erc20", "erc721", "erc1155"];

async function getAssetTransfers(
  params: Record<string, unknown>
): Promise<TransfersResult | null> {
  if (!sources.alchemy.available) return null;
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "alchemy_getAssetTransfers",
    params: [params],
  });
  const res = await fetchJson<RpcResponse<TransfersResult>>(config.alchemy.baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    revalidate: 120,
  });
  if (!res.ok || !res.data.result) return null;
  return res.data.result;
}

export interface WalletChainSummary {
  txCount: number;
  firstSeenIso: string | null;
  lastSeenIso: string | null;
  protocolCount: number;
  protocols: string[];
}

export async function getWalletSummary(
  address: string,
  maxPages = 3
): Promise<WalletChainSummary | null> {
  if (!sources.alchemy.available) return null;

  const protocols = new Set<string>();
  let txCount = 0;
  let earliest: string | null = null;
  let latest: string | null = null;
  let pageKey: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const result = await getAssetTransfers({
      fromAddress: address,
      category: CATEGORIES,
      withMetadata: true,
      excludeZeroValue: false,
      maxCount: "0x3e8",
      order: "asc",
      ...(pageKey ? { pageKey } : {}),
    });
    if (!result) break;

    for (const t of result.transfers) {
      txCount += 1;
      const ts = t.metadata?.blockTimestamp ?? null;
      if (ts) {
        if (!earliest || ts < earliest) earliest = ts;
        if (!latest || ts > latest) latest = ts;
      }
      if (t.to && t.category !== "external") {
        protocols.add(t.to.toLowerCase());
      }
    }

    if (!result.pageKey) break;
    pageKey = result.pageKey;
  }

  return {
    txCount,
    firstSeenIso: earliest,
    lastSeenIso: latest,
    protocolCount: protocols.size,
    protocols: Array.from(protocols),
  };
}

// ---- Recent activity: aktivitas terakhir (masuk + keluar) -----------------
export interface ActivityItem {
  type: "swap" | "bridge" | "stake" | "protocol" | "transfer" | "contract";
  description: string;
  timestamp: string;
  txHash: string;
  url: string;
}

interface RawTransfer {
  hash: string;
  from: string;
  to: string | null;
  value: number | null;
  asset: string | null;
  category: string;
  metadata?: { blockTimestamp?: string };
}

const fmtAmt = (v: number | null) =>
  v == null ? "" : Number(v).toLocaleString("en-US", { maximumFractionDigits: 4 });

/** Ambil aktivitas terakhir wallet (token & ETH masuk/keluar), urut terbaru. */
export async function getRecentActivity(
  address: string,
  limit = 12
): Promise<ActivityItem[] | null> {
  if (!sources.alchemy.available) return null;
  const wallet = address.toLowerCase();
  const categories = ["external", "erc20", "erc721", "erc1155"];

  async function fetchDir(key: "fromAddress" | "toAddress"): Promise<RawTransfer[]> {
    const params: Record<string, unknown> = {
      category: categories,
      withMetadata: true,
      excludeZeroValue: true,
      maxCount: "0xc", // 12
      order: "desc",
      [key]: address,
    };
    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "alchemy_getAssetTransfers", params: [params] });
    const res = await fetchJson<{ result?: { transfers: RawTransfer[] } }>(config.alchemy.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      revalidate: 60,
    });
    return res.ok && res.data.result ? res.data.result.transfers : [];
  }

  function describe(t: RawTransfer): { type: ActivityItem["type"]; desc: string } {
    const incoming = (t.to || "").toLowerCase() === wallet;
    const asset = t.asset || "ETH";
    if (t.category === "erc721" || t.category === "erc1155") {
      return { type: "contract", desc: `${incoming ? "Received" : "Sent"} NFT (${asset})` };
    }
    const sign = incoming ? "+" : "-";
    return { type: "transfer", desc: `${sign}${fmtAmt(t.value)} ${asset}` };
  }

  try {
    const [out, inc] = await Promise.all([fetchDir("fromAddress"), fetchDir("toAddress")]);
    const all = [...out, ...inc].filter((t) => t.metadata?.blockTimestamp);

    const seen = new Set<string>();
    const merged = all
      .sort((a, b) => (b.metadata!.blockTimestamp! > a.metadata!.blockTimestamp! ? 1 : -1))
      .filter((t) => {
        const k = `${t.hash}-${t.asset}-${t.value}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, limit);

    return merged.map((t) => {
      const { type, desc } = describe(t);
      return {
        type,
        description: desc,
        timestamp: t.metadata!.blockTimestamp!,
        txHash: t.hash,
        url: `https://basescan.org/tx/${t.hash}`,
      };
    });
  } catch {
    return null;
  }
}