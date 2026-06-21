import { getAllCampaigns } from "@/lib/adapters/campaigns";
import { ok, fail } from "@/lib/utils/api";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    return ok(await getAllCampaigns());
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Airdrops failed");
  }
}
