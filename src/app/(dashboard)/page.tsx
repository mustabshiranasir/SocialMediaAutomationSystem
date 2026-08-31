"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Bell, TrendingUp, CheckCircle2, Clock, FileText, Users, BarChart2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getPendingPosts, getAllPosts, Post } from "@/lib/firestore";
import Link from "next/link";

export default function Dashboard() {
  const { user, role } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    getAllPosts().then(setPosts).catch(console.error);
    if (role !== "admin") return;
    getPendingPosts().then(p => setPendingCount(p.length)).catch(console.error);
  }, [role]);

  const published = posts.filter(p => p.status === "published").length;
  const pending   = posts.filter(p => p.status === "pending").length;

  const stats = [
    { label: "Total Posts",  value: String(posts.length), icon: <FileText className="w-5 h-5" />,     color: "blue"    },
    { label: "Published",    value: String(published),    icon: <CheckCircle2 className="w-5 h-5" />, color: "emerald" },
    { label: "Pending",      value: String(pending),      icon: <Clock className="w-5 h-5" />,        color: "amber"   },
    ...(role === "admin" ? [{ label: "Pending Review", value: String(pendingCount), icon: <Bell className="w-5 h-5" />, color: "red" }] : []),
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue:    { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-100"    },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-100"   },
    red:     { bg: "bg-red-50",     text: "text-red-600",     border: "border-red-100"     },
  };

  const recentPosts = [...posts]
    .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0))
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, {user?.email}</p>
      </motion.div>

      {role === "admin" && pendingCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link href="/approvals">
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">
                    {pendingCount} post{pendingCount > 1 ? "s" : ""} waiting for your approval
                  </p>
                  <p className="text-xs text-amber-500 mt-0.5">Click to review and publish</p>
                </div>
              </div>
              <span className="text-xs font-medium text-amber-600 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">Review Now →</span>
            </div>
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const c = colorMap[stat.color];
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`bg-white rounded-xl p-5 border ${c.border} shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.text} flex items-center justify-center`}>{stat.icon}</div>
              </div>
              <p className="text-4xl font-bold text-slate-800">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg text-slate-800">Recent Posts</h2>
          <Link href="/posts" className="text-xs text-blue-500 hover:underline font-medium">View all →</Link>
        </div>
        {recentPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
            <span className="text-5xl opacity-40">📭</span>
            <p className="text-sm">No posts yet. Head to compose to create one!</p>
            <Link href="/compose" className="mt-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors border border-blue-100">
              Create your first post →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentPosts.map(post => {
              const sc =
                post.status === "published" ? "bg-green-100 text-green-700" :
                post.status === "rejected"  ? "bg-red-100 text-red-700"     :
                "bg-amber-100 text-amber-700";
              return (
                <div key={post.id} className="flex items-center justify-between py-3 gap-4">
                  <p className="text-sm text-slate-700 truncate flex-1">{post.content}</p>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${sc}`}>{post.status}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {post.createdAt?.toDate?.()?.toLocaleDateString() || "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="grid grid-cols-3 gap-4">
        {[
          { label: "Social Poster", href: "/social-poster", icon: <BarChart2 className="w-5 h-5" />,   bgIcon: "bg-purple-50 text-purple-600", border: "border-purple-100" },
          { label: "Team",          href: "/team",          icon: <Users className="w-5 h-5" />,        bgIcon: "bg-blue-50 text-blue-600",     border: "border-blue-100"   },
          { label: "Compose",       href: "/compose",       icon: <TrendingUp className="w-5 h-5" />,  bgIcon: "bg-emerald-50 text-emerald-600",border: "border-emerald-100"},
        ].map(item => (
          <Link key={item.href} href={item.href}
            className={`bg-white rounded-xl p-5 border ${item.border} shadow-sm hover:shadow-md transition-shadow flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.bgIcon}`}>{item.icon}</div>
            <span className="font-semibold text-slate-700 text-sm">{item.label}</span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
