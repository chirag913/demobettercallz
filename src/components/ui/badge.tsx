import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide",
  {
    variants: {
      variant: {
        neutral: "bg-black/5 text-[var(--foreground)]",
        outline: "border border-[var(--border-strong)] text-[var(--muted)]",
        verified: "bg-[var(--verified-bg)] text-[var(--verified)]",
        unverified: "bg-[var(--unverified-bg)] text-[var(--unverified)]",
        restricted: "bg-[var(--restricted-bg)] text-[var(--restricted)]",
        live: "bg-[var(--foreground)] text-white",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
