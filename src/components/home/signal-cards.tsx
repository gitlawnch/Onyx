import Link from "next/link";
import { Waves, TrendingUp, Trophy, Crown } from "lucide-react";
import type { ComponentType } from "react";
import { getDiscoverData } from "@/lib/services/discover-service";
import { getLeaderboard } from "@/lib/adapters/smart-money";
import { shortenAddress, formatPercent } from "@/lib/utils/format";

/**
 * Four compact "signal" cards summarizing live ecosystem state, mirroring the
 * Framer prototype's signal-card row. Pulls from the same data sources as
 * /discover and /smart-money so numbers are always real, never invented.
 */
export async function SignalCards() {
  const [discover, topActive] = await Promise.all([
    getDiscoverData(),
    getLeaderboard("top_active", 1),
  ]);

  const topMover = [...discover.trendingProjects].sort(
    (a, b) => (b.change24h ?? -Infinity) - (a.change24h ?? -Infinity)
  )[0];

  const liveQuestCount =
    discover.activeQuests.length + discover.endingSoon.length;

  const leader = topActive[0];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SignalCard
        href="/smart-money"
        label="Smart Money"
        value={leader ? shortenAddress(leader.address, 4) : "—"}
        sub={leader ? `${leader.metric.label}: ${leader.metric.value}` : "No tracked wallets yet"}
        icon={Waves}
      />
      <SignalCard
        href="/discover#trending"
        label="Top Mover"
        value={topMover ? formatPercent(topMover.change24h) : "—"}
        sub={topMover ? topMover.name : "No trending data"}
        icon={TrendingUp}
      />
      <SignalCard
        href="/discover#airdrops"
        label="Quests"
        value={`${liveQuestCount} live`}
        sub="Airdrop paths ranked by status"
        icon={Trophy}
      />
      <SignalCard
        href="/smart-money"
        label="Leaderboard"
        value={leader ? `#1` : "—"}
        sub={leader ? `${leader.badges[0] ?? "Tracked wallet"}` : "Connect Supabase to populate"}
        icon={Crown}
      />
    </div>
  );
}

function SignalCard({
  href,
  label,
  value,
  sub,
  icon: Icon,
}: {
  href: string;
  label: string;
  value: string;
  sub: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 hover:border-brand-lime/30 hover:bg-white/[0.05]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-lime">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-brand-lime" />
      </div>
      <p className="font-display text-2xl font-semibold leading-none tracking-tight">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{sub}</p>
    </Link>
  );
}
