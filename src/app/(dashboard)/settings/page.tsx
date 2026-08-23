"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Key, Shield, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { saveCredentials, getCredentials, FacebookCredentials, TwitterCredentials, AiCredentials } from "@/lib/firestore";

export default function Settings() {
  const { user } = useAuth();
  const [fb, setFb] = useState<FacebookCredentials>({ appId: "", appSecret: "", pageAccessToken: "" });
  const [tw, setTw] = useState<TwitterCredentials>({ apiKey: "", apiSecret: "", accessToken: "", accessTokenSecret: "" });
  const [ai, setAi] = useState<AiCredentials>({ grokApiKey: "", geminiApiKey: "" });
  const [loading, setLoading] = useState(true);
  const [savingFb, setSavingFb] = useState(false);
  const [savingTw, setSavingTw] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [fbSuccess, setFbSuccess] = useState(false);
  const [twSuccess, setTwSuccess] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCredentials(user.uid).then(data => {
      if (data?.facebook) setFb(data.facebook);
      if (data?.twitter) setTw(data.twitter);
      if (data?.ai) setAi(data.ai);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const handleSaveFacebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingFb(true); setFbSuccess(false);
    try { await saveCredentials(user.uid, "facebook", fb); setFbSuccess(true); setTimeout(() => setFbSuccess(false), 3000); }
    catch (e) { console.error(e); } finally { setSavingFb(false); }
  };

  const handleSaveTwitter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingTw(true); setTwSuccess(false);
    try { await saveCredentials(user.uid, "twitter", tw); setTwSuccess(true); setTimeout(() => setTwSuccess(false), 3000); }
    catch (e) { console.error(e); } finally { setSavingTw(false); }
  };

  const handleSaveAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingAi(true); setAiSuccess(false);
    try { await saveCredentials(user.uid, "ai", ai); setAiSuccess(true); setTimeout(() => setAiSuccess(false), 3000); }
    catch (e) { console.error(e); } finally { setSavingAi(false); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your social media API integrations securely</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          {/* Facebook */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-panel rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Shield className="w-32 h-32" /></div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#1877F2]/20">f</div>
              <div>
                <h2 className="text-xl font-semibold">Facebook Integration</h2>
                <p className="text-sm text-slate-400">Connect your Facebook Page using Graph API credentials.</p>
              </div>
            </div>
            <form onSubmit={handleSaveFacebook} className="space-y-5 relative z-10 max-w-2xl">
              {[
                { label: "App ID", key: "appId", type: "text", val: fb.appId, ph: "Enter Facebook App ID" },
                { label: "App Secret", key: "appSecret", type: "password", val: fb.appSecret, ph: "Enter Facebook App Secret" },
                { label: "Page Access Token", key: "pageAccessToken", type: "password", val: fb.pageAccessToken, ph: "Enter Long-Lived Page Access Token" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-slate-500" /> {field.label}
                  </label>
                  <input type={field.type} value={field.val} placeholder={field.ph}
                    onChange={e => setFb({ ...fb, [field.key]: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1877F2] transition-all" />
                </div>
              ))}
              <div className="flex items-center gap-4 mt-6">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={savingFb}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl font-medium transition-colors shadow-lg shadow-[#1877F2]/20 disabled:opacity-70">
                  {savingFb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingFb ? "Saving..." : "Save Facebook Credentials"}
                </motion.button>
                <AnimatePresence>{fbSuccess && (<motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><CheckCircle2 className="w-6 h-6 text-emerald-400" /></motion.div>)}</AnimatePresence>
              </div>
            </form>
          </motion.section>

          {/* Twitter */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-panel rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Shield className="w-32 h-32" /></div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-full bg-black border border-white/20 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-black/20">𝕏</div>
              <div>
                <h2 className="text-xl font-semibold">Twitter (X) Integration</h2>
                <p className="text-sm text-slate-400">Connect your X Developer account (OAuth 2.0).</p>
              </div>
            </div>
            <form onSubmit={handleSaveTwitter} className="space-y-5 relative z-10 max-w-2xl">
              {[
                { label: "API Key", key: "apiKey", type: "text", val: tw.apiKey, ph: "Enter API Key" },
                { label: "API Key Secret", key: "apiSecret", type: "password", val: tw.apiSecret, ph: "Enter API Key Secret" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-slate-500" /> {field.label}
                  </label>
                  <input type={field.type} value={field.val} placeholder={field.ph}
                    onChange={e => setTw({ ...tw, [field.key]: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Access Token", key: "accessToken", val: tw.accessToken, ph: "Access Token" },
                  { label: "Access Token Secret", key: "accessTokenSecret", val: tw.accessTokenSecret, ph: "Access Token Secret" },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-slate-500" /> {field.label}
                    </label>
                    <input type="password" value={field.val} placeholder={field.ph}
                      onChange={e => setTw({ ...tw, [field.key]: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-6">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={savingTw}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-slate-200 rounded-xl font-medium transition-colors shadow-lg shadow-white/10 disabled:opacity-70">
                  {savingTw ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4" />}
                  {savingTw ? "Saving..." : "Save Twitter Credentials"}
                </motion.button>
                <AnimatePresence>{twSuccess && (<motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><CheckCircle2 className="w-6 h-6 text-emerald-400" /></motion.div>)}</AnimatePresence>
              </div>
            </form>
          </motion.section>

          {/* AI Settings */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-panel rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles className="w-32 h-32" /></div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">AI Integrations</h2>
                <p className="text-sm text-slate-400">Connect Groq and Gemini APIs for AI-powered content generation.</p>
              </div>
            </div>
            <form onSubmit={handleSaveAi} className="space-y-5 relative z-10 max-w-2xl">
              {[
                { label: "Groq API Key", key: "grokApiKey", type: "password", val: ai.grokApiKey, ph: "Enter Groq API Key (gsk_...)" },
                { label: "Google Gemini API Key", key: "geminiApiKey", type: "password", val: ai.geminiApiKey, ph: "Enter Gemini API Key (Fallback)" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-slate-500" /> {field.label}
                  </label>
                  <input type={field.type} value={field.val} placeholder={field.ph}
                    onChange={e => setAi({ ...ai, [field.key]: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                </div>
              ))}
              <div className="flex items-center gap-4 mt-6">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={savingAi}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-70">
                  {savingAi ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                  {savingAi ? "Saving..." : "Save AI Credentials"}
                </motion.button>
                <AnimatePresence>{aiSuccess && (<motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><CheckCircle2 className="w-6 h-6 text-emerald-400" /></motion.div>)}</AnimatePresence>
              </div>
            </form>
          </motion.section>
        </div>
      )}
    </div>
  );
}
