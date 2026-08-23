"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Tag as TagIcon, Trash2, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";

type Category = { id: string; name: string; slug: string; count: number; createdAt: any };

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const autoSlug = slug || name.toLowerCase().replace(/\s+/g, "-");
      const docRef = await addDoc(collection(db, "categories"), {
        name: name.trim(), slug: autoSlug, count: 0, createdAt: serverTimestamp()
      });
      setCategories([{ id: docRef.id, name: name.trim(), slug: autoSlug, count: 0, createdAt: null }, ...categories]);
      setName(""); setSlug("");
    } catch (e) { console.error(e); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await deleteDoc(doc(db, "categories", id));
    setCategories(categories.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-slate-400 text-sm mt-1">Organize your posts with categories</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-5">Add Category</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
              <input required value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
                placeholder="e.g. Social Media"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Slug</label>
              <input value={slug} onChange={e => setSlug(e.target.value)}
                placeholder="e.g. social-media"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
              <p className="text-xs text-slate-500 mt-1">Auto-generated from name if left empty.</p>
            </div>
            <button type="submit" disabled={adding}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Category
            </button>
          </form>
        </motion.div>

        {/* Categories Table */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">{categories.length} Categories</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <TagIcon className="w-10 h-10 mb-3 opacity-30" />
              <p>No categories yet. Add one!</p>
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
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm font-medium text-blue-400 hover:underline cursor-pointer">{cat.name}</td>
                    <td className="p-4 text-sm text-slate-400">{cat.slug}</td>
                    <td className="p-4 text-sm text-slate-400">{cat.count}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(cat.id)} className="text-slate-500 hover:text-red-400 transition-colors">
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
