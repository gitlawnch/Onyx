-- ============================================================================
-- Base Alpha — initial schema
-- ============================================================================
-- Run this in your Supabase project (SQL editor, or `supabase db push`).
-- These tables back the data that has NO public API:
--   • campaigns          → airdrops + quests (Galxe / Layer3 / Zealy / Intract)
--   • tracked_wallets    → proprietary "smart money" wallet labels
--   • wallet_interactions→ activity feed + smart-money exposure
--
-- The app reads these via the anon key (RLS read policies below). Writes happen
-- only from your own ingestion/labeling jobs using the service-role key.
-- An empty table yields honest empty states in the UI — never fabricated data.
-- ============================================================================

-- ---- Campaigns (airdrops + quests) -----------------------------------------
create table if not exists public.campaigns (
  id              text primary key,
  name            text not null,
  kind            text not null check (kind in ('airdrop', 'quest')),
  source          text not null check (source in ('Galxe', 'Layer3', 'Zealy', 'Intract')),
  -- Stored status is advisory only; the app re-derives the displayed status
  -- from dates + last_checked_at so an ended campaign is never shown as ongoing.
  stored_status   text check (stored_status in ('ongoing', 'ended', 'upcoming', 'unknown')),
  reward          text,
  start_date      timestamptz,
  end_date        timestamptz,
  last_checked_at timestamptz not null default now(),
  url             text,
  project_slug    text,
  created_at      timestamptz not null default now()
);

create index if not exists campaigns_status_idx on public.campaigns (stored_status);
create index if not exists campaigns_kind_idx on public.campaigns (kind);
create index if not exists campaigns_end_date_idx on public.campaigns (end_date);
create index if not exists campaigns_name_trgm_idx on public.campaigns using gin (name gin_trgm_ops);

-- ---- Tracked wallets (smart money labels) ----------------------------------
create table if not exists public.tracked_wallets (
  address          text primary key,
  score            integer,
  age_days         integer,
  protocol_count   integer,
  badges           text[] default '{}',
  volume_usd       numeric,
  tx_count         integer,
  diversity_score  numeric,
  is_whale         boolean default false,
  is_early_adopter boolean default false,
  is_rising        boolean default false,
  label            text,
  updated_at       timestamptz not null default now()
);

create index if not exists tracked_wallets_whale_idx on public.tracked_wallets (is_whale) where is_whale = true;
create index if not exists tracked_wallets_early_idx on public.tracked_wallets (is_early_adopter) where is_early_adopter = true;
create index if not exists tracked_wallets_rising_idx on public.tracked_wallets (is_rising) where is_rising = true;
create index if not exists tracked_wallets_score_idx on public.tracked_wallets (score desc);
create index if not exists tracked_wallets_volume_idx on public.tracked_wallets (volume_usd desc);

-- ---- Wallet interactions (activity + smart-money exposure) ------------------
create table if not exists public.wallet_interactions (
  id              bigint generated always as identity primary key,
  wallet_address  text not null,
  -- The token/project/contract that was interacted with (lowercased).
  target          text not null,
  action          text not null,
  description     text not null,
  tx_hash         text not null,
  occurred_at     timestamptz not null,
  created_at      timestamptz not null default now()
);

create index if not exists wallet_interactions_wallet_idx on public.wallet_interactions (wallet_address);
create index if not exists wallet_interactions_target_idx on public.wallet_interactions (target);
create index if not exists wallet_interactions_time_idx on public.wallet_interactions (occurred_at desc);
create unique index if not exists wallet_interactions_txhash_target_idx
  on public.wallet_interactions (tx_hash, target);

-- ---- Row Level Security -----------------------------------------------------
-- Public read access (anon key); writes restricted to service-role only.
alter table public.campaigns enable row level security;
alter table public.tracked_wallets enable row level security;
alter table public.wallet_interactions enable row level security;

drop policy if exists "campaigns read" on public.campaigns;
create policy "campaigns read" on public.campaigns for select using (true);

drop policy if exists "tracked_wallets read" on public.tracked_wallets;
create policy "tracked_wallets read" on public.tracked_wallets for select using (true);

drop policy if exists "wallet_interactions read" on public.wallet_interactions;
create policy "wallet_interactions read" on public.wallet_interactions for select using (true);

-- Note: enable the pg_trgm extension once per project for fuzzy name search:
--   create extension if not exists pg_trgm;
