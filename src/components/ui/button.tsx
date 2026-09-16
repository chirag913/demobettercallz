import { type ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-black/85",
        secondary: "bg-transparent text-[var(--foreground)] border border-[var(--border-strong)] hover:border-[var(--foreground)]",
        ghost: "bg-transparent text-[var(--foreground)] hover:bg-black/5",
        link: "bg-transparent text-[var(--foreground)] underline underline-offset-4 hover:opacity-70 p-0 h-auto",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-13 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, href, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);
    if (href) {
      return (
        <Link href={href} className={classes}>
          {props.children as React.ReactNode}
        </Link>
      );
    }
    return <button className={classes} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";
