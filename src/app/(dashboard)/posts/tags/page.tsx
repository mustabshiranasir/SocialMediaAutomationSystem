"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Hash, Trash2, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";

type Tag = { id: string; name: string; slug: string; count: number };

export default function Tags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchTags(); }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "tags"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setTags(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tag)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const docRef = await addDoc(collection(db, "tags"), {
        name: name.trim(), slug, count: 0, createdAt: serverTimestamp()
      });
      setTags([{ id: docRef.id, name: name.trim(), slug, count: 0 }, ...tags]);
      setName("");
    } catch (e) { console.error(e); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "tags", id));
    setTags(tags.filter(t => t.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
        <p className="text-slate-400 text-sm mt-1">Manage tags to label your posts</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Tag Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-5">Add Tag</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tag Name *</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Marketing"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
            </div>
            <button type="submit" disabled={adding}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Tag
            </button>
          </form>

          {/* Tags Cloud */}
          <div className="mt-6">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">All Tags</h3>
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag.id}
                    className="group flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-full hover:border-primary/40 transition-colors">
                    <Hash className="w-3 h-3" />{tag.name}
                    <button onClick={() => handleDelete(tag.id)} className="opacity-0 group-hover:opacity-100 text-red-400 transition-opacity ml-0.5">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Tags Table */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <span className="text-sm font-medium text-slate-300">{tags.length} Tags</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Hash className="w-10 h-10 mb-3 opacity-30" />
              <p>No tags yet. Add one!</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead><tr className="bg-white/5">
                <th className="p-4 text-xs font-medium text-slate-400 uppercase">Name</th>
                <th className="p-4 text-xs font-medium text-slate-400 uppercase">Slug</th>
                <th className="p-4 text-xs font-medium text-slate-400 uppercase">Count</th>
                <th className="p-4 text-xs font-medium text-slate-400 uppercase text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {tags.map(tag => (
                  <tr key={tag.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm font-medium text-blue-400 cursor-pointer hover:underline flex items-center gap-1.5"><Hash className="w-3 h-3" />{tag.name}</td>
                    <td className="p-4 text-sm text-slate-400">{tag.slug}</td>
                    <td className="p-4 text-sm text-slate-400">{tag.count}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(tag.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>
    </div>
  );
}
