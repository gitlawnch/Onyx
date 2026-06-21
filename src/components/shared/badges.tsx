import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Small "Demo" indicator for sections that render illustrative/sample data
 * because the backing source isn't connected or populated yet. Keeps the UI
 * honest per the project's "unknown is better than incorrect" principle.
 */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300",
        className
      )}
    >
      <FlaskConical className="h-2.5 w-2.5" />
      Demo
    </span>
  );
}

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-lime/30 bg-brand-lime/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-lime",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-brand-lime animate-pulse" />
      Live
    </span>
  );
}
