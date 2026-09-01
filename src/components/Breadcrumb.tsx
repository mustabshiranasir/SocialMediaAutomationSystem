"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
  "appearance":      "Appearance",
  "analytics":       "Analytics",
  "team":            "Team",
  "settings":        "Settings",
  "accounts":        "Accounts",
};

/** Map of query parameter `?tab=` → display label */
const TAB_LABELS: Record<string, string> = {
  general:     "General",
  connectors:  "Connectors",
  writing:     "Writing",
  reading:     "Reading",
  discussion:  "Discussion",
  media:       "Media",
  permalinks:  "Permalinks",
  privacy:     "Privacy",
  themes:      "Themes",
  editors:     "Editors",
  fonts:       "Fonts",
  "add-theme": "Add Themes",
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

function BreadcrumbContent({ items, className = "" }: BreadcrumbProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab");

  // Auto-generate breadcrumbs from pathname segments & query params
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

    // Append active sub-tab (e.g. Settings → Connectors or Appearance → Themes)
    if (tab && (pathname === "/settings" || pathname === "/appearance")) {
      const tabLabel =
        TAB_LABELS[tab] ??
        tab.charAt(0).toUpperCase() + tab.slice(1).replace(/-/g, " ");
      generated.push({
        label: tabLabel,
        href: `${pathname}?tab=${tab}`,
      });
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
      className={`flex items-center gap-1.5 text-xs text-slate-400 mb-6 font-medium ${className}`}
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href + index} className="flex items-center gap-1.5">
            {index === 0 && (
              <Home className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            )}
            {isLast ? (
              <span
                className="font-bold text-slate-700 truncate max-w-[180px]"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-blue-600 transition-colors truncate max-w-[140px]"
              >
                {crumb.label}
              </Link>
            )}
            {!isLast && (
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" aria-hidden="true" />
            )}
          </span>
        );
      })}
    </motion.nav>
  );
}

export function Breadcrumb(props: BreadcrumbProps) {
  return (
    <Suspense fallback={null}>
      <BreadcrumbContent {...props} />
    </Suspense>
  );
}
