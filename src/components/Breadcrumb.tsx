"use client";

// Breadcrumb Component — Auto-generated from pathname with custom label overrides
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

/** Map of route segment → display label */
const SEGMENT_LABELS: Record<string, string> = {
  "social-poster":   "Social Poster",
  "compose":         "Compose Post",
  "posts":           "Posts",
  "categories":      "Categories",
  "tags":            "Tags",
  "media":           "Media",
  "add":             "Add New",
  "comments":        "Comments",
  "approvals":       "Approvals",
  "analytics":       "Analytics",
  "team":            "Team",
  "settings":        "Settings",
  "accounts":        "Accounts",
};

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  /** Optional manual override for the breadcrumb items */
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname segments
  const crumbs: BreadcrumbItem[] = items ?? (() => {
    const segments = pathname.split("/").filter(Boolean);
    const generated: BreadcrumbItem[] = [{ label: "Dashboard", href: "/" }];
    let accumulatedPath = "";
    for (const seg of segments) {
      accumulatedPath += `/${seg}`;
      const label =
        SEGMENT_LABELS[seg] ??
        seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
      generated.push({ label, href: accumulatedPath });
    }
    return generated;
  })();

  // Don't show breadcrumbs on root dashboard page
  if (crumbs.length <= 1) return null;

  return (
    <motion.nav
      aria-label="Breadcrumb"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-center gap-1 text-xs text-slate-400 mb-6 ${className}`}
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            {index === 0 && (
              <Home className="w-3 h-3 shrink-0" aria-hidden="true" />
            )}
            {isLast ? (
              <span
                className="font-semibold text-slate-600 truncate max-w-[160px]"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-blue-500 transition-colors truncate max-w-[120px]"
              >
                {crumb.label}
              </Link>
            )}
            {!isLast && (
              <ChevronRight className="w-3 h-3 shrink-0 text-slate-300" aria-hidden="true" />
            )}
          </span>
        );
      })}
    </motion.nav>
  );
}
