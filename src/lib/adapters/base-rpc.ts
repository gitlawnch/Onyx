/**
 * Base RPC adapter (KEYLESS, with automatic multi-endpoint fallback).
 *
 * Uses viem's `fallback` transport over a pool of public Base RPCs (plus an
 * optional dedicated endpoint via NEXT_PUBLIC_BASE_RPC_URL, tried first). If an
 * endpoint is down or rate-limited, viem transparently switches to the next and
 * ranks endpoints by reliability — so transient RPC issues don't surface as
 * errors in the UI.
 *
 * Provides the primitive that powers search disambiguation: `isContract`.
 */

import {
  createPublicClient,
  http,
  fallback,
  formatEther,
  type Address,
} from "viem";
import { base } from "viem/chains";
import { config, sources } from "@/lib/config";

// Single shared client. Created eagerly so its concrete type is preserved for
// viem's action inference (a nullable union breaks getBlock/getCode typing).
const client = createPublicClient({
  chain: base,
  transport: fallback(
    config.baseRpcUrls.map((url) =>
      http(url, { batch: true, timeout: 10_000, retryCount: 1 })
    ),
    {
      // Periodically re-rank endpoints so the fastest healthy one leads.
      rank: { interval: 60_000, sampleCount: 3 },
      retryCount: 2,
    }
  ),
});

export function rpcClient() {
  return client;
}

/**
 * Distinguishes a contract from an externally-owned (wallet) account by
 * checking for deployed bytecode. This is the on-chain ground truth that the
 * search engine uses to route an address to /token vs /wallet.
 */
export async function isContract(address: Address): Promise<boolean | null> {
  if (!sources.baseRpc.available) return null;
  try {
    const code = await rpcClient().getCode({ address });
    return Boolean(code && code !== "0x");
  } catch {
    return null;
  }
}

export async function getNativeBalance(address: Address): Promise<string | null> {
  if (!sources.baseRpc.available) return null;
  try {
    const wei = await rpcClient().getBalance({ address });
    return formatEther(wei);
  } catch {
    return null;
  }
}

/**
 * Transaction count from the node (nonce). Note: this is the *outgoing* tx
 * count (nonce), not total account activity — full activity requires an
 * indexer (BaseScan). We label it accordingly in the UI.
 */
export async function getNonce(address: Address): Promise<number | null> {
  if (!sources.baseRpc.available) return null;
  try {
    return await rpcClient().getTransactionCount({ address });
  } catch {
    return null;
  }
}

/** Resolve a Basename/ENS name to an address, if resolvable. */
export async function resolveName(name: string): Promise<string | null> {
  try {
    const addr = await rpcClient().getEnsAddress({ name });
    return addr ?? null;
  } catch {
    // Base RPC may not support ENS resolution for all names; treat as unknown.
    return null;
  }
}
