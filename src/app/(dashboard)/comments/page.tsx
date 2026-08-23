"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Loader2, MessageSquare, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

type Comment = {
  id: string;
  author: string;
  authorEmail: string;
  content: string;
  postTitle: string;
  status: "pending" | "approved" | "spam" | "trash";
  createdAt: any;
};

const TABS = ["all", "mine", "pending", "approved", "spam", "trash"] as const;

export default function Comments() {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof TABS[number]>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  // Seed some demo comments if none exist
  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
      setComments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = comments.filter(c => {
    const matchTab =
      tab === "all" ? c.status !== "trash" :
      tab === "mine" ? c.authorEmail === user?.email && c.status !== "trash" :
      c.status === tab;
    const matchSearch = !search ||
      c.author.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    all: comments.filter(c => c.status !== "trash").length,
    mine: comments.filter(c => c.authorEmail === user?.email && c.status !== "trash").length,
    pending: comments.filter(c => c.status === "pending").length,
    approved: comments.filter(c => c.status === "approved").length,
    spam: comments.filter(c => c.status === "spam").length,
    trash: comments.filter(c => c.status === "trash").length,
  };

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map(c => c.id));

  const statusBadge = (status: string) => {
    const cfg: Record<string, string> = {
      approved: "bg-emerald-500/10 text-emerald-400",
      pending: "bg-amber-500/10 text-amber-400",
      spam: "bg-red-500/10 text-red-400",
      trash: "bg-slate-500/10 text-slate-400",
    };
    return cfg[status] || cfg.pending;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comments</h1>
          <p className="text-slate-400 text-sm mt-1">Manage feedback and interactions on your posts</p>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search comments..."
            className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary w-52" />
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="flex items-center gap-0.5 mb-0 border-b border-white/10 pb-0 text-sm flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium transition-colors relative capitalize ${tab === t ? "text-white" : "text-slate-400 hover:text-white"}`}>
            {t} <span className="text-xs opacity-60">({counts[t]})</span>
            {tab === t && <motion.span layoutId="commentTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </motion.div>

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-3 py-3 border-b border-white/5 mb-0">
        <select className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary">
          <option>Bulk actions</option>
          <option>Approve</option>
          <option>Mark as Spam</option>
          <option>Move to Trash</option>
        </select>
        <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-lg transition-colors border border-white/10">
          Apply
        </button>
        <select className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary">
          <option>All comment types</option>
          <option>Comments</option>
          <option>Replies</option>
        </select>
        <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-lg transition-colors border border-white/10 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Filter
        </button>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-panel rounded-2xl overflow-hidden mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p>No comments found.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 w-8">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll} className="accent-primary w-4 h-4 rounded" />
                </th>
                <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Author</th>
                <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Comment</th>
                <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">In response to</th>
                <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Submitted on</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)}
                        className="accent-primary w-4 h-4 rounded" />
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-3 min-w-[160px]">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                          {c.author[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-400">{c.author}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{c.authorEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-sm text-slate-200 line-clamp-2">{c.content}</p>
                      {/* Row actions */}
                      <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-xs text-emerald-400 hover:underline">Approve</button>
                        <span className="text-slate-600">|</span>
                        <button className="text-xs text-slate-400 hover:underline">Reply</button>
                        <span className="text-slate-600">|</span>
                        <button className="text-xs text-red-400 hover:underline">Spam</button>
                        <span className="text-slate-600">|</span>
                        <button className="text-xs text-red-400 hover:underline flex items-center gap-1"><Trash2 className="w-3 h-3" />Trash</button>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-blue-400 hover:underline cursor-pointer">{c.postTitle || "—"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">View Post</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize ${statusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400 whitespace-nowrap">
                      {c.createdAt?.toDate?.().toLocaleString() ?? "—"}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
