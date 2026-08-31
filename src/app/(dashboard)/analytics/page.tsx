"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, BarChart2, PieChart as PieIcon, Calendar,
  FileText, CheckCircle2, Clock, XCircle, RefreshCw,
} from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post } from "@/lib/firestore";
import { StatCard, Card, CardHeader } from "@/components/ui";

/* ─── Colour palette for charts ─── */
const COLORS = {
  published: "#10b981",
  pending:   "#f59e0b",
  scheduled: "#6366f1",
  rejected:  "#ef4444",
};
const PIE_COLORS = [COLORS.published, COLORS.pending, COLORS.scheduled, COLORS.rejected];

/* ─── Date range helpers ─── */
type Range = "7d" | "30d" | "90d" | "all";

function subtractDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function rangeStart(range: Range): Date | null {
  if (range === "7d")  return subtractDays(7);
  if (range === "30d") return subtractDays(30);
  if (range === "90d") return subtractDays(90);
  return null;
}

function groupByDay(posts: Post[], start: Date | null): { date: string; published: number; pending: number; scheduled: number; rejected: number }[] {
  const filtered = start
    ? posts.filter(p => (p.createdAt?.toDate?.() ?? new Date(0)) >= start)
    : posts;

  const map: Record<string, { published: number; pending: number; scheduled: number; rejected: number }> = {};

  for (const post of filtered) {
    const d: Date = post.createdAt?.toDate?.() ?? new Date();
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!map[key]) map[key] = { published: 0, pending: 0, scheduled: 0, rejected: 0 };
    const status = post.status as keyof typeof map[string];
    if (status in map[key]) map[key][status]++;
  }

  // Sort chronologically
  return Object.entries(map)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => new Date(a.date + " 2024").getTime() - new Date(b.date + " 2024").getTime());
}

function networkBreakdown(posts: Post[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  for (const post of posts) {
    for (const net of (post.networks ?? [])) {
      map[net] = (map[net] ?? 0) + 1;
    }
  }
  return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
}

function statusBreakdown(posts: Post[]): { name: string; value: number }[] {
  const map: Record<string, number> = { published: 0, pending: 0, scheduled: 0, rejected: 0 };
  for (const p of posts) map[p.status] = (map[p.status] ?? 0) + 1;
  return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
}

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="font-medium capitalize">{entry.dataKey}:</span>
          <span>{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ─── Main Component ─── */
export default function AnalyticsPage() {
  const [posts, setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange]   = useState<Range>("30d");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  /* Real-time Firestore listener */
  useEffect(() => {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        setPosts(fetched);
        setLastUpdated(new Date());
        setLoading(false);
      },
      (err) => {
        console.error("Firestore analytics listener error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  /* Derived data */
  const start          = rangeStart(range);
  const filteredPosts  = start ? posts.filter(p => (p.createdAt?.toDate?.() ?? new Date(0)) >= start) : posts;
  const timeSeriesData = groupByDay(posts, start);
  const statusData     = statusBreakdown(filteredPosts);
  const networkData    = networkBreakdown(filteredPosts);

  const published = filteredPosts.filter(p => p.status === "published").length;
  const pending   = filteredPosts.filter(p => p.status === "pending").length;
  const scheduled = filteredPosts.filter(p => p.status === "scheduled").length;
  const rejected  = filteredPosts.filter(p => p.status === "rejected").length;
  const publishRate = filteredPosts.length > 0 ? Math.round((published / filteredPosts.length) * 100) : 0;

  const RANGE_OPTIONS: { label: string; value: Range }[] = [
    { label: "7 Days",   value: "7d"  },
    { label: "30 Days",  value: "30d" },
    { label: "90 Days",  value: "90d" },
    { label: "All Time", value: "all" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-8 h-8 text-blue-500" />
            Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Live performance overview — updated{" "}
            <span className="font-medium text-slate-600">
              {lastUpdated.toLocaleTimeString()}
            </span>
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm" role="group" aria-label="Date range filter">
          <Calendar className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              id={`range-${opt.value}`}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                range === opt.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Posts"    value={filteredPosts.length} icon={<FileText className="w-5 h-5" />}     iconBg="bg-blue-50"    iconText="text-blue-600"    border="border-blue-100"    delay={0}    />
        <StatCard label="Published"      value={published}             icon={<CheckCircle2 className="w-5 h-5" />} iconBg="bg-emerald-50" iconText="text-emerald-600" border="border-emerald-100" delay={0.06} />
        <StatCard label="Pending"        value={pending}               icon={<Clock className="w-5 h-5" />}        iconBg="bg-amber-50"   iconText="text-amber-600"   border="border-amber-100"   delay={0.12} />
        <StatCard label="Scheduled"      value={scheduled}             icon={<Calendar className="w-5 h-5" />}     iconBg="bg-indigo-50"  iconText="text-indigo-600"  border="border-indigo-100"  delay={0.18} />
        <StatCard
          label="Publish Rate"
          value={`${publishRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-purple-50"
          iconText="text-purple-600"
          border="border-purple-100"
          delay={0.24}
          change={publishRate >= 70 ? "On track" : "Needs attention"}
          changePositive={publishRate >= 70}
        />
      </div>

      {/* Area Chart — Posts Over Time */}
      <Card className="p-6" delay={0.3}>
        <CardHeader
          title="Posts Over Time"
          subtitle={`Activity over the selected ${range === "all" ? "entire history" : range} period`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        {timeSeriesData.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400 gap-2">
            <span className="text-4xl">📊</span>
            <p className="text-sm">No post activity in this time range.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPublished" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS.published} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={COLORS.published} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS.pending} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={COLORS.pending} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradScheduled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS.scheduled} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={COLORS.scheduled} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="published" stroke={COLORS.published} fill="url(#gradPublished)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="pending"   stroke={COLORS.pending}   fill="url(#gradPending)"   strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="scheduled" stroke={COLORS.scheduled} fill="url(#gradScheduled)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Bottom Row: Bar Chart + Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Network Breakdown Bar Chart */}
        <Card className="p-6 lg:col-span-1" delay={0.4}>
          <CardHeader
            title="By Network"
            subtitle="Posts distributed across platforms"
            icon={<BarChart2 className="w-5 h-5" />}
            iconBg="bg-indigo-50 text-indigo-600"
          />
          {networkData.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-400 gap-2">
              <span className="text-3xl">🌐</span>
              <p className="text-xs">No network data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={networkData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Posts" radius={[0, 6, 6, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Status Pie Chart */}
        <Card className="p-6 lg:col-span-1" delay={0.5}>
          <CardHeader
            title="Status Breakdown"
            subtitle="Distribution of post statuses"
            icon={<PieIcon className="w-5 h-5" />}
            iconBg="bg-purple-50 text-purple-600"
          />
          {statusData.every(s => s.value === 0) ? (
            <div className="flex flex-col items-center py-10 text-slate-400 gap-2">
              <span className="text-3xl">🥧</span>
              <p className="text-xs">No posts in this range</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name || ""} ${Math.round((percent ?? 0) * 100)}%`}
                    labelLine={false}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${val} posts`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
                {statusData.map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {s.name}: <strong>{s.value}</strong>
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Quick Stats Summary */}
        <Card className="p-6 lg:col-span-1" delay={0.6}>
          <CardHeader
            title="Quick Summary"
            subtitle="At-a-glance metrics"
            icon={<RefreshCw className="w-5 h-5" />}
            iconBg="bg-slate-100 text-slate-600"
          />
          <div className="space-y-3 mt-2">
            {[
              { label: "Total Posts",     value: filteredPosts.length, color: "bg-blue-500"    },
              { label: "Published",       value: published,             color: "bg-emerald-500" },
              { label: "Pending Review",  value: pending,               color: "bg-amber-500"   },
              { label: "Scheduled",       value: scheduled,             color: "bg-indigo-500"  },
              { label: "Rejected",        value: rejected,              color: "bg-red-400"     },
              { label: "Publish Rate",    value: `${publishRate}%`,     color: "bg-purple-500"  },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`} />
                  <span className="text-sm text-slate-600">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-100">
              {/* Publish rate progress bar */}
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Publish Rate</span>
                <span className="font-semibold text-slate-700">{publishRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${publishRate}%` }}
                  transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                  className={`h-2 rounded-full ${publishRate >= 70 ? "bg-emerald-500" : publishRate >= 40 ? "bg-amber-500" : "bg-red-400"}`}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
