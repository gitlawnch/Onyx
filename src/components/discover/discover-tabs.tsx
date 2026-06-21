"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket } from "lucide-react";
import type { DiscoverData } from "@/types";
import { ProjectCard } from "@/components/discover/cards";
import { EmptyState } from "@/components/shared/states";
import { cn } from "@/lib/utils/cn";

type TabKey = "trending" | "new" | "airdrops";

const FILTERS: { key: TabKey; label: string }[] = [
  { key: "trending", label: "Projects" },
  { key: "new", label: "New" },
  { key: "airdrops", label: "Airdrops" },
];

export function DiscoverTabs({ data }: { data: DiscoverData }) {
  const [tab, setTab] = React.useState<TabKey>("trending");

  React.useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const map: Record<string, TabKey> = {
      trending: "trending",
      new: "new",
      airdrops: "airdrops",
      quests: "airdrops",
      ending: "airdrops",
      ended: "airdrops",
    };
    if (hash && map[hash]) setTab(map[hash]);
  }, []);

  return (
    <div className="space-y-8">
      {/* Section header ala Framer */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-lime">
            Discover the Base surface area
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Projects, tokens, quests, and airdrops in one connected world.
          </h2>
        </div>

        {/* Filter pills */}
        <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] p-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setTab(f.key)}
              className={cn(
                "relative rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                tab === f.key
                  ? "text-[#071006]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === f.key && (
                <motion.span
                  layoutId="discover-tab-pill"
                  className="absolute inset-0 rounded-full bg-brand-lime"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
      {tab === "trending" && (
        <motion.div key="trending" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
        <Grid
          empty={{
            title: "No trending projects",
            description:
              "DefiLlama returned no Base protocols with a 24h TVL change right now.",
          }}
          items={data.trendingProjects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        />
        </motion.div>
      )}

      {tab === "new" && (
        <motion.div key="new" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
        <Grid
          empty={{
            title: "No new projects",
            description: "No Base protocol has been listed in the last 30 days.",
          }}
          items={data.newProjects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        />
        </motion.div>
      )}

      {tab === "airdrops" && (
        <motion.div key="airdrops" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-brand-lime/10 via-brand-darkAlt to-transparent px-6 py-20 text-center">
          <div className="pointer-events-none absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-lime/15 blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-white/10 blur-2xl animate-float" />
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient shadow-lg">
            <Rocket className="h-8 w-8 text-[#071006]" />
          </div>
          <h3 className="font-display text-2xl font-semibold">Airdrops — Coming Soon</h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            We are building a verified airdrop &amp; quest tracker for the Base
            ecosystem. Campaign statuses will always be derived from real dates —
            an ended campaign will never be shown as ongoing.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-brand-lime" style={{ boxShadow: "0 0 8px #b9ff4a" }} />
            In development
          </span>
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function Grid({
  items,
  empty,
}: {
  items: React.ReactNode[];
  empty: { title: string; description: string };
}) {
  if (items.length === 0) {
    return <EmptyState title={empty.title} description={empty.description} />;
  }
  return (
    <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items}
    </motion.div>
  );
}






