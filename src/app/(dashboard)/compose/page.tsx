"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Loader2, Image as ImageIcon, Link as LinkIcon, Hash } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createPendingPost } from "@/lib/firestore";

export default function Compose() {
  const { user, role } = useAuth();
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [networks, setNetworks] = useState(["facebook", "twitter"]);

  const toggleNetwork = (network: string) => {
    setNetworks(prev =>
      prev.includes(network) ? prev.filter(n => n !== network) : [...prev, network]
    );
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (networks.length === 0 || !content.trim() || !user) return;

    setIsPublishing(true);
    setSuccess(false);

    try {
      if (role === "admin") {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
          body: JSON.stringify({ content, networks }),
        });
        if (res.ok) { setSuccess(true); setContent(""); }
      } else {
        await createPendingPost({ content, networks, authorId: user.uid, authorEmail: user.email || "Unknown" });
        setSuccess(true);
        setContent("");
      }
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add Post</h1>
        <p className="text-slate-400 text-sm mt-1">Create and publish content across your networks</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-panel rounded-2xl p-8 shadow-2xl shadow-black/50">

        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-xl mb-8">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">
                {role === "admin" ? "Published successfully!" : "Submitted for admin approval!"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handlePublish} className="space-y-8">
          {/* Networks */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Select Networks</label>
            <div className="flex gap-4">
              {[
                { id: "facebook", label: "Facebook", letter: "f", color: "#1877F2", shadow: "#1877F2" },
                { id: "twitter", label: "Twitter (X)", letter: "𝕏", color: "#000", shadow: "#fff" },
              ].map(net => {
                const active = networks.includes(net.id);
                return (
                  <label key={net.id}
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 ${active ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                    <input type="checkbox" checked={active} onChange={() => toggleNetwork(net.id)} className="w-5 h-5 accent-blue-500 rounded" />
                    <span className="font-medium text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: net.color, boxShadow: `0 2px 8px ${net.shadow}40` }}>{net.letter}</div>
                      {net.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Post Content</label>
            <div className="relative group">
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} required
                placeholder="What do you want to share with your audience?"
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none shadow-inner" />
              <div className="absolute bottom-4 left-4 flex gap-2">
                <button type="button" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><ImageIcon className="w-4 h-4" /></button>
                <button type="button" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><LinkIcon className="w-4 h-4" /></button>
                <button type="button" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><Hash className="w-4 h-4" /></button>
              </div>
              <div className={`absolute bottom-6 right-6 text-xs font-medium ${content.length > 250 ? "text-amber-400" : "text-slate-500"}`}>
                {content.length} characters
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
              disabled={isPublishing || !content.trim() || networks.length === 0}
              className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
              {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isPublishing ? (role === "admin" ? "Publishing..." : "Submitting...") : (role === "admin" ? "Publish Now" : "Submit for Approval")}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
