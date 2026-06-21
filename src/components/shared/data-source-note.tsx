import { Database, CheckCircle2, XCircle } from "lucide-react";
import { sources as sourceRegistry } from "@/lib/config";

const REGISTRY_BY_NAME: Record<string, { available: boolean; note?: string }> = {
  "Base RPC": { available: sourceRegistry.baseRpc.available },
  BaseScan: {
    available: sourceRegistry.basescan.available,
    note: "Add BASESCAN_API_KEY to enable",
  },
  Alchemy: {
    available: sourceRegistry.alchemy.available,
    note: "Add ALCHEMY_API_KEY to enable",
  },
  DexScreener: { available: sourceRegistry.dexscreener.available },
  GeckoTerminal: { available: true },
  DefiLlama: { available: sourceRegistry.defillama.available },
  CoinGecko: { available: sourceRegistry.coingecko.available },
  Supabase: {
    available: sourceRegistry.supabase.available,
    note: "Connect Supabase to enable",
  },
};

export function DataSourceNote({ sources }: { sources: string[] }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Database className="h-4 w-4" />
        Data sources
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((name) => {
          const meta = REGISTRY_BY_NAME[name];
          const available = meta?.available ?? false;
          return (
            <span
              key={name}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                available
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                  : "border-amber-500/20 bg-amber-500/5 text-amber-300/90"
              }`}
              title={!available ? meta?.note : undefined}
            >
              {available ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {name}
              {!available && meta?.note && (
                <span className="text-amber-300/60">· {meta.note}</span>
              )}
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Values that a connected source can&apos;t provide are shown as
        &ldquo;Unknown&rdquo; rather than estimated. Accuracy over completeness.
      </p>
    </div>
  );
}
