import { isAddress } from "viem";
import {
  TokenHeader,
  TokenActions,
  TokenMetrics,
  TokenRisk,
  TokenLinks,
  TokenSmartMoney,
} from "@/components/token/token-view";
import { NotFoundState } from "@/components/shared/states";
import { DataSourceNote } from "@/components/shared/data-source-note";
import { getTokenProfile } from "@/lib/services/token-service";

export const dynamic = "force-dynamic";

export default async function TokenPage({
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

  const profile = await getTokenProfile(address);
  if (!profile) {
    return (
      <div className="container py-16">
        <NotFoundState query={address} />
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-10">
      <TokenHeader profile={profile} />
      <TokenActions profile={profile} />
      <TokenMetrics profile={profile} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <TokenRisk risk={profile.risk} />
        <TokenSmartMoney profile={profile} />
      </div>
      <TokenLinks profile={profile} />
      <DataSourceNote sources={["DexScreener", "GeckoTerminal", "BaseScan", "Supabase"]} />
    </div>
  );
}


