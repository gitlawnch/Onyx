"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ExternalLink, Clock } from "lucide-react";
import type { Campaign, ProjectSummary } from "@/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/airdrop/status-badge";
import { cn } from "@/lib/utils/cn";
import {
  formatUsd,
  formatPercent,
  formatDate,
  relativeTime,
  formatAgeDays,
} from "@/lib/utils/format";

function bannerGradient(category: string | null): string {
  const c = (category ?? "").toLowerCase();
  if (c.includes("dex") || c.includes("dexes") || c.includes("amm"))
    return "from-white/[0.05] via-[#1A1A1A] to-[#111111]";
  if (c.includes("lending") || c.includes("yield") || c.includes("farm"))
    return "from-emerald-400/25 via-brand-darkAlt to-brand-dark";
  if (c.includes("nft") || c.includes("collect"))
    return "from-fuchsia-400/20 via-brand-darkAlt to-brand-dark";
  if (c.includes("bridge") || c.includes("cross"))
    return "from-sky-400/20 via-brand-darkAlt to-brand-dark";
  if (c.includes("social") || c.includes("game"))
    return "from-amber-300/20 via-brand-darkAlt to-brand-dark";
  if (c.includes("derivativ") || c.includes("perp"))
    return "from-rose-400/20 via-brand-darkAlt to-brand-dark";
  return "from-brand-lime/20 via-brand-darkAlt to-brand-dark";
}

export function ProjectCard({
  project,
  index = 0,
  bare = false,
}: {
  project: ProjectSummary;
  index?: number;
  bare?: boolean;
}) {
  const change = project.change24h;
  const positive = change != null && change >= 0;
  const initial = project.name.trim().charAt(0).toUpperCase() || "?";

  const cardRef = React.useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = React.useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const maxDeg = 18;
    const ry = (0.5 - px) * maxDeg * 2;
    const rx = (py - 0.5) * maxDeg * 2;
    setTilt({ rx, ry });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const content = (
    <Link href={`/project/${project.slug}`} className="block">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: "transform 0.15s ease-out",
          transformStyle: "preserve-3d",
        }}
      >
        <Card className="group h-full overflow-hidden p-0 transition-shadow duration-500 hover:border-brand-lime/40 hover:shadow-[0_10px_20px_rgba(0,0,0,0.25),0_40px_80px_rgba(180,255,80,0.18)]">
          <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-white/[0.06] via-brand-darkAlt to-brand-dark">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-brand-lime/20 blur-3xl opacity-40 animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-20px] right-[-10px] h-28 w-28 rounded-full bg-white/10 blur-2xl opacity-30 animate-float pointer-events-none" />

            {project.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.logo}
                alt={project.name}
                className="relative h-20 w-20 rounded-2xl border border-white/10 bg-brand-dark/60 object-contain p-2 shadow-lg transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-110 group-hover:shadow-[0_20px_60px_rgba(255,255,255,0.15)] sm:h-24 sm:w-24"
                loading="lazy"
              />
            ) : (
              <div className="relative grid h-20 w-20 place-items-center rounded-2xl border border-white/10 bg-brand-dark/60 font-display text-3xl font-bold text-brand-lime shadow-lg sm:h-24 sm:w-24">
                {initial}
              </div>
            )}
            {project.isNew && (
              <span className="absolute right-3 top-3 rounded-md border border-brand-lime/25 bg-brand-dark/70 px-2 py-0.5 text-[10px] font-medium text-brand-lime backdrop-blur">
                NEW
              </span>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-base font-semibold">{project.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {project.category ?? "Protocol"}
                </p>
              </div>
              {change != null && (
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium",
                    positive ? "bg-brand-lime/10 text-brand-lime" : "bg-red-500/10 text-red-300"
                  )}
                >
                  {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {formatPercent(change)}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">TVL (Base)</p>
                <p className="mt-0.5 font-mono text-lg font-semibold">{formatUsd(project.tvlUsd)}</p>
              </div>
              {project.ageDays != null && (
                <p className="text-xs text-muted-foreground">
                  Listed {formatAgeDays(project.ageDays)} ago
                </p>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className="absolute -left-1/2 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-120%] group-hover:translate-x-[220%] transition-transform duration-1000" />
          </div>
        </Card>
      </div>
    </Link>
  );

  if (bare) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
      style={{ perspective: "1000px" }}
    >
      {content}
    </motion.div>
  );
}

export function CampaignCard({ campaign, index = 0 }: { campaign: Campaign; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link href={`/airdrop/${campaign.id}`}>
        <Card className="group h-full p-5 transition-all hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_25px_80px_rgba(0,0,0,0.6)] hover:bg-white/[0.055]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-semibold">{campaign.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {campaign.source} - {campaign.kind === "quest" ? "Quest" : "Airdrop"}
              </p>
            </div>
            <StatusBadge status={campaign.status} />
          </div>

          {campaign.reward && (
            <p className="mt-4 text-sm">
              <span className="text-muted-foreground">Reward: </span>
              <span className="font-medium text-foreground">{campaign.reward}</span>
            </p>
          )}

          <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Start</span>
              <span className="font-mono">{formatDate(campaign.startDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>End</span>
              <span className="font-mono">{formatDate(campaign.endDate)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.05] pt-1.5">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Checked
              </span>
              <span className="font-mono">{relativeTime(campaign.lastCheckedAt)}</span>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className="absolute -left-1/2 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-120%] group-hover:translate-x-[220%] transition-transform duration-1000" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  href,
  id,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  id?: string;
}) {
  return (
    <div id={id} className="mb-6 flex items-end justify-between gap-4 scroll-mt-24">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-sm text-brand-lime transition-colors hover:text-brand-lime/80"
        >
          View all <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}