"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
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

const statusBadge = (status: string) => {
  const cfg: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    pending:  "bg-amber-50  text-amber-700  border border-amber-100",
    spam:     "bg-red-50    text-red-700    border border-red-100",
    trash:    "bg-slate-100 text-slate-500  border border-slate-200",
  };
  return cfg[status] || cfg.pending;
};

export default function Comments() {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof TABS[number]>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => { fetchComments(); }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = comments.filter(c => {
    const matchTab =
      tab === "all"  ? c.status !== "trash" :
      tab === "mine" ? c.authorEmail === user?.email && c.status !== "trash" :
      c.status === tab;
    const matchSearch = !search ||
      c.author.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    all:      comments.filter(c => c.status !== "trash").length,
    mine:     comments.filter(c => c.authorEmail === user?.email && c.status !== "trash").length,
    pending:  comments.filter(c => c.status === "pending").length,
    approved: comments.filter(c => c.status === "approved").length,
    spam:     comments.filter(c => c.status === "spam").length,
    trash:    comments.filter(c => c.status === "trash").length,
  };

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map(c => c.id));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Comments</h1>
          <p className="text-slate-500 text-sm mt-1">Manage feedback and interactions on your posts</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search comments..."
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 shadow-sm" />
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="flex items-center gap-0.5 border-b border-slate-200 text-sm flex-wrap mb-0">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 font-medium transition-colors relative capitalize ${
              tab === t ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
            }`}>
            {t}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              tab === t ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
            }`}>{counts[t]}</span>
            {tab === t && <motion.span layoutId="commentTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
          </button>
        ))}
      </motion.div>

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-3 py-3 border-b border-slate-100 mb-0">
        <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
          <option>Bulk actions</option>
          <option>Approve</option>
          <option>Mark as Spam</option>
          <option>Move to Trash</option>
        </select>
        <button className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-sm rounded-lg transition-colors border border-slate-200 shadow-sm font-medium">
          Apply
        </button>
        <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
          <option>All comment types</option>
          <option>Comments</option>
          <option>Replies</option>
        </select>
        <button className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-sm rounded-lg transition-colors border border-slate-200 shadow-sm flex items-center gap-1.5 font-medium">
          <Filter className="w-3.5 h-3.5" /> Filter
        </button>
        <span className="ml-auto text-xs text-slate-400 font-medium">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p className="text-slate-500 font-medium">No comments found.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-4 w-8">
                  <input type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="accent-blue-500 w-4 h-4 rounded border-slate-300 cursor-pointer" />
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Author</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Comment</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">In response to</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted on</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)}
                        className="accent-blue-500 w-4 h-4 rounded border-slate-300 cursor-pointer" />
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-3 min-w-[160px]">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                          {c.author[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-600">{c.author}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{c.authorEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-sm text-slate-700 line-clamp-2">{c.content}</p>
                      <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-xs text-emerald-600 hover:underline font-medium">Approve</button>
                        <span className="text-slate-300">|</span>
                        <button className="text-xs text-slate-500 hover:underline font-medium">Reply</button>
                        <span className="text-slate-300">|</span>
                        <button className="text-xs text-red-500 hover:underline font-medium">Spam</button>
                        <span className="text-slate-300">|</span>
                        <button className="text-xs text-red-500 hover:underline font-medium flex items-center gap-1">
                          <Trash2 className="w-3 h-3" />Trash
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-blue-500 hover:underline cursor-pointer font-medium">{c.postTitle || "—"}</p>
                      <p className="text-xs text-slate-400 mt-0.5">View Post</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(c.status)}`}>
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
