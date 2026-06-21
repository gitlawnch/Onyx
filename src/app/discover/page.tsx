import { SearchBar } from "@/components/search/search-bar";
import { DiscoverTabs } from "@/components/discover/discover-tabs";
import { DataSourceNote } from "@/components/shared/data-source-note";
import { getDiscoverData } from "@/lib/services/discover-service";

export const revalidate = 120;
export const metadata = {
  title: "Discover · Onyx",
  description: "Trending and new Base projects, active quests, and airdrop tracking.",
};

export default async function DiscoverPage() {
  const data = await getDiscoverData();
  return (
    <div className="container space-y-8 py-10">
      <div className="max-w-2xl">
        <SearchBar size="md" />
      </div>
      <div id="airdrops" className="scroll-mt-24" />
      <DiscoverTabs data={data} />
      <DataSourceNote sources={["DefiLlama", "DexScreener", "Supabase"]} />
    </div>
  );
}
