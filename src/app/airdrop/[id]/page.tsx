import Link from "next/link";
import { Clock, ExternalLink, Calendar, Gift, Tag, ArrowLeft, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/airdrop/status-badge";
import { NotFoundState } from "@/components/shared/states";
import { getCampaignById } from "@/lib/adapters/campaigns";
import { formatDate, relativeTime } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function AirdropPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignById(decodeURIComponent(id));

  if (!campaign) {
    return (
      <div className="container py-16">
        <Link
          href="/discover#airdrops"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Discover
        </Link>
        <NotFoundState query={id} />
      </div>
    );
  }

  const rows = [
    { icon: Tag, label: "Source", value: campaign.source },
    { icon: Gift, label: "Reward", value: campaign.reward ?? "Unknown" },
    { icon: Calendar, label: "Start date", value: formatDate(campaign.startDate) },
    { icon: Calendar, label: "End date", value: formatDate(campaign.endDate) },
  ];

  return (
    <div className="container max-w-3xl py-10">
      <Link
        href="/discover#airdrops"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Discover
      </Link>

      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.06] bg-gradient-to-br from-brand-violet/10 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {campaign.kind === "quest" ? "Quest" : "Airdrop"}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold">{campaign.name}</h1>
            </div>
            <StatusBadge status={campaign.status} />
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5">
                  <row.icon className="h-4 w-4 text-violet-300" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="truncate text-sm font-medium">{row.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Last-checked transparency — central to the accuracy promise. */}
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Status last verified</span>
            <span className="ml-auto font-mono">
              {relativeTime(campaign.lastCheckedAt)}
            </span>
            <span className="text-xs text-muted-foreground/60">
              ({formatDate(campaign.lastCheckedAt)})
            </span>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
            <p>
              Status is derived from the campaign&apos;s real start/end dates and
              the last verification time — not from a stored label alone. A
              campaign past its end date is always shown as Ended, never Ongoing.
            </p>
          </div>

          {campaign.url && (
            <a
              href={campaign.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient font-display font-semibold text-white transition-all hover:-translate-y-0.5"
            >
              Open on {campaign.source} <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {campaign.projectSlug && (
            <Link
              href={`/project/${campaign.projectSlug}`}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] font-display font-semibold transition-all hover:bg-white/[0.04]"
            >
              View project
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
