"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Coins,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  HelpCircle,
  Users,
  CandlestickChart,
  ScanLine,
} from "lucide-react";
import type { RiskBreakdown, TokenHolder, TokenProfile } from "@/types";
import { Card } from "@/components/ui/card";
import { SourcedValue } from "@/components/shared/sourced-value";
import { EmptyState } from "@/components/shared/states";
import {
  explorerAddress,
  explorerToken,
  geckoTerminalToken,
  geckoTerminalPool,
} from "@/lib/config";
import {
  formatUsd,
  formatNumber,
  formatPercent,
  formatAgeDays,
  formatDate,
  shortenAddress,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function TokenHeader({ profile }: { profile: TokenProfile }) {
  const [copied, setCopied] = React.useState(false);
  const change = profile.priceChange24h.value;
  const positive = change != null && change >= 0;

  function copy() {
    navigator.clipboard.writeText(profile.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-5">
        {profile.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.logo}
            alt={profile.symbol.value ?? "Token"}
            className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 bg-brand-darkAlt object-contain p-1.5 shadow-lg"
          />
        ) : (
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-gradient shadow-lg">
            <Coins className="h-8 w-8 text-[#071006]" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">
              <SourcedValue data={profile.symbol} format={(s) => s} label="Symbol" />
            </h1>
            <button
              onClick={copy}
              className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Copy contract"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <SourcedValue data={profile.name} format={(n) => n} label="Name" /> ·{" "}
            <span className="font-mono">{shortenAddress(profile.address)}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-mono text-2xl font-bold">
            <SourcedValue
              data={profile.priceUsd}
              format={(p) => formatUsd(p, false)}
              label="Price (USD)"
            />
          </div>
          {change != null && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-sm font-medium",
                positive ? "text-emerald-300" : "text-red-300"
              )}
            >
              {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {formatPercent(change)} 24h
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Action bar: clear outbound links so the page isn't a dead end —
 * GeckoTerminal (live chart), BaseScan token page, and BaseScan contract.
 */
export function TokenActions({ profile }: { profile: TokenProfile }) {
  const chartUrl = profile.poolAddress
    ? geckoTerminalPool(profile.poolAddress)
    : geckoTerminalToken(profile.address);

  const actions = [
    {
      label: "View chart",
      sub: "GeckoTerminal",
      href: chartUrl,
      icon: CandlestickChart,
      primary: true,
    },
    {
      label: "Token page",
      sub: "BaseScan",
      href: explorerToken(profile.address),
      icon: ScanLine,
      primary: false,
    },
    {
      label: "Contract",
      sub: "BaseScan",
      href: explorerAddress(profile.address),
      icon: ExternalLink,
      primary: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <a
            key={a.label}
            href={a.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group flex items-center gap-3 rounded-xl border p-4 transition-all hover:-translate-y-0.5",
              a.primary
                ? "border-transparent bg-brand-gradient text-white shadow-[0_8px_30px_-8px_rgba(124,58,237,0.6)]"
                : "border-white/[0.1] bg-white/[0.03] text-foreground hover:bg-white/[0.06]"
            )}
          >
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                a.primary ? "bg-white/15" : "border border-white/10 bg-white/5"
              )}
            >
              <Icon className={cn("h-5 w-5", a.primary ? "text-white" : "text-violet-300")} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-sm font-semibold">{a.label}</span>
              <span
                className={cn(
                  "block text-xs",
                  a.primary ? "text-white/70" : "text-muted-foreground"
                )}
              >
                {a.sub}
              </span>
            </span>
            <ExternalLink
              className={cn(
                "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                a.primary ? "text-white/70" : "text-muted-foreground"
              )}
            />
          </a>
        );
      })}
    </div>
  );
}

export function TokenMetrics({ profile }: { profile: TokenProfile }) {
  const metrics = [
    {
      label: "Market cap",
      node: <SourcedValue data={profile.marketCapUsd} format={(v) => formatUsd(v)} label="Market cap" />,
    },
    {
      label: "Liquidity",
      node: <SourcedValue data={profile.liquidityUsd} format={(v) => formatUsd(v)} label="Liquidity" />,
    },
    {
      label: "24h volume",
      node: <SourcedValue data={profile.volume24hUsd} format={(v) => formatUsd(v)} label="24h volume" />,
    },
    {
      label: "Holders",
      node: <SourcedValue data={profile.holderCount} format={(v) => formatNumber(v, false)} label="Holder count" />,
    },
    {
      label: "Contract age",
      node: <SourcedValue data={profile.contractAgeDays} format={(d) => formatAgeDays(d)} label="Contract age" />,
    },
    {
      label: "Created",
      node: <SourcedValue data={profile.createdAt} format={(iso) => formatDate(iso)} label="Created at" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((m) => (
        <Card key={m.label} className="p-4">
          <p className="text-xs text-muted-foreground">{m.label}</p>
          <div className="mt-1.5 font-mono text-base font-semibold">{m.node}</div>
        </Card>
      ))}
    </div>
  );
}

const RISK_VISUAL = {
  "Low Risk": { icon: ShieldCheck, color: "text-emerald-300", ring: "#34D399", bg: "from-emerald-500/15" },
  "Medium Risk": { icon: ShieldAlert, color: "text-amber-300", ring: "#FBBF24", bg: "from-amber-500/15" },
  "High Risk": { icon: ShieldX, color: "text-red-300", ring: "#F87171", bg: "from-red-500/15" },
  Unknown: { icon: HelpCircle, color: "text-muted-foreground", ring: "#6B7280", bg: "from-white/5" },
} as const;

export function TokenRisk({ risk }: { risk: RiskBreakdown }) {
  const visual = RISK_VISUAL[risk.label];
  const Icon = visual.icon;

  return (
    <Card className={cn("overflow-hidden bg-gradient-to-br to-transparent p-6", visual.bg)}>
      <div className="flex items-start gap-5">
        <div className="flex flex-col items-center gap-2">
          <div className="relative grid h-24 w-24 place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              {risk.score != null && (
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={visual.ring}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - risk.score / 100) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              )}
            </svg>
            <span className="font-display text-2xl font-bold">
              {risk.score != null ? risk.score : "—"}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div className={cn("flex items-center gap-2 font-display text-lg font-bold", visual.color)}>
            <Icon className="h-5 w-5" />
            {risk.label}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {risk.score != null
              ? "Risk score 0–100 (higher = riskier), weighted across available factors."
              : "Not enough data from connected sources to compute a reliable risk score."}
          </p>

          <div className="mt-4 space-y-2.5">
            {risk.factors.map((factor) => (
              <div key={factor.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{factor.label}</span>
                  <span className="font-mono text-xs">
                    {factor.contribution != null ? Math.round(factor.contribution) : "—"}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  {factor.contribution != null && (
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: visual.ring }}
                      initial={{ width: 0 }}
                      animate={{ width: `${factor.contribution}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">{factor.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function TokenHolders({ profile }: { profile: TokenProfile }) {
  const holders = profile.topHolders;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Top holders</h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <SourcedValue data={profile.holderCount} format={(n) => `${formatNumber(n, false)} total`} />
        </span>
      </div>

      {holders.state !== "verified" || !holders.value || holders.value.length === 0 ? (
        <EmptyState
          title="Holder data unavailable"
          description="Top holder breakdown requires a BaseScan API key. Add one to enable this view — values are never estimated."
        />
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            Percentages reflect share among the top holders shown.
          </p>
          <ul className="space-y-2">
            {holders.value.map((holder, i) => (
              <HolderRow key={holder.address} holder={holder} rank={i + 1} />
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

function HolderRow({ holder, rank }: { holder: TokenHolder; rank: number }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 font-mono text-xs text-muted-foreground">
        {rank}
      </span>
      <a
        href={explorerAddress(holder.address)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 truncate font-mono text-sm transition-colors hover:text-violet-300"
      >
        {shortenAddress(holder.address, 6)}
      </a>
      <div className="flex w-32 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-brand-gradient"
            style={{ width: `${Math.min(100, holder.percentage)}%` }}
          />
        </div>
        <span className="w-12 shrink-0 text-right font-mono text-xs">
          {holder.percentage.toFixed(1)}%
        </span>
      </div>
    </li>
  );
}

export function TokenLinks({ profile }: { profile: TokenProfile }) {
  const hasDesc = profile.description.state === "verified" && !!profile.description.value;
  const links: { label: string; url: string }[] = [];
  if (profile.website) links.push({ label: "Website", url: profile.website });
  for (const s of profile.socials) {
    const label = s.type.charAt(0).toUpperCase() + s.type.slice(1);
    links.push({ label, url: s.url });
  }

  if (!hasDesc && links.length === 0) return null;

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-display text-base font-semibold">About &amp; links</h3>
      {hasDesc && (
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          {profile.description.value}
        </p>
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.06]"
            >
              {l.label} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}

export function TokenSmartMoney({ profile }: { profile: TokenProfile }) {
  const exposure = profile.smartMoneyExposure;
  const value = exposure.state === "verified" ? exposure.value : null;

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-display text-base font-semibold">Smart money exposure</h3>
      {!value || value.trackedWalletCount == null ? (
        <EmptyState
          title="No smart-money data"
          description="Smart-money wallet labeling is a proprietary dataset. Connect your labeling pipeline via Supabase to populate this — it's never fabricated."
        />
      ) : (
        <div>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono text-lg font-semibold text-foreground">
              {value.trackedWalletCount}
            </span>{" "}
            tracked wallets have interacted with this token.
          </p>
        </div>
      )}
    </Card>
  );
}










