"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Loader2, Image as ImageIcon, Link as LinkIcon, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createPendingPost, createPublishedPost } from "@/lib/firestore";

type AiResult = {
  facebook?: { content: string; cta: string; hashtags: string[] };
  twitter?: { content: string; cta: string; hashtags: string[] };
  seo?: { talkingPoints: string[]; targetAudience: string };
};

export default function Compose() {
  const { user, role } = useAuth();

  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [networks, setNetworks] = useState(["facebook", "twitter"]);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("Professional / Corporate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [aiError, setAiError] = useState("");

  const toggleNetwork = (network: string) => {
    setNetworks(prev => prev.includes(network) ? prev.filter(n => n !== network) : [...prev, network]);
  };

  const buildContentForPlatforms = (generated: AiResult, selectedNetworks: string[]): string => {
    const parts: string[] = [];
    if (selectedNetworks.length === 1) {
      const platform = selectedNetworks[0] as "facebook" | "twitter";
      const data = generated[platform];
      if (data) {
        parts.push(data.content);
        if (data.cta) parts.push(data.cta);
        if (data.hashtags?.length) parts.push(data.hashtags.join(" "));
      }
      return parts.filter(Boolean).join("\n\n");
    }
    if (selectedNetworks.includes("facebook") && generated.facebook) {
      const fb = generated.facebook;
      parts.push(`📘 Facebook:\n${fb.content}`);
      if (fb.cta) parts.push(fb.cta);
      if (fb.hashtags?.length) parts.push(fb.hashtags.join(" "));
    }
    if (selectedNetworks.includes("twitter") && generated.twitter) {
      if (parts.length > 0) parts.push("---");
      const tw = generated.twitter;
      parts.push(`𝕏 Twitter:\n${tw.content}`);
      if (tw.cta) parts.push(tw.cta);
      if (tw.hashtags?.length) parts.push(tw.hashtags.join(" "));
    }
    return parts.filter(Boolean).join("\n\n");
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim() || !user) return;
    setIsGenerating(true);
    setAiError("");
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ prompt: aiPrompt, tone: aiTone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate AI content");
      const finalContent = buildContentForPlatforms(data.data as AiResult, networks);
      setContent(finalContent);
      setHasGenerated(true);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (networks.length === 0 || !content.trim() || !user) return;
    setIsPublishing(true);
    setSuccess(false);
    try {
      if (role === "admin") {
        await createPublishedPost({ content, networks, authorId: user.uid, authorEmail: user.email || "Unknown" });
        try {
          const idToken = await user.getIdToken();
          await fetch("/api/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
            body: JSON.stringify({ content, networks }),
          });
        } catch (pubErr) {
          console.warn("Social publish failed, but post was saved:", pubErr);
        }
      } else {
        await createPendingPost({ content, networks, authorId: user.uid, authorEmail: user.email || "Unknown" });
      }
      setSuccess(true);
      setContent("");
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Compose Post</h1>
        <p className="text-slate-500 text-sm mt-1">Create and publish content across your networks</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">

        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl mb-6">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="font-medium text-sm">
                {role === "admin" ? "Published successfully!" : "Submitted for admin approval!"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handlePublish} className="space-y-6">
          {/* Networks */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Publish To</label>
            <div className="flex gap-3">
              {[
                { id: "facebook", label: "Facebook",    letter: "f",  color: "#1877F2" },
                { id: "twitter",  label: "Twitter (X)", letter: "𝕏", color: "#000000" },
              ].map(net => {
                const active = networks.includes(net.id);
                return (
                  <label key={net.id}
                    className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all flex-1 ${
                      active ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}>
                    <input type="checkbox" checked={active} onChange={() => toggleNetwork(net.id)} className="hidden" />
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: net.color }}>
                      {net.letter}
                    </div>
                    <span className={`text-sm font-medium ${active ? "text-blue-700" : "text-slate-600"}`}>{net.label}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-blue-500 ml-auto" />}
                  </label>
                );
              })}
            </div>
          </div>

          {/* AI Generator */}
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">AI Campaign Generator</h3>
                <p className="text-[10px] text-slate-500">Powered by Groq & Gemini — writes directly to your post</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={2}
                  placeholder="e.g. Announce our 50% off Summer Sale this weekend..."
                  className="w-full bg-white border border-purple-200 rounded-xl p-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm resize-none" />
              </div>
              <div className="space-y-2">
                <select value={aiTone} onChange={e => setAiTone(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400">
                  <option>Professional / Corporate</option>
                  <option>Bold / Energetic</option>
                  <option>Friendly / Social</option>
                  <option>Witty / Playful</option>
                </select>
                <button type="button" onClick={handleGenerate} disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-medium transition-all shadow-md disabled:opacity-50">
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {isGenerating ? "Generating..." : hasGenerated ? "Rewrite / Regenerate ✨" : "Generate ✨"}
                </button>
              </div>
            </div>
            {aiError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{aiError}</p>}
          </div>

          {/* Content Box */}
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">Final Post Content</label>
              {content && <button type="button" onClick={() => setContent("")} className="text-xs text-blue-500 hover:underline">Clear</button>}
            </div>
            <div className="relative">
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} required
                placeholder="Write your post or use AI to generate it above..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 pb-14 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm leading-relaxed" />
              <div className="absolute bottom-4 left-4 flex gap-2">
                <button type="button" className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors shadow-sm">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button type="button" className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors shadow-sm">
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>
              <div className={`absolute bottom-6 right-5 text-xs font-medium ${content.length > 250 ? "text-amber-500" : "text-slate-400"}`}>
                {content.length} chars
              </div>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
            disabled={isPublishing || !content.trim() || networks.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isPublishing
              ? (role === "admin" ? "Publishing..." : "Submitting...")
              : (role === "admin" ? "Publish Now" : "Submit for Approval")}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
