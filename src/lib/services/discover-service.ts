/**
 * Discover service (Priority #4) + project assembly.
 *
 * Trending / New projects are built from the live DefiLlama Base protocol set:
 *   - New        = listed < 30 days ago (when listedAt is known)
 *   - Trending   = highest positive 24h TVL change
 * Campaign collections (active quests, ending soon, recently ended, upcoming)
 * come from the Supabase-backed campaigns adapter with status correction.
 *
 * When a source is unconfigured the corresponding collection is empty — an
 * honest "nothing verified yet" rather than placeholder rows.
 */

import type {
  Campaign,
  DiscoverData,
  ProjectProfile,
  ProjectSummary,
  Sourced,
} from "@/types";
import { sourced, unknownValue } from "@/types";
import { sources } from "@/lib/config";
import { getBaseProtocols, getProtocolBySlug } from "@/lib/adapters/defillama";
import {
  endingSoon,
  filterByStatus,
  getAllCampaigns,
  recentlyEnded,
} from "@/lib/adapters/campaigns";
import { getSmartMoneyExposure } from "@/lib/adapters/smart-money";

const NEW_THRESHOLD_DAYS = 30;

function ageDaysFromMs(ms: number | null): number | null {
  if (ms == null) return null;
  return Math.max(0, (Date.now() - ms) / (1000 * 60 * 60 * 24));
}

function toSummary(p: Awaited<ReturnType<typeof getBaseProtocols>>[number]): ProjectSummary {
  const ageDays = ageDaysFromMs(p.listedAtMs);
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    tvlUsd: p.baseTvlUsd,
    volume24hUsd: null, // DefiLlama protocols endpoint doesn't carry volume
    change24h: p.change24h,
    ageDays,
    isNew: ageDays != null && ageDays < NEW_THRESHOLD_DAYS,
    logo: p.logo ?? null,
  };
}

export async function getDiscoverData(): Promise<DiscoverData> {
  const [protocols, campaigns] = await Promise.all([
    getBaseProtocols(),
    getAllCampaigns(),
  ]);

  const summaries = protocols.map(toSummary);

  const trendingProjects = [...summaries]
    .filter((p) => p.change24h != null && p.tvlUsd != null && p.tvlUsd > 0)
    .sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0))
    .slice(0, 12);

  const newProjects = [...summaries]
    .filter((p) => p.isNew)
    .sort((a, b) => (a.ageDays ?? 0) - (b.ageDays ?? 0))
    .slice(0, 12);

  return {
    trendingProjects,
    newProjects,
    activeQuests: filterByStatus(campaigns, "ongoing").filter(
      (c) => c.kind === "quest"
    ),
    endingSoon: endingSoon(campaigns),
    recentlyEnded: recentlyEnded(campaigns),
    upcomingCampaigns: filterByStatus(campaigns, "upcoming"),
  };
}

export async function getProjectProfile(
  slug: string
): Promise<ProjectProfile | null> {
  const p = await getProtocolBySlug(slug);
  if (!p) return null;

  const ageDays = ageDaysFromMs(p.listedAtMs);
  const smartMoney = await getSmartMoneyExposure(slug);
  const llamaSrc = sources.defillama.available ? ["DefiLlama"] : [];

  return {
    slug: p.slug,
    name: p.name,
    category: strOrUnknown(p.category, llamaSrc),
    description: strOrUnknown(p.description, llamaSrc),
    website: strOrUnknown(p.url, llamaSrc),
    socials: p.twitter
      ? sourced({ twitter: p.twitter }, { state: "verified", sources: llamaSrc })
      : unknownValue(llamaSrc),
    ageDays: numOrUnknown(ageDays, llamaSrc),
    tvlUsd: numOrUnknown(p.baseTvlUsd, llamaSrc),
    volume24hUsd: unknownValue<number>(llamaSrc),
    smartMoneyExposure: smartMoney
      ? sourced(smartMoney, { state: "verified", sources: ["Supabase"] })
      : unknownValue(["Supabase"]),
    isNew: ageDays != null && ageDays < NEW_THRESHOLD_DAYS,
  };
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

export type { Campaign };





