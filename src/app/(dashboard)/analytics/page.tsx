"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Users, ThumbsUp, MessageSquare,
  Share2, Eye, BarChart2, Calendar, ChevronLeft, ChevronRight, PlusCircle
} from "lucide-react";
import Link from "next/link";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Analytics() {
  const today = new Date();
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [calDate, setCalDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [activeMetric, setActiveMetric] = useState(0);

  const prevMonth = () => setCalDate(d => d.month === 0 ? { year: d.year - 1, month: 11 } : { ...d, month: d.month - 1 });
  const nextMonth = () => setCalDate(d => d.month === 11 ? { year: d.year + 1, month: 0 } : { ...d, month: d.month + 1 });

  const daysInMonth = getDaysInMonth(calDate.year, calDate.month);
  const firstDay = getFirstDayOfMonth(calDate.year, calDate.month);

  const metrics = [
    { label: "Total Reach", value: "0", change: "+0%", up: true, icon: <Eye className="w-5 h-5" />, color: "blue" },
    { label: "Engagements", value: "0", change: "+0%", up: true, icon: <ThumbsUp className="w-5 h-5" />, color: "emerald" },
    { label: "Comments", value: "0", change: "0%", up: true, icon: <MessageSquare className="w-5 h-5" />, color: "purple" },
    { label: "Shares", value: "0", change: "+0%", up: true, icon: <Share2 className="w-5 h-5" />, color: "amber" },
    { label: "Followers", value: "0", change: "+0", up: true, icon: <Users className="w-5 h-5" />, color: "pink" },
  ];

  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    blue:    { bg: "bg-blue-500/10",    text: "text-blue-400",    ring: "ring-blue-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", ring: "ring-emerald-500/20" },
    purple:  { bg: "bg-purple-500/10",  text: "text-purple-400",  ring: "ring-purple-500/20" },
    amber:   { bg: "bg-amber-500/10",   text: "text-amber-400",   ring: "ring-amber-500/20" },
    pink:    { bg: "bg-pink-500/10",    text: "text-pink-400",    ring: "ring-pink-500/20" },
  };

  const platforms = [
    { name: "Facebook", letter: "f", bg: "#1877F2", reach: 0, engagement: 0, posts: 0 },
    { name: "Twitter (X)", letter: "𝕏", bg: "#000", reach: 0, engagement: 0, posts: 0 },
  ];

  const calendarCells = Array.from({ length: firstDay + daysInMonth }, (_, i) => {
    if (i < firstDay) return null;
    return i - firstDay + 1;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Track performance across all your social channels</p>
        </div>
        <Link href="/compose"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
          <PlusCircle className="w-4 h-4" /> Schedule New Post
        </Link>
      </motion.div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((m, i) => {
          const c = colorMap[m.color];
          const active = activeMetric === i;
          return (
            <motion.button key={m.label} onClick={() => setActiveMetric(i)}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`glass-panel rounded-xl p-4 text-left transition-all ring-1 ${active ? `ring-2 ${c.ring}` : "ring-transparent hover:ring-white/10"}`}>
              <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.text} flex items-center justify-center mb-3`}>
                {m.icon}
              </div>
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-slate-400 mt-1">{m.label}</p>
              <p className={`text-xs font-medium mt-1 flex items-center gap-0.5 ${m.up ? "text-emerald-400" : "text-red-400"}`}>
                {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.change}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Chart + Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg">Performance Overview</h2>
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              {["7D", "30D", "90D"].map(r => (
                <button key={r} className="px-3 py-1 text-xs rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors first:bg-primary first:text-white">{r}</button>
              ))}
            </div>
          </div>
          {/* Empty chart state */}
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 space-y-3">
            <BarChart2 className="w-12 h-12 opacity-20" />
            <p className="text-sm">No data yet. Publish your first post to see analytics.</p>
            <Link href="/compose" className="text-xs text-primary hover:underline">Create a post →</Link>
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between mt-2 px-1">
            {["Aug 17", "Aug 18", "Aug 19", "Aug 20", "Aug 21", "Aug 22", "Aug 23"].map(d => (
              <span key={d} className="text-[10px] text-slate-600">{d}</span>
            ))}
          </div>
        </motion.div>

        {/* Platform Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-panel rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-5">By Platform</h2>
          <div className="space-y-4">
            {platforms.map(p => (
              <div key={p.name} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: p.bg }}>
                    {p.letter}
                  </div>
                  <span className="font-medium text-sm">{p.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[["Reach", p.reach], ["Engage.", p.engagement], ["Posts", p.posts]].map(([label, val]) => (
                    <div key={label as string}>
                      <p className="text-lg font-bold">{val}</p>
                      <p className="text-[10px] text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Calendar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-panel rounded-2xl p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Content Calendar
          </h2>
          <div className="flex items-center gap-3">
            {/* Week/Month toggle */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              {(["week", "month"] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${viewMode === v ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}>
                  {v}
                </button>
              ))}
            </div>
            {/* Month nav */}
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium w-36 text-center">
                {MONTHS[calDate.month]} {calDate.year}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className={`text-center text-xs font-medium py-2 ${d === "Sun" || d === "Sat" ? "text-slate-500" : "text-slate-400"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
            const isToday = day === today.getDate() && calDate.month === today.getMonth() && calDate.year === today.getFullYear();
            return (
              <motion.div key={day} whileHover={{ scale: 1.03 }}
                className={`aspect-square rounded-xl border flex flex-col items-start p-1.5 cursor-pointer transition-colors
                  ${isToday ? "border-primary bg-primary/10" : "border-white/5 hover:border-white/20 hover:bg-white/5"}`}>
                <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-slate-400"}`}>{day}</span>
                {/* Placeholder for scheduled posts */}
                <div className="flex-1 w-full" />
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Schedule posts to see them appear on the calendar.{" "}
          <Link href="/compose" className="text-primary hover:underline">Add a post →</Link>
        </p>
      </motion.div>
    </div>
  );
}
