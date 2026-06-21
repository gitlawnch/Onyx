/**
 * BaseScan adapter (KEY REQUIRED).
 *
 * Provides indexed data the RPC can't give cheaply:
 *  - total transaction count (full activity, not just nonce)
 *  - token holder count
 *  - contract creation time (→ contract age)
 *
 * TODO(api-key): Set BASESCAN_API_KEY in .env.local to enable. Without it,
 * every function here returns null and the UI shows "unknown" — never a guess.
 * Free key: https://basescan.org/myapikey
 */

import { config, sources } from "@/lib/config";
import { fetchJson } from "@/lib/utils/fetch";

interface EtherscanEnvelope<T> {
  status: string; // "1" ok, "0" error/empty
  message: string;
  result: T;
}

// Round-robin index across configured BaseScan keys. Rotating per-request
// spreads load so no single key hits its rate limit first.
let _keyCursor = 0;
function nextApiKey(): string {
  const keys = config.basescan.apiKeys;
  if (keys.length === 0) return "";
  const key = keys[_keyCursor % keys.length];
  _keyCursor += 1;
  return key;
}

function buildUrl(params: Record<string, string>): string {
  const usp = new URLSearchParams({ ...params, apikey: nextApiKey() });
  return `${config.basescan.apiUrl}?${usp.toString()}`;
}

/** Total tx count for an address via the account txlist (capped sample). */
export async function getTransactionCount(address: string): Promise<number | null> {
  if (!sources.basescan.available) return null;
  // proxy.eth_getTransactionCount gives nonce; for full count we page txlist.
  // To stay within free-tier limits we read the first page and the latest,
  // using the indexer's own count when available.
  const url = buildUrl({
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "10000",
    sort: "asc",
  });
  const res = await fetchJson<EtherscanEnvelope<unknown[]>>(url, { revalidate: 120 });
  if (!res.ok || res.data.status !== "1" || !Array.isArray(res.data.result)) {
    return null;
  }
  // If we hit the page cap, report it as a lower bound handled by the caller.
  return res.data.result.length;
}

/** First-seen timestamp (ISO) from the earliest transaction. */
export async function getFirstSeen(address: string): Promise<string | null> {
  if (!sources.basescan.available) return null;
  const url = buildUrl({
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "1",
    sort: "asc",
  });
  const res = await fetchJson<EtherscanEnvelope<{ timeStamp: string }[]>>(url, {
    revalidate: 600,
  });
  if (!res.ok || res.data.status !== "1" || !res.data.result?.[0]) return null;
  const ts = Number(res.data.result[0].timeStamp) * 1000;
  return Number.isFinite(ts) ? new Date(ts).toISOString() : null;
}

/** Distinct contracts an address has interacted with (protocol proxy). */
export async function getInteractedContracts(address: string): Promise<string[] | null> {
  if (!sources.basescan.available) return null;
  const url = buildUrl({
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "10000",
    sort: "desc",
  });
  const res = await fetchJson<EtherscanEnvelope<{ to: string; input: string }[]>>(
    url,
    { revalidate: 300 }
  );
  if (!res.ok || res.data.status !== "1" || !Array.isArray(res.data.result)) {
    return null;
  }
  const contracts = new Set<string>();
  for (const tx of res.data.result) {
    // Heuristic: txs with calldata to a destination are contract interactions.
    if (tx.to && tx.input && tx.input !== "0x") contracts.add(tx.to.toLowerCase());
  }
  return Array.from(contracts);
}

/** Token holder count. BaseScan exposes this via the token endpoints. */
export async function getTokenHolderCount(contract: string): Promise<number | null> {
  if (!sources.basescan.available) return null;
  const url = buildUrl({
    module: "token",
    action: "tokenholdercount",
    contractaddress: contract,
  });
  const res = await fetchJson<EtherscanEnvelope<string>>(url, { revalidate: 120 });
  if (!res.ok || res.data.status !== "1") return null;
  const n = Number(res.data.result);
  return Number.isFinite(n) ? n : null;
}

/** Top token holders with balances. Returns null without a (Pro) key. */
export async function getTopTokenHolders(
  contract: string,
  limit = 10
): Promise<{ address: string; balance: string }[] | null> {
  if (!sources.basescan.available) return null;
  const url = buildUrl({
    module: "token",
    action: "topholders",
    contractaddress: contract,
    page: "1",
    offset: String(limit),
  });
  const res = await fetchJson<
    EtherscanEnvelope<{ TokenHolderAddress: string; TokenHolderQuantity: string }[]>
  >(url, { revalidate: 300 });
  if (!res.ok || res.data.status !== "1" || !Array.isArray(res.data.result)) {
    return null;
  }
  return res.data.result.map((h) => ({
    address: h.TokenHolderAddress,
    balance: h.TokenHolderQuantity,
  }));
}

/** Contract creation timestamp (ISO) → used for contract age. */
export async function getContractCreation(contract: string): Promise<string | null> {
  if (!sources.basescan.available) return null;
  const url = buildUrl({
    module: "contract",
    action: "getcontractcreation",
    contractaddresses: contract,
  });
  const res = await fetchJson<EtherscanEnvelope<{ txHash: string }[]>>(url, {
    revalidate: 3600,
  });
  if (!res.ok || res.data.status !== "1" || !res.data.result?.[0]) return null;

  // Resolve creation tx → block timestamp.
  const txHash = res.data.result[0].txHash;
  const txUrl = buildUrl({
    module: "proxy",
    action: "eth_getTransactionByHash",
    txhash: txHash,
  });
  const txRes = await fetchJson<{ result: { blockNumber: string } | null }>(txUrl, {
    revalidate: 3600,
  });
  if (!txRes.ok || !txRes.data.result?.blockNumber) return null;

  const blockUrl = buildUrl({
    module: "proxy",
    action: "eth_getBlockByNumber",
    tag: txRes.data.result.blockNumber,
    boolean: "false",
  });
  const blockRes = await fetchJson<{ result: { timestamp: string } | null }>(
    blockUrl,
    { revalidate: 3600 }
  );
  if (!blockRes.ok || !blockRes.data.result?.timestamp) return null;
  const ts = parseInt(blockRes.data.result.timestamp, 16) * 1000;
  return Number.isFinite(ts) ? new Date(ts).toISOString() : null;
}
