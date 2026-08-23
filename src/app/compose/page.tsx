"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, CheckCircle2, Loader2, Image as ImageIcon, Link as LinkIcon, Hash } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { createPendingPost } from "@/lib/firestore";

export default function Compose() {
  const { user, role } = useAuth();
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [networks, setNetworks] = useState(["facebook", "twitter"]);

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
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({ content, networks }),
        });

        if (res.ok) {
          setSuccess(true);
          setContent("");
        }
      } else {
        // Standard user: submit for approval
        await createPendingPost({
          content,
          networks,
          authorId: user.uid,
          authorEmail: user.email || "Unknown"
        });
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
    <ProtectedRoute>
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-xl mb-8"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">
                {role === "admin" ? "Published successfully!" : "Submitted for admin approval!"}
              </span>
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isPublishing || !content.trim()}
              className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPublishing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {isPublishing 
                ? (role === "admin" ? "Publishing..." : "Submitting...") 
                : (role === "admin" ? "Publish Now" : "Submit for Approval")}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </main>
    </ProtectedRoute>
  );
}
