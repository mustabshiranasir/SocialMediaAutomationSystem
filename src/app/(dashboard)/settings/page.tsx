"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Key, Loader2, CheckCircle2, X, ExternalLink, FlaskConical, Settings as SettingsIcon,
  Sparkles, Trash2, Cpu, Image as ImageIcon, MessageSquare, Globe, Check, Download
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  saveCredentials,
  subscribeToCredentials,
  subscribeToInstalledPlugins,
  toggleUserPlugin,
  AiCredentials,
  subscribeToMediaSettings,
  saveMediaSettings,
  MediaSettingsData,
  defaultMediaSettings
} from "@/lib/firestore";

// ─── Connector Definitions ────────────────────────────────────────────────────
const CONNECTORS = [
  {
    id: "groq",
    name: "Groq (Claude-speed LLM)",
    description: "Ultra-fast text generation with Groq-hosted open models.",
    logo: (
      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">G</div>
    ),
    fieldKey: "grokApiKey" as keyof AiCredentials,
    placeholder: "Enter Groq API Key (gsk_...)",
    docsUrl: "https://console.groq.com/keys",
  },
  {
    id: "google",
    name: "Google",
    description: "Text and image generation with Gemini and Imagen.",
    logo: (
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
        <svg viewBox="0 0 48 48" className="w-9 h-9">
          <path fill="#4285F4" d="M24 9.5c3.1 0 5.8 1.1 8 2.9l6-6C34.3 3 29.4 1 24 1 14.6 1 6.7 6.5 3 14.4l7 5.4C12 14 17.5 9.5 24 9.5z"/>
          <path fill="#34A853" d="M46.1 24.5c0-1.6-.1-2.8-.4-4H24v7.6h12.5c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7C43.1 37 46.1 31.2 46.1 24.5z"/>
          <path fill="#FBBC05" d="M10 28.8C9.4 27.1 9 25.1 9 23s.4-4.1 1-5.8L3 11.9C1.1 15.6 0 19.6 0 24s1.1 8.4 3 12.1L10 28.8z"/>
          <path fill="#EA4335" d="M24 47c5.4 0 10-1.8 13.3-4.9l-7.4-5.7c-1.9 1.3-4.3 2.1-6.9 2.1-6.5 0-12-4.5-14-10.7l-7 5.4C6.7 41.5 14.6 47 24 47z"/>
        </svg>
      </div>
    ),
    fieldKey: "geminiApiKey" as keyof AiCredentials,
    placeholder: "Enter Gemini API Key (AIza...)",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "Text and image generation with GPT and Dall-E.",
    logo: (
      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0 shadow-sm">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M22.28 9.22a6 6 0 0 0-.52-4.92 6.07 6.07 0 0 0-6.53-2.91A6 6 0 0 0 10.7 0a6.08 6.08 0 0 0-5.8 4.21 6 6 0 0 0-4 2.91 6.07 6.07 0 0 0 .75 7.12 6 6 0 0 0 .52 4.92 6.07 6.07 0 0 0 6.53 2.91A6 6 0 0 0 13.3 24a6.08 6.08 0 0 0 5.8-4.22 6 6 0 0 0 4-2.9 6.07 6.07 0 0 0-.82-7.66zM13.3 22.5a4.5 4.5 0 0 1-2.89-1.05l.14-.08 4.8-2.77a.79.79 0 0 0 .4-.69v-6.77l2.03 1.17a.07.07 0 0 1 .04.06v5.6a4.5 4.5 0 0 1-4.52 4.53zM3.62 18.4a4.5 4.5 0 0 1-.54-3.02l.14.09 4.8 2.77a.77.77 0 0 0 .79 0l5.86-3.38v2.34a.07.07 0 0 1-.03.06l-4.85 2.8a4.5 4.5 0 0 1-6.17-1.66zM2.46 8.17a4.5 4.5 0 0 1 2.35-1.98v5.7a.78.78 0 0 0 .39.68l5.84 3.37-2.03 1.17a.07.07 0 0 1-.07 0L4.1 14.4a4.5 4.5 0 0 1-1.64-6.23zm16.67 3.87L13.27 8.6l2.03-1.17a.07.07 0 0 1 .07 0l4.84 2.8a4.5 4.5 0 0 1-.7 8.13V12.7a.79.79 0 0 0-.38-.66zm2.02-3.04-.14-.08-4.8-2.77a.77.77 0 0 0-.79 0L9.58 9.53V7.2a.07.07 0 0 1 .03-.06l4.84-2.79a4.5 4.5 0 0 1 6.7 4.65zm-12.7 4.18-2.03-1.17a.07.07 0 0 1-.04-.06V6.63a4.5 4.5 0 0 1 7.38-3.46l-.14.08-4.8 2.77a.79.79 0 0 0-.4.69v6.77zm1.1-2.37 2.61-1.5 2.61 1.5v3L12.16 16l-2.61-1.5z"/>
        </svg>
      </div>
    ),
    fieldKey: "openaiApiKey" as keyof AiCredentials,
    placeholder: "Enter OpenAI API Key (sk-...)",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Text generation with Claude.",
    logo: (
      <div className="w-10 h-10 rounded-full bg-[#D4763B] flex items-center justify-center shrink-0 shadow-sm">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M17.3 3h-3.1L9 21h3.2l1-3h5.7l1 3H23zm-3.2 12.5 1.9-6.2 1.9 6.2zM6.7 3H3.6L0 21h3.2l.7-3H8l.7 3H12zm-2.1 12.5 1.5-6.2 1.5 6.2z"/>
        </svg>
      </div>
    ),
    fieldKey: "anthropicApiKey" as keyof AiCredentials,
    placeholder: "Enter Anthropic API Key (sk-ant-...)",
    docsUrl: "https://console.anthropic.com/keys",
  },
];

// ─── Available AI Plugins ─────────────────────────────────────────────────────
const AI_PLUGINS = [
  {
    id: "ai-content-generator",
    name: "AI Content & Post Generator",
    tagline: "Core AI Writer",
    description: "Automatically generates post titles, excerpts, hashtags, custom social post copy, and alt text for all connected networks.",
    icon: Sparkles,
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    id: "ai-image-generator",
    name: "AI Visual & Story Creator",
    tagline: "Image Generation",
    description: "Creates featured images, story templates, and visual post banners using Gemini Imagen & OpenAI Dall-E.",
    icon: ImageIcon,
    badgeColor: "bg-pink-100 text-pink-700 border-pink-200",
  },
  {
    id: "ai-smart-reply",
    name: "AI Smart Engagement & Reply",
    tagline: "Community Assistant",
    description: "Analyzes incoming comments and generates intelligent response suggestions for Facebook and Twitter/X.",
    icon: MessageSquare,
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    id: "ai-translator",
    name: "AI Multi-Language Translator",
    tagline: "Localization",
    description: "Auto-translates posts and custom captions across 20+ global languages before dispatch.",
    icon: Globe,
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
];

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <SettingsIcon className="w-10 h-10 mb-3 opacity-20" />
      <p className="text-sm font-medium">{label} settings coming soon.</p>
    </div>
  );
}

// ─── Media Settings Tab Component ──────────────────────────────────────────────
function MediaSettingsTab() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MediaSettingsData>(defaultMediaSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMediaSettings(user.uid, (data) => {
      setSettings(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      await saveMediaSettings(user.uid, settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error("Save media settings error:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
      {/* Title Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-medium text-slate-900">Media Settings</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Image sizes */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-1">Image sizes</h2>
          <p className="text-sm text-slate-500 mb-6">
            The sizes listed below determine the maximum dimensions in pixels to use when adding an image to the Media Library.
          </p>

          <div className="space-y-6">
            {/* Thumbnail size */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Thumbnail size</h3>
              <div className="flex flex-col space-y-2 pl-4">
                <div className="flex items-center gap-6">
                  <label className="w-24 text-sm text-slate-600">Width</label>
                  <input
                    type="number"
                    value={settings.thumbnailWidth}
                    onChange={e => setSettings({ ...settings, thumbnailWidth: parseInt(e.target.value) || 0 })}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="w-24 text-sm text-slate-600">Height</label>
                  <input
                    type="number"
                    value={settings.thumbnailHeight}
                    onChange={e => setSettings({ ...settings, thumbnailHeight: parseInt(e.target.value) || 0 })}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="pl-4 pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.cropThumbnail}
                    onChange={e => setSettings({ ...settings, cropThumbnail: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  Crop thumbnail to exact dimensions (normally thumbnails are proportional)
                </label>
              </div>
            </div>

            {/* Medium size */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Medium size</h3>
              <div className="flex flex-col space-y-2 pl-4">
                <div className="flex items-center gap-6">
                  <label className="w-24 text-sm text-slate-600">Max Width</label>
                  <input
                    type="number"
                    value={settings.mediumMaxWidth}
                    onChange={e => setSettings({ ...settings, mediumMaxWidth: parseInt(e.target.value) || 0 })}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="w-24 text-sm text-slate-600">Max Height</label>
                  <input
                    type="number"
                    value={settings.mediumMaxHeight}
                    onChange={e => setSettings({ ...settings, mediumMaxHeight: parseInt(e.target.value) || 0 })}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Large size */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Large size</h3>
              <div className="flex flex-col space-y-2 pl-4">
                <div className="flex items-center gap-6">
                  <label className="w-24 text-sm text-slate-600">Max Width</label>
                  <input
                    type="number"
                    value={settings.largeMaxWidth}
                    onChange={e => setSettings({ ...settings, largeMaxWidth: parseInt(e.target.value) || 0 })}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="w-24 text-sm text-slate-600">Max Height</label>
                  <input
                    type="number"
                    value={settings.largeMaxHeight}
                    onChange={e => setSettings({ ...settings, largeMaxHeight: parseInt(e.target.value) || 0 })}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Uploading Files */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-800">Uploading Files</h2>
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.organizeUploadsByDate}
                onChange={e => setSettings({ ...settings, organizeUploadsByDate: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              Organize my uploads into month- and year-based folders
            </label>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#4361ee] hover:bg-[#3751d7] text-white text-sm font-semibold rounded-lg transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {savedSuccess && (
            <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Changes saved successfully!
            </span>
          )}
        </div>
      </form>
    </motion.div>
  );
}

// ─── Main Settings Content Component ──────────────────────────────────────────
function SettingsContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "general";

  const { user } = useAuth();
  const [credentials, setCredentials] = useState<AiCredentials>({});
  const [installedPlugins, setInstalledPlugins] = useState<string[]>(["ai-content-generator"]);
  const [loading, setLoading] = useState(true);
  const [openConnector, setOpenConnector] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pluginLoading, setPluginLoading] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // 🔴 Real-time listener for Credentials & Installed Plugins
  useEffect(() => {
    if (!user) return;

    // Credentials Listener
    const unsubCreds = subscribeToCredentials(user.uid, (data) => {
      const aiCreds = data?.ai || {};
      setCredentials(aiCreds);
      setFieldValues(prev => ({
        grokApiKey: aiCreds.grokApiKey || prev.grokApiKey || "",
        geminiApiKey: aiCreds.geminiApiKey || prev.geminiApiKey || "",
        openaiApiKey: aiCreds.openaiApiKey || prev.openaiApiKey || "",
        anthropicApiKey: aiCreds.anthropicApiKey || prev.anthropicApiKey || "",
      }));
      setLoading(false);
    });

    // Installed Plugins Listener
    const unsubPlugins = subscribeToInstalledPlugins(user.uid, (plugins) => {
      setInstalledPlugins(plugins);
    });

    return () => {
      unsubCreds();
      unsubPlugins();
    };
  }, [user]);

  // Close open connector form when tab changes
  useEffect(() => {
    setOpenConnector(null);
  }, [activeTab]);

  const isConnectorInstalled = (key: keyof AiCredentials) => !!credentials[key];

  const handleSaveConnector = async (connector: typeof CONNECTORS[0]) => {
    if (!user) return;
    setSaving(connector.id);
    setSaved(null);
    try {
      const updatedCreds: AiCredentials = {
        ...credentials,
        [connector.fieldKey]: fieldValues[connector.fieldKey] || "",
      };
      await saveCredentials(user.uid, "ai", updatedCreds);
      setSaved(connector.id);
      setTimeout(() => {
        setSaved(null);
        setOpenConnector(null);
      }, 1500);
    } catch (e) {
      console.error("Save connector error:", e);
    } finally {
      setSaving(null);
    }
  };

  const handleRemoveConnector = async (connector: typeof CONNECTORS[0]) => {
    if (!user) return;
    setSaving(connector.id);
    try {
      const updatedCreds: AiCredentials = {
        ...credentials,
        [connector.fieldKey]: "",
      };
      await saveCredentials(user.uid, "ai", updatedCreds);
      setFieldValues(prev => ({ ...prev, [connector.fieldKey]: "" }));
      setOpenConnector(null);
    } catch (e) {
      console.error("Remove connector error:", e);
    } finally {
      setSaving(null);
    }
  };

  const handleTogglePlugin = async (pluginId: string, currentInstalled: boolean) => {
    if (!user) return;
    setPluginLoading(pluginId);
    try {
      await toggleUserPlugin(user.uid, pluginId, !currentInstalled);
    } catch (e) {
      console.error("Toggle plugin error:", e);
    } finally {
      setPluginLoading(null);
    }
  };

  const tabTitle: Record<string, string> = {
    general: "General",
    connectors: "Connectors",
    writing: "Writing",
    reading: "Reading",
    discussion: "Discussion",
    media: "Media",
    permalinks: "Permalinks",
    privacy: "Privacy",
  };

  return (
    <div className="max-w-3xl mx-auto w-full py-6">
      <AnimatePresence mode="wait">
        {activeTab === "connectors" ? (
          <motion.div
            key="connectors"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Header with Real-time Sync Indicator */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Connectors & AI Plugins</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  All of your API keys and installed AI plugins are synced in real-time across your workspace.
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-medium shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Realtime Connected
              </div>
            </div>

            {/* AI Plugin Promo & Active Banner */}
            <div className="relative rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700 text-white p-6 shadow-md overflow-hidden">
              <div className="absolute right-4 bottom-0 opacity-15 pointer-events-none">
                <FlaskConical className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10 max-w-lg">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-semibold mb-3 backdrop-blur-sm border border-white/20">
                  <Sparkles className="w-3.5 h-3.5" /> AI Plugin Suite
                </div>
                <h2 className="text-lg font-bold text-white mb-1">Empower Your Workspace with AI Connectors</h2>
                <p className="text-xs text-purple-100 leading-relaxed mb-4">
                  Connect Groq, Gemini, OpenAI, or Anthropic to enable automatic post copies, featured images, alt text, and smart audience engagement.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const element = document.getElementById("ai-plugins-section");
                      element?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-4 py-2 bg-white text-purple-700 hover:bg-purple-50 text-xs font-bold rounded-lg transition-all shadow-sm"
                  >
                    View Installed AI Plugins ({installedPlugins.length})
                  </button>
                  <a
                    href="https://smm.clicktaketech.com/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-purple-200 hover:text-white flex items-center gap-1 font-medium transition-colors"
                  >
                    Documentation <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* AI Connectors Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-600" /> API Connectors
                </h2>
                <span className="text-xs text-slate-500">
                  {CONNECTORS.filter(c => isConnectorInstalled(c.fieldKey)).length} of {CONNECTORS.length} Connected
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
              ) : (
                <div className="space-y-3">
                  {CONNECTORS.map(connector => {
                    const installed = isConnectorInstalled(connector.fieldKey);
                    const isOpen = openConnector === connector.id;
                    const isSaving = saving === connector.id;
                    const isSaved = saved === connector.id;

                    return (
                      <div key={connector.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all hover:border-slate-300">
                        <div className="flex items-center gap-4 px-5 py-4">
                          {connector.logo}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 text-sm">{connector.name}</span>
                              {installed ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> Configured
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-full border border-slate-200">
                                  Not Configured
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{connector.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={connector.docsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-slate-400 hover:text-blue-500 transition-colors p-1"
                              title="Get API Key"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => setOpenConnector(isOpen ? null : connector.id)}
                              className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all
                                ${installed
                                  ? "border-slate-300 text-slate-700 hover:border-slate-400 bg-white shadow-2xs"
                                  : "border-[#635BFF] text-[#635BFF] hover:bg-[#635BFF] hover:text-white bg-white"
                                }`}
                            >
                              {installed ? "Configure" : "Install"}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Configuration Form */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50">
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <Key className="w-3 h-3 text-slate-400" /> API Key
                                  </span>
                                  {installed && (
                                    <button
                                      onClick={() => handleRemoveConnector(connector)}
                                      disabled={isSaving}
                                      className="text-[11px] text-red-500 hover:text-red-600 flex items-center gap-1 hover:underline"
                                    >
                                      <Trash2 className="w-3 h-3" /> Disconnect Key
                                    </button>
                                  )}
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="password"
                                    value={fieldValues[connector.fieldKey] || ""}
                                    onChange={e => setFieldValues(prev => ({ ...prev, [connector.fieldKey]: e.target.value }))}
                                    placeholder={connector.placeholder}
                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/40 focus:border-[#635BFF] transition-all font-mono"
                                  />
                                  <button
                                    onClick={() => handleSaveConnector(connector)}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#635BFF] hover:bg-[#5249e6] disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-all shadow-xs"
                                  >
                                    {isSaving ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : isSaved ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                                    ) : (
                                      <Save className="w-3.5 h-3.5" />
                                    )}
                                    {isSaved ? "Saved!" : isSaving ? "Saving..." : "Save Key"}
                                  </button>
                                  <button
                                    onClick={() => setOpenConnector(null)}
                                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5">
                                  Keys are stored in Firestore with real-time encryption and accessible across your publishing modules.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Plugins Directory Section */}
            <div id="ai-plugins-section" className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> AI Plugins
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage AI plugins installed for your account. Changes update instantly in real-time.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                  {installedPlugins.length} Installed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AI_PLUGINS.map(plugin => {
                  const isInstalled = installedPlugins.includes(plugin.id);
                  const isToggling = pluginLoading === plugin.id;
                  const IconComponent = plugin.icon;

                  return (
                    <div
                      key={plugin.id}
                      className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all shadow-xs relative overflow-hidden ${
                        isInstalled ? "border-purple-200 bg-gradient-to-b from-white to-purple-50/20" : "border-slate-200"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <IconComponent className="w-5 h-5 text-purple-300" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 text-sm">{plugin.name}</h3>
                              <span className={`inline-block text-[10px] font-semibold px-2 py-0.2 rounded border mt-0.5 ${plugin.badgeColor}`}>
                                {plugin.tagline}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                          {plugin.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        {isInstalled ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Installed & Active
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Available</span>
                        )}

                        <button
                          onClick={() => handleTogglePlugin(plugin.id, isInstalled)}
                          disabled={isToggling}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                            isInstalled
                              ? "bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 border border-slate-200"
                              : "bg-[#635BFF] hover:bg-[#5249e6] text-white shadow-xs"
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isInstalled ? (
                            <>
                              <X className="w-3 h-3" /> Uninstall
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3" /> Install Plugin
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plugin Directory Footer */}
            <p className="text-xs text-slate-500 pt-4 text-center">
              If the connector or plugin you need is not listed,{" "}
              <a href="https://smm.clicktaketech.com/docs" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                search the plugin directory
              </a>{" "}
              to see if an addon is available.
            </p>
          </motion.div>
        ) : activeTab === "media" ? (
          <MediaSettingsTab key="media" />
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-5 pb-4 border-b border-slate-200">
              <h1 className="text-xl font-bold text-slate-900">{tabTitle[activeTab] || "Settings"}</h1>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <PlaceholderTab label={tabTitle[activeTab] || activeTab} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function Settings() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
