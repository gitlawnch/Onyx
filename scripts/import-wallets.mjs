import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadEnv() {
  const p = resolve(ROOT, ".env.local");
  if (!existsSync(p)) { console.error("x .env.local tidak ada"); process.exit(1); }
  const env = {};
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv();
const ALCHEMY_KEY = env.ALCHEMY_API_KEY || "";
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!ALCHEMY_KEY) { console.error("x ALCHEMY_API_KEY kosong"); process.exit(1); }
if (!SUPABASE_URL || !SERVICE_KEY) { console.error("x SUPABASE creds kosong"); process.exit(1); }

const ALCHEMY_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`;
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const logScore = (v, ref) => (v <= 0 ? 0 : clamp((Math.log1p(v) / Math.log1p(ref)) * 100));

async function rpc(method, params) {
  const res = await fetch(ALCHEMY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

async function isContract(addr) {
  try { const code = await rpc("eth_getCode", [addr, "latest"]); return code && code !== "0x"; }
  catch { return null; }
}

async function getTxCount(addr) {
  try { const hex = await rpc("eth_getTransactionCount", [addr, "latest"]); return Number(BigInt(hex)); }
  catch { return null; }
}

// Hanya untuk umur + protokol (2 halaman cukup; tx count pakai nonce di atas).
async function getAgeAndProtocols(addr, maxPages = 2) {
  const categories = ["external", "erc20", "erc721", "erc1155"];
  const protocols = new Set();
  let earliest = null, latest = null, pageKey, sawAny = false;
  for (let p = 0; p < maxPages; p++) {
    const params = { fromAddress: addr, category: categories, withMetadata: true, excludeZeroValue: false, maxCount: "0x3e8", order: "asc" };
    if (pageKey) params.pageKey = pageKey;
    let result;
    try { result = await rpc("alchemy_getAssetTransfers", [params]); } catch { return null; }
    if (!result || !result.transfers) break;
    for (const t of result.transfers) {
      sawAny = true;
      const ts = t.metadata?.blockTimestamp ?? null;
      if (ts) { if (!earliest || ts < earliest) earliest = ts; if (!latest || ts > latest) latest = ts; }
      if (t.to && t.category !== "external") protocols.add(t.to.toLowerCase());
    }
    if (!result.pageKey) break;
    pageKey = result.pageKey;
  }
  // Ambil juga 1 transfer terbaru untuk recency (lastSeen) secara terpisah.
  try {
    const recent = await rpc("alchemy_getAssetTransfers", [{ fromAddress: addr, category: categories, withMetadata: true, maxCount: "0x1", order: "desc" }]);
    const t = recent?.transfers?.[0];
    if (t?.metadata?.blockTimestamp) { const ts = t.metadata.blockTimestamp; if (!latest || ts > latest) latest = ts; }
  } catch {}
  return { firstSeenIso: earliest, lastSeenIso: latest, protocolCount: protocols.size, sawAny };
}

async function getBalanceEth(addr) {
  try { const hex = await rpc("eth_getBalance", [addr, "latest"]); return Number(BigInt(hex)) / 1e18; }
  catch { return null; }
}

const daysBetween = (iso, to = Date.now()) => {
  if (!iso) return null;
  const f = new Date(iso).getTime();
  return Number.isFinite(f) ? Math.max(0, (to - f) / 86400000) : null;
};

function scoreWallet({ ageDays, txCount, protocolCount, daysSinceLast }) {
  const c = {
    age: ageDays != null ? logScore(ageDays, 1095) : null,
    transactions: txCount != null ? logScore(txCount, 2000) : null,
    protocols: protocolCount != null ? logScore(protocolCount, 40) : null,
    activity: daysSinceLast != null ? clamp(100 - logScore(daysSinceLast, 180)) : null,
  };
  const w = { age: 0.25, transactions: 0.25, protocols: 0.25, activity: 0.25 };
  let sum = 0, wt = 0;
  for (const k of Object.keys(c)) if (c[k] != null) { sum += c[k] * w[k]; wt += w[k]; }
  return wt > 0 ? Math.round(sum / wt) : null;
}

function deriveBadges({ ageDays, protocolCount, daysSinceLast, balanceEth }) {
  const b = [];
  if (ageDays != null && ageDays >= 365) b.push("OG Wallet");
  if (ageDays != null && ageDays >= 180 && ageDays < 365) b.push("Early Adopter");
  if (protocolCount != null && protocolCount >= 5) b.push("DeFi User");
  if (daysSinceLast != null && daysSinceLast <= 7) b.push("Active User");
  if (balanceEth != null && balanceEth >= 50) b.push("Whale");
  return b;
}

async function upsert(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tracked_wallets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const listPath = resolve(ROOT, "wallets.txt");
  if (!existsSync(listPath)) { console.error("x wallets.txt tidak ada"); process.exit(1); }
  const addrs = Array.from(new Set(
    readFileSync(listPath, "utf8").split(/\r?\n/).map((l) => l.trim().toLowerCase()).filter((l) => /^0x[a-f0-9]{40}$/.test(l))
  ));
  if (!addrs.length) { console.error("x tidak ada alamat valid"); process.exit(1); }

  console.log(`-> Memproses ${addrs.length} alamat (contract dilewati otomatis)...\n`);
  let ok = 0, skipCa = 0, skipEmpty = 0, err = 0;

  for (const [i, addr] of addrs.entries()) {
    const tag = `[${i + 1}/${addrs.length}] ${addr.slice(0, 10)}..`;
    try {
      const ca = await isContract(addr);
      if (ca === true) { console.log(`${tag} - contract, dilewati`); skipCa++; await sleep(150); continue; }
      const txCount = await getTxCount(addr);
      const info = await getAgeAndProtocols(addr);
      if (!info || (!info.sawAny && (txCount ?? 0) === 0)) { console.log(`${tag} - tidak ada aktivitas Base, dilewati`); skipEmpty++; await sleep(150); continue; }
      const bal = await getBalanceEth(addr);
      const ageDays = daysBetween(info.firstSeenIso);
      const daysSinceLast = daysBetween(info.lastSeenIso);
      const score = scoreWallet({ ageDays, txCount, protocolCount: info.protocolCount, daysSinceLast });
      const badges = deriveBadges({ ageDays, protocolCount: info.protocolCount, daysSinceLast, balanceEth: bal });
      await upsert({
        address: addr, score,
        age_days: ageDays != null ? Math.round(ageDays) : null,
        protocol_count: info.protocolCount, badges, tx_count: txCount,
        is_whale: badges.includes("Whale"),
        is_early_adopter: badges.includes("Early Adopter") || badges.includes("OG Wallet"),
        is_rising: false, diversity_score: info.protocolCount,
        updated_at: new Date().toISOString(),
      });
      console.log(`${tag} OK score ${score ?? "-"} | ${txCount}tx | ${info.protocolCount}proto | ${badges.join(",") || "-"}`);
      ok++;
    } catch (e) { console.log(`${tag} x ${e.message}`); err++; }
    await sleep(200);
  }
  console.log(`\nSelesai. Masuk: ${ok} | Contract: ${skipCa} | Tanpa aktivitas: ${skipEmpty} | Error: ${err}`);
  console.log("Buka /smart-money untuk lihat hasil.");
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
