import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-[15px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-2)] focus:border-[var(--foreground)]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
