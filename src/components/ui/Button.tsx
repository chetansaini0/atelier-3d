"use client";

import { cn } from "@/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "line" | "danger";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary: "bg-[var(--brass)] text-[#1a1916] hover:brightness-110",
    ghost: "bg-transparent text-[var(--fg)] hover:bg-white/5",
    line: "border border-[var(--line)] bg-transparent hover:border-[var(--brass)]",
    danger: "bg-[var(--danger)] text-white",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm tracking-wide transition disabled:opacity-40",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
