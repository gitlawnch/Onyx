const env = (key: string, fallback = ""): string =>
  process.env[key]?.trim() || fallback;

const PUBLIC_BASE_RPCS = [
  "https://mainnet.base.org",
  "https://base.llamarpc.com",
  "https://base-rpc.publicnode.com",
  "https://base.drpc.org",
  "https://1rpc.io/base",
  "https://base.meowrpc.com",
];

export const config = {
  baseRpcUrl: env("NEXT_PUBLIC_BASE_RPC_URL", "https://mainnet.base.org"),
  baseRpcUrls: Array.from(
    new Set(
      [env("NEXT_PUBLIC_BASE_RPC_URL"), ...PUBLIC_BASE_RPCS].filter(Boolean)
    )
  ),
  basescan: {
    apiKey: env("BASESCAN_API_KEY"),
    apiKeys: env("BASESCAN_API_KEY")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    apiUrl: env("BASESCAN_API_URL", "https://api.basescan.org/api"),
  },
  alchemy: {
    apiKey: env("ALCHEMY_API_KEY"),
    baseUrl: env("ALCHEMY_API_KEY")
      ? `https://base-mainnet.g.alchemy.com/v2/${env("ALCHEMY_API_KEY")}`
      : "",
  },
  dexscreener: {
    apiUrl: env("DEXSCREENER_API_URL", "https://api.dexscreener.com"),
  },
  defillama: {
    apiUrl: env("DEFILLAMA_API_URL", "https://api.llama.fi"),
  },
  coingecko: {
    apiUrl: env("COINGECKO_API_URL", "https://api.coingecko.com/api/v3"),
    apiKey: env("COINGECKO_API_KEY"),
  },
  supabase: {
    url: env("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY"),
  },
} as const;

export const sources = {
  baseRpc: {
    name: "Base RPC",
    available: config.baseRpcUrls.length > 0,
    keyless: true,
  },
  basescan: {
    name: "BaseScan",
    available: Boolean(config.basescan.apiKey),
    keyless: false,
    note: "Add BASESCAN_API_KEY to enable tx counts, holder counts, contract age.",
  },
  alchemy: {
    name: "Alchemy",
    available: Boolean(config.alchemy.apiKey),
    keyless: false,
    note: "Add ALCHEMY_API_KEY to enable wallet tx count, age and protocols.",
  },
  dexscreener: {
    name: "DexScreener",
    available: Boolean(config.dexscreener.apiUrl),
    keyless: true,
  },
  defillama: {
    name: "DefiLlama",
    available: Boolean(config.defillama.apiUrl),
    keyless: true,
  },
  coingecko: {
    name: "CoinGecko",
    available: Boolean(config.coingecko.apiUrl),
    keyless: true,
  },
  supabase: {
    name: "Supabase",
    available: Boolean(config.supabase.url && config.supabase.anonKey),
    keyless: false,
    note: "Required for campaigns (airdrops/quests) and smart-money labels.",
  },
} as const;

export const BASE_CHAIN_ID = 8453;

export const EXPLORER_URL = "https://basescan.org";

export const explorerTx = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const explorerAddress = (addr: string) =>
  `${EXPLORER_URL}/address/${addr}`;
export const explorerToken = (addr: string) => `${EXPLORER_URL}/token/${addr}`;

export const GECKOTERMINAL_URL = "https://www.geckoterminal.com";
export const geckoTerminalToken = (tokenAddr: string) =>
  `${GECKOTERMINAL_URL}/base/tokens/${tokenAddr}`;
export const geckoTerminalPool = (poolAddr: string) =>
  `${GECKOTERMINAL_URL}/base/pools/${poolAddr}`;
