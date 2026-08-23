"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Bell, TrendingUp, Users2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { getPendingPosts } from "@/lib/firestore";
import Link from "next/link";

export default function Dashboard() {
  const { user, role } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (role !== "admin") return;
    getPendingPosts().then(posts => setPendingCount(posts.length)).catch(console.error);
  }, [role]);

  const stats = [
    { label: "Total Posts", value: "0", icon: <TrendingUp className="w-5 h-5" />, color: "blue" },
    { label: "Published", value: "0", icon: <CheckCircle2 className="w-5 h-5" />, color: "emerald" },
    { label: "Scheduled", value: "0", icon: <Clock className="w-5 h-5" />, color: "amber" },
    ...(role === "admin" ? [{ label: "Pending Review", value: String(pendingCount), icon: <Bell className="w-5 h-5" />, color: "red" }] : []),
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Welcome back, {user?.email}</p>
      </motion.div>

      {/* Pending Approval Banner (admin only) */}
      {role === "admin" && pendingCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link href="/approvals">
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-300">
                    {pendingCount} post{pendingCount > 1 ? "s" : ""} waiting for your approval
                  </p>
                  <p className="text-xs text-amber-400/70 mt-0.5">Click to review and publish</p>
                </div>
              </div>
              <span className="text-xs font-medium text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full">Review Now →</span>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`glass-panel rounded-xl p-5 border ${colorMap[stat.color]}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider opacity-70">{stat.label}</span>
              {stat.icon}
            </div>
            <p className="text-4xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Connected Accounts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-panel rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg">Connected Accounts</h2>
          <Link href="/accounts" className="text-xs text-primary hover:underline">Manage →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { name: "Facebook", letter: "f", color: "#1877F2", shadow: "#1877F2" },
            { name: "Twitter (X)", letter: "𝕏", color: "#000", shadow: "#000" },
          ].map(acc => (
            <div key={acc.name} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: acc.color, boxShadow: `0 4px 14px ${acc.shadow}40` }}>
                {acc.letter}
              </div>
              <div>
                <p className="font-medium text-sm">{acc.name}</p>
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> Pending Setup
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-panel rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-5">Recent Activity</h2>
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="text-5xl opacity-40">📭</motion.div>
          <p className="text-sm">No recent posts. Head over to compose to create one!</p>
          <Link href="/compose"
            className="mt-2 px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors">
            Create your first post →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
