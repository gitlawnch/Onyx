import { getDiscoverData } from "@/lib/services/discover-service";
import { ok, fail } from "@/lib/utils/api";

export const runtime = "nodejs";
export const revalidate = 120;

export async function GET() {
  try {
    return ok(await getDiscoverData());
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Discover failed");
  }
}
