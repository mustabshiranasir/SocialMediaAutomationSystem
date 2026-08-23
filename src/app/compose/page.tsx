"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, CheckCircle2, Loader2, Image as ImageIcon, Link as LinkIcon, Hash } from "lucide-react";

export default function Compose() {
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setSuccess(true);
        setContent("");
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight">Compose Post</h1>
          <p className="text-slate-400 text-sm mt-1">
            Create and publish content across networks
          </p>
        </motion.div>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-8 shadow-2xl shadow-black/50"
      >
        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: "auto", mb: 24 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" /> Successfully published to selected networks!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handlePublish} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Select Networks
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-3 p-4 border border-blue-500/50 bg-blue-500/10 rounded-xl cursor-pointer hover:bg-blue-500/20 transition-all flex-1">
                <input type="checkbox" className="w-5 h-5 accent-blue-500 rounded" defaultChecked />
                <span className="font-medium text-white flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-[#1877F2]/30">f</div>
                  Facebook
                </span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-white/20 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all flex-1">
                <input type="checkbox" className="w-5 h-5 accent-slate-400 rounded" defaultChecked />
                <span className="font-medium text-white flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-black border border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-white/10">𝕏</div>
                  Twitter (X)
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Post Content
            </label>
            <div className="relative group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="What do you want to share with your audience?"
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none shadow-inner"
                required
              ></textarea>
              
              {/* Toolbar mock */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <button type="button" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button type="button" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button type="button" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <Hash className="w-4 h-4" />
                </button>
              </div>

              <div className={`absolute bottom-6 right-6 text-xs font-medium ${content.length > 250 ? "text-amber-400" : "text-slate-500"}`}>
                {content.length} characters
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <motion.button
              whileHover={!isPublishing && content.trim() !== "" ? { scale: 1.02 } : {}}
              whileTap={!isPublishing && content.trim() !== "" ? { scale: 0.98 } : {}}
              type="submit"
              disabled={isPublishing || content.trim() === ""}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium shadow-lg transition-all ${
                isPublishing || content.trim() === ""
                  ? "bg-primary/30 text-white/50 cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-blue-600 hover:shadow-blue-500/25 shadow-blue-500/20"
              }`}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Publish Now
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
