"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Loader2, Image as ImageIcon, Link as LinkIcon, Hash, Sparkles, ChevronRight, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createPendingPost } from "@/lib/firestore";

type AiResult = {
  facebook?: { content: string; cta: string; hashtags: string[] };
  twitter?: { content: string; cta: string; hashtags: string[] };
  seo?: { talkingPoints: string[]; targetAudience: string };
};

export default function Compose() {
  const { user, role } = useAuth();
  
  // Standard post state
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [networks, setNetworks] = useState(["facebook", "twitter"]);

  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("Professional / Corporate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState("");

  const toggleNetwork = (network: string) => {
    setNetworks(prev =>
      prev.includes(network) ? prev.filter(n => n !== network) : [...prev, network]
    );
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim() || !user) return;
    
    setIsGenerating(true);
    setAiError("");
    setAiResult(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ prompt: aiPrompt, tone: aiTone }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate AI content");
      
      const generated = data.data as AiResult;
      setAiResult(generated);

      // Auto-write to Final Post Content: prefer Facebook (more complete), fall back to Twitter
      const primary = generated.facebook || generated.twitter;
      if (primary) {
        const hashtagStr = primary.hashtags?.join(" ") || "";
        const combined = [primary.content, primary.cta, hashtagStr].filter(Boolean).join("\n\n");
        setContent(combined);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyPlatformContent = (platform: "facebook" | "twitter") => {
    if (!aiResult) return;
    const data = aiResult[platform];
    if (!data) return;
    
    const newContent = `${data.content}\n\n${data.cta}\n\n${data.hashtags.join(" ")}`;
    setContent(newContent);
    // Auto-select that network
    if (!networks.includes(platform)) {
      setNetworks([...networks, platform]);
    }
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
    <div className="max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Compose Post</h1>
        <p className="text-slate-400 text-sm mt-1">Create and publish content across your networks</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: AI Campaign Generator */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border-t-4 border-t-purple-500 shadow-xl shadow-purple-500/10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">AI Campaign Generator</h2>
                <p className="text-xs text-slate-400">Powered by Groq & Gemini</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Brand Tone</label>
                <select value={aiTone} onChange={e => setAiTone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option>Professional / Corporate</option>
                  <option>Bold / Energetic</option>
                  <option>Friendly / Social</option>
                  <option>Witty / Playful</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Campaign Idea</label>
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={3}
                  placeholder="e.g. Announce our new 50% off Summer Sale starting this weekend..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none" />
              </div>

              <button type="button" onClick={handleGenerate} disabled={isGenerating || !aiPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50">
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isGenerating ? "Generating Magic..." : "Generate AI Content"}
              </button>
              
              {aiError && <p className="text-xs text-red-400 text-center">{aiError}</p>}
            </div>
          </div>

          {/* AI Results Display */}
          <AnimatePresence>
            {aiResult && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden">
                
                {/* Facebook Result */}
                {aiResult.facebook && (
                  <div className="glass-panel p-5 rounded-xl border border-blue-500/20 relative group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-2 text-sm font-semibold text-blue-400">
                        <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-[10px]">f</div>
                        Facebook Tailored
                      </span>
                      <button onClick={() => applyPlatformContent("facebook")}
                        className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                        Use this <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{aiResult.facebook.content}</p>
                    <p className="text-sm font-semibold text-white mt-3 border-l-2 border-primary pl-3 py-1">{aiResult.facebook.cta}</p>
                    <p className="text-xs text-blue-400 mt-3">{aiResult.facebook.hashtags?.join(" ")}</p>
                  </div>
                )}

                {/* Twitter Result */}
                {aiResult.twitter && (
                  <div className="glass-panel p-5 rounded-xl border border-white/10 relative group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-2 text-sm font-semibold text-white">
                        <div className="w-5 h-5 rounded-full bg-black border border-white/20 flex items-center justify-center text-white text-[10px]">𝕏</div>
                        Twitter Tailored
                      </span>
                      <button onClick={() => applyPlatformContent("twitter")}
                        className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                        Use this <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{aiResult.twitter.content}</p>
                    <p className="text-sm font-semibold text-white mt-3 border-l-2 border-primary pl-3 py-1">{aiResult.twitter.cta}</p>
                    <p className="text-xs text-blue-400 mt-3">{aiResult.twitter.hashtags?.join(" ")}</p>
                  </div>
                )}

                {/* SEO & Insights */}
                {aiResult.seo && (
                  <div className="glass-panel p-5 rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20">
                    <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                      <Hash className="w-4 h-4" /> SEO & Audience Insights
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-medium mb-1.5">Target Audience</p>
                        <p className="text-sm text-slate-300">{aiResult.seo.targetAudience}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-medium mb-1.5">Key Talking Points</p>
                        <ul className="space-y-1">
                          {aiResult.seo.talkingPoints?.map((pt, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Column: Standard Editor */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="glass-panel rounded-2xl p-8 shadow-2xl shadow-black/50 h-fit sticky top-8">
          
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-xl mb-6">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium text-sm">
                  {role === "admin" ? "Published successfully!" : "Submitted for admin approval!"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handlePublish} className="space-y-6">
            {/* Networks */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Publish To</label>
              <div className="flex gap-3">
                {[
                  { id: "facebook", label: "Facebook", letter: "f", color: "#1877F2", shadow: "#1877F2" },
                  { id: "twitter", label: "Twitter", letter: "𝕏", color: "#000", shadow: "#fff" },
                ].map(net => {
                  const active = networks.includes(net.id);
                  return (
                    <label key={net.id}
                      className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all flex-1 ${active ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                      <input type="checkbox" checked={active} onChange={() => toggleNetwork(net.id)} className="hidden" />
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: net.color, boxShadow: `0 2px 8px ${net.shadow}40` }}>{net.letter}</div>
                      <span className={`text-sm font-medium ${active ? "text-white" : "text-slate-400"}`}>{net.label}</span>
                      {active && <CheckCircle2 className="w-4 h-4 text-blue-400 ml-auto" />}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Content Box */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3 flex justify-between">
                Final Post Content
                {content && <span className="text-xs text-primary cursor-pointer" onClick={() => setContent("")}>Clear</span>}
              </label>
              <div className="relative group">
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} required
                  placeholder="Paste AI content here or write from scratch..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 pb-14 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none shadow-inner text-sm leading-relaxed" />
                
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <button type="button" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><ImageIcon className="w-4 h-4" /></button>
                  <button type="button" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><LinkIcon className="w-4 h-4" /></button>
                </div>
                
                <div className={`absolute bottom-6 right-6 text-xs font-medium ${content.length > 250 ? "text-amber-400" : "text-slate-500"}`}>
                  {content.length} chars
                </div>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
              disabled={isPublishing || !content.trim() || networks.length === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
              {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isPublishing ? (role === "admin" ? "Publishing..." : "Submitting...") : (role === "admin" ? "Publish Now" : "Submit for Approval")}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
