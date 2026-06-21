import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-display font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-gradient text-[#071006] shadow-[0_8px_30px_-8px_rgba(185,255,74,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-8px_rgba(185,255,74,0.6),inset_0_1px_0_rgba(255,255,255,0.3)]",
        ghost:
          "bg-white/[0.035] border border-white/[0.08] text-foreground backdrop-blur-md hover:bg-white/[0.06] hover:border-white/[0.18] hover:-translate-y-0.5",
        outline:
          "border border-white/[0.12] text-foreground hover:bg-white/[0.04]",
        subtle: "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-5 text-[15px]",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
