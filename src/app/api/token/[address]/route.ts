import type { NextRequest } from "next/server";
import { getTokenProfile } from "@/lib/services/token-service";
import { getAddress } from "viem";
import { ok, fail } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  try {
    getAddress(address);
  } catch {
    return fail("Invalid contract address", 400);
  }

  try {
    const profile = await getTokenProfile(address);
    if (!profile) return fail("Token not found on Base", 404);
    return ok(profile);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Token lookup failed");
  }
}
