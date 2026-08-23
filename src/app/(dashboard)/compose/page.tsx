"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Loader2, Image as ImageIcon, Link as LinkIcon, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createPendingPost, createPublishedPost } from "@/lib/firestore";

type AiResult = {
  type: "clarification" | "post";
  question?: string;
  post?: {
    facebook?: { content: string; cta: string; hashtags: string[] };
    twitter?: { content: string; cta: string; hashtags: string[] };
    seo?: { talkingPoints: string[]; targetAudience: string };
  };
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Compose() {
  const { user, role } = useAuth();
  
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [networks, setNetworks] = useState(["facebook", "twitter"]);

  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("Professional / Corporate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [clarification, setClarification] = useState("");

  const toggleNetwork = (network: string) => {
    setNetworks(prev =>
      prev.includes(network) ? prev.filter(n => n !== network) : [...prev, network]
    );
  };

  const buildContentForPlatforms = (generated: Exclude<AiResult["post"], undefined>, selectedNetworks: string[]): string => {
    const parts: string[] = [];

    // If only one platform is selected, use that platform's content
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

    // If both platforms are selected, show both with clear labels
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

  const handleGenerate = async (isRewrite = false, additionalContext = "") => {
    if ((!aiPrompt.trim() && messages.length === 0) || !user) return;
    
    setIsGenerating(true);
    setAiError("");

    try {
      let newMessages = [...messages];
      
      if (isRewrite) {
        newMessages.push({ role: "user", content: additionalContext || "Please rewrite this to give me a different variation." });
      } else if (additionalContext) {
        // User is answering a clarification
        newMessages.push({ role: "user", content: additionalContext });
      } else if (newMessages.length === 0) {
        // First prompt
        newMessages = [{ role: "user", content: aiPrompt }];
      }

      setMessages(newMessages);

      const idToken = await user.getIdToken();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ messages: newMessages, tone: aiTone }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate AI content");
      
      const generated = data.data as AiResult;
      
      if (generated.type === "clarification" && generated.question) {
        setClarification(generated.question);
        setMessages(prev => [...prev, { role: "assistant", content: generated.question! }]);
      } else if (generated.type === "post" && generated.post) {
        setClarification("");
        setMessages(prev => [...prev, { role: "assistant", content: JSON.stringify(generated.post) }]);
        const finalContent = buildContentForPlatforms(generated.post, networks);
        setContent(finalContent);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message);
      // Remove the last optimistic user message on error to allow retry
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewrite = () => {
    handleGenerate(true);
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
        
        setSuccess(true); 
        setContent("");
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
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Compose Post</h1>
        <p className="text-slate-400 text-sm mt-1">Create and publish content across your networks</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-panel rounded-2xl p-8 shadow-2xl shadow-black/50">

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
                { id: "twitter", label: "Twitter (X)", letter: "𝕏", color: "#000", shadow: "#fff" },
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

          {/* AI Campaign Generator - inline */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold">AI Campaign Generator</h3>
                <p className="text-[10px] text-slate-400">Powered by Groq & Gemini — writes directly to your post</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                {clarification ? (
                  <div className="bg-black/50 border border-purple-500/30 rounded-xl p-3 h-full flex flex-col justify-between">
                    <p className="text-sm text-purple-300 mb-2 font-medium">AI: {clarification}</p>
                    <div className="flex gap-2">
                      <input type="text"
                        placeholder="Type your answer..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.currentTarget.value) {
                            handleGenerate(false, e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={2}
                    placeholder="e.g. Announce our 50% off Summer Sale this weekend..."
                    className="w-full h-full bg-black/30 border border-white/10 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none" />
                )}
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <select value={aiTone} onChange={e => setAiTone(e.target.value)} disabled={messages.length > 0}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50">
                  <option>Professional / Corporate</option>
                  <option>Bold / Energetic</option>
                  <option>Friendly / Social</option>
                  <option>Witty / Playful</option>
                </select>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleGenerate()} disabled={isGenerating || (!aiPrompt.trim() && messages.length === 0) || !!clarification}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50">
                    {isGenerating && !clarification ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isGenerating && !clarification ? "Generating..." : "Generate ✨"}
                  </button>
                  {messages.length > 0 && !clarification && (
                    <button type="button" onClick={handleRewrite} disabled={isGenerating}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                      title="Rewrite/Regenerate">
                      {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "↻"}
                    </button>
                  )}
                  {messages.length > 0 && (
                    <button type="button" onClick={() => { setMessages([]); setClarification(""); setAiPrompt(""); }}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium transition-all"
                      title="Clear Chat">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
            {aiError && <p className="text-xs text-red-400">{aiError}</p>}
          </div>

          {/* Content Box */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3 flex justify-between">
              Final Post Content
              {content && <span className="text-xs text-primary cursor-pointer" onClick={() => setContent("")}>Clear</span>}
            </label>
            <div className="relative group">
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={14} required
                placeholder="Write your post or use AI to generate it above..."
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
  );
}
