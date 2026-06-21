import { redirect } from "next/navigation";
import { isAddress, getAddress } from "viem";
import {
  WalletHeader,
  WalletScoreCard,
  WalletBadges,
  WalletStats,
  WalletActivity,
} from "@/components/wallet/wallet-view";
import { NotFoundState } from "@/components/shared/states";
import { DataSourceNote } from "@/components/shared/data-source-note";
import { getWalletProfile } from "@/lib/services/wallet-service";
import { getTokenByAddress } from "@/lib/adapters/dexscreener";
import type { Address } from "viem";

export const dynamic = "force-dynamic";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;

  if (!isAddress(address)) {
    return (
      <div className="container py-16">
        <NotFoundState query={address} />
      </div>
    );
  }

  const checksummed: Address = getAddress(address);

  // Only route to the Token Analyzer if this address is a REAL token
  // (has a DexScreener pair). Smart wallets have bytecode but aren't tokens.
  const tokenPair = await getTokenByAddress(checksummed.toLowerCase()).catch(() => null);
  if (tokenPair) {
    redirect(`/token/${address.toLowerCase()}`);
  }

  const profile = await getWalletProfile(address);
  if (!profile) {
    return (
      <div className="container py-16">
        <NotFoundState query={address} />
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-10">
      <WalletHeader profile={profile} />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <WalletScoreCard profile={profile} />
        <WalletBadges badges={profile.badges} />
      </div>
      <WalletStats profile={profile} />
      <WalletActivity profile={profile} />
      <DataSourceNote sources={["Base RPC", "Alchemy", "BaseScan", "Supabase"]} />
    </div>
  );
}


