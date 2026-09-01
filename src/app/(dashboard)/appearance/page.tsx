"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, Sparkles, CheckCircle2, Download, Search, ExternalLink,
  Code, Type, Check, RefreshCw, Loader2, ArrowUpRight, Upload, Sliders,
  Plus, X, AlertTriangle, ArrowLeft, Layers, Eye, Star
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToAppearanceSettings,
  saveAppearanceSettings,
  AppearanceSettingsData,
  defaultAppearanceSettings
} from "@/lib/firestore";
import { FULL_THEMES_CATALOG, ThemeItem } from "@/lib/themes-catalog";
import Link from "next/link";

const AVAILABLE_THEMES = FULL_THEMES_CATALOG;

// ─── Font Options ─────────────────────────────────────────────────────────────
const FONTS = [
  { id: "Inter", name: "Inter (System Sans)", preview: "The quick brown fox jumps over the lazy dog" },
  { id: "Plus Jakarta Sans", name: "Plus Jakarta Sans", preview: "Modern corporate typography with sharp legibility" },
  { id: "Roboto", name: "Roboto", preview: "Google's classic geometric sans-serif font" },
  { id: "Open Sans", name: "Open Sans", preview: "Optimized for print, web, and mobile interfaces" },
  { id: "Fira Code", name: "Fira Code (Monospace)", preview: "const theme = { active: true, font: 'Fira Code' };" },
  { id: "Outfit", name: "Outfit", preview: "Clean display typeface inspired by modern tech branding" },
  { id: "Playfair Display", name: "Playfair Display (Serif)", preview: "Elegant editorial serif for high-fashion headlines" },
];

// ─── Main Content Component ───────────────────────────────────────────────────
function AppearanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams?.get("tab") || "themes";

  const { user } = useAuth();
  const [appearance, setAppearance] = useState<AppearanceSettingsData>(defaultAppearanceSettings);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Modal State for "Details & Preview"
  const [previewThemeModal, setPreviewThemeModal] = useState<ThemeItem | null>(null);

  // Page 2: Add / Upload Theme state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [themeFilter, setThemeFilter] = useState<"popular" | "latest" | "block" | "favorites">("popular");
  const [searchQuery, setSearchQuery] = useState("");

  // Editors Tab State
  const [customCss, setCustomCss] = useState(defaultAppearanceSettings.customCss || "");
  const [savingCss, setSavingCss] = useState(false);
  const [savedCssSuccess, setSavedCssSuccess] = useState(false);

  // 🔴 Real-time listener for Appearance Settings
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToAppearanceSettings(user.uid, (data) => {
      setAppearance(data);
      if (data.customCss) setCustomCss(data.customCss);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Activate Theme Handler
  const handleActivateTheme = async (themeId: string) => {
    if (!user) return;
    setActivatingId(themeId);
    try {
      const installed = appearance.installedThemeIds || [];
      const updatedInstalled = installed.includes(themeId) ? installed : [...installed, themeId];
      await saveAppearanceSettings(user.uid, {
        activeThemeId: themeId,
        installedThemeIds: updatedInstalled
      });
      setPreviewThemeModal(null);
      router.push("/appearance?tab=themes");
    } catch (e) {
      console.error("Activate theme error:", e);
    } finally {
      setActivatingId(null);
    }
  };

  // Deactivate Theme Handler
  const handleDeactivateTheme = async () => {
    if (!user) return;
    setActivatingId("deactivate");
    try {
      await saveAppearanceSettings(user.uid, { activeThemeId: "" });
    } catch (e) {
      console.error("Deactivate theme error:", e);
    } finally {
      setActivatingId(null);
    }
  };

  // Upload Theme File Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadedFileName(file.name);
    setUploadingFile(true);
    setTimeout(async () => {
      try {
        const customId = `custom-${Date.now()}`;
        const newInstalled = [...(appearance.installedThemeIds || []), customId];
        await saveAppearanceSettings(user.uid, {
          activeThemeId: customId,
          installedThemeIds: newInstalled
        });
        setUploadSuccess(true);
        setTimeout(() => {
          setUploadSuccess(false);
          setShowUploadForm(false);
          router.push("/appearance?tab=themes");
        }, 1500);
      } catch (err) {
        console.error(err);
      } finally {
        setUploadingFile(false);
      }
    }, 1200);
  };

  // Save Font Handler
  const handleSelectFont = async (fontId: string) => {
    if (!user) return;
    try {
      await saveAppearanceSettings(user.uid, { activeFont: fontId });
    } catch (e) {
      console.error("Save font error:", e);
    }
  };

  // Save Custom CSS Handler
  const handleSaveCss = async () => {
    if (!user) return;
    setSavingCss(true);
    try {
      await saveAppearanceSettings(user.uid, { customCss });
      setSavedCssSuccess(true);
      setTimeout(() => setSavedCssSuccess(false), 2500);
    } catch (e) {
      console.error("Save CSS error:", e);
    } finally {
      setSavingCss(false);
    }
  };

  const activeTheme = AVAILABLE_THEMES.find(t => t.id === appearance.activeThemeId);
  const activeCount = appearance.activeThemeId ? 1 : 0;

  // Filtered themes logic
  const filteredThemes = AVAILABLE_THEMES.filter(theme => {
    const matchesSearch = theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          theme.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (themeFilter === "popular") return matchesSearch;
    if (themeFilter === "latest") return matchesSearch && (theme.category === "latest" || theme.id === "twentytwentyfive" || theme.id === "neve" || theme.id === "blocksy");
    if (themeFilter === "block") return matchesSearch && (theme.category === "block" || theme.tags.includes("Site Editor") || theme.tags.includes("Full Site Editing"));
    if (themeFilter === "favorites") return matchesSearch && (theme.id === appearance.activeThemeId || theme.id === "astra" || theme.id === "kadence");
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <AnimatePresence mode="wait">

        {/* ── PAGE 1: THEMES MAIN PAGE (tab=themes) ── */}
        {activeTab === "themes" && (
          <motion.div key="themes-page" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Header (Matching Screenshot 1: "Themes (1) [Add Theme]") */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-normal text-slate-800 tracking-tight">Themes</h1>
                <span className="w-6 h-6 rounded-full bg-slate-600 text-white text-xs font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              </div>

              <Link
                href="/appearance?tab=add-theme"
                className="px-4 py-1.5 bg-white border border-[#635BFF] text-[#635BFF] hover:bg-[#635BFF] hover:text-white rounded text-sm font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5"
              >
                Add Theme
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : activeTheme ? (
              /* Active Theme Hero Detail Card (Matching Screenshot 1 & 2) */
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Mockup / Preview Image (Matching Screenshot 1) */}
                  <div className="lg:col-span-6 rounded-lg border border-slate-300 bg-slate-50 overflow-hidden shadow-xs">
                    <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-sans">
                      <span className="font-bold text-slate-800">✶ {activeTheme.name}</span>
                      <div className="flex items-center gap-4 text-slate-500">
                        <span>Home</span>
                        <span>Pages</span>
                        <span>Posts</span>
                        <span>Patterns</span>
                        <span>Templates</span>
                      </div>
                    </div>
                    <div className="p-8 text-center bg-white border-b border-slate-100 min-h-[160px] flex flex-col justify-center items-center">
                      <h3 className="text-xl font-serif font-bold text-slate-900 max-w-sm mb-3">
                        {activeTheme.headlineText || "A commitment to innovation and sustainability"}
                      </h3>
                      <p className="text-[11px] text-slate-500 max-w-xs mb-4">
                        Études is a pioneering firm that seamlessly merges creativity and functionality to redefine architectural excellence.
                      </p>
                      <span className="px-3 py-1 bg-black text-white text-[10px] font-bold rounded">Learn More</span>
                    </div>
                    <div className="h-44 bg-slate-200 overflow-hidden">
                      <img src={activeTheme.previewImage} alt={activeTheme.name} className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Right Metadata & Details (Matching Screenshot 1) */}
                  <div className="lg:col-span-6 space-y-4">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 bg-slate-800 text-white text-[11px] font-bold rounded mb-2">
                        Active Theme
                      </span>
                      <h2 className="text-3xl font-serif text-slate-900 tracking-tight">
                        {activeTheme.name} <span className="text-xs font-sans text-slate-400">Version: {activeTheme.version}</span>
                      </h2>
                      <p className="text-xs text-slate-600 mt-1">
                        By <a href="#" className="text-blue-600 hover:underline">{activeTheme.author}</a>
                      </p>
                    </div>

                    {/* Update Available Box (Matching Screenshot 1) */}
                    {activeTheme.hasUpdate && (
                      <div className="p-4 rounded bg-[#FFFBEB] border-l-4 border-amber-500 border border-amber-200 text-slate-800 space-y-1">
                        <h4 className="font-bold text-sm text-slate-900">Update Available</h4>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          There is a new version of {activeTheme.name} available.{" "}
                          <a href="#" className="text-blue-600 hover:underline">View version {activeTheme.updateVersion} details</a> or{" "}
                          <a href="#" className="text-blue-600 hover:underline">update now</a>.
                        </p>
                      </div>
                    )}

                    <div>
                      <a href="#" className="text-xs text-blue-600 hover:underline">Enable auto-updates</a>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pt-2">
                      {activeTheme.description}
                    </p>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-600 leading-normal">
                        <strong>Tags:</strong> {activeTheme.tags.join(", ")}
                      </p>
                    </div>

                    {/* Deactivate Option */}
                    <div className="pt-2">
                      <button
                        onClick={handleDeactivateTheme}
                        disabled={activatingId === "deactivate"}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline"
                      >
                        Deactivate current theme
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar Buttons (Matching Screenshot 2: [Customize] [Fonts]) */}
                <div className="pt-6 border-t border-slate-200 flex items-center gap-3">
                  <Link
                    href="/appearance?tab=editors"
                    className="px-6 py-2 bg-[#4361ee] hover:bg-[#3751d7] text-white text-sm font-semibold rounded transition-colors shadow-xs"
                  >
                    Customize
                  </Link>
                  <Link
                    href="/appearance?tab=fonts"
                    className="px-6 py-2 bg-white border border-[#4361ee] text-[#4361ee] hover:bg-blue-50 text-sm font-semibold rounded transition-colors"
                  >
                    Fonts
                  </Link>
                </div>
              </div>
            ) : (
              /* EMPTY STATE: By default no theme */
              <div className="bg-white border border-slate-200 rounded-xl p-16 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Palette className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">No Theme Currently Active</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    By default, no theme is active for your project. Click <strong>Add Theme</strong> to browse popular themes or upload your own theme file.
                  </p>
                </div>
                <Link
                  href="/appearance?tab=add-theme"
                  className="px-5 py-2.5 bg-[#635BFF] hover:bg-[#5249e6] text-white text-xs font-bold rounded-lg transition-all inline-flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" /> Add Theme
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* ── PAGE 2: ADD THEMES / UPLOAD THEME PAGE (tab=add-theme) ── */}
        {activeTab === "add-theme" && (
          <motion.div key="add-theme-page" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Header (Matching Screenshot 3 & 4: "Add Themes [Upload Theme]") */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <Link href="/appearance?tab=themes" className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-2xl font-normal text-slate-800 tracking-tight">Add Themes</h1>
              </div>

              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="px-4 py-1.5 bg-white border border-[#635BFF] text-[#635BFF] hover:bg-[#635BFF] hover:text-white rounded text-sm font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Theme
              </button>
            </div>

            {/* Expandable Upload Theme File Form */}
            <AnimatePresence>
              {showUploadForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-slate-50 border border-slate-300 rounded-xl p-6 text-center space-y-4 mb-6">
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      If you have a theme in a <strong>.zip</strong> or <strong>.json</strong> format, you may install it by uploading it here.
                    </p>
                    <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
                      <label className="flex-1 cursor-pointer bg-white border border-dashed border-slate-400 hover:border-blue-500 rounded-lg p-3 text-xs font-mono text-slate-600 transition-colors truncate">
                        {uploadedFileName || "Choose file..."}
                        <input type="file" accept=".zip,.json" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                    {uploadingFile && (
                      <div className="flex items-center justify-center gap-2 text-xs font-medium text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading & Installing theme...
                      </div>
                    )}
                    {uploadSuccess && (
                      <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" /> Theme uploaded & activated in real time!
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Directory Filter Bar (Matching Screenshot 3 & 4) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
                <span className="px-3 py-1 rounded-full bg-slate-700 text-white text-xs font-bold">
                  8527
                </span>
                {[
                  { id: "popular", label: "Popular" },
                  { id: "latest", label: "Latest" },
                  { id: "block", label: "Block Themes" },
                  { id: "favorites", label: "Favorites" },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setThemeFilter(f.id as any)}
                    className={`px-3.5 py-1 rounded text-xs font-semibold transition-all ${
                      themeFilter === f.id
                        ? "bg-blue-50 text-blue-600 border border-blue-200 font-bold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <button className="px-3 py-1 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Feature Filter
                </button>
              </div>

              {/* Search Themes Input (Matching Screenshot 3 & 4) */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-slate-500 font-medium shrink-0">Search Themes</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder=""
                  className="w-full md:w-64 px-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Theme Directory Grid (Matching Screenshot 4 with Hover Overlay) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredThemes.map(theme => {
                const isActive = appearance.activeThemeId === theme.id;
                const isActivating = activatingId === theme.id;

                return (
                  <div
                    key={theme.id}
                    className={`bg-white border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between transition-all group ${
                      isActive ? "ring-2 ring-blue-600 border-blue-600" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      {/* Theme Thumbnail Preview Container with Hover Overlay (Matching Screenshot 4) */}
                      <div className="relative h-48 bg-slate-900 overflow-hidden">
                        <img
                          src={theme.previewImage}
                          alt={theme.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                        />

                        {/* Top Installed Badge if active */}
                        {isActive && (
                          <div className="absolute top-0 left-0 bg-emerald-50 text-emerald-800 border-b border-r border-emerald-200 px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-xs z-10">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Installed
                          </div>
                        )}

                        {/* 🎯 HOVER OVERLAY: "Details & Preview" button (Matching Screenshot 4) */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 z-20">
                          <button
                            onClick={() => setPreviewThemeModal(theme)}
                            className="px-6 py-2.5 bg-[#252836] hover:bg-slate-900 text-white font-bold text-xs rounded-md shadow-xl border border-white/20 transition-all scale-95 group-hover:scale-100"
                          >
                            Details & Preview
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar (Matching Screenshot 4: Active vs Inactive state) */}
                    {isActive ? (
                      /* Active Theme Bottom Bar (Blue Title Badge + [Activated] + [Customize]) */
                      <div className="flex items-center justify-between border-t border-slate-200 bg-white">
                        <div className="bg-[#3b82f6] text-white px-3.5 py-2 text-xs font-semibold flex-1 truncate">
                          {theme.name}
                        </div>
                        <div className="flex items-center border-l border-slate-200">
                          <span className="bg-[#e2e8f0] text-slate-700 text-xs font-semibold px-3 py-2 border-r border-slate-200">
                            Activated
                          </span>
                          <Link
                            href="/appearance?tab=editors"
                            className="bg-white text-[#3b82f6] hover:bg-blue-50 text-xs font-bold px-3 py-2"
                          >
                            Customize
                          </Link>
                        </div>
                      </div>
                    ) : (
                      /* Inactive Theme Bottom Bar (Title on left + [Install] [Preview] on right) */
                      <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{theme.name}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleActivateTheme(theme.id)}
                            disabled={isActivating}
                            className="px-3.5 py-1.5 bg-[#3b82f6] hover:bg-blue-600 text-white text-xs font-bold rounded transition-all flex items-center gap-1 disabled:opacity-60"
                          >
                            {isActivating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            {isActivating ? "Installing..." : "Install"}
                          </button>
                          <button
                            onClick={() => setPreviewThemeModal(theme)}
                            className="px-3.5 py-1.5 bg-white border border-[#3b82f6] text-[#3b82f6] hover:bg-blue-50 text-xs font-semibold rounded transition-colors"
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── 3. EDITORS TAB (tab=editors) ── */}
        {activeTab === "editors" && (
          <motion.div key="editors" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Code className="w-5 h-5 text-blue-600" /> Custom Theme Code & CSS Editor
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Write custom CSS rules to override active theme styling in real-time.
                  </p>
                </div>
                {savedCssSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs text-emerald-400 p-4">
                <textarea
                  value={customCss}
                  onChange={e => setCustomCss(e.target.value)}
                  rows={14}
                  className="w-full bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                  placeholder="/* Add custom CSS rules here */"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleSaveCss}
                  disabled={savingCss}
                  className="px-6 py-2 bg-[#4361ee] hover:bg-[#3751d7] text-white text-xs font-bold rounded transition-all shadow-xs flex items-center gap-2 disabled:opacity-60"
                >
                  {savingCss ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {savingCss ? "Saving Styles..." : "Save CSS Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── 4. FONTS TAB (tab=fonts) ── */}
        {activeTab === "fonts" && (
          <motion.div key="fonts" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Type className="w-5 h-5 text-purple-600" /> Typography & Fonts
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select the primary font family used across your project.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FONTS.map(font => {
                  const isSelected = appearance.activeFont === font.id;

                  return (
                    <div
                      key={font.id}
                      onClick={() => handleSelectFont(font.id)}
                      className={`p-5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/30"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-slate-800 text-sm">{font.name}</span>
                        {isSelected && (
                          <span className="px-2.5 py-0.5 bg-purple-600 text-white rounded-full text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active Font
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 truncate" style={{ fontFamily: font.id }}>
                        {font.preview}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DETAILS & PREVIEW MODAL ── */}
      <AnimatePresence>
        {previewThemeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{previewThemeModal.name} Details & Preview</h3>
                  <span className="text-xs text-slate-500 font-mono">v{previewThemeModal.version}</span>
                </div>
                <button
                  onClick={() => setPreviewThemeModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="h-64 rounded-xl bg-slate-900 overflow-hidden border border-slate-200 relative">
                  <img src={previewThemeModal.previewImage} alt={previewThemeModal.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-xs text-white p-3 rounded-lg max-w-md border border-white/10">
                    <p className="text-xs font-bold">{previewThemeModal.headlineText || previewThemeModal.name}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">About {previewThemeModal.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{previewThemeModal.description}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2">Features & Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {previewThemeModal.tags.map(t => (
                      <span key={t} className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500">By {previewThemeModal.author}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPreviewThemeModal(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleActivateTheme(previewThemeModal.id)}
                    disabled={activatingId === previewThemeModal.id}
                    className="px-5 py-2 bg-[#3b82f6] hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-60"
                  >
                    {activatingId === previewThemeModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {activatingId === previewThemeModal.id ? "Installing..." : "Install & Activate"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function AppearancePage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}>
      <AppearanceContent />
    </Suspense>
  );
}
