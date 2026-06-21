"use client";

import { motion } from "framer-motion";
import {
  Crown,
  Sparkles,
  Layers,
  Zap,
  Wallet as WalletIcon,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import * as React from "react";
import type { WalletBadge, WalletProfile } from "@/types";
import { Card } from "@/components/ui/card";
import { ScoreRing } from "@/components/shared/score-ring";
import { SourcedValue } from "@/components/shared/sourced-value";
import { EmptyState } from "@/components/shared/states";
import { explorerAddress } from "@/lib/config";
import {
  formatUsd,
  formatNumber,
  formatAgeDays,
  formatDate,
  shortenAddress,
  relativeTime,
} from "@/lib/utils/format";

const BADGE_META: Record<WalletBadge, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  "OG Wallet": { icon: Crown, color: "text-amber-300 border-amber-400/30 bg-amber-400/10" },
  "Early Adopter": { icon: Sparkles, color: "text-violet-300 border-violet-400/30 bg-violet-400/10" },
  "DeFi User": { icon: Layers, color: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10" },
  "Active User": { icon: Zap, color: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
  Whale: { icon: WalletIcon, color: "text-blue-300 border-blue-400/30 bg-blue-400/10" },
  "NFT User": { icon: ImageIcon, color: "text-pink-300 border-pink-400/30 bg-pink-400/10" },
};

export function WalletHeader({ profile }: { profile: WalletProfile }) {
  const [copied, setCopied] = React.useState(false);

  function copy() {
    navigator.clipboard.writeText(profile.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="absolute inset-0 -z-10 rounded-2xl bg-brand-lime/30 blur-xl" />
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient shadow-[0_8px_30px_-8px_rgba(124,58,237,0.7)]">
            <WalletIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Wallet</p>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-semibold md:text-2xl">
              {shortenAddress(profile.address, 6)}
            </h1>
            <button
              onClick={copy}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Copy address"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start md:self-auto">
        <a
          href={`https://debank.com/profile/${profile.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.06]"
        >
          DeBank <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href={explorerAddress(profile.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.06]"
        >
          BaseScan <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

export function WalletScoreCard({ profile }: { profile: WalletProfile }) {
  const components = profile.score.components;
  const rows: { label: string; value: number | null }[] = [
    { label: "Age", value: components.age },
    { label: "Transactions", value: components.transactions },
    { label: "Protocols", value: components.protocols },
    { label: "Activity", value: components.activity },
    { label: "Volume", value: components.volume },
    { label: "Diversity", value: components.diversity },
  ].filter((r) => r.value != null);

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={profile.score.score} size={120} label="Score" />
          <p className="text-xs text-muted-foreground">
            {profile.score.score != null ? "Composite 0–100" : "Insufficient data"}
          </p>
        </div>

        <div className="w-full flex-1">
          <h3 className="mb-3 font-display text-sm font-semibold text-muted-foreground">
            Score breakdown
          </h3>
          <div className="space-y-2.5">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-muted-foreground">{row.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  {row.value != null && (
                    <motion.div
                      className="h-full rounded-full bg-brand-gradient"
                      initial={{ width: 0 }}
                      animate={{ width: `${row.value}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  )}
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {row.value != null ? Math.round(row.value) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function WalletBadges({ badges }: { badges: WalletBadge[] }) {
  if (badges.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-1 font-display text-base font-semibold">Badges</h3>
        <p className="text-sm text-muted-foreground">
          No badges earned yet — or insufficient on-chain data to award them.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-display text-base font-semibold">Badges</h3>
      <div className="flex flex-wrap gap-2.5">
        {badges.map((badge) => {
          const meta = BADGE_META[badge];
          const Icon = meta.icon;
          return (
            <span
              key={badge}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${meta.color}`}
            >
              <Icon className="h-4 w-4" />
              {badge}
            </span>
          );
        })}
      </div>
    </Card>
  );
}

export function WalletStats({ profile }: { profile: WalletProfile }) {
  const stats: { label: string; node: React.ReactNode }[] = [
    {
      label: "Wallet age",
      node: (
        <SourcedValue
          data={profile.ageDays}
          label="Wallet age"
          format={(d) => formatAgeDays(d)}
        />
      ),
    },
    {
      label: "First seen",
      node: (
        <SourcedValue
          data={profile.firstSeen}
          label="First seen"
          format={(iso) => formatDate(iso)}
        />
      ),
    },
    {
      label: "Transactions",
      node: (
        <SourcedValue
          data={profile.transactionCount}
          label="Transaction count"
          format={(n) => formatNumber(n, false)}
        />
      ),
    },
    {
      label: "Protocols used",
      node: (
        <SourcedValue
          data={profile.protocolCount}
          label="Distinct protocols"
          format={(n) => formatNumber(n, false)}
        />
      ),
    },
    {
      label: "ETH balance",
      node: (
        <SourcedValue
          data={profile.nativeBalance}
          label="Native ETH balance"
          format={(b) => `${parseFloat(b).toFixed(4)} ETH`}
        />
      ),
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-display text-base font-semibold">Transaction statistics</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-lime/40 hover:bg-white/[0.05] hover:shadow-[0_10px_30px_-10px_rgba(185,255,74,0.25)]">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <div className="mt-1.5 font-mono text-base font-semibold">{stat.node}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function WalletActivity({ profile }: { profile: WalletProfile }) {
  const activity = profile.recentActivity;

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-display text-base font-semibold">Recent activity</h3>
      {activity.state !== "verified" || !activity.value || activity.value.length === 0 ? (
        <EmptyState
          title="No activity feed"
          description={
            activity.state === "unknown"
              ? "A labeled activity feed isn't available from the connected sources. On-chain stats above are still computed where possible."
              : "No recent transactions found for this wallet."
          }
        />
      ) : (
        <ul className="space-y-2">
          {activity.value.map((item) => (
            <li
              key={item.txHash}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium capitalize">{item.type}</p>
                <p className="truncate text-xs text-muted-foreground">{item.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-muted-foreground">{relativeTime(item.timestamp)}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}








