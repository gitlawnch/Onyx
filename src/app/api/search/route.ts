import type { NextRequest } from "next/server";
import { resolveQuery, suggestQuery } from "@/lib/search/resolver";
import { ok, fail } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const mode = req.nextUrl.searchParams.get("mode") ?? "resolve";
  if (!q.trim()) return fail("Empty query", 400);

  try {
    if (mode === "suggest") return ok(await suggestQuery(q));
    return ok(await resolveQuery(q));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Search failed");
  }
}
