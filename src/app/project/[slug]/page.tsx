import Link from "next/link";
import { ArrowLeft, ExternalLink, Globe, Twitter, Boxes, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NotFoundState } from "@/components/shared/states";
import { DataSourceNote } from "@/components/shared/data-source-note";
import { getProjectProfile } from "@/lib/services/discover-service";
import { getProtocolDetail } from "@/lib/adapters/defillama";
import { explorerToken, geckoTerminalToken } from "@/lib/config";
import { formatUsd, formatAgeDays } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectProfile(decodeURIComponent(slug));
  const detail = await getProtocolDetail(decodeURIComponent(slug));

  if (!project) {
    return (
      <div className="container py-16">
        <Link
          href="/discover"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Discover
        </Link>
        <NotFoundState query={slug} />
      </div>
    );
  }

  const website = project.website.value;
  const twitter = project.socials.value?.twitter;
  const exposure =
    project.smartMoneyExposure.state === "verified"
      ? project.smartMoneyExposure.value
      : null;

  return (
    <div className="container max-w-4xl space-y-6 py-10">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Discover
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          {detail?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={detail.logo}
              alt={project.name}
              className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 bg-brand-darkAlt object-contain p-2.5 shadow-lg"
            />
          ) : (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-gradient shadow-lg">
              <Boxes className="h-8 w-8 text-[#071006]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{project.name}</h1>
              {project.isNew && (
                <span className="rounded-md border border-brand-cyan/25 bg-brand-cyan/15 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                  NEW
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {project.category.state === "verified" && project.category.value ? project.category.value : "Unknown"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.06]"
            >
              <Globe className="h-4 w-4" /> Website
            </a>
          )}
          <a
            href={`https://defillama.com/protocol/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.06]"
          >
            <BarChart3 className="h-4 w-4" /> DefiLlama
          </a>
          {twitter && (
            <a
              href={twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.1] bg-white/[0.03] text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Twitter / X"
            >
              <Twitter className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">TVL on Base</p>
          <div className="mt-1.5 font-mono text-xl font-semibold">
            {project.tvlUsd.state === "verified" && project.tvlUsd.value != null ? formatUsd(project.tvlUsd.value) : "Unknown"}
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Age</p>
          <div className="mt-1.5 font-mono text-xl font-semibold">
            {project.ageDays.state === "verified" && project.ageDays.value != null ? formatAgeDays(project.ageDays.value) : "Unknown"}
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Smart money</p>
          <div className="mt-1.5 font-mono text-xl font-semibold">
            {exposure && exposure.trackedWalletCount != null
              ? `${exposure.trackedWalletCount} wallets`
              : "Unknown"}
          </div>
        </Card>
      </div>

      {project.description.value && (
        <Card className="p-6">
          <h3 className="mb-2 font-display text-base font-semibold">About</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {project.description.value}
          </p>
        </Card>
      )}

      {detail && (detail.symbol || detail.audits != null || detail.tokenAddress) && (
        <Card className="p-6">
          <h3 className="mb-4 font-display text-base font-semibold">Project info</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {detail.symbol && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-xs text-muted-foreground">Token</p>
                <p className="mt-1 font-mono text-sm font-semibold">${detail.symbol}</p>
              </div>
            )}
            {detail.audits != null && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-xs text-muted-foreground">Audits</p>
                <p className="mt-1 text-sm font-semibold">
                  {detail.audits > 0 ? `${detail.audits} audit${detail.audits > 1 ? "s" : ""}` : "No audits listed"}
                </p>
              </div>
            )}
          </div>
          {detail.tokenAddress && (
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={explorerToken(detail.tokenAddress)} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.06]">
                Token on BaseScan <ExternalLink className="h-4 w-4" />
              </a>
              <a href={geckoTerminalToken(detail.tokenAddress)} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.06]">
                Chart on GeckoTerminal <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </Card>
      )}

      <DataSourceNote sources={["DefiLlama", "Supabase"]} />
    </div>
  );
}

