"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Key, Shield, Loader2, CheckCircle2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { saveCredentials, getCredentials, FacebookCredentials, TwitterCredentials } from "@/lib/firestore";

export default function Settings() {
  const { user } = useAuth();
  
  const [fb, setFb] = useState<FacebookCredentials>({ appId: "", appSecret: "", pageAccessToken: "" });
  const [tw, setTw] = useState<TwitterCredentials>({ apiKey: "", apiSecret: "", accessToken: "", accessTokenSecret: "" });
  
  const [loading, setLoading] = useState(true);
  const [savingFb, setSavingFb] = useState(false);
  const [savingTw, setSavingTw] = useState(false);
  const [fbSuccess, setFbSuccess] = useState(false);
  const [twSuccess, setTwSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    async function fetchData() {
      try {
        const data = await getCredentials(user!.uid);
        if (data?.facebook) setFb(data.facebook);
        if (data?.twitter) setTw(data.twitter);
      } catch (error) {
        console.error("Error fetching credentials:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [user]);

  const handleSaveFacebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSavingFb(true);
    setFbSuccess(false);
    
    try {
      await saveCredentials(user.uid, "facebook", fb);
      setFbSuccess(true);
      setTimeout(() => setFbSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingFb(false);
    }
  };

  const handleSaveTwitter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSavingTw(true);
    setTwSuccess(false);
    
    try {
      await saveCredentials(user.uid, "twitter", tw);
      setTwSuccess(true);
      setTimeout(() => setTwSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingTw(false);
    }
  };

  return (
    <ProtectedRoute>
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your social media API integrations securely
          </p>
        </motion.div>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </header>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Facebook Settings */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Shield className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#1877F2]/20">
                f
              </div>
              <div>
                <h2 className="text-xl font-semibold">Facebook Integration</h2>
                <p className="text-sm text-slate-400">
                  Connect your Facebook Page using Graph API credentials.
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSaveFacebook} className="space-y-5 relative z-10 max-w-2xl">
              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-slate-500" /> App ID
                </label>
                <input
                  type="text"
                  value={fb.appId}
                  onChange={(e) => setFb({ ...fb, appId: e.target.value })}
                  placeholder="Enter Facebook App ID"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent transition-all group-hover:border-white/20"
                />
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-slate-500" /> App Secret
                </label>
                <input
                  type="password"
                  value={fb.appSecret}
                  onChange={(e) => setFb({ ...fb, appSecret: e.target.value })}
                  placeholder="Enter Facebook App Secret"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent transition-all group-hover:border-white/20"
                />
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-slate-500" /> Page Access Token
                </label>
                <input
                  type="password"
                  value={fb.pageAccessToken}
                  onChange={(e) => setFb({ ...fb, pageAccessToken: e.target.value })}
                  placeholder="Enter Long-Lived Page Access Token"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent transition-all group-hover:border-white/20"
                />
              </div>
              <div className="flex items-center gap-4 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={savingFb}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl font-medium transition-colors shadow-lg shadow-[#1877F2]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {savingFb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                  {savingFb ? "Saving..." : "Save Facebook Credentials"}
                </motion.button>
                <AnimatePresence>
                  {fbSuccess && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.section>

          {/* Twitter Settings */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel rounded-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Shield className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-full bg-black border border-white/20 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-black/20">
                𝕏
              </div>
              <div>
                <h2 className="text-xl font-semibold">Twitter (X) Integration</h2>
                <p className="text-sm text-slate-400">
                  Connect your X Developer account (OAuth 2.0).
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSaveTwitter} className="space-y-5 relative z-10 max-w-2xl">
              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-slate-500" /> API Key
                </label>
                <input
                  type="text"
                  value={tw.apiKey}
                  onChange={(e) => setTw({ ...tw, apiKey: e.target.value })}
                  placeholder="Enter API Key"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all group-hover:border-white/20"
                />
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-slate-500" /> API Key Secret
                </label>
                <input
                  type="password"
                  value={tw.apiSecret}
                  onChange={(e) => setTw({ ...tw, apiSecret: e.target.value })}
                  placeholder="Enter API Key Secret"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all group-hover:border-white/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-slate-500" /> Access Token
                  </label>
                  <input
                    type="text"
                    value={tw.accessToken}
                    onChange={(e) => setTw({ ...tw, accessToken: e.target.value })}
                    placeholder="Access Token"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all group-hover:border-white/20"
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-slate-500" /> Access Token Secret
                  </label>
                  <input
                    type="password"
                    value={tw.accessTokenSecret}
                    onChange={(e) => setTw({ ...tw, accessTokenSecret: e.target.value })}
                    placeholder="Access Token Secret"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all group-hover:border-white/20"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={savingTw}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-slate-200 rounded-xl font-medium transition-colors shadow-lg shadow-white/10 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {savingTw ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4" />}
                  {savingTw ? "Saving..." : "Save Twitter Credentials"}
                </motion.button>
                <AnimatePresence>
                  {twSuccess && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.section>
        </div>
      )}
    </main>
    </ProtectedRoute>
  );
}
