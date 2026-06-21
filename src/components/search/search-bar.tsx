"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Wallet,
  Coins,
  Boxes,
  Trophy,
  ArrowRight,
  FileCode2,
} from "lucide-react";
import type { ApiResult, SearchDetection } from "@/types";
import { detectShape } from "@/lib/search/detect";
import { cn } from "@/lib/utils/cn";
import { shortenAddress } from "@/lib/utils/format";

interface Suggestions {
  tokens: { address: string; symbol: string; name: string }[];
  projects: { slug: string; name: string; category: string | null; logo: string | null }[];
  campaigns: { id: string; name: string; kind: string }[];
}

const SHAPE_HINT: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  address: { label: "Address detected", icon: Wallet },
  tx_hash: { label: "Transaction hash", icon: FileCode2 },
  ens_name: { label: "Basename / ENS", icon: Boxes },
  text: { label: "Search Base", icon: Search },
};

export function SearchBar({
  size = "lg",
  autoFocus = false,
  placeholder = "Search wallet, token, contract, project, quest or airdrop...",
}: {
  size?: "md" | "lg";
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Suggestions | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [resolving, setResolving] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const shape = query.trim() ? detectShape(query).shape : "text";

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions(null);
      setLoading(false);
      return;
    }
    if (shape === "address" || shape === "tx_hash" || shape === "ens_name") {
      setSuggestions(null);
      return;
    }

    setLoading(true);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/search?mode=suggest&q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );
        const json: ApiResult<Suggestions> = await res.json();
        if (json.ok && json.data) {
          setSuggestions(json.data);
          setOpen(true);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") setSuggestions(null);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(t);
  }, [query, shape]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function resolveAndGo(raw: string) {
    const q = raw.trim();
    if (!q) return;
    setResolving(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?mode=resolve&q=${encodeURIComponent(q)}`);
      const json: ApiResult<SearchDetection> = await res.json();
      if (!json.ok || !json.data) {
        setError(json.error ?? "Search failed");
        return;
      }
      const detection = json.data;
      if (!detection.route) {
        setError(detection.reason);
        return;
      }
      if (detection.route.startsWith("http")) {
        window.open(detection.route, "_blank", "noopener,noreferrer");
      } else {
        setOpen(false);
        router.push(detection.route);
      }
    } catch {
      setError("Network error while searching");
    } finally {
      setResolving(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    resolveAndGo(query);
  }

  const Hint = SHAPE_HINT[shape] ?? SHAPE_HINT.text;
  const hasSuggestions =
    suggestions &&
    (suggestions.tokens.length > 0 ||
      suggestions.projects.length > 0 ||
      suggestions.campaigns.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-50"
        style={{
          padding: "1.5px",
          background:
            "linear-gradient(90deg, rgba(185,255,74,0.6), rgba(237,227,199,0.35), rgba(185,255,74,0.6))",
          backgroundSize: "200% 200%",
          animation: "border-flow 4s ease infinite",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <form onSubmit={onSubmit}>
        <div
          className={cn(
            "group relative flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-white/[0.04] backdrop-blur-md transition-all focus-within:border-brand-lime/50 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_4px_rgba(185,255,74,0.18),0_0_40px_rgba(185,255,74,0.25),0_0_80px_rgba(185,255,74,0.12)]",
            size === "lg" ? "h-16 px-5" : "h-12 px-4"
          )}
        >
          <Search
            className={cn(
              "shrink-0 transition-colors group-focus-within:text-brand-lime",
              size === "lg" ? "h-6 w-6" : "h-5 w-5",
              loading ? "text-brand-lime animate-pulse" : "text-muted-foreground"
            )}
          />
          <input
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            onFocus={() => hasSuggestions && setOpen(true)}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            className={cn(
              "min-w-0 flex-1 bg-transparent font-sans text-foreground placeholder:text-muted-foreground/70 focus:outline-none",
              size === "lg" ? "text-lg" : "text-base"
            )}
          />
          {(loading || resolving) && (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
          )}
          <button
            type="submit"
            disabled={!query.trim() || resolving}
            className={cn(
              "hidden shrink-0 items-center gap-1.5 rounded-xl bg-brand-gradient px-4 font-display text-sm font-semibold text-[#071006] transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 sm:flex",
              size === "lg" ? "h-11" : "h-9"
            )}
          >
            Search <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Shape hint */}
      {query.trim().length >= 2 && (
        <div className="mt-2 flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <Hint.icon className="h-3.5 w-3.5" />
          <span>{Hint.label}</span>
          {error && <span className="ml-2 text-amber-300">- {error}</span>}
        </div>
      )}

      {/* Suggestions dropdown */}
      <AnimatePresence>
      {open && hasSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/[0.1] bg-[#10130D]/95 shadow-2xl backdrop-blur-xl">
          {suggestions!.tokens.length > 0 && (
            <Section title="Tokens">
              {suggestions!.tokens.map((t) => (
                <SuggestionRow
                  key={t.address}
                  icon={Coins}
                  primary={t.symbol}
                  secondary={`${t.name} - ${shortenAddress(t.address)}`}
                  onClick={() => router.push(`/token/${t.address.toLowerCase()}`)}
                />
              ))}
            </Section>
          )}
          {suggestions!.projects.length > 0 && (
            <Section title="Projects">
              {suggestions!.projects.map((p) => (
                <SuggestionRow
                  key={p.slug}
                  icon={Boxes}
                  logo={p.logo}
                  primary={p.name}
                  secondary={p.category ?? "Protocol"}
                  onClick={() => router.push(`/project/${p.slug}`)}
                />
              ))}
            </Section>
          )}
          {suggestions!.campaigns.length > 0 && (
            <Section title="Quests & Airdrops">
              {suggestions!.campaigns.map((c) => (
                <SuggestionRow
                  key={c.id}
                  icon={Trophy}
                  primary={c.name}
                  secondary={c.kind === "quest" ? "Quest" : "Airdrop"}
                  onClick={() => router.push(`/airdrop/${c.id}`)}
                />
              ))}
            </Section>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/[0.05] py-2 last:border-0">
      <p className="px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {title}
      </p>
      {children}
    </div>
  );
}

function SuggestionRow({
  icon: Icon,
  logo,
  primary,
  secondary,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  logo?: string | null;
  primary: string;
  secondary: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={primary} className="h-full w-full object-contain p-1" loading="lazy" />
        ) : (
          <Icon className="h-4 w-4 text-brand-lime" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{primary}</span>
        <span className="block truncate text-xs text-muted-foreground">{secondary}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}





