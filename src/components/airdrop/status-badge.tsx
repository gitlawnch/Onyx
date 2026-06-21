import type { CampaignStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

const META: Record<
  CampaignStatus,
  { label: string; emoji: string; dot: string; text: string; bg: string }
> = {
  ongoing: { label: "Ongoing", emoji: "🟢", dot: "#34D399", text: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/25" },
  ended: { label: "Ended", emoji: "🔴", dot: "#F87171", text: "text-red-300", bg: "bg-red-500/10 border-red-500/25" },
  upcoming: { label: "Upcoming", emoji: "🔵", dot: "#60A5FA", text: "text-blue-300", bg: "bg-blue-500/10 border-blue-500/25" },
  unknown: { label: "Unknown", emoji: "🟡", dot: "#FBBF24", text: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/25" },
};

export function StatusBadge({
  status,
  withDot = true,
  className,
}: {
  status: CampaignStatus;
  withDot?: boolean;
  className?: string;
}) {
  const m = META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium",
        m.bg,
        m.text,
        className
      )}
    >
      {withDot && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: m.dot, boxShadow: status === "ended" ? "none" : `0 0 8px ${m.dot}` }}
        />
      )}
      {m.label}
    </span>
  );
}

export { META as STATUS_META };
