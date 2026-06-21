# Base Alpha

**Search-first intelligence platform for the Base ecosystem.**

Paste any wallet, token, contract, project, quest, or airdrop — Base Alpha
detects what it is and shows verified on-chain intelligence. Built on the
principle that **unknown is better than incorrect**: when a connected source
can't provide a value, the UI shows "Unknown" with an explanation, never a
fabricated number.

---

## Stack

- **Next.js 15** (App Router, Route Handlers, RSC) · **TypeScript** (strict)
- **Tailwind CSS** + **shadcn-style** primitives (Radix under the hood)
- **Framer Motion** for animation
- **viem** for Base RPC
- **Supabase** for the data that has no public API (campaigns + smart-money labels)

---

## Quick start

```bash
# 1. Install
npm install

# 2. Configure (nothing is required to boot — see "Data sources" below)
cp .env.example .env.local
#   The app runs with zero keys: keyless sources work, keyed/Supabase-backed
#   sections show honest empty/"unknown" states until you add credentials.

# 3. Dev
npm run dev          # http://localhost:3000

# 4. Production
npm run build && npm run start
```

Type-check and lint:

```bash
npm run typecheck
npm run lint
```

---

## Data sources

Base Alpha is explicit about where every value comes from and degrades
gracefully when a source isn't configured.

### Keyless — work immediately, no setup

| Source          | Powers                                              |
| --------------- | -------------------------------------------------- |
| **Base RPC**    | wallet vs. contract detection, ETH balance, nonce  |
| **DexScreener** | token price, liquidity, volume, market cap, search |
| **DefiLlama**   | Base protocol list + TVL (Discover, projects)      |
| **CoinGecko**   | (adapter scaffold; public endpoints, optional key) |

### Keyed — add a key to unlock (otherwise shown as "Unknown")

| Source       | Env var             | Powers                                          |
| ------------ | ------------------- | ----------------------------------------------- |
| **BaseScan** | `BASESCAN_API_KEY`  | tx counts, holder counts, top holders, contract age |

Get a free BaseScan key at <https://basescan.org/myapikey>. Without it, those
specific fields render "Unknown" — every other part of the page still works.

### Supabase-backed — data with no public API

Galxe, Layer3, Zealy, and Intract **do not expose public read APIs** for
campaign status, and "smart money" wallet labeling is a proprietary dataset.
Base Alpha reads these from Supabase tables that **you** populate from your own
ingestion/labeling jobs. Empty tables produce honest empty states — never
invented campaigns or wallets.

```bash
# Set in .env.local
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."   # server-only, for your write jobs
```

Then run the migration in `supabase/migrations/0001_init.sql` (Supabase SQL
editor or `supabase db push`). It creates:

- `campaigns` — airdrops + quests
- `tracked_wallets` — smart-money labels
- `wallet_interactions` — activity feed + smart-money exposure

---

## Architecture

```
src/
├─ app/
│  ├─ page.tsx                  Home: hero search + live sections
│  ├─ wallet/[address]/         Wallet Analyzer (score, badges, stats, activity)
│  ├─ token/[address]/          Token Analyzer (price, risk, holders)
│  ├─ project/[slug]/           Project profile (TVL, socials, exposure)
│  ├─ airdrop/[id]/             Campaign detail (source, dates, last-checked)
│  ├─ discover/                 Trending / New / Quests / Ending / Ended
│  ├─ smart-money/              Five leaderboards
│  └─ api/                      Route Handlers (search, wallet, token, …)
├─ components/
│  ├─ search/search-bar.tsx     Global search w/ live suggestions + detection
│  ├─ shared/sourced-value.tsx  Renders Sourced<T> → "Unknown" when unverified
│  ├─ wallet/ token/ discover/ smart-money/ airdrop/   feature views
│  └─ ui/                       Button, Card, Badge, Tabs, Accordion, Skeleton
└─ lib/
   ├─ adapters/                 One file per source (base-rpc, dexscreener,
   │                            defillama, basescan, campaigns, smart-money)
   ├─ scoring/                  wallet.ts (composite score), token.ts (risk)
   ├─ search/                   detect.ts (shape) + resolver.ts (async routing)
   ├─ services/                 assemble full profiles from adapters + scoring
   ├─ supabase/                 browser + server clients
   ├─ utils/                    fetch (timeout/retry), format, cn, api helpers
   └─ config.ts                 source-availability registry
```

### How search works

1. **`detectShape`** (sync) classifies the input form: address, tx hash,
   ENS/Basename, or free text.
2. **`resolveQuery`** (async) does the minimal network work:
   - address → on-chain bytecode check → `/token` (contract) or `/wallet` (EOA)
   - ENS → resolve to address → recurse
   - text → race token/project/campaign lookups, pick the best match
3. The client navigates to the returned route, or shows the reason if nothing
   matched.

### The accuracy guarantee

- Every externally-sourced value is wrapped in `Sourced<T>` (`{ value, state,
  sources, checkedAt }`) and rendered through `<SourcedValue>`, which shows
  "Unknown" + a tooltip when the value isn't verified.
- Campaign status is **always re-derived** from real start/end dates and the
  last-checked timestamp (`deriveStatus`). A campaign past its end date is shown
  as **Ended** even if its stored label says "ongoing". Stale or unverifiable
  records become **Unknown** — never a false "Ongoing".
- Scores return `null` (not 0, not a guess) when there's insufficient data.

---

## Adding a new keyed source later

The architecture isolates each source so new ones drop in without touching the
rest of the app:

1. Add an adapter in `src/lib/adapters/` that returns `null` when its key is
   absent.
2. Register it in `src/lib/config.ts` under `sources` with an `available` flag.
3. Consume it in the relevant service; wrap outputs in `Sourced<T>`.

That's it — the UI's "Unknown" handling and source notes pick it up
automatically.

---

## Notes

- Focused exclusively on **Base** (chain ID 8453).
- Not financial advice. Data is provided as-is for research.
- All adapters use a resilient fetch wrapper (timeout, bounded retry, 429
  handling) and never throw into a page render.
