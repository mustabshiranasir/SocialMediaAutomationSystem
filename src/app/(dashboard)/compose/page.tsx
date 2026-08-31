"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Loader2, Image as ImageIcon, Link as LinkIcon, Sparkles, AlertCircle, BookmarkCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createPendingPost, createPublishedPost } from "@/lib/firestore";
import { canCompose, canPublishDirectly } from "@/lib/permissions";
import { ShieldAlert } from "lucide-react";

/* ─── Types ─── */
type AiResult = {
  facebook?: { content: string; cta: string; hashtags: string[] };
  twitter?:  { content: string; cta: string; hashtags: string[] };
  seo?:      { talkingPoints: string[]; targetAudience: string };
};

/* ─── Validation ─── */
interface ValidationErrors {
  content?: string;
  networks?: string;
}

function validate(content: string, networks: string[]): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!content.trim()) {
    errors.content = "Post content is required.";
  } else if (content.trim().length < 10) {
    errors.content = "Post content must be at least 10 characters.";
  } else if (content.length > 5000) {
    errors.content = "Post content must not exceed 5000 characters.";
  }
  if (networks.length === 0) {
    errors.networks = "Select at least one network to publish to.";
  }
  return errors;
}

/* ─── Draft persistence key ─── */
const DRAFT_KEY = "compose_draft";


export default function Compose() {
  const { user, role } = useAuth();

  if (!canCompose(role || "")) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-slate-800">Access Denied</h1>
        <p className="text-slate-500 mb-6 text-sm max-w-sm leading-relaxed">You do not have permissions to compose new posts.</p>
      </div>
    );
  }

  const [content, setContent]           = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [success, setSuccess]           = useState(false);
  const [networks, setNetworks]         = useState(["facebook", "twitter"]);
  const [errors, setErrors]             = useState<ValidationErrors>({});
  const [draftSaved, setDraftSaved]     = useState(false);

  const [aiPrompt, setAiPrompt]         = useState("");
  const [aiTone, setAiTone]             = useState("Professional / Corporate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [aiError, setAiError]           = useState("");

  /* ─── Restore draft from localStorage on mount ─── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.content) setContent(draft.content);
        if (draft.networks?.length) setNetworks(draft.networks);
        if (draft.aiPrompt) setAiPrompt(draft.aiPrompt);
      }
    } catch { /* ignore corrupted draft */ }
  }, []);

  /* ─── Auto-save draft to localStorage whenever content changes ─── */
  useEffect(() => {
    if (!content && networks.length === 2) return; // don't save empty default state
    const id = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, networks, aiPrompt }));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 1500);
      } catch { /* ignore quota errors */ }
    }, 800);
    return () => clearTimeout(id);
  }, [content, networks, aiPrompt]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

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
    if (!user) return;

    // Run client-side validation
    const validationErrors = validate(content, networks);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsPublishing(true);
    setSuccess(false);
    try {
      if (canPublishDirectly(role || "")) {
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
      setErrors({});
      clearDraft();  // Remove saved draft after successful submission
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
                {canPublishDirectly(role || "") ? "Published successfully!" : "Submitted for admin approval!"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Draft Saved Indicator */}
        <AnimatePresence>
          {draftSaved && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs text-slate-400 mb-2"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
              Draft saved automatically
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
            {/* Network validation error */}
            {errors.networks && (
              <p className="flex items-center gap-1.5 text-xs text-red-500 font-medium mt-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.networks}
              </p>
            )}
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
              <textarea
                value={content}
                onChange={e => { setContent(e.target.value); if (errors.content) setErrors(prev => ({ ...prev, content: undefined })); }}
                rows={12}
                placeholder="Write your post or use AI to generate it above..."
                className={`w-full bg-slate-50 border rounded-2xl p-5 pb-14 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-none text-sm leading-relaxed ${
                  errors.content
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                }`}
              />
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
            {/* Content validation error */}
            {errors.content && (
              <p className="flex items-center gap-1.5 text-xs text-red-500 font-medium mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.content}
              </p>
            )}
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
            disabled={isPublishing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isPublishing
              ? (canPublishDirectly(role || "") ? "Publishing..." : "Submitting...")
              : (canPublishDirectly(role || "") ? "Publish Now" : "Submit for Approval")}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
