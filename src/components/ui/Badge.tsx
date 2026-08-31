// Badge Component
import React from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger:  "bg-red-100 text-red-700",
  info:    "bg-blue-100 text-blue-700",
  purple:  "bg-purple-100 text-purple-700",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  info:    "bg-blue-500",
  purple:  "bg-purple-500",
};

export function Badge({ children, variant = "default", size = "md", dot = false, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-semibold rounded-full capitalize
        ${size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"}
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
}

// Helper to auto-pick variant from status string
export function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const variant: BadgeVariant =
    lower === "published" ? "success" :
    lower === "pending"   ? "warning" :
    lower === "rejected" || lower === "failed" ? "danger" :
    lower === "scheduled" ? "info" :
    lower === "admin"     ? "purple" :
    "default";

  return <Badge variant={variant} dot>{status}</Badge>;
}
