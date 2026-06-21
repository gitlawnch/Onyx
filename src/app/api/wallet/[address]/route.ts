import type { NextRequest } from "next/server";
import { getWalletProfile } from "@/lib/services/wallet-service";
import { getTokenByAddress } from "@/lib/adapters/dexscreener";
import { getAddress, type Address } from "viem";
import { ok, fail } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  let checksummed: Address;
  try {
    checksummed = getAddress(address);
  } catch {
    return fail("Invalid Base address", 400);
  }

  try {
    // Only redirect to /token if this address is actually a token (has a DEX
    // pair). Smart-contract wallets (Coinbase Smart Wallet, Safe, etc.) have
    // bytecode too, so a plain bytecode check would wrongly treat them as
    // tokens. Checking for token data avoids that misclassification.
    const token = await getTokenByAddress(checksummed.toLowerCase());
    if (token) {
      return fail("Address is a token — use /token", 409);
    }

    const profile = await getWalletProfile(address);
    if (!profile) return fail("Could not load wallet", 404);
    return ok(profile);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Wallet lookup failed");
  }
}
