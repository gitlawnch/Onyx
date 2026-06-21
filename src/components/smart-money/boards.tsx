"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Waves,
  Sparkles,
  TrendingUp,
  Network,
  ChevronRight,
  Crown,
} from "lucide-react";
import type { ApiResult, LeaderboardEntry, LeaderboardKind, WalletBadge } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { ScoreRing } from "@/components/shared/score-ring";
import { shortenAddress, formatAgeDays } from "@/lib/utils/format";
import { sources } from "@/lib/config";

const BOARDS: { key: LeaderboardKind; label: string; icon: React.ComponentType<{ className?: string }>; blurb: string }[] = [
  { key: "top_active", label: "Top Active", icon: Activity, blurb: "Most transactions on Base" },
  { key: "whale", label: "Whales", icon: Waves, blurb: "Highest volume wallets" },
  { key: "early_adopter", label: "Early Adopters", icon: Sparkles, blurb: "Oldest active wallets" },
  { key: "rising", label: "Rising", icon: TrendingUp, blurb: "Fastest-growing scores" },
  { key: "diversified", label: "Diversified", icon: Network, blurb: "Broadest protocol usage" },
];

export function SmartMoneyBoards() {
  const [kind, setKind] = React.useState<LeaderboardKind>("top_active");

  return (
    <Tabs value={kind} onValueChange={(v) => setKind(v as LeaderboardKind)}>
      <TabsList className="mb-6">
        {BOARDS.map((b) => (
          <TabsTrigger key={b.key} value={b.key}>
            <b.icon className="mr-1.5 h-4 w-4" />
            {b.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {BOARDS.map((b) => (
        <TabsContent key={b.key} value={b.key}>
          <p className="mb-4 text-sm text-muted-foreground">{b.blurb}</p>
          <Board kind={b.key} active={kind === b.key} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function Board({ kind, active }: { kind: LeaderboardKind; active: boolean }) {
  const [state, setState] = React.useState<{
    loading: boolean;
    error: string | null;
    entries: LeaderboardEntry[];
  }>({ loading: true, error: null, entries: [] });

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`/api/smart-money?kind=${kind}`);
      const json: ApiResult<LeaderboardEntry[]> = await res.json();
      if (!json.ok || !json.data) {
        setState({ loading: false, error: json.error ?? "Failed to load", entries: [] });
        return;
      }
      setState({ loading: false, error: null, entries: json.data });
    } catch {
      setState({ loading: false, error: "Network error", entries: [] });
    }
  }, [kind]);

  React.useEffect(() => {
    if (active) load();
  }, [active, load]);

  if (state.loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (state.error) {
    return <ErrorState message={state.error} onRetry={load} />;
  }

  if (state.entries.length === 0) {
    return (
      <EmptyState
        title={sources.supabase.available ? "No wallets on this board" : "Smart-money source not connected"}
        description={
          sources.supabase.available
            ? "No labeled wallets match this leaderboard yet. Wallets appear here once your labeling pipeline populates them."
            : "Smart-money labeling is a proprietary dataset. Connect Supabase and populate tracked_wallets from your own pipeline — no wallet is ever invented or labeled without real data."
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      {state.entries.map((entry, i) => (
        <LeaderboardRow key={entry.address} entry={entry} index={i} />
      ))}
    </div>
  );
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link href={`/wallet/${entry.address.toLowerCase()}`}>
        <Card className="group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-violet/30 hover:bg-white/[0.055]">
          <div className="flex w-10 shrink-0 items-center justify-center">
            {entry.rank <= 3 ? (
              <Crown
                className={
                  entry.rank === 1
                    ? "h-5 w-5 text-amber-300"
                    : entry.rank === 2
                    ? "h-5 w-5 text-slate-300"
                    : "h-5 w-5 text-orange-400"
                }
              />
            ) : (
              <span className="font-mono text-sm text-muted-foreground">{entry.rank}</span>
            )}
          </div>

          <ScoreRing score={entry.score} size={44} strokeWidth={4} />

          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm font-medium">
              {shortenAddress(entry.address, 6)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {entry.badges.slice(0, 3).map((badge) => (
                <BadgePill key={badge} badge={badge} />
              ))}
              {entry.ageDays != null && (
                <span className="text-[11px] text-muted-foreground">
                  {formatAgeDays(entry.ageDays)} old
                </span>
              )}
            </div>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {entry.metric.label}
            </p>
            <p className="font-mono text-sm font-semibold">{entry.metric.value}</p>
          </div>

          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Card>
      </Link>
    </motion.div>
  );
}

function BadgePill({ badge }: { badge: WalletBadge }) {
  return (
    <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
      {badge}
    </span>
  );
}
