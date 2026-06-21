import { SmartMoneyBoards } from "@/components/smart-money/boards";
import { DataSourceNote } from "@/components/shared/data-source-note";

export const metadata = {
  title: "Smart Money Â· Onyx",
  description: "Leaderboards of the most active, whale, early-adopter, and rising wallets on Base.",
};

export default function SmartMoneyPage() {
  return (
    <div className="container space-y-8 py-10">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Smart <span className="text-gradient">Money</span>
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Leaderboards of notable wallets on Base. Click any wallet to open its
          full analysis. Labels come from your own pipeline â€” never invented.
        </p>
      </div>

      <SmartMoneyBoards />

      <DataSourceNote sources={["Supabase", "Base RPC", "BaseScan"]} />
    </div>
  );
}
