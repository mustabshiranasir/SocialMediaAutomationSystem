"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isEditorOrAbove } from "@/lib/permissions";

type Post = {
  id: string;
  content: string;
  networks: string[];
  status: string;
  authorEmail: string;
  createdAt: any;
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  published: {
    label: "Published",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  },
  pending: {
    label: "Pending",
    icon: <Clock className="w-3.5 h-3.5" />,
    className: "bg-amber-50 text-amber-700 border border-amber-100",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: "bg-red-50 text-red-700 border border-red-100",
  },
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
      let snap;
      try {
        const q = isEditorOrAbove(role || "")
          ? query(postsRef, orderBy("createdAt", "desc"))
          : query(postsRef, where("authorId", "==", user!.uid), orderBy("createdAt", "desc"));
        snap = await getDocs(q);
      } catch (e) {
        // Fallback for missing composite index: query without orderBy and sort in JS
        const fallbackQ = isEditorOrAbove(role || "")
          ? query(postsRef)
          : query(postsRef, where("authorId", "==", user!.uid));
        snap = await getDocs(fallbackQ);
      }

      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      list.sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });
      setPosts(list);
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

  const tabs: { key: string; label: string; dot?: string }[] = [
    { key: "all",       label: "All" },
    { key: "published", label: "Published", dot: "bg-emerald-500" },
    { key: "pending",   label: "Pending",   dot: "bg-amber-400"  },
    { key: "rejected",  label: "Rejected",  dot: "bg-red-500"    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Posts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all your social media posts</p>
        </div>
        <Link href="/compose"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-md shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Add Post
        </Link>
      </motion.div>

      {/* Filter Tabs + Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-1 mb-6 border-b border-slate-200">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative ${
              filter === tab.key ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
            }`}>
            {tab.dot && <span className={`w-2 h-2 rounded-full ${tab.dot}`} />}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              filter === tab.key ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
            }`}>{counts[tab.key as keyof typeof counts]}</span>
            {filter === tab.key && (
              <motion.span layoutId="postFilterTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
        {/* Search */}
        <div className="ml-auto flex items-center gap-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 shadow-sm"
          />
        </div>
      </motion.div>

      {/* Posts Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <span className="text-5xl opacity-30">📭</span>
            <p className="text-base font-medium text-slate-500">No posts found.</p>
            <Link href="/compose" className="text-sm text-blue-500 hover:underline font-medium">Create your first post →</Link>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Content</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Author</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Networks</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(post => {
                const cfg = statusConfig[post.status] || statusConfig.pending;
                return (
                  <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 max-w-xs">
                      <p className="text-sm text-slate-800 font-medium truncate">{post.content}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                          {post.authorEmail?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-600 truncate max-w-[140px]">{post.authorEmail}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {post.networks?.map(n => (
                          <span key={n} className="text-[10px] font-semibold uppercase bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                            {n}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
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
