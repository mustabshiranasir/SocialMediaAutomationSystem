"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Filter, Search, CheckCircle2, Clock, XCircle, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Post = {
  id: string;
  content: string;
  networks: string[];
  status: string;
  authorEmail: string;
  createdAt: any;
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  published: { label: "Published", icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: "bg-emerald-500/10 text-emerald-400" },
  pending: { label: "Pending", icon: <Clock className="w-3.5 h-3.5" />, className: "bg-amber-500/10 text-amber-400" },
  rejected: { label: "Rejected", icon: <XCircle className="w-3.5 h-3.5" />, className: "bg-red-500/10 text-red-400" },
};

export default function AllPosts() {
  const { user, role } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchPosts();
  }, [user, role]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const postsRef = collection(db, "posts");
      // Admins see all posts, regular users see only their own
      const q = role === "admin"
        ? query(postsRef, orderBy("createdAt", "desc"))
        : query(postsRef, where("authorId", "==", user!.uid), orderBy("createdAt", "desc"));

      const snap = await getDocs(q);
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = posts.filter(p => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch = p.content.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: posts.length,
    pending: posts.filter(p => p.status === "pending").length,
    published: posts.filter(p => p.status === "published").length,
    rejected: posts.filter(p => p.status === "rejected").length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-slate-400 text-sm mt-1">Manage all your social media posts</p>
        </div>
        <Link href="/compose"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Add Post
        </Link>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-1 mb-6 border-b border-white/10 pb-0">
        {(["all", "published", "pending", "rejected"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${filter === s ? "text-white" : "text-slate-400 hover:text-white"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs opacity-60">({counts[s]})</span>
            {filter === s && (
              <motion.span layoutId="postFilterTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
        {/* Search */}
        <div className="ml-auto flex items-center gap-2 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary w-48" />
        </div>
      </motion.div>

      {/* Posts Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-panel rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <p className="text-lg">No posts found.</p>
            <Link href="/compose" className="text-sm text-primary hover:underline">Create your first post →</Link>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Content</th>
                <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Author</th>
                <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Networks</th>
                <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(post => {
                const cfg = statusConfig[post.status] || statusConfig.pending;
                return (
                  <tr key={post.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 max-w-xs">
                      <p className="text-sm text-slate-200 truncate">{post.content}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-400">{post.authorEmail}</td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {post.networks?.map(n => (
                          <span key={n} className="text-[10px] font-medium uppercase bg-primary/20 text-blue-300 px-1.5 py-0.5 rounded">
                            {n}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${cfg.className}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {post.createdAt?.toDate?.().toLocaleDateString() ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
