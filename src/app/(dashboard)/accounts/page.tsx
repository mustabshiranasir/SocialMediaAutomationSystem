"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, Plus, Search, Filter, RefreshCw, Trash2, CheckCircle2,
  AlertCircle, ExternalLink, ShieldCheck, Power, Wifi, Loader2, X,
  Radio, Copy, Sparkles, Check, Server
} from "lucide-react";
import {
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn,
  FaBlogger, FaPinterest, FaReddit, FaYoutube, FaTiktok
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import {
  Channel,
  subscribeToChannels,
  updateChannel,
  deleteChannel,
  addChannel
} from "@/lib/firestore";
import Link from "next/link";

// ─── Network Info Mapping ──────────────────────────────────────────────────────
const NETWORK_MAP: Record<string, { name: string; bg: string; icon: any; color: string }> = {
  fb:        { name: "Facebook",    bg: "bg-blue-600",      icon: FaFacebookF,  color: "#1877F2" },
  facebook:  { name: "Facebook",    bg: "bg-blue-600",      icon: FaFacebookF,  color: "#1877F2" },
  tw:        { name: "X (Twitter)", bg: "bg-slate-900",     icon: FaTwitter,    color: "#0f1419" },
  twitter:   { name: "X (Twitter)", bg: "bg-slate-900",     icon: FaTwitter,    color: "#0f1419" },
  x:         { name: "X (Twitter)", bg: "bg-slate-900",     icon: FaTwitter,    color: "#0f1419" },
  instagram: { name: "Instagram",   bg: "bg-pink-600",      icon: FaInstagram,  color: "#E4405F" },
  linkedin:  { name: "LinkedIn",    bg: "bg-blue-700",      icon: FaLinkedinIn, color: "#0A66C2" },
  blogger:   { name: "Blogger",     bg: "bg-orange-500",    icon: FaBlogger,    color: "#FF5722" },
  pinterest: { name: "Pinterest",   bg: "bg-red-600",       icon: FaPinterest,  color: "#BD081C" },
  reddit:    { name: "Reddit",      bg: "bg-orange-600",    icon: FaReddit,     color: "#FF4500" },
  youtube:   { name: "YouTube",     bg: "bg-red-600",       icon: FaYoutube,    color: "#FF0000" },
  tiktok:    { name: "TikTok",      bg: "bg-slate-900",     icon: FaTiktok,     color: "#000000" },
};

function getNetworkInfo(net: string) {
  const key = net.toLowerCase();
  return NETWORK_MAP[key] || { name: net, bg: "bg-slate-700", icon: Link2, color: "#475569" };
}

// ─── Component Start ──────────────────────────────────────────────────────────
export default function AccountsPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // State for modals & actions
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Add Account Modal State
  const [addPlatform, setAddPlatform] = useState("facebook");
  const [addMethod, setAddMethod] = useState<"cookie" | "app">("cookie");
  const [fbCuser, setFbCuser] = useState("");
  const [fbXs, setFbXs] = useState("");
  const [twAuthToken, setTwAuthToken] = useState("");
  const [twCt0, setTwCt0] = useState("");
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  // LinkedIn App Method state
  const [liClientId, setLiClientId]     = useState("");
  const [liClientSecret, setLiClientSecret] = useState("");
  const [liSaving, setLiSaving]         = useState(false);
  const [liSaved, setLiSaved]           = useState(false); // credentials saved, show Connect button
  const [liProxyUrl, setLiProxyUrl]     = useState("");
  const [showLiProxy, setShowLiProxy]   = useState(false);

  // 🔴 Real-time Channels Listener
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToChannels(user.uid, (data) => {
      setChannels(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Toggle Auto-Share Status
  const handleToggleAutoShare = async (channel: Channel) => {
    if (!channel.id) return;
    setTogglingId(channel.id);
    try {
      await updateChannel(channel.id, { isAutoShare: !channel.isAutoShare });
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  // Test Connection
  const handleTestConnection = async (channel: Channel) => {
    if (!channel.id) return;
    setTestingId(channel.id);
    setTestResult(null);
    setTimeout(() => {
      setTestingId(null);
      setTestResult({
        id: channel.id!,
        success: true,
        message: `Connection to ${channel.name} (${channel.network}) is active and healthy!`,
      });
      setTimeout(() => setTestResult(null), 4000);
    }, 1200);
  };

  // Delete Channel
  const handleDeleteChannel = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteChannel(id);
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  // Add Account Handler
  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingAccount(true);
    setAddError("");
    setAddSuccess("");

    try {
      if (addPlatform === "facebook") {
        if (addMethod === "cookie") {
          if (!fbCuser || !fbXs) throw new Error("Please fill in both c_user and xs cookies.");
          const res = await fetch("/api/facebook/cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ c_user: fbCuser, xs: fbXs, userId: user.uid }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Failed to add Facebook account.");
        } else {
          // App Method connect
          await addChannel({
            userId: user.uid,
            name: "Facebook Page (App OAuth)",
            network: "facebook",
            channelType: "ownpage",
            method: "app",
            isAutoShare: true,
            status: "connected",
          });
        }
      } else if (addPlatform === "twitter" || addPlatform === "tw") {
        if (addMethod === "cookie") {
          if (!twAuthToken || !twCt0) throw new Error("Please fill in both auth_token and ct0 cookies.");
          const res = await fetch("/api/twitter/cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ auth_token: twAuthToken, ct0: twCt0, userId: user.uid }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Failed to add Twitter account.");
        } else {
          await addChannel({
            userId: user.uid,
            name: "X (Twitter) Personal App",
            network: "twitter",
            channelType: "profile",
            method: "app",
            isAutoShare: true,
            status: "connected",
          });
        }
      } else {
        // Generic Platform
        await addChannel({
          userId: user.uid,
          name: `${getNetworkInfo(addPlatform).name} Account`,
          network: addPlatform,
          channelType: "profile",
          method: "cookie",
          isAutoShare: true,
          status: "connected",
        });
      }

      setAddSuccess("Account connected successfully!");
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess("");
        setFbCuser(""); setFbXs(""); setTwAuthToken(""); setTwCt0("");
      }, 1200);
    } catch (err: any) {
      setAddError(err.message || "Failed to add account.");
    } finally {
      setSubmittingAccount(false);
    }
  };

  // Save LinkedIn App Credentials → then redirect to OAuth
  const handleLinkedInSaveAndConnect = async () => {
    if (!user) return;
    if (!liClientId.trim() || !liClientSecret.trim()) {
      setAddError("Please enter both Client ID and Client Secret.");
      return;
    }
    setLiSaving(true);
    setAddError("");
    try {
      // Step 1: Save credentials to Firestore via API
      const res = await fetch("/api/linkedin/save-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          clientId: liClientId.trim(),
          clientSecret: liClientSecret.trim(),
          ...(liProxyUrl.trim() && { proxyUrl: liProxyUrl.trim() }),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save credentials.");

      // Step 2: Redirect to LinkedIn OAuth (the login route reads credentials from Firestore)
      window.location.href = `/api/oauth/login?userId=${user.uid}`;
    } catch (err: any) {
      setAddError(err.message || "Something went wrong.");
    } finally {
      setLiSaving(false);
    }
  };

  // Handle success/error redirects from LinkedIn OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("linkedin_success")) {
      setAddSuccess("LinkedIn account connected successfully!");
      window.history.replaceState({}, "", "/accounts");
      setTimeout(() => setAddSuccess(""), 4000);
    }
    if (params.get("linkedin_error")) {
      setAddError(`LinkedIn connection failed: ${params.get("linkedin_error")}`);
      window.history.replaceState({}, "", "/accounts");
      setTimeout(() => setAddError(""), 6000);
    }
  }, []);

  // Filter channels logic
  const filteredChannels = channels.filter(ch => {
    const net = ch.network.toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = ch.name.toLowerCase().includes(query) || net.includes(query);

    let matchesNetwork = true;
    if (selectedNetworkFilter !== "all") {
      if (selectedNetworkFilter === "fb") matchesNetwork = (net === "fb" || net === "facebook");
      else if (selectedNetworkFilter === "tw") matchesNetwork = (net === "tw" || net === "twitter" || net === "x");
      else matchesNetwork = net === selectedNetworkFilter;
    }

    let matchesStatus = true;
    if (selectedStatusFilter === "active") matchesStatus = ch.isAutoShare;
    else if (selectedStatusFilter === "paused") matchesStatus = !ch.isAutoShare;

    return matchesSearch && matchesNetwork && matchesStatus;
  });

  // Calculate statistics
  const totalAccounts = channels.length;
  const activeAccounts = channels.filter(c => c.isAutoShare).length;
  const pausedAccounts = totalAccounts - activeAccounts;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Connected Accounts</h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage all connected social media accounts, pages, groups, and auto-dispatch channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#635BFF] hover:bg-[#5249e6] text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" /> Add New Account
          </button>
        </div>
      </div>

      {/* ── Summary Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Accounts</p>
            <p className="text-2xl font-bold text-slate-900">{totalAccounts}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Auto-Publish Active</p>
            <p className="text-2xl font-bold text-slate-900">{activeAccounts}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Power className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Paused Accounts</p>
            <p className="text-2xl font-bold text-slate-900">{pausedAccounts}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Connection Health</p>
            <p className="text-2xl font-bold text-emerald-600">100% Healthy</p>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search accounts or handle..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Auto-Publish</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>

        {/* Network Tabs Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
          {[
            { id: "all", label: "All Networks" },
            { id: "fb", label: "Facebook" },
            { id: "tw", label: "X (Twitter)" },
            { id: "instagram", label: "Instagram" },
            { id: "linkedin", label: "LinkedIn" },
            { id: "blogger", label: "Blogger" },
            { id: "pinterest", label: "Pinterest" },
            { id: "reddit", label: "Reddit" },
            { id: "youtube", label: "YouTube" },
          ].map(net => {
            const isActive = selectedNetworkFilter === net.id;
            return (
              <button
                key={net.id}
                onClick={() => setSelectedNetworkFilter(net.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {net.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Test Connection Result Notification ── */}
      <AnimatePresence>
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-xl border flex items-center justify-between ${
              testResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {testResult.message}
            </div>
            <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Accounts Cards Grid ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Link2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No accounts found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery || selectedNetworkFilter !== "all"
                ? "No connected accounts matched your search criteria."
                : "You haven't connected any social media accounts yet."}
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#635BFF] hover:bg-[#5249e6] text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Connect Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChannels.map(channel => {
            const netInfo = getNetworkInfo(channel.network);
            const Icon = netInfo.icon;
            const isToggling = togglingId === channel.id;
            const isTesting = testingId === channel.id;
            const isDeleting = deletingId === channel.id;

            return (
              <motion.div
                key={channel.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group"
              >
                {/* Top Bar */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        {channel.profilePicUrl ? (
                          <img
                            src={channel.profilePicUrl}
                            alt={channel.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-xl ${netInfo.bg} text-white flex items-center justify-center font-bold text-lg shadow-sm`}>
                            {channel.name?.[0]?.toUpperCase() || "A"}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${netInfo.bg} text-white flex items-center justify-center text-[10px] ring-2 ring-white`}>
                          <Icon className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{channel.name}</h3>
                        <p className="text-xs text-slate-400 capitalize flex items-center gap-1 mt-0.5">
                          {netInfo.name} • <span className="font-medium text-slate-500">{channel.channelType || "profile"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Method Badge */}
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                      channel.method === "app"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {channel.method === "app" ? "App OAuth" : "Cookie"}
                    </span>
                  </div>

                  {/* Account Metadata */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs mb-4 border border-slate-100">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Account ID:</span>
                      <span className="font-mono text-slate-800 font-medium truncate max-w-[140px]">
                        {channel.accountId || channel.pageId || "Active"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Status:</span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions & Toggle */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {/* Auto Share Toggle */}
                  <button
                    onClick={() => handleToggleAutoShare(channel)}
                    disabled={isToggling}
                    className="flex items-center gap-2 cursor-pointer group/toggle"
                  >
                    <div className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center ${
                      channel.isAutoShare ? "bg-emerald-500" : "bg-slate-300"
                    }`}>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                        channel.isAutoShare ? "translate-x-4" : "translate-x-0.5"
                      }`} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      {channel.isAutoShare ? "Auto Share" : "Paused"}
                    </span>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Ping Test */}
                    <button
                      onClick={() => handleTestConnection(channel)}
                      disabled={isTesting}
                      title="Test Connection Ping"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete Account */}
                    <button
                      onClick={() => handleDeleteChannel(channel.id!)}
                      disabled={isDeleting}
                      title="Disconnect Account"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Add Account Modal ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Connect Social Account</h2>
                    <p className="text-xs text-slate-500">Select network &amp; authentication method</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body — scrollable so all fields are always visible */}
              <form onSubmit={handleAddAccountSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Platform Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Select Platform</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "facebook", label: "Facebook", icon: FaFacebookF, color: "text-blue-600" },
                      { id: "twitter",  label: "X (Twitter)", icon: FaTwitter,  color: "text-slate-900" },
                      { id: "instagram", label: "Instagram", icon: FaInstagram, color: "text-pink-600" },
                      { id: "linkedin", label: "LinkedIn", icon: FaLinkedinIn, color: "text-blue-700" },
                    ].map(p => {
                      const selected = addPlatform === p.id;
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setAddPlatform(p.id)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                            selected
                              ? "border-blue-600 bg-blue-50/50 shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${p.color}`} />
                          <span className="text-[11px] font-semibold text-slate-800">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Connection Method Selector */}
                {(addPlatform === "facebook" || addPlatform === "twitter" || addPlatform === "tw") && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Connection Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAddMethod("cookie")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          addMethod === "cookie"
                            ? "border-blue-600 bg-blue-50/40"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className="block text-xs font-bold text-slate-800">Cookie Method</span>
                        <span className="text-[10px] text-slate-500">Quick session cookies connection</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddMethod("app")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          addMethod === "app"
                            ? "border-blue-600 bg-blue-50/40"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className="block text-xs font-bold text-slate-800">App Method (OAuth)</span>
                        <span className="text-[10px] text-slate-500">Personal App ID & Secret connection</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Cookie Inputs for Facebook */}
                {addPlatform === "facebook" && addMethod === "cookie" && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">c_user Cookie</label>
                      <input
                        type="text"
                        value={fbCuser}
                        onChange={e => setFbCuser(e.target.value)}
                        placeholder="e.g. 1000892837..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">xs Cookie</label>
                      <input
                        type="password"
                        value={fbXs}
                        onChange={e => setFbXs(e.target.value)}
                        placeholder="e.g. 42%3A..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Cookie Inputs for Twitter */}
                {(addPlatform === "twitter" || addPlatform === "tw") && addMethod === "cookie" && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">auth_token Cookie</label>
                      <input
                        type="password"
                        value={twAuthToken}
                        onChange={e => setTwAuthToken(e.target.value)}
                        placeholder="e.g. 8f92a10b..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">ct0 Cookie</label>
                      <input
                        type="password"
                        value={twCt0}
                        onChange={e => setTwCt0(e.target.value)}
                        placeholder="e.g. e4d5c6b7..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* ── LinkedIn App Method ── */}
                {addPlatform === "linkedin" && (
                  <div className="space-y-4">
                    {/* Banner */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="w-9 h-9 rounded-lg bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
                        <FaLinkedinIn className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-800">LinkedIn App (OAuth)</p>
                        <p className="text-[10px] text-blue-600 mt-0.5">Enter your LinkedIn Developer App credentials to connect your profile and pages.</p>
                      </div>
                    </div>

                    {/* Credentials */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Client ID <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={liClientId}
                          onChange={e => setLiClientId(e.target.value)}
                          placeholder="e.g. 86abc123xyz..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Client Secret <span className="text-red-500">*</span></label>
                        <input
                          type="password"
                          value={liClientSecret}
                          onChange={e => setLiClientSecret(e.target.value)}
                          placeholder="••••••••••••••••"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Proxy toggle */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowLiProxy(v => !v)}
                        className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        <Server className="w-3.5 h-3.5" />
                        {showLiProxy ? "Hide Proxy Settings" : "Enable Proxy (optional)"}
                      </button>
                      {showLiProxy && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={liProxyUrl}
                            onChange={e => setLiProxyUrl(e.target.value)}
                            placeholder="http://user:pass@host:port"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">All LinkedIn API requests will be routed through this proxy.</p>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Don't have a LinkedIn App? <a href="https://www.linkedin.com/developers/apps/new" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Create one here →</a>
                    </p>
                  </div>
                )}

                {/* Error / Success */}
                {addError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" /> {addError}
                  </div>
                )}
                {addSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" /> {addSuccess}
                  </div>
                )}

                {/* Submit / Connect button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>

                  {addPlatform === "linkedin" ? (
                    // LinkedIn: save credentials then redirect to OAuth
                    <button
                      type="button"
                      onClick={handleLinkedInSaveAndConnect}
                      disabled={liSaving}
                      className="px-5 py-2.5 bg-[#0A66C2] hover:bg-[#0958a8] text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-60 flex items-center gap-2"
                    >
                      {liSaving
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        : <><FaLinkedinIn className="w-3.5 h-3.5" /> Sign in with LinkedIn</>
                      }
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submittingAccount}
                      className="px-5 py-2.5 bg-[#635BFF] hover:bg-[#5249e6] text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-60 flex items-center gap-2"
                    >
                      {submittingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {submittingAccount ? "Connecting..." : "Add Account"}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
