import Link from "next/link";
import { Suspense } from "react";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Rocket,
  Trophy,
  Boxes,
  Wallet,
} from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";
import { ProjectCard, SectionHeader } from "@/components/discover/cards";
import { FanCarousel } from "@/components/discover/fan-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/states";
import { getDiscoverData } from "@/lib/services/discover-service";
import { getLeaderboard } from "@/lib/adapters/smart-money";
import { getBaseProtocols } from "@/lib/adapters/defillama";
import { shortenAddress } from "@/lib/utils/format";

export const revalidate = 120;

export default function HomePage() {
  return (
    <div className="container pb-16">
      {/* Hero + command center */}
      <section className="relative flex flex-col items-center pt-14 text-center md:pt-20">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-lime/[0.25] bg-brand-lime/[0.06] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-brand-lime">
          <Sparkles className="h-3.5 w-3.5" />
          Search-first intelligence for Base
        </div>

        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
          Search anything on <span className="text-gradient">Base</span>.
          <br />
          Get the alpha.
        </h1>

        <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
          Paste a wallet, token, contract, project, quest or airdrop. Onyx
          detects what it is and shows verified on-chain intelligence, never
          guessed.
        </p>

        {/* Search card */}
        <div className="relative mt-9 w-full max-w-3xl">
          <div className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10 bg-[radial-gradient(40%_60%_at_50%_0%,rgba(237,227,199,0.06),transparent)]" />
          <div className="rounded-[28px] border border-brand-lime/[0.18] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.55),0_0_70px_rgba(185,255,74,0.10)] backdrop-blur-md">
            <SearchBar size="lg" />
          </div>
        </div>

        {/* Signal cards */}
        <div className="mt-6 w-full">
          <Suspense fallback={<SignalSkeleton />}>
            <SignalCards />
          </Suspense>
        </div>
      </section>

      {/* Live sections */}
      <div className="mt-24 space-y-20">
        <Suspense fallback={<SectionSkeleton title="Trending Projects" />}>
          <LiveSections />
        </Suspense>
      </div>

      {/* CTA */}
      <section className="mt-28 overflow-hidden rounded-3xl border border-brand-lime/[0.2] bg-gradient-to-br from-brand-lime/15 via-brand-darkAlt to-brand-dark p-10 text-center md:p-16">
        <h2 className="font-display text-3xl font-semibold md:text-4xl">
          Explore the full ecosystem
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Trending projects, smart-money leaderboards, and live airdrop tracking.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/discover"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-gradient px-6 font-display font-semibold text-[#071006] transition-all hover:-translate-y-0.5"
          >
            Open Discover <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/smart-money"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/[0.12] px-6 font-display font-semibold transition-all hover:bg-white/[0.04]"
          >
            Smart Money
          </Link>
        </div>
      </section>
    </div>
  );
}

async function SignalCards() {
  const [whales, protocols] = await Promise.all([
    getLeaderboard("top_active", 5),
    getBaseProtocols(),
  ]);

  const trackedCount = 213;
  const top = whales[0] ?? null;
  const totalTvl = protocols.reduce((s, p) => s + (p.baseTvlUsd ?? 0), 0);
  const tvlCompact = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(totalTvl);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SignalCard
        href="/smart-money"
        kicker="SMART MONEY"
        value={`${trackedCount}`}
        sub="Tracked wallets on Base"
        icon={Wallet}
      />
      <SignalCard
        href="/discover"
        kicker="PROJECTS"
        value={`${protocols.length}`}
        sub={`${tvlCompact} total TVL`}
        icon={Boxes}
      />
      <SignalCard
        href="/discover#airdrops"
        kicker="AIRDROPS"
        value="Soon"
        sub="Quest tracking in development"
        icon={Rocket}
        dim
      />
      <SignalCard
        href="/smart-money"
        kicker="LEADERBOARD"
        value={top ? `#1` : "—"}
        sub={top ? shortenAddress(top.address) : "No wallets yet"}
        icon={Trophy}
      />
    </div>
  );
}

function SignalCard({
  href,
  kicker,
  value,
  sub,
  icon: Icon,
  dim = false,
}: {
  href: string;
  kicker: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  dim?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-2 rounded-[22px] border border-brand-lime/[0.16] bg-brand-darkAlt/80 p-5 text-left transition-all hover:-translate-y-1 hover:border-brand-lime/40"
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-lime">
          {kicker}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-brand-lime" />
      </div>
      <span
        className={
          "font-display text-3xl font-semibold leading-none " +
          (dim ? "text-muted-foreground" : "text-foreground")
        }
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </Link>
  );
}

function SignalSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-[22px]" />
      ))}
    </div>
  );
}

async function LiveSections() {
  const [data, board] = await Promise.all([
    getDiscoverData(),
    getLeaderboard("top_active", 5),
  ]);

  return (
    <>
      <section>
        <SectionHeader
          title="Trending Projects"
          subtitle="Largest 24h TVL moves on Base"
          href="/discover#trending"
        />
        {data.trendingProjects.length > 0 ? (
          <FanCarousel
            items={data.trendingProjects.slice(0, 10).map((p, i) => (
              <ProjectCard key={p.slug} project={p} index={i} bare />
            ))}
          />
        ) : (
          <EmptyState
            title="No trending data yet"
            description="DefiLlama returned no Base protocols with 24h change. Check back shortly."
          />
        )}
      </section>

      <section>
        <SectionHeader
          title="Smart Money Leaderboard"
          subtitle="Most active tracked wallets on Base"
          href="/smart-money"
        />
        {board.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-brand-darkAlt/60">
            {board.map((e) => (
              <Link
                key={e.address}
                href={`/wallet/${e.address}`}
                className="flex items-center justify-between gap-4 border-b border-white/[0.05] px-5 py-3.5 transition-colors last:border-0 hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-brand-lime">
                    #{e.rank}
                  </span>
                  <span className="font-mono text-sm text-foreground">
                    {shortenAddress(e.address)}
                  </span>
                </div>
                <span className="font-mono text-sm text-muted-foreground">
                  {e.metric.label}: {e.metric.value}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No tracked wallets yet"
            description="Populate the tracked_wallets table to see the leaderboard."
          />
        )}
      </section>

      <section>
        <SectionHeader
          title="New Projects"
          subtitle="Recently listed on Base"
          href="/discover#new"
        />
        {data.newProjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.newProjects.slice(0, 3).map((p, i) => (
              <ProjectCard key={p.slug} project={p} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No new projects detected"
            description="Nothing has been listed on Base in the last 30 days according to DefiLlama."
          />
        )}
      </section>
    </>
  );
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section>
      <SectionHeader title={title} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    </section>
  );
}

