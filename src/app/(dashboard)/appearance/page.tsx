"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, Sparkles, CheckCircle2, Download, Search, ExternalLink,
  Code, Type, Check, RefreshCw, Loader2, ArrowUpRight, Upload, Sliders,
  Plus, X, AlertTriangle, ArrowLeft, Layers, Eye, Star, Filter, RotateCcw,
  Compass, Layout, FileText, ChevronRight, Image as ImageIcon, Circle, Moon,
  MoreVertical, FilePlus, LayoutGrid, CheckSquare, Settings2, SlidersHorizontal,
  Trash2, Link as LinkIcon, Edit3
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToAppearanceSettings,
  saveAppearanceSettings,
  AppearanceSettingsData,
  defaultAppearanceSettings,
  SitePageItem,
  SiteNavItem
} from "@/lib/firestore";
import {
  FULL_THEMES_CATALOG,
  ThemeItem,
  FILTER_SUBJECTS,
  FILTER_FEATURES,
  FILTER_LAYOUTS
} from "@/lib/themes-catalog";
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

  // Feature Filter Panel Toggle & Selection State
  const [showFeatureFilterPanel, setShowFeatureFilterPanel] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>([]);

  // ─── SITE EDITOR STATE (Connected to Backend Real-Time) ───
  const [editorSection, setEditorSection] = useState<"identity" | "styles" | "pages" | "navigation" | "patterns" | "templates">("identity");
  const [editorSubFilter, setEditorSubFilter] = useState("all");

  // Site Identity Fields
  const [siteTitle, setSiteTitle] = useState(defaultAppearanceSettings.siteTitle || "Social Media Posting");
  const [siteTagline, setSiteTagline] = useState(defaultAppearanceSettings.siteTagline || "Connecting in A Better Way!");
  const [savingIdentity, setSavingIdentity] = useState(false);

  // Custom Pages & Navigation State
  const [sitePages, setSitePages] = useState<SitePageItem[]>(defaultAppearanceSettings.pages || []);
  const [siteNav, setSiteNav] = useState<SiteNavItem[]>(defaultAppearanceSettings.navigation || []);

  // Modals for Adding Page & Link
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");

  const [showAddNavModal, setShowAddNavModal] = useState(false);
  const [newNavLabel, setNewNavLabel] = useState("");
  const [newNavUrl, setNewNavUrl] = useState("");

  // Custom CSS State
  const [customCss, setCustomCss] = useState(defaultAppearanceSettings.customCss || "");
  const [savingCss, setSavingCss] = useState(false);
  const [savedCssSuccess, setSavedCssSuccess] = useState(false);

  // Color Palette Selection
  const [activePalette, setActivePalette] = useState("#000000");

  // 🔴 Real-time listener for Appearance Settings
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToAppearanceSettings(user.uid, (data) => {
      setAppearance(data);
      if (data.siteTitle !== undefined) setSiteTitle(data.siteTitle);
      if (data.siteTagline !== undefined) setSiteTagline(data.siteTagline);
      if (data.customCss !== undefined) setCustomCss(data.customCss);
      if (data.primaryColor !== undefined) setActivePalette(data.primaryColor);
      if (data.pages) setSitePages(data.pages);
      if (data.navigation) setSiteNav(data.navigation);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Real-time Identity Save Handler
  const handleSaveIdentity = async (newTitle: string, newTagline: string) => {
    setSiteTitle(newTitle);
    setSiteTagline(newTagline);
    if (!user) return;
    setSavingIdentity(true);
    try {
      await saveAppearanceSettings(user.uid, {
        siteTitle: newTitle,
        siteTagline: newTagline,
      });
    } catch (e) {
      console.error("Save Identity Error:", e);
    } finally {
      setSavingIdentity(false);
    }
  };

  // Real-time Palette Save Handler
  const handleSavePalette = async (hexColor: string) => {
    setActivePalette(hexColor);
    if (!user) return;
    try {
      await saveAppearanceSettings(user.uid, { primaryColor: hexColor });
    } catch (e) {
      console.error("Save Palette Error:", e);
    }
  };

  // Real-time Page Creation Handler
  const handleCreatePage = async () => {
    if (!newPageTitle || !user) return;
    const newPage: SitePageItem = {
      id: `page-${Date.now()}`,
      title: newPageTitle,
      slug: newPageSlug || `/${newPageTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      status: "Published",
      author: user.email?.split("@")[0] || "Admin",
      updatedAt: new Date().toISOString().split("T")[0],
    };
    const updated = [newPage, ...sitePages];
    setSitePages(updated);
    setShowAddPageModal(false);
    setNewPageTitle("");
    setNewPageSlug("");
    try {
      await saveAppearanceSettings(user.uid, { pages: updated });
    } catch (e) {
      console.error("Create Page Error:", e);
    }
  };

  // Real-time Page Deletion Handler
  const handleDeletePage = async (pageId: string) => {
    if (!user) return;
    const updated = sitePages.filter(p => p.id !== pageId);
    setSitePages(updated);
    try {
      await saveAppearanceSettings(user.uid, { pages: updated });
    } catch (e) {
      console.error("Delete Page Error:", e);
    }
  };

  // Real-time Navigation Item Creation Handler
  const handleCreateNav = async () => {
    if (!newNavLabel || !user) return;
    const newNav: SiteNavItem = {
      id: `nav-${Date.now()}`,
      label: newNavLabel,
      url: newNavUrl || `/${newNavLabel.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      order: siteNav.length + 1,
    };
    const updated = [...siteNav, newNav];
    setSiteNav(updated);
    setShowAddNavModal(false);
    setNewNavLabel("");
    setNewNavUrl("");
    try {
      await saveAppearanceSettings(user.uid, { navigation: updated });
    } catch (e) {
      console.error("Create Nav Error:", e);
    }
  };

  // Real-time Navigation Item Deletion Handler
  const handleDeleteNav = async (navId: string) => {
    if (!user) return;
    const updated = siteNav.filter(n => n.id !== navId);
    setSiteNav(updated);
    try {
      await saveAppearanceSettings(user.uid, { navigation: updated });
    } catch (e) {
      console.error("Delete Nav Error:", e);
    }
  };

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

  // Toggle Checkboxes for Feature Filter
  const toggleSubjectFilter = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const toggleFeatureFilter = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const toggleLayoutFilter = (layout: string) => {
    setSelectedLayouts(prev =>
      prev.includes(layout) ? prev.filter(l => l !== layout) : [...prev, layout]
    );
  };

  const clearAllFeatureFilters = () => {
    setSelectedSubjects([]);
    setSelectedFeatures([]);
    setSelectedLayouts([]);
  };

  const activeTheme = AVAILABLE_THEMES.find(t => t.id === appearance.activeThemeId);
  const activeCount = appearance.activeThemeId ? 1 : 0;

  // Real-time Multi-Criteria Filtered Themes logic
  const filteredThemes = AVAILABLE_THEMES.filter(theme => {
    const matchesSearch = !searchQuery ||
      theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesTab = true;
    if (themeFilter === "latest") {
      matchesTab = (theme.category === "latest" || theme.id === "twentytwentyfive" || theme.id === "neve" || theme.id === "blocksy");
    } else if (themeFilter === "block") {
      matchesTab = (theme.category === "block" || theme.tags.includes("Site Editor") || theme.tags.includes("Full Site Editing"));
    } else if (themeFilter === "favorites") {
      matchesTab = (theme.id === appearance.activeThemeId || theme.id === "astra" || theme.id === "kadence");
    }

    const matchesSubject = selectedSubjects.length === 0 || selectedSubjects.includes(theme.subject);
    const matchesFeature = selectedFeatures.length === 0 || selectedFeatures.some(f => theme.features.includes(f));
    const matchesLayout = selectedLayouts.length === 0 || selectedLayouts.some(l => theme.layout.includes(l));

    return matchesSearch && matchesTab && matchesSubject && matchesFeature && matchesLayout;
  });

  const hasActiveFeatureFilters = selectedSubjects.length > 0 || selectedFeatures.length > 0 || selectedLayouts.length > 0;

  // Sub-filtered Pages list
  const filteredSitePages = sitePages.filter(p => {
    if (editorSubFilter === "all") return true;
    return p.status.toLowerCase() === editorSubFilter.toLowerCase();
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <AnimatePresence mode="wait">

        {/* ── PAGE 1: THEMES MAIN PAGE (tab=themes) ── */}
        {activeTab === "themes" && (
          <motion.div key="themes-page" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
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
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-6 rounded-lg border border-slate-300 bg-slate-50 overflow-hidden shadow-xs">
                    <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-sans">
                      <span className="font-bold text-slate-800">✶ {siteTitle || activeTheme.name}</span>
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
                        {siteTagline || "Études is a pioneering firm that seamlessly merges creativity and functionality to redefine architectural excellence."}
                      </p>
                      <span className="px-3 py-1 bg-black text-white text-[10px] font-bold rounded">About us</span>
                    </div>
                    <div className="h-44 bg-slate-200 overflow-hidden">
                      <img src={activeTheme.previewImage} alt={activeTheme.name} className="w-full h-full object-cover" />
                    </div>
                  </div>

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

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
                  <span className="w-7 h-7 rounded-full bg-[#555d66] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {filteredThemes.length}
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
                      className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                        themeFilter === f.id
                          ? "bg-slate-100 text-slate-900 border border-slate-300 font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  <button
                    onClick={() => setShowFeatureFilterPanel(!showFeatureFilterPanel)}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                      showFeatureFilterPanel || hasActiveFeatureFilters
                        ? "bg-[#555d66] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" /> ⚙ Feature Filter
                  </button>
                </div>

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

              <AnimatePresence>
                {showFeatureFilterPanel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-slate-200 pt-4 mt-3"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setShowFeatureFilterPanel(false)}
                        className="px-4 py-1.5 bg-white border border-[#3b82f6] text-[#3b82f6] hover:bg-blue-50 text-xs font-semibold rounded shadow-2xs transition-colors"
                      >
                        Apply Filters
                      </button>

                      {hasActiveFeatureFilters && (
                        <button
                          onClick={clearAllFeatureFilters}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold hover:underline"
                        >
                          <RotateCcw className="w-3 h-3" /> Clear All Filters
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
                        <h4 className="font-bold text-slate-800 text-xs mb-3 pb-1 border-b border-slate-100">Subject</h4>
                        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                          {FILTER_SUBJECTS.map(subj => {
                            const checked = selectedSubjects.includes(subj);
                            return (
                              <label key={subj} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-blue-600 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSubjectFilter(subj)}
                                  className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span>{subj}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
                        <h4 className="font-bold text-slate-800 text-xs mb-3 pb-1 border-b border-slate-100">Features</h4>
                        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                          {FILTER_FEATURES.map(feat => {
                            const checked = selectedFeatures.includes(feat);
                            return (
                              <label key={feat} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-blue-600 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleFeatureFilter(feat)}
                                  className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span>{feat}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
                        <h4 className="font-bold text-slate-800 text-xs mb-3 pb-1 border-b border-slate-100">Layout</h4>
                        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                          {FILTER_LAYOUTS.map(lay => {
                            const checked = selectedLayouts.includes(lay);
                            return (
                              <label key={lay} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-blue-600 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleLayoutFilter(lay)}
                                  className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span>{lay}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => setShowFeatureFilterPanel(false)}
                        className="px-4 py-2 bg-white border border-[#3b82f6] text-[#3b82f6] hover:bg-blue-50 text-xs font-semibold rounded shadow-2xs transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {filteredThemes.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                <p className="text-sm font-bold text-slate-800">No themes match your active filters</p>
                <p className="text-xs text-slate-500">Try clearing some subject, feature, or layout checkboxes.</p>
                <button
                  onClick={clearAllFeatureFilters}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg transition-all shadow-xs"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
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
                        <div className="relative h-48 bg-slate-900 overflow-hidden">
                          <img
                            src={theme.previewImage}
                            alt={theme.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                          />

                          {isActive && (
                            <div className="absolute top-0 left-0 bg-emerald-50 text-emerald-800 border-b border-r border-emerald-200 px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-xs z-10">
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Installed
                            </div>
                          )}

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

                      {isActive ? (
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
            )}
          </motion.div>
        )}

        {/* ── 3. FULL SITE EDITOR TAB (tab=editors) (Connected to Backend Real-Time) ── */}
        {activeTab === "editors" && (
          <motion.div key="editors-page" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-[750px] rounded-2xl overflow-hidden border border-slate-800 bg-[#1e1e1e] flex flex-col md:flex-row shadow-2xl text-white">

            {/* Left Dark Navigation Sidebar */}
            <div className="w-full md:w-64 bg-[#1e1e1e] border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-normal text-white flex items-center gap-2 tracking-tight">
                    <span className="text-slate-400 font-light text-base cursor-pointer hover:text-white" onClick={() => router.push("/appearance?tab=themes")}>‹</span> Design
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Customize the appearance of your website using the block editor.
                  </p>
                </div>

                <div className="space-y-1">
                  {[
                    { id: "identity", label: "Identity", icon: <Circle className="w-4 h-4 stroke-[1.5]" /> },
                    { id: "styles", label: "Styles", icon: <Moon className="w-4 h-4 stroke-[1.5]" /> },
                    { id: "pages", label: "Pages", icon: <FileText className="w-4 h-4 stroke-[1.5]" />, hasArrow: true },
                    { id: "navigation", label: "Navigation", icon: <Compass className="w-4 h-4 stroke-[1.5]" />, hasArrow: true },
                    { id: "patterns", label: "Patterns", icon: <Sparkles className="w-4 h-4 stroke-[1.5]" />, hasArrow: true },
                    { id: "templates", label: "Templates", icon: <Layout className="w-4 h-4 stroke-[1.5]" />, hasArrow: true },
                  ].map(item => {
                    const isSelected = editorSection === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setEditorSection(item.id as any)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-[#2c2c2c] text-white font-semibold"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          {item.icon}
                          {item.label}
                        </span>
                        {item.hasArrow && <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Real-time Status Indicator */}
              <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  {savingIdentity || savingCss ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Saved
                    </>
                  )}
                </span>
                <span className="text-[10px] text-slate-500">Live Sync</span>
              </div>
            </div>

            {/* Middle Controls & Settings Column + Right Live Preview Canvas */}
            <div className="flex-1 bg-slate-900 flex flex-col md:flex-row overflow-hidden">

              {/* ── 1. IDENTITY SECTION ── */}
              {editorSection === "identity" && (
                <div className="flex-1 flex flex-col md:flex-row w-full overflow-hidden">
                  <div className="w-full md:w-80 bg-white text-slate-900 p-6 space-y-6 border-r border-slate-200 overflow-y-auto">
                    <div>
                      <h3 className="text-xl font-normal text-slate-900 tracking-tight">Identity</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold tracking-wider text-slate-600 uppercase mb-1.5">
                          Site Title
                        </label>
                        <input
                          type="text"
                          value={siteTitle}
                          onChange={e => handleSaveIdentity(e.target.value, siteTagline)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Displays in your site's layout via the Site Title block.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold tracking-wider text-slate-600 uppercase mb-1.5">
                          Site Tagline
                        </label>
                        <input
                          type="text"
                          value={siteTagline}
                          onChange={e => handleSaveIdentity(siteTitle, e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          In a few words, explain what this site is about. Displays in your site's layout via the Site Tagline block.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold tracking-wider text-slate-600 uppercase mb-1.5">
                          Site Logo
                        </label>
                        <div className="border-2 border-dashed border-blue-400/60 rounded-xl p-4 text-center cursor-pointer hover:border-blue-600 transition-colors bg-blue-50/20">
                          <span className="text-xs text-blue-600 font-semibold">Choose logo</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Displays in your site's layout via the Site Logo block.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold tracking-wider text-slate-600 uppercase mb-1.5">
                          Site Icon
                        </label>
                        <div className="border-2 border-dashed border-blue-400/60 rounded-xl p-4 text-center cursor-pointer hover:border-blue-600 transition-colors bg-blue-50/20">
                          <span className="text-xs text-blue-600 font-semibold">Choose icon</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Shown in browser tabs, bookmarks, and mobile apps. It should be square and at least 512 by 512 pixels.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-100 p-8 overflow-y-auto flex justify-center items-start">
                    <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden text-slate-900 transition-all">
                      <div className="p-6 border-b border-slate-100 flex items-center justify-between" style={{ borderTop: `4px solid ${activePalette}` }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                            /
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-base">{siteTitle || "Social Media Posting"}</h4>
                            <p className="text-xs text-slate-500">{siteTagline || "Connecting in A Better Way!"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                          {siteNav.map(nav => (
                            <span key={nav.id}>{nav.label}</span>
                          ))}
                        </div>
                      </div>

                      <div className="p-10 text-center space-y-4">
                        <h2 className="text-3xl font-serif font-bold text-slate-900 max-w-md mx-auto">
                          A commitment to innovation and sustainability
                        </h2>
                        <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                          {siteTagline || "Études is a pioneering firm that seamlessly merges creativity and functionality to redefine architectural excellence."}
                        </p>
                        <button className="px-5 py-2 text-white text-xs font-bold rounded-lg shadow-sm" style={{ backgroundColor: activePalette }}>
                          About us
                        </button>
                      </div>

                      <div className="h-56 bg-slate-200 overflow-hidden">
                        <img
                          src={activeTheme?.previewImage || "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80"}
                          alt="Live Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 2. STYLES SECTION ── */}
              {editorSection === "styles" && (
                <div className="flex-1 flex flex-col md:flex-row w-full overflow-hidden">
                  <div className="w-full md:w-80 bg-white text-slate-900 p-6 space-y-6 border-r border-slate-200 overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xl font-normal text-slate-900 tracking-tight">Styles</h3>
                      <div className="p-1 rounded bg-slate-800 text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-8 text-center space-y-4 border border-slate-300 shadow-2xs">
                      <span className="text-5xl font-serif text-slate-900 font-normal">Aa</span>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: activePalette }}></div>
                        <div className="w-5 h-5 rounded-full bg-slate-800"></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {[
                        { label: "Browse styles", hasArrow: true },
                        { label: "Typography", icon: <Type className="w-4 h-4" /> },
                        { label: "Colors", icon: <Circle className="w-4 h-4" /> },
                        { label: "Background", icon: <Layers className="w-4 h-4" /> },
                        { label: "Shadows", icon: <Sparkles className="w-4 h-4" /> },
                        { label: "Layout", icon: <Layout className="w-4 h-4" /> },
                      ].map(item => (
                        <button
                          key={item.label}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <span className="flex items-center gap-2.5">
                            {item.icon}
                            {item.label}
                          </span>
                          {item.hasArrow && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 bg-white p-8 overflow-y-auto space-y-6">
                    <div className="max-w-xl mx-auto space-y-6">
                      <h4 className="text-sm font-bold text-slate-800">Color Palette (Connected to Real-time Backend)</h4>
                      <div className="space-y-3">
                        {[
                          { hex: "#000000", label: "Black" },
                          { hex: "#3b82f6", label: "Royal Blue" },
                          { hex: "#635bff", label: "Stripe Indigo" },
                          { hex: "#10b981", label: "Emerald Green" },
                          { hex: "#f59e0b", label: "Amber Yellow" },
                          { hex: "#ef4444", label: "Coral Red" },
                          { hex: "#8b5cf6", label: "Purple Velvet" },
                          { hex: "#64748b", label: "Cool Slate" },
                        ].map(c => (
                          <div
                            key={c.hex}
                            onClick={() => handleSavePalette(c.hex)}
                            className={`h-12 rounded-lg cursor-pointer transition-all flex items-center justify-between px-4 border ${
                              activePalette === c.hex ? "ring-2 ring-blue-600 scale-[1.01]" : "border-transparent hover:opacity-90"
                            }`}
                            style={{ backgroundColor: c.hex }}
                          >
                            <span className="text-xs font-bold text-white shadow-xs">
                              {c.label} ({c.hex})
                            </span>
                            {activePalette === c.hex && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Custom CSS Code Editor */}
                      <div className="pt-6 border-t border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <Code className="w-4 h-4 text-blue-600" /> Custom Theme CSS Overrides
                          </h4>
                          {savedCssSuccess && (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Saved!
                            </span>
                          )}
                        </div>
                        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4 font-mono text-xs">
                          <textarea
                            value={customCss}
                            onChange={e => setCustomCss(e.target.value)}
                            rows={8}
                            className="w-full bg-transparent text-emerald-400 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                            placeholder="/* Add custom CSS rules here */"
                          />
                        </div>
                        <button
                          onClick={handleSaveCss}
                          disabled={savingCss}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-60"
                        >
                          {savingCss ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          {savingCss ? "Saving..." : "Save CSS Rules"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 3. PAGES SECTION (Connected to Backend Real-Time) ── */}
              {editorSection === "pages" && (
                <div className="flex-1 flex flex-col md:flex-row w-full overflow-hidden bg-white text-slate-900">
                  <div className="w-full md:w-56 bg-[#1e1e1e] text-white p-4 border-r border-slate-800 space-y-4">
                    <h3 className="text-xl font-normal text-white flex items-center gap-2">
                      ‹ Pages
                    </h3>
                    <div className="space-y-1">
                      {[
                        { id: "all", label: `All Pages (${sitePages.length})`, icon: <FileText className="w-4 h-4" /> },
                        { id: "published", label: `Published (${sitePages.filter(p=>p.status==="Published").length})`, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
                        { id: "draft", label: `Drafts (${sitePages.filter(p=>p.status==="Draft").length})`, icon: <Circle className="w-4 h-4 text-amber-400" /> },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setEditorSubFilter(f.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            editorSubFilter === f.id ? "bg-[#2c2c2c] text-white font-bold" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {f.icon}
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <h3 className="text-2xl font-normal text-slate-900">Pages</h3>
                      <button
                        onClick={() => setShowAddPageModal(true)}
                        className="px-4 py-2 bg-[#3b82f6] hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Add Page
                      </button>
                    </div>

                    <div className="space-y-3">
                      {filteredSitePages.map(p => (
                        <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{p.title}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-slate-400 font-mono">{p.slug}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === "Published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                  {p.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePage(p.id)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete Page"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── 4. NAVIGATION SECTION (Connected to Backend Real-Time) ── */}
              {editorSection === "navigation" && (
                <div className="flex-1 p-8 bg-white text-slate-900 overflow-y-auto">
                  <div className="max-w-xl mx-auto space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <h3 className="text-2xl font-normal text-slate-900">Navigation Menu</h3>
                      <button
                        onClick={() => setShowAddNavModal(true)}
                        className="px-4 py-2 bg-[#3b82f6] hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Add Link
                      </button>
                    </div>
                    <div className="space-y-2">
                      {siteNav.map((item) => (
                        <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-semibold text-xs text-slate-800">
                          <span className="flex items-center gap-3">
                            <span className="text-slate-400 cursor-grab">⋮⋮</span>
                            <LinkIcon className="w-4 h-4 text-blue-600" />
                            {item.label}
                            <span className="text-[11px] text-slate-400 font-mono">({item.url})</span>
                          </span>
                          <button
                            onClick={() => handleDeleteNav(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete Nav Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── 5. PATTERNS SECTION ── */}
              {editorSection === "patterns" && (
                <div className="flex-1 p-8 bg-white text-slate-900 overflow-y-auto">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <h3 className="text-2xl font-normal text-slate-900 pb-4 border-b border-slate-200">Block Patterns</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {["Headers & Hero", "Footers", "Galleries", "Call to Action", "Team Layouts", "Pricing Tables"].map(cat => (
                        <div key={cat} className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2 cursor-pointer hover:border-blue-500 transition-colors">
                          <Sparkles className="w-6 h-6 text-blue-600 mx-auto" />
                          <h4 className="font-bold text-xs text-slate-800">{cat}</h4>
                          <p className="text-[11px] text-slate-500">Explore pre-designed block sections</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── 6. TEMPLATES SECTION ── */}
              {editorSection === "templates" && (
                <div className="flex-1 flex flex-col md:flex-row w-full overflow-hidden bg-white text-slate-900">
                  <div className="w-full md:w-56 bg-[#1e1e1e] text-white p-4 border-r border-slate-800 space-y-4">
                    <h3 className="text-xl font-normal text-white flex items-center gap-2">
                      ‹ Templates
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Create new templates, or reset any customizations made to the templates supplied by your theme.
                    </p>
                    <div className="space-y-1 pt-2">
                      <button className="w-full text-left px-3 py-2 bg-[#2c2c2c] rounded-lg text-xs font-bold text-white flex items-center gap-2">
                        <Layout className="w-4 h-4" /> All templates
                      </button>
                      <button className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-medium text-slate-400">
                        Twenty Twenty-Four
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <h3 className="text-2xl font-normal text-slate-900">Templates</h3>
                      <button className="px-4 py-2 bg-[#3b82f6] hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm">
                        Add Template
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { title: "All Archives", desc: "Displays any archive, including posts by a single author, category, tag, taxonomy...", image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80" },
                        { title: "Blog Home", desc: "Displays the latest posts as either the site homepage or as the Posts page...", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80" },
                        { title: "Index", desc: "Used as a fallback template for all pages when a more specific template is not defined.", image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=80" },
                      ].map(t => (
                        <div key={t.title} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-3 p-4 bg-white hover:border-slate-300 transition-colors">
                          <div className="h-40 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                            <img src={t.image} alt={t.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{t.desc}</p>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                            <span>Author</span>
                            <span className="font-semibold text-slate-600">{activeTheme?.name || "Twenty Twenty-Four"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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

      {/* ── ADD PAGE MODAL ── */}
      <AnimatePresence>
        {showAddPageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-base">Add New Site Page</h3>
                <button onClick={() => setShowAddPageModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Page Title</label>
                  <input
                    type="text"
                    value={newPageTitle}
                    onChange={e => setNewPageTitle(e.target.value)}
                    placeholder="e.g. Terms of Service"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={newPageSlug}
                    onChange={e => setNewPageSlug(e.target.value)}
                    placeholder="e.g. /terms-of-service"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setShowAddPageModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleCreatePage} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm">Save & Publish</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADD NAV LINK MODAL ── */}
      <AnimatePresence>
        {showAddNavModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-base">Add Navigation Link</h3>
                <button onClick={() => setShowAddNavModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Link Label</label>
                  <input
                    type="text"
                    value={newNavLabel}
                    onChange={e => setNewNavLabel(e.target.value)}
                    placeholder="e.g. Portfolio"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target URL</label>
                  <input
                    type="text"
                    value={newNavUrl}
                    onChange={e => setNewNavUrl(e.target.value)}
                    placeholder="e.g. /portfolio"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setShowAddNavModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleCreateNav} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm">Save Link</button>
              </div>
            </motion.div>
          </div>
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
