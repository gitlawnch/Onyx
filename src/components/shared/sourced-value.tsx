"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import type { DataState, Sourced } from "@/types";
import { cn } from "@/lib/utils/cn";
import { relativeTime } from "@/lib/utils/format";

/**
 * Renders a Sourced<T> with honest provenance. When the value isn't verified,
 * it shows a clear "Unknown" state with a tooltip explaining why — never a
 * fabricated number. This component is how the "Unknown is better than
 * incorrect" principle is enforced consistently across every page.
 */

interface SourcedValueProps<T> {
  data: Sourced<T> | undefined;
  /** Formats a present value for display. */
  format: (value: T) => React.ReactNode;
  className?: string;
  /** Label shown in the provenance tooltip (e.g. "Liquidity"). */
  label?: string;
}

const stateStyles: Record<DataState, string> = {
  verified: "",
  stale: "text-amber-300/90",
  unknown: "text-amber-300/80",
  error: "text-red-300/80",
};

export function SourcedValue<T>({
  data,
  format,
  className,
  label,
}: SourcedValueProps<T>) {
  const [open, setOpen] = React.useState(false);

  if (!data) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }

  const isResolved = data.state === "verified" || data.state === "stale";
  const showValue = isResolved && data.value != null;

  return (
    <span
      className={cn("relative inline-flex items-center gap-1.5", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className={cn(stateStyles[data.state])}>
        {showValue ? (
          format(data.value as T)
        ) : data.state === "error" ? (
          "Error"
        ) : (
          "Unknown"
        )}
      </span>

      {!showValue && (
        <button
          type="button"
          aria-label="Why is this unknown?"
          className="text-amber-300/60 transition-colors hover:text-amber-300"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-[#0c0e16] p-3 text-left text-xs leading-relaxed text-muted-foreground shadow-xl">
          {label && <span className="mb-1 block font-medium text-foreground">{label}</span>}
          {data.state === "unknown" && (
            <>
              Not available from the connected sources
              {data.sources.length > 0 && ` (${data.sources.join(", ")})`}. Shown
              as Unknown rather than guessed.
            </>
          )}
          {data.state === "error" && (
            <>Couldn&apos;t fetch this value: {data.error ?? "upstream error"}.</>
          )}
          {data.state === "stale" && <>Cached value, may be slightly behind.</>}
          {data.state === "verified" && (
            <>
              Source: {data.sources.join(", ") || "—"} · checked{" "}
              {relativeTime(data.checkedAt)}
            </>
          )}
        </span>
      )}
    </span>
  );
}