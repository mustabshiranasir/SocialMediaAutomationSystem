"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, List, Search, Plus, Loader2, Image as ImageIcon, Trash2, Download } from "lucide-react";
import Link from "next/link";

export default function MediaLibrary() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-slate-400 text-sm mt-1">All your uploaded images and files</p>
        </div>
        <Link href="/media/add"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Add Media File
        </Link>
      </motion.div>

      {/* Controls */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-4 mb-6">
        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
          <button onClick={() => setView("grid")}
            className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")}
            className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search media..."
            className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary w-56" />
        </div>
      </motion.div>

      {/* Empty State */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-panel rounded-2xl">
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <ImageIcon className="w-10 h-10 opacity-30" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-slate-300">No media files yet</p>
            <p className="text-sm mt-1">Upload images and files to use in your posts</p>
          </div>
          <Link href="/media/add"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Upload Your First File
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
