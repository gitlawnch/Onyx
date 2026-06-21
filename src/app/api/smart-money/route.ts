import type { NextRequest } from "next/server";
import { getLeaderboard } from "@/lib/adapters/smart-money";
import type { LeaderboardKind } from "@/types";
import { ok, fail } from "@/lib/utils/api";

export const runtime = "nodejs";
export const revalidate = 120;

const VALID: LeaderboardKind[] = [
  "top_active", "whale", "early_adopter", "rising", "diversified",
];

export async function GET(req: NextRequest) {
  const kind = (req.nextUrl.searchParams.get("kind") ?? "top_active") as LeaderboardKind;
  if (!VALID.includes(kind)) return fail("Invalid leaderboard", 400);
  try {
    return ok(await getLeaderboard(kind));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Leaderboard failed");
  }
}
