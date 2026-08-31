// Card Component
import { motion } from "framer-motion";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  animate = true,
  delay = 0,
  hover = false,
  onClick,
}: CardProps) {
  const base = `bg-white rounded-2xl border border-slate-200 shadow-sm ${
    hover ? "cursor-pointer hover:shadow-md transition-shadow" : ""
  } ${className}`;

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className={base}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={base} onClick={onClick}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
}

export function CardHeader({ title, subtitle, action, icon, iconBg = "bg-blue-50 text-blue-600" }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
        )}
        <div>
          <h2 className="font-semibold text-slate-800 text-lg leading-tight">{title}</h2>
          {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  iconText?: string;
  border?: string;
  change?: string;
  changePositive?: boolean;
  delay?: number;
}

export function StatCard({
  label,
  value,
  icon,
  iconBg = "bg-blue-50",
  iconText = "text-blue-600",
  border = "border-slate-200",
  change,
  changePositive,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-white rounded-xl p-5 border ${border} shadow-sm`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-lg ${iconBg} ${iconText} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-4xl font-bold text-slate-800">{value}</p>
      {change && (
        <p className={`text-xs mt-1.5 font-medium ${changePositive ? "text-emerald-600" : "text-red-500"}`}>
          {changePositive ? "▲" : "▼"} {change}
        </p>
      )}
    </motion.div>
  );
}
