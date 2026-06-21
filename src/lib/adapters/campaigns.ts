/**
 * Campaigns adapter â€” airdrops + quests (Priority #5).
 *
 * Galxe, Layer3, Zealy, and Intract do NOT offer public read APIs for campaign
 * status. Onyx therefore reads *verified* campaign records from Supabase,
 * which you populate via your own ingestion jobs or admin tooling.
 *
 * TODO(ingestion): build a job that writes into the `campaigns` table with an
 * up-to-date `last_checked_at`. Until then, this adapter returns whatever is in
 * the table â€” and an empty table yields an honest "no verified campaigns" state,
 * never invented ones.
 *
 * CRITICAL ACCURACY RULE (enforced in `deriveStatus`):
 *   A campaign is only "ongoing" when now is within [start, end] AND it was
 *   checked recently. A stored "ongoing" whose end date has passed is shown as
 *   "ended". A stored status we can't trust becomes "unknown". We never show an
 *   ended campaign as ongoing.
 */

import type { Campaign, CampaignSource, CampaignStatus } from "@/types";
import { serverSupabase } from "@/lib/supabase/server";

// Row shape in Supabase (snake_case).
interface CampaignRow {
  id: string;
  name: string;
  kind: "airdrop" | "quest";
  source: string;
  stored_status: string | null;
  reward: string | null;
  start_date: string | null;
  end_date: string | null;
  last_checked_at: string;
  url: string | null;
  project_slug: string | null;
}

/** Max age of a `last_checked_at` before we no longer trust an active status. */
const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Derives the *displayed* status from dates + freshness, never trusting a stale
 * or contradictory stored status. This is the guarantee behind
 * "never show ended campaigns as ongoing."
 */
export function deriveStatus(row: {
  stored_status: string | null;
  start_date: string | null;
  end_date: string | null;
  last_checked_at: string;
}): CampaignStatus {
  const now = Date.now();
  const start = row.start_date ? new Date(row.start_date).getTime() : null;
  const end = row.end_date ? new Date(row.end_date).getTime() : null;
  const checked = new Date(row.last_checked_at).getTime();
  const isStale = !Number.isFinite(checked) || now - checked > STALE_AFTER_MS;

  // Hard date logic wins over any stored label.
  if (end != null && Number.isFinite(end) && now > end) return "ended";
  if (start != null && Number.isFinite(start) && now < start) return "upcoming";

  // Within the window (or no end date): only call it ongoing if fresh AND the
  // stored status agrees. Otherwise we can't be sure â†’ unknown.
  if (start != null && (end == null || now <= end)) {
    if (!isStale && row.stored_status === "ongoing") return "ongoing";
    return "unknown";
  }

  // No usable dates: fall back to a fresh stored status, else unknown.
  if (!isStale && isValidStatus(row.stored_status)) {
    // But an explicitly stored "ongoing" with no dates is unverifiable â†’ unknown.
    return row.stored_status === "ongoing"
      ? "unknown"
      : (row.stored_status as CampaignStatus);
  }
  return "unknown";
}

function isValidStatus(s: string | null): s is CampaignStatus {
  return s === "ongoing" || s === "ended" || s === "upcoming" || s === "unknown";
}

function mapRow(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    source: (row.source as CampaignSource) ?? "Galxe",
    status: deriveStatus(row),
    reward: row.reward,
    startDate: row.start_date,
    endDate: row.end_date,
    lastCheckedAt: row.last_checked_at,
    url: row.url,
    projectSlug: row.project_slug,
  };
}

/** All campaigns, status-corrected. Empty array when Supabase is unconfigured. */
/**
 * All campaigns, status-corrected, from Supabase. Empty when unconfigured.
 */
export async function getAllCampaigns(): Promise<Campaign[]> {
  const sb = serverSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("campaigns")
    .select("*")
    .order("last_checked_at", { ascending: false });
  if (error || !data) return [];
  return (data as CampaignRow[]).map(mapRow);
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const sb = serverSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("campaigns")
    .select("*")
    .or(`id.eq.${id},url.ilike.%${id}%,name.ilike.%${id}%`)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as CampaignRow);
}

/** Free-text campaign search by name (for the search resolver). */
export async function searchCampaigns(query: string): Promise<Campaign[]> {
  const sb = serverSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("campaigns")
    .select("*")
    .ilike("name", `%${query}%`)
    .limit(8);
  if (error || !data) return [];
  return (data as CampaignRow[]).map(mapRow);
}

// --- Derived collections for the Discover page ------------------------------

export function filterByStatus(
  campaigns: Campaign[],
  status: CampaignStatus
): Campaign[] {
  return campaigns.filter((c) => c.status === status);
}

export function endingSoon(campaigns: Campaign[], withinDays = 7): Campaign[] {
  const now = Date.now();
  const horizon = now + withinDays * 24 * 60 * 60 * 1000;
  return campaigns
    .filter(
      (c) =>
        c.status === "ongoing" &&
        c.endDate != null &&
        new Date(c.endDate).getTime() <= horizon
    )
    .sort(
      (a, b) =>
        new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime()
    );
}

export function recentlyEnded(campaigns: Campaign[], withinDays = 14): Campaign[] {
  const now = Date.now();
  const floor = now - withinDays * 24 * 60 * 60 * 1000;
  return campaigns
    .filter(
      (c) =>
        c.status === "ended" &&
        c.endDate != null &&
        new Date(c.endDate).getTime() >= floor
    )
    .sort(
      (a, b) =>
        new Date(b.endDate!).getTime() - new Date(a.endDate!).getTime()
    );
}
