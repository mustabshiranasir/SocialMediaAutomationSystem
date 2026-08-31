// Button Component
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:   "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20",
  secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
  danger:    "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20",
  ghost:     "bg-transparent hover:bg-slate-100 text-slate-600",
  success:   "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm:  "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md:  "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg:  "px-6 py-3.5 text-base rounded-xl gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium transition-all
        disabled:opacity-60 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...(props as any)}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
}
