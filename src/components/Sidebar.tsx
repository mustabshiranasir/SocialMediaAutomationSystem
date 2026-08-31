"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileText, ChevronDown, Image, ShieldCheck,
  Link2, Users, Settings, LogOut, PenSquare, Tag, FolderOpen,
  ImagePlus, List, MessageSquare, BarChart2, TrendingUp
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPendingPosts } from "@/lib/firestore";
import { isAdmin, isEditorOrAbove } from "@/lib/permissions";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  requiresEditor?: boolean;
  badge?: number;
  children?: { label: string; href: string; adminOnly?: boolean }[];
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
    if (!isEditorOrAbove(role || "")) return;
    getPendingPosts()
      .then(posts => setPendingCount(posts.length))
      .catch(console.error);
  }, [role]);

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      label: "Posts",
      icon: <FileText className="w-4 h-4" />,
      children: [
        { label: "All Posts", href: "/posts" },
        { label: "Add Post", href: "/compose" },
        { label: "Categories", href: "/posts/categories" },
        { label: "Tags", href: "/posts/tags" },
      ],
    },
    {
      label: "Media",
      icon: <Image className="w-4 h-4" />,
      children: [
        { label: "Library", href: "/media" },
        { label: "Add Media File", href: "/media/add" },
      ],
    },
    {
      label: "Comments",
      href: "/comments",
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      label: "Approvals",
      href: "/approvals",
      icon: <ShieldCheck className="w-4 h-4" />,
      requiresEditor: true,
      badge: pendingCount,
    },
    {
      label: "Accounts",
      href: "/accounts",
      icon: <Link2 className="w-4 h-4" />,
      adminOnly: true,
    },
    {
      label: "Users",
      icon: <Users className="w-4 h-4" />,
      adminOnly: true,
      children: [
        { label: "All Users", href: "/team", adminOnly: true },
        { label: "Add User", href: "/team/add", adminOnly: true },
        { label: "Profile", href: "/team/profile" },
      ],
    },
    {
      label: "Social Poster",
      href: "/social-poster",
      icon: <img src="/fs-poster-logo.png" alt="Social Poster" className="w-4 h-4 rounded object-cover" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="w-4 h-4" />,
      adminOnly: true,
    },
  ];

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/team") return pathname === "/team";
    return pathname.startsWith(href);
  };

  const isParentActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some(child => isActive(child.href));
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 h-screen w-56 flex flex-col z-40 border-r border-white/5 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
        style={{ background: "linear-gradient(180deg, #0f1117 0%, #111827 100%)" }}
      >
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
            <img src="/fs-poster-logo.png" alt="Social Auto" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">Social Auto</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin(role || "")) return null;
          if (item.requiresEditor && !isEditorOrAbove(role || "")) return null;

          // Parent with children
          if (item.children) {
            const open = openMenus.includes(item.label);
            const parentActive = isParentActive(item);
            const visibleChildren = item.children.filter(child => !child.adminOnly || isAdmin(role || ""));
            if (visibleChildren.length === 0) return null;

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group
                    ${parentActive ? "bg-primary/20 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={parentActive ? "text-primary" : "group-hover:text-primary transition-colors"}>
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3 pl-3 border-l border-white/10 mt-0.5 space-y-0.5 py-1">
                        {visibleChildren.map(child => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={`block px-3 py-1.5 rounded-lg text-sm transition-colors
                              ${isActive(child.href)
                                ? "text-white font-semibold bg-primary/10"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          // Single link
          return (
            <Link
              key={item.label}
              href={item.href!}
              onClick={onClose}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors group
                ${isActive(item.href!)
                  ? "bg-primary/20 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
            >
              <span className={isActive(item.href!) ? "text-primary" : "group-hover:text-primary transition-colors"}>
                {item.icon}
              </span>
              {item.label}
              {/* Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg shadow-red-500/40"
                >
                  {item.badge > 9 ? "9+" : item.badge}
                </motion.span>
              )}
              {/* Active indicator */}
              {isActive(item.href!) && (
                <motion.span
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.email}</p>
            <p className={`text-[10px] capitalize ${isAdmin(role || "") ? "text-purple-400" : "text-slate-500"}`}>
              {role || "User"}
            </p>
          </div>
          <button
            onClick={() => logout()}
            title="Sign Out"
            className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
