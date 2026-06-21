import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        brand: "border-brand-violet/30 bg-brand-violet/15 text-violet-300",
        cyan: "border-brand-cyan/25 bg-brand-cyan/15 text-cyan-300",
        ongoing: "border-status-ongoing/25 bg-status-ongoing/15 text-emerald-300",
        ended: "border-status-ended/25 bg-status-ended/15 text-red-300",
        upcoming: "border-status-upcoming/25 bg-status-upcoming/15 text-blue-300",
        unknown: "border-status-unknown/25 bg-status-unknown/15 text-amber-300",
        neutral: "border-white/10 bg-white/5 text-muted-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
