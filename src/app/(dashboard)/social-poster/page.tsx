"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Lightbulb,
  BarChart3,
  MonitorPlay,
  CalendarDays,
  Settings,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserX,
  CalendarCheck,
  CalendarX,
  Bell,
  X,
  ExternalLink,
  Trash2,
  Pencil,
  RefreshCw,
  BarChart,
  ChevronDown,
  List as ListIcon,
  Edit2,
  Search,
  LayoutGrid,
  Globe,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  MessageCircle,
  SendHorizonal,
  Link2,
  ExternalLink as ExtLink,
  Eye,
  Sparkles,
} from "lucide-react";
import { getAllPosts, getChannels, addChannel, getContentIdeas, addContentIdea, updateContentIdea, deleteContentIdea, Post, Channel } from "@/lib/firestore";
import Image from "next/image";
import { useSocialPoster } from "@/context/SocialPosterContext";


import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaLinkedin,
  FaPinterest,
  FaTelegram,
  FaReddit,
  FaYoutube,
  FaWordpress,
  FaBlogger,
  FaGoogle,
  FaTwitter,
} from "react-icons/fa";
import { SiThreads, SiGoogle } from "react-icons/si";
import { ResponsiveContainer, BarChart as ReChartsBarChart, Bar as ReChartsBar, XAxis, YAxis, Tooltip as ReChartsTooltip, CartesianGrid } from "recharts";


// Social network config with real brand icons
const networkOptionsAddModal = [
  { id: "fb",  name: "Facebook",          Icon: FaFacebook,        iconColor: "text-white",    bg: "bg-blue-600",    signInUrl: "/api/oauth/login?network=fb" },
  { id: "tw",  name: "X (Twitter)",       Icon: FaTwitter,         iconColor: "text-white",    bg: "bg-slate-900",   signInUrl: "/api/oauth/login?network=tw" },
  { id: "ig",  name: "Instagram",         Icon: FaInstagram,       iconColor: "text-white",    bg: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600", signInUrl: "/api/oauth/login?network=ig" },
  { id: "tk",  name: "Tiktok",            Icon: FaTiktok,          iconColor: "text-white",    bg: "bg-black",       signInUrl: "/api/oauth/login?network=tk" },
  { id: "th",  name: "Threads",           Icon: SiThreads,         iconColor: "text-white",    bg: "bg-neutral-900", signInUrl: "/api/oauth/login?network=th" },
  { id: "li",  name: "Linkedin",          Icon: FaLinkedin,        iconColor: "text-white",    bg: "bg-blue-700",    signInUrl: "/api/oauth/login?network=li" },
  { id: "pi",  name: "Pinterest",         Icon: FaPinterest,       iconColor: "text-white",    bg: "bg-red-600",     signInUrl: "/api/oauth/login?network=pi" },
  { id: "tg",  name: "Telegram",          Icon: FaTelegram,        iconColor: "text-white",    bg: "bg-sky-500",     signInUrl: "/api/oauth/login?network=tg" },
  { id: "re",  name: "Reddit",            Icon: FaReddit,          iconColor: "text-white",    bg: "bg-orange-500",  signInUrl: "/api/oauth/login?network=re" },
  { id: "yc",  name: "YouTube Community", Icon: FaYoutube,         iconColor: "text-white",    bg: "bg-red-600",     signInUrl: "/api/oauth/login?network=yc" },
  { id: "ys",  name: "YouTube Shorts",    Icon: FaYoutube,         iconColor: "text-white",    bg: "bg-red-600",     signInUrl: "/api/oauth/login?network=ys" },
  { id: "gb",  name: "Google Business",   Icon: SiGoogle,          iconColor: "text-white",    bg: "bg-blue-500",    signInUrl: "/api/oauth/login?network=gb" },
  { id: "wp",  name: "WordPress",         Icon: FaWordpress,       iconColor: "text-white",    bg: "bg-slate-700",   signInUrl: "/api/oauth/login?network=wp" },
  { id: "bl",  name: "Blogger",           Icon: FaBlogger,         iconColor: "text-white",    bg: "bg-orange-400",  signInUrl: "/api/oauth/login?network=bl" },
];

// Brand icon avatar component
function NetAvatar({ net, size = "sm" }: { net: typeof networkOptionsAddModal[0], size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-14 h-14" : "w-7 h-7";
  const iconSize = size === "lg" ? "text-2xl" : "text-sm";
  return (
    <div className={`${dim} ${net.bg} rounded-full flex items-center justify-center shrink-0`}>
      <net.Icon className={`${iconSize} text-white`} />
    </div>
  );
}

export default function SocialPosterPage() {
  const [activeTab, setActiveTab] = useState("Calendar");
  const [displayMode, setDisplayMode] = useState<"calendar" | "list">("calendar");
  const [calendarView, setCalendarView] = useState<"Month" | "Week">("Month");
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const {
    posts,
    channels,
    loading,
    actionLoading,
    currentUserId,
    refreshData,
    refreshChannels,
    schedulePostOptimistic,
  } = useSocialPoster();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  // Set mount status, handle resizing, and handle url parameters
  useEffect(() => {
    setIsMounted(true);

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setDisplayMode("list");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    
    // Check for OAuth callback parameters
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("tab") === "Channels") {
        setActiveTab("Channels");
      }
      if (urlParams.get("error")) {
        alert("Error connecting channel: " + urlParams.get("error"));
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get("success")) {
        alert("Channel connected successfully!");
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []);


  // Dropdown states
  const [isDisplayDropdownOpen, setIsDisplayDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter states
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  
  // Channels states
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [selectedNetworkToAdd, setSelectedNetworkToAdd] = useState<any>(null);
  const [addChannelMode, setAddChannelMode] = useState<"easy" | "advanced">("easy");
  const [fbMethodTab, setFbMethodTab] = useState<"app" | "cookie">("app");
  const [cookieCUser, setCookieCUser] = useState("");
  const [cookieXs, setCookieXs] = useState("");
  const [cookieDatr, setCookieDatr] = useState("");
  const [cookieSubmitting, setCookieSubmitting] = useState(false);
  const [cookieError, setCookieError] = useState<string | null>(null);
  const [cookieSuccess, setCookieSuccess] = useState<string | null>(null);

  // Twitter connection states
  const [twitterMethodTab, setTwitterMethodTab] = useState<"app" | "cookie">("app");
  const [twitterAuthToken, setTwitterAuthToken] = useState("");
  const [twitterCt0, setTwitterCt0] = useState("");
  const [twitterSubmitting, setTwitterSubmitting] = useState(false);
  const [twitterError, setTwitterError] = useState<string | null>(null);
  const [twitterSuccess, setTwitterSuccess] = useState<string | null>(null);

  // Settings tab states (Story Customization matching FS Poster)
  const [activeSettingsMenu, setActiveSettingsMenu] = useState<
    "General" | "Apps" | "Auto share" | "AI Settings" | "Watermark & Templates" | "Import & Export" | "System Information" | "Notifications" | "Facebook"
  >("General");
  const [settingsSubTab, setSettingsSubTab] = useState<"General" | "Post Customization" | "Story Customization">("Story Customization");

  // General Settings state matching Reference Screenshots
  const [whoCanAccess, setWhoCanAccess] = useState<"every_user" | "only_selected">("every_user");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Administrator"]);
  const [allowedPostTypes, setAllowedPostTypes] = useState<string[]>(["Posts", "Pages", "Media"]);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isPostTypeDropdownOpen, setIsPostTypeDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const postTypeDropdownRef = useRef<HTMLDivElement>(null);

  const [configureCron, setConfigureCron] = useState(true);
  const [cronCommand, setCronCommand] = useState("wget -O /dev/null https://smm.clicktaketech.com/wp-cron.php?doing_wp_cron > /dev/null 2>&1");
  const [lastCronTimestamp, setLastCronTimestamp] = useState<number>(() => Date.now() - 4000);
  const [lastCronFormatted, setLastCronFormatted] = useState("4s ago");
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [generalSaveSuccess, setGeneralSaveSuccess] = useState(false);
  const [copiedCron, setCopiedCron] = useState(false);

  const availableRolesList = ["Administrator", "Editor", "Author", "Contributor", "Subscriber"];
  const availablePostTypesList = ["Posts", "Pages", "Media"];

  // Social Apps states (Backend connected, default empty)
  const [socialApps, setSocialApps] = useState<any[]>([]);
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
  const [selectedNetworkForApp, setSelectedNetworkForApp] = useState<any>(null);
  const [appNameInput, setAppNameInput] = useState("");
  const [appIdInput, setAppIdInput] = useState("");
  const [appSecretInput, setAppSecretInput] = useState("");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appSaveSuccess, setAppSaveSuccess] = useState(false);

  // Facebook Settings states (Matching Images 1, 2, 3)
  const [fbImportComments, setFbImportComments] = useState(true);
  const [fbFetchTimeframe, setFbFetchTimeframe] = useState<"Last week" | "Last 2 weeks" | "Last 3 weeks" | "Last month">("Last week");
  const [fbCustomMessage, setFbCustomMessage] = useState("{title}\n\n{excerpt}\n\n{url}");
  const [fbUploadImages, setFbUploadImages] = useState(false);
  const [fbAttachLink, setFbAttachLink] = useState(true);
  const [fbEnableFirstComment, setFbEnableFirstComment] = useState(true);
  const [fbFirstCommentText, setFbFirstCommentText] = useState("@followers");
  const [isKeywordMenuOpen, setIsKeywordMenuOpen] = useState(false);

  // Facebook Story Customization states (Matching Images 1, 2, 3, 4)
  const [fbStoryText, setFbStoryText] = useState("{title}");
  const [fbStoryCapitalize, setFbStoryCapitalize] = useState(true);
  const [fbStoryUrlEncode, setFbStoryUrlEncode] = useState(true);
  const [fbStoryAttachLink, setFbStoryAttachLink] = useState(true);
  const [fbStoryTagSettingsOpen, setFbStoryTagSettingsOpen] = useState(false);

  const [storyBgColor, setStoryBgColor] = useState("#636e72");
  const [storyTitleBgColor, setStoryTitleBgColor] = useState("#000000");
  const [storyTitleOpacity, setStoryTitleOpacity] = useState(30);
  const [storyTitleColor, setStoryTitleColor] = useState("#FFFFFF");
  const [storyTopOffset, setStoryTopOffset] = useState(125);
  const [storyLeftOffset, setStoryLeftOffset] = useState(30);
  const [storyWidth, setStoryWidth] = useState(660);
  const [storyFontSize, setStoryFontSize] = useState(30);
  const [storyFontFamily, setStoryFontFamily] = useState("ABeeZee");
  const [storyRtlMode, setStoryRtlMode] = useState(false);
  const [isStoryKeywordMenuOpen, setIsStoryKeywordMenuOpen] = useState(false);

  const fontFamilyList = [
    "ABeeZee",
    "ADLaM Display",
    "AR One Sans",
    "Abel",
    "Abhaya Libre",
    "Aboreto",
    "Abril Fatface",
    "Abyssinica SIL",
    "Aclonica",
  ];

  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Realtime Cron Timer Ticker (calculates "Xs ago" every second)
  useEffect(() => {
    const timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastCronTimestamp) / 1000);
      if (diffSec < 60) {
        setLastCronFormatted(`${diffSec}s ago`);
      } else if (diffSec < 3600) {
        setLastCronFormatted(`${Math.floor(diffSec / 60)}m ago`);
      } else {
        setLastCronFormatted(`${Math.floor(diffSec / 3600)}h ago`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastCronTimestamp]);

  // Realtime Cron Execution Worker (Pings /api/cron every 30 seconds when enabled)
  useEffect(() => {
    if (!configureCron) return;

    const cronWorker = setInterval(async () => {
      try {
        const res = await fetch("/api/cron");
        if (res.ok) {
          setLastCronTimestamp(Date.now());
        }
      } catch (err) {
        console.warn("Realtime cron ping failed:", err);
      }
    }, 30000);

    return () => clearInterval(cronWorker);
  }, [configureCron]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (postTypeDropdownRef.current && !postTypeDropdownRef.current.contains(event.target as Node)) {
        setIsPostTypeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load General Settings, Social Apps & Facebook Settings from Firestore on mount/user change
  useEffect(() => {
    async function loadSettings() {
      try {
        const { auth } = await import("@/lib/firebase");
        const { getGeneralSettings, getSocialApps, getFacebookSettings } = await import("@/lib/firestore");
        if (auth.currentUser) {
          const gs = await getGeneralSettings(auth.currentUser.uid);
          setWhoCanAccess(gs.whoCanAccess || "every_user");
          setSelectedRoles(gs.selectedRoles || ["Administrator"]);
          setAllowedPostTypes(gs.allowedPostTypes || ["Posts", "Pages", "Media"]);
          setConfigureCron(gs.configureCron !== undefined ? gs.configureCron : true);
          if (gs.cronCommand) setCronCommand(gs.cronCommand);

          const dbApps = await getSocialApps(auth.currentUser.uid);
          if (dbApps && dbApps.length > 0) {
            setSocialApps(dbApps);
          }

          const fbSettings = await getFacebookSettings(auth.currentUser.uid);
          if (fbSettings) {
            if (fbSettings.general) {
              setFbImportComments(fbSettings.general.importComments !== undefined ? fbSettings.general.importComments : true);
              if (fbSettings.general.fetchCommentsTimeframe) setFbFetchTimeframe(fbSettings.general.fetchCommentsTimeframe);
            }
            if (fbSettings.postCustomization) {
              if (fbSettings.postCustomization.customMessage) setFbCustomMessage(fbSettings.postCustomization.customMessage);
              setFbUploadImages(fbSettings.postCustomization.uploadPostImages || false);
              setFbAttachLink(fbSettings.postCustomization.attachLink !== undefined ? fbSettings.postCustomization.attachLink : true);
              setFbEnableFirstComment(fbSettings.postCustomization.enableFirstComment !== undefined ? fbSettings.postCustomization.enableFirstComment : true);
              if (fbSettings.postCustomization.firstCommentText) setFbFirstCommentText(fbSettings.postCustomization.firstCommentText);
            }
            if (fbSettings.storyCustomization) {
              if (fbSettings.storyCustomization.storyText) setFbStoryText(fbSettings.storyCustomization.storyText);
              setFbStoryCapitalize(fbSettings.storyCustomization.capitalizeStoryText !== undefined ? fbSettings.storyCustomization.capitalizeStoryText : true);
              setFbStoryUrlEncode(fbSettings.storyCustomization.urlEncodeStoryText !== undefined ? fbSettings.storyCustomization.urlEncodeStoryText : true);
              setFbStoryAttachLink(fbSettings.storyCustomization.attachStoryLink !== undefined ? fbSettings.storyCustomization.attachStoryLink : true);
              if (fbSettings.storyCustomization.backgroundColor) setStoryBgColor(fbSettings.storyCustomization.backgroundColor);
              if (fbSettings.storyCustomization.titleBackgroundColor) setStoryTitleBgColor(fbSettings.storyCustomization.titleBackgroundColor);
              if (fbSettings.storyCustomization.titleBackgroundOpacity !== undefined) setStoryTitleOpacity(fbSettings.storyCustomization.titleBackgroundOpacity);
              if (fbSettings.storyCustomization.titleColor) setStoryTitleColor(fbSettings.storyCustomization.titleColor);
              if (fbSettings.storyCustomization.titleTopOffset !== undefined) setStoryTopOffset(fbSettings.storyCustomization.titleTopOffset);
              if (fbSettings.storyCustomization.titleLeftOffset !== undefined) setStoryLeftOffset(fbSettings.storyCustomization.titleLeftOffset);
              if (fbSettings.storyCustomization.titleWidth !== undefined) setStoryWidth(fbSettings.storyCustomization.titleWidth);
              if (fbSettings.storyCustomization.titleFontSize !== undefined) setStoryFontSize(fbSettings.storyCustomization.titleFontSize);
              if (fbSettings.storyCustomization.titleFontFamily) setStoryFontFamily(fbSettings.storyCustomization.titleFontFamily);
              setStoryRtlMode(fbSettings.storyCustomization.titleRtlMode || false);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load general settings:", err);
      }
    }
    loadSettings();
  }, [currentUserId]);

  const [isChannelFilterOpen, setIsChannelFilterOpen] = useState(false);
  const channelFilterRef = useRef<HTMLDivElement>(null);

  // Internal dropdown states for multi-select
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  const statusOptions = ["Published", "Pending", "Failed", "Draft"];
  const networkOptions = ["Blogger", "Facebook", "Google Business", "Instagram", "Linkedin", "Pinterest"];

  // Schedule modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleStep, setScheduleStep] = useState<1 | 2 | 3>(1);
  const [selectedChannelsForPost, setSelectedChannelsForPost] = useState<Channel[]>([]);
  const [channelSearchQuery, setChannelSearchQuery] = useState("");
  const [postContent, setPostContent] = useState("");
  const isScheduling = actionLoading;
  const [scheduleDate, setScheduleDate] = useState<Date>(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d;
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calViewDate, setCalViewDate] = useState<Date>(new Date());
  const [attachLink, setAttachLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadMedia, setUploadMedia] = useState(false);
  const [shareNowDropdown, setShareNowDropdown] = useState(false);

  // Format schedule date for display
  const formatScheduleDate = (d: Date) =>
    d.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

  const handleSchedule = async (isShareNow: boolean = false) => {
    if (selectedChannelsForPost.length === 0 || !postContent) return;
    
    const apiCall = async () => {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer mock_token"
        },
        body: JSON.stringify({
          content: postContent,
          channels: selectedChannelsForPost,
          scheduledAt: isShareNow ? new Date().toISOString() : scheduleDate.toISOString(),
          mediaUrls: attachLink && linkUrl ? [linkUrl] : [],
          isShareNow
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule post");
      }

      const data = await response.json();
      return data.post || {
        content: postContent,
        networks: selectedChannelsForPost.map(c => c.network),
        authorEmail: "me@demo.com",
        status: isShareNow ? "published" : "scheduled",
        id: `post-${Date.now()}`
      };
    };

    try {
      await schedulePostOptimistic(
        {
          content: postContent,
          networks: selectedChannelsForPost.map(c => c.network),
          authorId: "current-user-id",
          authorEmail: "me@demo.com",
          status: isShareNow ? "published" : "scheduled",
        },
        apiCall
      );

      // Close modal and reset state
      setIsScheduleModalOpen(false);
      setScheduleStep(1);
      setSelectedChannelsForPost([]);
      setPostContent("");
      setLinkUrl("");
      setAttachLink(false);
      setUploadMedia(false);
      
      // Notify user
      alert(isShareNow ? "Post published successfully!" : "Post scheduled successfully!");
    } catch (error: any) {
      console.error("Error scheduling:", error);
      alert("Error scheduling post: " + (error.message || "Please try again."));
    }
  };




  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
        setIsStatusDropdownOpen(false);
        setIsNetworkDropdownOpen(false);
      }
      if (displayRef.current && !displayRef.current.contains(event.target as Node)) {
        setIsDisplayDropdownOpen(false);
      }
      if (channelFilterRef.current && !channelFilterRef.current.contains(event.target as Node)) {
        setIsChannelFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabs = [
    { id: "Calendar", icon: CalendarIcon },
    { id: "Content Ideas", icon: Lightbulb },
    { id: "Analytics", icon: BarChart3 },
    { id: "Channels", icon: MonitorPlay },
    { id: "Planners", icon: CalendarDays },
    { id: "Settings", icon: Settings },
  ];

  // Filtering
  const filteredPosts = posts.filter(post => {
    // Check status filter
    if (selectedStatuses.length > 0) {
      const mappedStatuses = selectedStatuses.map(s => {
        const lower = s.toLowerCase();
        return lower === 'failed' ? 'rejected' : lower;
      });
      if (!mappedStatuses.includes(post.status)) {
        return false;
      }
    }
    
    // Check network filter
    if (selectedNetworks.length > 0) {
      const postNets = post.networks || [];
      const hasMatch = selectedNetworks.some(net => postNets.includes(net.toLowerCase()));
      if (!hasMatch) return false;
    }
    
    return true;
  });

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleNetwork = (network: string) => {
    setSelectedNetworks(prev => 
      prev.includes(network) ? prev.filter(n => n !== network) : [...prev, network]
    );
  };

  const removeStatus = (e: React.MouseEvent, status: string) => {
    e.stopPropagation();
    setSelectedStatuses(prev => prev.filter(s => s !== status));
  };

  const removeNetwork = (e: React.MouseEvent, network: string) => {
    e.stopPropagation();
    setSelectedNetworks(prev => prev.filter(n => n !== network));
  };

  const hasActiveFilters = selectedStatuses.length > 0 || selectedNetworks.length > 0;

  // Group posts by date string (YYYY-MM-DD)
  const postsByDate = filteredPosts.reduce((acc, post) => {
    let dateStr = "";
    if (post.createdAt?.toDate) {
      dateStr = post.createdAt.toDate().toISOString().split('T')[0];
    } else if (post.createdAt) {
      dateStr = new Date(post.createdAt).toISOString().split('T')[0];
    } else {
      dateStr = new Date().toISOString().split('T')[0];
    }
    
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(post);
    return acc;
  }, {} as Record<string, Post[]>);

  const getCalendarDays = () => {
    if (calendarView === "Week") {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    } else {
      // Month view
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      start.setDate(start.getDate() - start.getDay());
      return Array.from({ length: 35 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }
  };

  const calendarDays = getCalendarDays();

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (calendarView === "Week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (calendarView === "Week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getHeaderDateString = () => {
    if (calendarView === "Week") {
      const start = calendarDays[0];
      const end = calendarDays[6];
      return `${start.toLocaleString('default', { month: 'short' })} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] rounded-xl overflow-hidden shadow-sm border border-slate-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-2">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.id}
            </button>
          ))}
        </div>
        <div>
          <button className="text-slate-500 hover:bg-slate-100 p-2 rounded-full">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 overflow-y-auto bg-white flex-1 relative">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{activeTab}</h1>
          
          {activeTab === "Calendar" && (
            <div className="flex items-center gap-3">
              {/* Display Mode Dropdown */}
              <div className="relative" ref={displayRef}>
                <div 
                  onClick={() => setIsDisplayDropdownOpen(!isDisplayDropdownOpen)}
                  className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50"
                >
                  {displayMode === "calendar" ? (
                    <CalendarIcon className="w-4 h-4 mr-2 text-slate-500" />
                  ) : (
                    <ListIcon className="w-4 h-4 mr-2 text-slate-500" />
                  )}
                  {displayMode === "calendar" ? "Calendar" : "List"}
                  <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
                </div>
                
                <AnimatePresence>
                  {isDisplayDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1"
                    >
                      <button 
                        onClick={() => { setDisplayMode("list"); setIsDisplayDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                      >
                        <ListIcon className="w-4 h-4 mr-2 text-slate-400" /> List
                      </button>
                      <button 
                        onClick={() => { setDisplayMode("calendar"); setIsDisplayDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" /> Calendar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Filter Dropdown */}
              <div className="relative" ref={filterRef}>
                <div className="relative">
                  <button 
                    onClick={() => {
                      setIsFilterOpen(!isFilterOpen);
                      setIsStatusDropdownOpen(false);
                      setIsNetworkDropdownOpen(false);
                    }}
                    className="flex items-center border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-white shadow-sm hover:bg-slate-50 relative"
                  >
                    <Filter className="w-4 h-4 mr-2 text-slate-500" />
                    Filter
                  </button>
                  {/* Red dot active filter indicator */}
                  {hasActiveFilters && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></div>
                  )}
                </div>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-20 p-4"
                    >
                      <div className="mb-4 relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <div 
                          className={`min-h-[42px] border ${isStatusDropdownOpen ? 'border-blue-500' : 'border-slate-200'} rounded-md p-1.5 flex flex-wrap gap-1.5 items-center cursor-text bg-white transition-colors`}
                          onClick={() => {
                            setIsStatusDropdownOpen(true);
                            setIsNetworkDropdownOpen(false);
                          }}
                        >
                          {selectedStatuses.map(status => (
                            <span key={status} className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                              {status}
                              <button onClick={(e) => removeStatus(e, status)} className="hover:bg-slate-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                          <span className="text-slate-400 text-sm px-1 outline-none min-w-[50px] flex-1">
                            {selectedStatuses.length === 0 ? "Select status" : ""}
                          </span>
                        </div>
                        
                        {/* Status Options Dropdown */}
                        {isStatusDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-30 max-h-48 overflow-y-auto py-1">
                            {statusOptions.map(option => (
                              <label key={option} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer">
                                <div className={`w-4 h-4 rounded mr-3 flex items-center justify-center border ${selectedStatuses.includes(option) ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                                  {selectedStatuses.includes(option) && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm text-slate-700">{option}</span>
                                <input 
                                  type="checkbox" 
                                  className="hidden" 
                                  checked={selectedStatuses.includes(option)}
                                  onChange={() => toggleStatus(option)}
                                />
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Social network</label>
                        <div 
                          className={`min-h-[42px] border ${isNetworkDropdownOpen ? 'border-blue-500' : 'border-slate-200'} rounded-md p-1.5 flex flex-wrap gap-1.5 items-center cursor-text bg-white transition-colors`}
                          onClick={() => {
                            setIsNetworkDropdownOpen(true);
                            setIsStatusDropdownOpen(false);
                          }}
                        >
                          {selectedNetworks.map(net => (
                            <span key={net} className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                              {net}
                              <button onClick={(e) => removeNetwork(e, net)} className="hover:bg-slate-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                          <span className="text-slate-400 text-sm px-1 outline-none min-w-[50px] flex-1">
                            {selectedNetworks.length === 0 ? "Select social network" : ""}
                          </span>
                        </div>
                        
                        {/* Network Options Dropdown */}
                        {isNetworkDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-30 max-h-48 overflow-y-auto py-1">
                            {networkOptions.map(option => (
                              <label key={option} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer">
                                <div className={`w-4 h-4 rounded mr-3 flex items-center justify-center border ${selectedNetworks.includes(option) ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                                  {selectedNetworks.includes(option) && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm text-slate-700">{option}</span>
                                <input 
                                  type="checkbox" 
                                  className="hidden" 
                                  checked={selectedNetworks.includes(option)}
                                  onChange={() => toggleNetwork(option)}
                                />
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={() => setIsScheduleModalOpen(true)} className="flex items-center bg-[#635BFF] hover:bg-[#5249e6] text-white rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" />
                Schedule new post
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "Calendar" && displayMode === "calendar" && (
            <motion.div
              key="calendar-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col"
            >
              {/* Calendar Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setCalendarView("Week")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      calendarView === "Week"
                        ? "bg-[#fb3b66] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setCalendarView("Month")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      calendarView === "Month"
                        ? "bg-[#fb3b66] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Month
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <button onClick={handlePrev} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="font-semibold text-slate-700 text-sm">
                    {getHeaderDateString()}
                  </span>
                  <button onClick={handleNext} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="w-32"></div>
              </div>

              {/* Calendar Grid */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                    <div key={day} className="py-3 text-center text-sm font-semibold text-slate-500 border-r border-slate-200 last:border-r-0">
                      {calendarView === "Week" ? `${day} ${calendarDays[idx].getMonth()+1}/${calendarDays[idx].getDate()}` : day}
                    </div>
                  ))}
                </div>
                
                {loading ? (
                  <div className="p-12 text-center text-slate-500">Loading posts...</div>
                ) : (
                  <div className="flex flex-col">
                    {Array.from({ length: calendarView === "Week" ? 1 : 5 }).map((_, weekIdx) => (
                      <div key={weekIdx} className="grid grid-cols-7 border-b border-slate-200 last:border-b-0">
                        {calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((date, idx) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const dayPosts = postsByDate[dateStr] || [];
                          const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
                          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                          
                          return (
                            <div key={idx} className={`border-r border-slate-200 p-2 relative ${hasActiveFilters ? 'min-h-[80px]' : 'min-h-[160px]'} last:border-r-0 ${!isCurrentMonth && calendarView === "Month" ? 'bg-slate-50' : 'bg-white'}`}>
                              <span className={`text-xs font-medium absolute top-2 left-2 ${isToday ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center -mt-1 -ml-1' : (isCurrentMonth || calendarView === "Week" ? 'text-slate-700' : 'text-slate-400')}`}>
                                {date.getDate()}
                              </span>
                              <div className="mt-6 flex flex-col gap-2">
                                {dayPosts.map((post, pIdx) => (
                                  <div key={post.id || pIdx} onClick={() => setSelectedPost(post)} className="cursor-pointer transition-transform hover:scale-[1.02]">
                                    <PostCard 
                                      title={post.content || "No content"} 
                                      time={
                                        post.createdAt?.toDate 
                                          ? post.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                          : "12:00 PM"
                                      } 
                                      status={post.status === "published" ? "success" : "error"} 
                                      hasMedia={!!post.content && post.content.length > 5}
                                      isFiltered={hasActiveFilters}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "Calendar" && displayMode === "list" && (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col"
            >
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-500">
                      <th className="p-4 w-12"><input type="checkbox" className="rounded border-slate-300" /></th>
                      <th className="p-4">Content</th>
                      <th className="p-4">Channel</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Share at</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-500">Loading posts...</td>
                      </tr>
                    ) : filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-500">No posts found.</td>
                      </tr>
                    ) : (
                      filteredPosts.map((post, idx) => (
                        <tr key={post.id || idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                          <td className="p-4">
                            <div className="flex items-center gap-3 max-w-xs cursor-pointer" onClick={() => setSelectedPost(post)}>
                              <div className="w-10 h-10 bg-slate-800 rounded flex-shrink-0"></div>
                              <p className="text-sm font-medium text-slate-700 truncate">{post.content || "No content"}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <UserCheck className="w-3 h-3" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-700">{post.authorEmail || "User"}</p>
                                <p className="text-[10px] text-slate-500">account</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                              post.status === "published" ? "bg-green-100 text-green-700" :
                              post.status === "pending" ? "bg-orange-100 text-orange-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {post.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-600">
                            {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : "Unknown"}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-3">
                              <button className="text-slate-400 hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                              <button className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
          {activeTab === "Analytics" && (() => {
            // Derive real stats from fetched data
            const totalPosts      = posts.length;
            const publishedPosts  = posts.filter(p => p.status === "published").length;
            const pendingPosts    = posts.filter(p => p.status === "pending").length;
            const failedPosts     = posts.filter(p => p.status === "rejected").length;
            const totalChannels   = channels.length;
            const disconnected    = channels.filter(c => c.status === "disconnected" || c.status === "error").length;

            // Posts per network (from posts.networks array)
            const networkCount: Record<string, number> = {};
            posts.forEach(p => {
              (p.networks || []).forEach(n => {
                networkCount[n] = (networkCount[n] || 0) + 1;
              });
            });
            const topNetworks = Object.entries(networkCount)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6);

            // Posts over last 7 days
            const now = new Date();
            const dayLabels = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(now);
              d.setDate(now.getDate() - (6 - i));
              return d;
            });
            const postsPerDay = dayLabels.map(day => ({
              label: day.toLocaleDateString("en", { weekday: "short" }),
              count: posts.filter(p => {
                const d = p.createdAt?.toDate?.();
                return d && d.toDateString() === day.toDateString();
              }).length,
            }));
            const maxDay = Math.max(...postsPerDay.map(d => d.count), 1);

            return (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Posts",      value: totalPosts,     icon: <BarChart className="w-5 h-5" />, bg: "bg-violet-50",  text: "text-violet-600", border: "border-violet-100" },
                    { label: "Published",         value: publishedPosts, icon: <CheckCircle2 className="w-5 h-5" />, bg: "bg-green-50",  text: "text-green-600",  border: "border-green-100" },
                    { label: "Pending / Failed",  value: `${pendingPosts} / ${failedPosts}`, icon: <AlertCircle className="w-5 h-5" />, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
                    { label: "Total Channels",    value: totalChannels,  icon: <UserCheck className="w-5 h-5" />, bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100" },
                  ].map(s => (
                    <div key={s.label} className={`bg-white rounded-xl p-5 border ${s.border} shadow-sm flex items-center gap-4`}>
                      <div className={`w-12 h-12 rounded-xl ${s.bg} ${s.text} flex items-center justify-center shrink-0`}>{s.icon}</div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                        <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Posts Activity Chart + Channel Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Bar chart — posts last 7 days */}
                  <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-slate-800">Posts Activity (Last 7 Days)</h3>
                      <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">{totalPosts} total</span>
                    </div>
                    <div className="h-48 w-full">
                      {isMounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ReChartsBarChart data={postsPerDay} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                            <ReChartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                            <ReChartsBar dataKey="count" fill="#635BFF" radius={[4, 4, 0, 0]} name="Posts" />
                          </ReChartsBarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">Loading chart...</div>
                      )}
                    </div>

                    {totalPosts === 0 && (
                      <p className="text-center text-xs text-slate-400 mt-3">No posts yet — publish something to see activity</p>
                    )}
                  </div>

                  {/* Channel Status donut-style */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
                    <h3 className="font-semibold text-slate-800 mb-4">Channel Status</h3>
                    {totalChannels === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center">
                        No channels connected yet
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[
                          { label: "Connected",     count: channels.filter(c => c.status === "connected").length,    color: "bg-green-500" },
                          { label: "Disconnected",  count: channels.filter(c => c.status === "disconnected").length, color: "bg-red-400"   },
                          { label: "Error",         count: channels.filter(c => c.status === "error").length,        color: "bg-amber-400" },
                        ].map(row => (
                          <div key={row.label}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                                <span className="text-sm text-slate-600">{row.label}</span>
                              </div>
                              <span className="text-sm font-semibold text-slate-700">{row.count}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div className={`${row.color} h-1.5 rounded-full`} style={{ width: `${(row.count / totalChannels) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                        {disconnected > 0 && (
                          <p className="text-xs text-red-500 mt-3 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {disconnected} channel{disconnected > 1 ? "s" : ""} need attention
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Posts by Status breakdown + Top Networks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status breakdown */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h3 className="font-semibold text-slate-800 mb-5">Posts by Status</h3>
                    {totalPosts === 0 ? (
                      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No posts yet</div>
                    ) : (
                      <div className="space-y-4">
                        {[
                          { label: "Published", count: publishedPosts, color: "bg-green-500",  pct: (publishedPosts / totalPosts) * 100 },
                          { label: "Pending",   count: pendingPosts,   color: "bg-amber-400",  pct: (pendingPosts / totalPosts) * 100   },
                          { label: "Failed",    count: failedPosts,    color: "bg-red-400",    pct: (failedPosts / totalPosts) * 100    },
                        ].map(row => (
                          <div key={row.label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-slate-600 font-medium">{row.label}</span>
                              <span className="text-sm font-bold text-slate-700">{row.count} <span className="text-slate-400 font-normal text-xs">({row.pct.toFixed(0)}%)</span></span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className={`${row.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${row.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top networks */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h3 className="font-semibold text-slate-800 mb-5">Posts per Network</h3>
                    {topNetworks.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No network data yet</div>
                    ) : (
                      <div className="space-y-3">
                        {topNetworks.map(([netId, count]) => {
                          const net = networkOptionsAddModal.find(n => n.id === netId);
                          const maxCount = topNetworks[0][1];
                          return (
                            <div key={netId} className="flex items-center gap-3">
                              {net && <NetAvatar net={net} size="sm" />}
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm text-slate-600">{net?.name || netId}</span>
                                  <span className="text-sm font-semibold text-slate-700">{count}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                  <div className="bg-[#635BFF] h-1.5 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })()}


          {activeTab === "Channels" && (
            <motion.div
              key="channels"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-800">Channels</h2>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">{channels.length}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search" className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-64" />
                  </div>

                  {/* Channel Filter Button + Dropdown */}
                  <div className="relative" ref={channelFilterRef}>
                    <button
                      onClick={() => setIsChannelFilterOpen(!isChannelFilterOpen)}
                      className="flex items-center border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                    >
                      <Filter className="w-4 h-4 mr-2 text-slate-500" /> Filter
                    </button>

                    <AnimatePresence>
                      {isChannelFilterOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-5"
                        >
                          {/* Label */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-sm font-semibold text-slate-700">Label</label>
                              <button className="text-xs text-blue-500 font-medium hover:underline">Manage labels</button>
                            </div>
                            <input
                              type="text"
                              placeholder="Select label"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 placeholder-slate-400 outline-none focus:border-blue-400"
                            />
                          </div>

                          {/* Auto-share */}
                          <div className="mb-4">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Auto-share</label>
                            <input
                              type="text"
                              placeholder="Select auto-share"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 placeholder-slate-400 outline-none focus:border-blue-400"
                            />
                          </div>

                          {/* Connection status */}
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Connection status</label>
                            <div className="relative">
                              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400 appearance-none bg-white outline-none focus:border-blue-400">
                                <option value="">Select connection status</option>
                                <option value="connected">Connected</option>
                                <option value="disconnected">Disconnected</option>
                                <option value="error">Error</option>
                              </select>
                              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button onClick={() => setIsAddChannelModalOpen(true)} className="flex items-center bg-[#635BFF] hover:bg-[#5249e6] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4 mr-2" /> Add channel
                  </button>
                </div>
              </div>

              <div className="flex gap-6 flex-1 min-h-[500px]">
                {/* Left Sidebar Networks */}
                <div className="w-64 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden h-fit">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-600"><LayoutGrid className="w-4 h-4" /></div>
                      <span className="font-semibold text-sm text-slate-800">All</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {channels.filter(c => c.status === 'error').length > 0 && (
                        <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded border border-red-100 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {channels.filter(c => c.status === 'error').length}
                        </span>
                      )}
                      <span className="text-green-600 font-bold text-sm">{channels.length}</span>
                    </div>
                  </div>
                  
                  {networkOptionsAddModal.map((net) => {
                    const count = channels.filter(c => c.network === net.id || (net.id === "tw" && (c.network === "twitter" || c.network === "x"))).length;
                    return (
                      <div key={net.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 flex items-center justify-between cursor-pointer last:border-b-0">
                        <div className="flex items-center gap-3">
                          <NetAvatar net={net} size="sm" />
                          <span className="font-semibold text-sm text-slate-700">{net.name}</span>
                        </div>
                        <span className="text-slate-400 font-medium text-sm">{count}</span>
                      </div>
                    );
                  })}

                </div>

                {/* Right Area List */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                        <th className="p-4 w-12"><input type="checkbox" className="rounded border-slate-300" /></th>
                        <th className="p-4">Channel</th>
                        <th className="p-4 w-32 text-center">Auto-share</th>
                        <th className="p-4 w-32 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channels.map(channel => (
                        <tr key={channel.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                          <td className="p-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <NetAvatar net={networkOptionsAddModal.find(n => n.id === channel.network || (n.id === "tw" && (channel.network === "twitter" || channel.network === "x"))) || networkOptionsAddModal[0]} size="sm" />
                              <div>
                                <p className="font-semibold text-slate-700 text-sm">{channel.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`w-2 h-2 rounded-full ${channel.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                  <span className="text-xs text-slate-500 capitalize">{channel.status}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${
                              channel.isAutoShare ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                            }`}>
                              {channel.isAutoShare ? "Enabled" : "Disabled"}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 text-slate-400 hover:text-blue-600 rounded bg-white border border-slate-200 hover:border-blue-200 shadow-sm transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const { deleteDoc, doc } = await import("firebase/firestore");
                                    const { db } = await import("@/lib/firebase");
                                    if (channel.id) {
                                      await deleteDoc(doc(db, "channels", channel.id));
                                      refreshChannels();
                                    }
                                  } catch (err) {
                                    console.error("Delete channel error:", err);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded bg-white border border-slate-200 hover:border-red-200 shadow-sm transition-colors"
                                title="Delete Channel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {channels.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                      <MonitorPlay className="w-12 h-12 mb-4 text-slate-200" />
                      <h3 className="text-lg font-medium text-slate-600 mb-2">No channels added</h3>
                      <p className="text-sm max-w-sm mb-6">You haven't connected any social networks yet. Add a channel to start scheduling posts.</p>
                      <button onClick={() => setIsAddChannelModalOpen(true)} className="flex items-center bg-[#635BFF] hover:bg-[#5249e6] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4 mr-2" /> Add channel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Content Ideas Tab */}
          {activeTab === "Content Ideas" && (
            <ContentIdeasTabSection onScheduleToChannels={() => setIsAddChannelModalOpen(true)} />
          )}

          {/* Settings Tab — FS Poster Style */}
          {activeTab === "Settings" && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-6 h-full min-h-[650px]"
            >
              {/* Left Sidebar for Settings Menu */}
              <div className="w-64 bg-white border border-slate-200 rounded-xl p-3 space-y-1 shrink-0 h-fit">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">General Settings</div>
                {[
                  { id: "General", label: "General", icon: Settings },
                  { id: "Apps", label: "Apps", icon: LayoutGrid },
                  { id: "Auto share", label: "Auto share", icon: CalendarIcon },
                  { id: "AI Settings", label: "AI Settings", icon: Sparkles },
                  { id: "Watermark & Templates", label: "Watermark & Templates", icon: Edit2 },
                  { id: "Import & Export", label: "Import & Export", icon: ExternalLink },
                  { id: "System Information", label: "System Information", icon: AlertCircle },
                  { id: "Notifications", label: "Notifications", icon: Bell },
                ].map(item => (
                  <div
                    key={item.id}
                    onClick={() => setActiveSettingsMenu(item.id as any)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeSettingsMenu === item.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                ))}
                
                <div className="pt-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Social Networks</div>
                <div
                  onClick={() => setActiveSettingsMenu("Facebook")}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    activeSettingsMenu === "Facebook"
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FaFacebook className="text-sm text-blue-600" />
                    <span>Facebook</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* Right Main Settings Area */}
              <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8 overflow-y-auto flex flex-col justify-between">
                <div>
                  {activeSettingsMenu === "General" && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSavingGeneral(true);
                        setGeneralSaveSuccess(false);
                        try {
                          const { auth } = await import("@/lib/firebase");
                          const { saveGeneralSettings } = await import("@/lib/firestore");
                          if (auth.currentUser) {
                            await saveGeneralSettings(auth.currentUser.uid, {
                              whoCanAccess,
                              selectedRoles,
                              allowedPostTypes,
                              configureCron,
                              cronCommand,
                              lastCronRunTime: lastCronFormatted,
                            });
                          }
                          setGeneralSaveSuccess(true);
                          setTimeout(() => setGeneralSaveSuccess(false), 3000);
                        } catch (err) {
                          console.error("Save general settings error:", err);
                        } finally {
                          setIsSavingGeneral(false);
                        }
                      }}
                      className="space-y-8 max-w-3xl"
                    >
                      {/* Title */}
                      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Settings</h2>

                      {/* 1. Who can access Social Poster? */}
                      <div className="flex items-start justify-between pb-8 border-b border-slate-100">
                        <div className="max-w-xs">
                          <h3 className="text-base font-bold text-slate-800">Who can access Social Poster?</h3>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Selected roles will be able to access Social Poster.
                          </p>
                        </div>
                        <div className="space-y-4 min-w-[280px]">
                          {/* Radio Option 1: Every user */}
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              whoCanAccess === "every_user" ? "border-emerald-500 bg-white" : "border-slate-300"
                            }`}>
                              {whoCanAccess === "every_user" && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>}
                            </div>
                            <input
                              type="radio"
                              name="whoCanAccess"
                              className="hidden"
                              checked={whoCanAccess === "every_user"}
                              onChange={() => setWhoCanAccess("every_user")}
                            />
                            <span className="text-sm font-semibold text-slate-700">Every user</span>
                          </label>

                          {/* Radio Option 2: Only selected user roles */}
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              whoCanAccess === "only_selected" ? "border-emerald-500 bg-white" : "border-slate-300"
                            }`}>
                              {whoCanAccess === "only_selected" && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>}
                            </div>
                            <input
                              type="radio"
                              name="whoCanAccess"
                              className="hidden"
                              checked={whoCanAccess === "only_selected"}
                              onChange={() => setWhoCanAccess("only_selected")}
                            />
                            <span className="text-sm font-semibold text-slate-700">Only selected user roles</span>
                          </label>

                          {/* Role Select Input Box & Dropdown (Matching Screenshot 1) */}
                          {whoCanAccess === "only_selected" && (
                            <div className="relative pt-1" ref={roleDropdownRef}>
                              <div
                                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                className={`w-full min-h-[42px] border-2 rounded-xl p-1.5 bg-white flex flex-wrap gap-1.5 items-center cursor-pointer transition-all ${
                                  isRoleDropdownOpen ? "border-blue-500 shadow-sm" : "border-blue-400/80 hover:border-blue-500"
                                }`}
                              >
                                {selectedRoles.map(role => (
                                  <span key={role} className="bg-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                                    {role}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRoles(prev => prev.filter(r => r !== role));
                                      }}
                                      className="hover:bg-slate-300 rounded-full p-0.5"
                                    >
                                      <X className="w-3 h-3 text-slate-600" />
                                    </button>
                                  </span>
                                ))}
                                <span className="text-slate-400 text-xs px-1 select-none">
                                  {selectedRoles.length === 0 ? "Select roles" : ""}
                                </span>
                              </div>

                              {/* Floating Dropdown List (Matching Screenshot 1) */}
                              <AnimatePresence>
                                {isRoleDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 space-y-0.5 overflow-hidden"
                                  >
                                    {availableRolesList.map(role => {
                                      const isSelected = selectedRoles.includes(role);
                                      return (
                                        <div
                                          key={role}
                                          onClick={() => {
                                            if (isSelected) {
                                              setSelectedRoles(prev => prev.filter(r => r !== role));
                                            } else {
                                              setSelectedRoles(prev => [...prev, role]);
                                            }
                                          }}
                                          className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                          <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                                            isSelected ? "bg-emerald-500 text-white" : "border-2 border-slate-300"
                                          }`}>
                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                          </div>
                                          <span className="text-xs font-semibold text-slate-700">{role}</span>
                                        </div>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Allowed post types (Matching Screenshot 2) */}
                      <div className="flex items-start justify-between pb-8 border-b border-slate-100">
                        <div className="max-w-xs">
                          <h3 className="text-base font-bold text-slate-800">Allowed post types</h3>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Specify the post types you wish to share across your social networks.
                          </p>
                        </div>
                        <div className="w-full max-w-sm relative" ref={postTypeDropdownRef}>
                          <div
                            onClick={() => setIsPostTypeDropdownOpen(!isPostTypeDropdownOpen)}
                            className={`w-full min-h-[46px] border-2 rounded-xl p-2 bg-white flex flex-wrap gap-2 items-center cursor-pointer transition-all ${
                              isPostTypeDropdownOpen ? "border-blue-500 shadow-sm" : "border-blue-400/80 hover:border-blue-500"
                            }`}
                          >
                            {allowedPostTypes.map(type => (
                              <span key={type} className="bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200">
                                {type}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAllowedPostTypes(prev => prev.filter(t => t !== type));
                                  }}
                                  className="hover:bg-slate-200 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3 text-slate-500" />
                                </button>
                              </span>
                            ))}
                            <span className="text-slate-400 text-xs px-1 select-none">
                              {allowedPostTypes.length === 0 ? "Select post types" : ""}
                            </span>
                          </div>

                          {/* Floating Dropdown List (Matching Screenshot 2) */}
                          <AnimatePresence>
                            {isPostTypeDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 space-y-0.5 overflow-hidden"
                              >
                                {availablePostTypesList.map(type => {
                                  const isSelected = allowedPostTypes.includes(type);
                                  return (
                                    <div
                                      key={type}
                                      onClick={() => {
                                        if (isSelected) {
                                          setAllowedPostTypes(prev => prev.filter(t => t !== type));
                                        } else {
                                          setAllowedPostTypes(prev => [...prev, type]);
                                        }
                                      }}
                                      className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                      <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                                        isSelected ? "bg-emerald-500 text-white" : "border-2 border-slate-300"
                                      }`}>
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                      </div>
                                      <span className="text-xs font-semibold text-slate-700">{type}</span>
                                    </div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* 3. Configure cron jobs */}
                      <div className="flex items-start justify-between pb-8">
                        <div className="max-w-xs space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-800">Configure cron jobs</h3>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                              RECOMMENDED
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            We recommend you to configure cronjob on your server for more accurate results.
                          </p>
                        </div>

                        <div className="w-full max-w-sm space-y-4">
                          <div className="flex justify-start">
                            {/* Toggle switch */}
                            <button
                              type="button"
                              onClick={() => setConfigureCron(!configureCron)}
                              className={`w-12 h-6 rounded-full transition-colors p-1 relative flex items-center ${
                                configureCron ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                                configureCron ? "translate-x-6" : "translate-x-0"
                              }`}></div>
                            </button>
                          </div>

                          {configureCron && (
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                                  <span>Cronjob command:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(cronCommand);
                                      setCopiedCron(true);
                                      setTimeout(() => setCopiedCron(false), 2000);
                                    }}
                                    className="text-blue-600 hover:underline flex items-center gap-1 font-bold text-xs"
                                  >
                                    <span>📋</span> {copiedCron ? "Copied!" : "Copy command"}
                                  </button>
                                </div>
                                <div className="border border-slate-200 bg-slate-50 rounded-xl p-3 text-xs font-mono text-slate-700 break-all select-all">
                                  {cronCommand}
                                </div>
                              </div>

                              <div className="border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs bg-white">
                                <span className="font-semibold text-slate-700">Last run:</span>
                                <span className="text-slate-600 font-mono font-bold flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                  {lastCronFormatted}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions (Custom Documentation Link) */}
                      <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        <a
                          href="https://smm.clicktaketech.com/docs"
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[#635BFF] hover:underline"
                        >
                          See documentation
                        </a>
                        <div className="flex items-center gap-4">
                          {generalSaveSuccess && (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> General settings saved!
                            </span>
                          )}
                          <button
                            type="submit"
                            disabled={isSavingGeneral}
                            className="px-8 py-3 bg-[#635BFF] hover:bg-[#5249e6] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-[#635BFF]/20 disabled:opacity-50"
                          >
                            {isSavingGeneral ? "Saving..." : "Save changes"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {activeSettingsMenu === "Facebook" && (
                    <div className="space-y-6">
                      {/* Sub-tabs header */}
                      <div className="flex border-b border-slate-200 mb-8 gap-8">
                        {(["General", "Post Customization", "Story Customization"] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setSettingsSubTab(tab)}
                            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                              settingsSubTab === tab
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      {/* Sub-tab 1: General (Matching Image 1: media_1788261316255.png) */}
                      {settingsSubTab === "General" && (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setSettingsSaving(true);
                            setSettingsSavedSuccess(false);
                            try {
                              const { auth } = await import("@/lib/firebase");
                              const { saveFacebookSettings, getFacebookSettings } = await import("@/lib/firestore");
                              if (auth.currentUser) {
                                const current = await getFacebookSettings(auth.currentUser.uid);
                                await saveFacebookSettings(auth.currentUser.uid, {
                                  ...current,
                                  general: {
                                    ...current.general,
                                    importComments: fbImportComments,
                                    fetchCommentsTimeframe: fbFetchTimeframe,
                                  },
                                });
                              }
                              setSettingsSavedSuccess(true);
                              setTimeout(() => setSettingsSavedSuccess(false), 3000);
                            } catch (err) {
                              console.error("Save Facebook General Settings error:", err);
                            } finally {
                              setSettingsSaving(false);
                            }
                          }}
                          className="space-y-8 max-w-2xl"
                        >
                          <div className="flex items-start justify-between pb-8 border-b border-slate-100">
                            <div className="max-w-xs space-y-1">
                              <h3 className="text-base font-bold text-slate-800">Import Facebook Comments</h3>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Activate the feature to fetch Facebook comments as post comments.
                                This feature is supported by the Official App method, and comments are fetched every 12 hours.
                              </p>
                            </div>

                            <div className="w-64 space-y-4">
                              {/* Toggle switch */}
                              <button
                                type="button"
                                onClick={() => setFbImportComments(!fbImportComments)}
                                className={`w-12 h-6 rounded-full transition-colors p-1 relative flex items-center ${
                                  fbImportComments ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                                  fbImportComments ? "translate-x-6" : "translate-x-0"
                                }`}></div>
                              </button>

                              {fbImportComments && (
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Fetch the post comments published in
                                  </label>
                                  <select
                                    value={fbFetchTimeframe}
                                    onChange={(e) => setFbFetchTimeframe(e.target.value as any)}
                                    className="w-full border border-blue-400 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-600 bg-white"
                                  >
                                    <option value="Last week">Last week</option>
                                    <option value="Last 2 weeks">Last 2 weeks</option>
                                    <option value="Last 3 weeks">Last 3 weeks</option>
                                    <option value="Last month">Last month</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                            <a
                              href="https://smm.clicktaketech.com/docs"
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-[#635BFF] hover:underline"
                            >
                              See documentation
                            </a>
                            <div className="flex items-center gap-4">
                              {settingsSavedSuccess && (
                                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Facebook settings saved!
                                </span>
                              )}
                              <button
                                type="submit"
                                disabled={settingsSaving}
                                className="px-8 py-3 bg-[#635BFF] hover:bg-[#5249e6] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-[#635BFF]/20 disabled:opacity-50"
                              >
                                {settingsSaving ? "Saving..." : "Save changes"}
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Sub-tab 2: Post Customization (Matching Images 2 & 3: media_1788261316262.png & media_1788261316266.png) */}
                      {settingsSubTab === "Post Customization" && (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setSettingsSaving(true);
                            setSettingsSavedSuccess(false);
                            try {
                              const { auth } = await import("@/lib/firebase");
                              const { saveFacebookSettings, getFacebookSettings } = await import("@/lib/firestore");
                              if (auth.currentUser) {
                                const current = await getFacebookSettings(auth.currentUser.uid);
                                await saveFacebookSettings(auth.currentUser.uid, {
                                  ...current,
                                  postCustomization: {
                                    ...current.postCustomization,
                                    customMessage: fbCustomMessage,
                                    uploadPostImages: fbUploadImages,
                                    attachLink: fbAttachLink,
                                    enableFirstComment: fbEnableFirstComment,
                                    firstCommentText: fbFirstCommentText,
                                    firstComment: fbFirstCommentText,
                                  },
                                });
                              }
                              setSettingsSavedSuccess(true);
                              setTimeout(() => setSettingsSavedSuccess(false), 3000);
                            } catch (err) {
                              console.error("Save Facebook Post Customization error:", err);
                            } finally {
                              setSettingsSaving(false);
                            }
                          }}
                          className="space-y-8 max-w-3xl"
                        >
                          {/* 1. Post content */}
                          <div className="flex items-start justify-between pb-8 border-b border-slate-100">
                            <div className="max-w-xs space-y-1">
                              <h3 className="text-base font-bold text-slate-800">Post content</h3>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Customize the shared post content by using available keywords and AI.
                                Click on the desired keyword to add it to the custom message section.
                              </p>
                            </div>

                            <div className="w-full max-w-sm">
                              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-500 transition-all">
                                <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                  <span className="bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                                    Post title ⚙
                                  </span>
                                </div>
                                <textarea
                                  rows={4}
                                  value={fbCustomMessage}
                                  onChange={(e) => setFbCustomMessage(e.target.value)}
                                  className="w-full p-3 text-xs font-mono text-slate-800 outline-none resize-none"
                                />
                                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => setFbCustomMessage(prev => prev + " \n\n✨ AI Generated Content: Enhance your social reach with automated scheduling!")}
                                    className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Use AI
                                  </button>
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setIsKeywordMenuOpen(!isKeywordMenuOpen)}
                                      className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                                    >
                                      <ListIcon className="w-3.5 h-3.5 text-slate-500" /> Keywords
                                    </button>
                                    {isKeywordMenuOpen && (
                                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 text-xs space-y-1 w-36">
                                        {["{title}", "{url}", "{excerpt}", "{author}", "{date}"].map(kw => (
                                          <div
                                            key={kw}
                                            onClick={() => {
                                              setFbCustomMessage(prev => prev + ` ${kw}`);
                                              setIsKeywordMenuOpen(false);
                                            }}
                                            className="px-2 py-1 hover:bg-slate-50 rounded cursor-pointer font-mono font-bold text-slate-700"
                                          >
                                            {kw}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 2. Attach post link */}
                          <div className="flex items-center justify-between pb-8 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-800">Attach post link</h3>
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = !fbAttachLink;
                                setFbAttachLink(nextVal);
                                if (nextVal) setFbUploadImages(false);
                              }}
                              className={`w-12 h-6 rounded-full transition-colors p-1 relative flex items-center ${
                                fbAttachLink ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                                fbAttachLink ? "translate-x-6" : "translate-x-0"
                              }`}></div>
                            </button>
                          </div>

                          {/* 3. Upload post image(s) (Matching Image 2: media_1788261316262.png) */}
                          <div className="flex items-center justify-between pb-8 border-b border-slate-100 relative">
                            <h3 className="text-base font-bold text-slate-800">Upload post image(s)</h3>
                            <div className="relative group">
                              <button
                                type="button"
                                disabled={fbAttachLink}
                                onClick={() => setFbUploadImages(!fbUploadImages)}
                                className={`w-12 h-6 rounded-full transition-colors p-1 relative flex items-center ${
                                  fbUploadImages && !fbAttachLink ? "bg-emerald-500" : "bg-slate-200 cursor-not-allowed opacity-60"
                                }`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                                  fbUploadImages && !fbAttachLink ? "translate-x-6" : "translate-x-0"
                                }`}></div>
                              </button>
                              {fbAttachLink && (
                                <div className="absolute right-0 bottom-full mb-2 bg-slate-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  Media upload is not possible when attach post link is enabled
                                  <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 4. Post a first comment (Matching Image 3: media_1788261316266.png) */}
                          <div className="flex items-start justify-between pb-8">
                            <div className="max-w-xs space-y-1">
                              <h3 className="text-base font-bold text-slate-800">Post a first comment</h3>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Enable the option to share a customized message as a first comment.
                                The feature is supported by the app method only.
                              </p>
                            </div>

                            <div className="w-full max-w-sm space-y-4">
                              <button
                                type="button"
                                onClick={() => setFbEnableFirstComment(!fbEnableFirstComment)}
                                className={`w-12 h-6 rounded-full transition-colors p-1 relative flex items-center ${
                                  fbEnableFirstComment ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                                  fbEnableFirstComment ? "translate-x-6" : "translate-x-0"
                                }`}></div>
                              </button>

                              {fbEnableFirstComment && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-500 transition-all">
                                  <input
                                    type="text"
                                    value={fbFirstCommentText}
                                    onChange={(e) => setFbFirstCommentText(e.target.value)}
                                    placeholder="e.g. @followers"
                                    className="w-full p-3 text-xs font-mono text-slate-800 outline-none"
                                  />
                                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setFbFirstCommentText("@followers Check out our full guide!")}
                                      className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Use AI
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setFbFirstCommentText(prev => prev + " {url}")}
                                      className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                                    >
                                      <ListIcon className="w-3.5 h-3.5 text-slate-500" /> Keywords
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                            <a
                              href="https://smm.clicktaketech.com/docs"
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-[#635BFF] hover:underline"
                            >
                              See documentation
                            </a>
                            <div className="flex items-center gap-4">
                              {settingsSavedSuccess && (
                                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Post customization saved!
                                </span>
                              )}
                              <button
                                type="submit"
                                disabled={settingsSaving}
                                className="px-8 py-3 bg-[#635BFF] hover:bg-[#5249e6] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-[#635BFF]/20 disabled:opacity-50"
                              >
                                {settingsSaving ? "Saving..." : "Save changes"}
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Sub-tab 3: Story Customization (Matching Images 1, 2, 3, 4: media_1788261394283.png - media_1788261452164.png) */}
                      {settingsSubTab === "Story Customization" && (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setSettingsSaving(true);
                            setSettingsSavedSuccess(false);
                            try {
                              const { auth } = await import("@/lib/firebase");
                              const { saveFacebookSettings, getFacebookSettings } = await import("@/lib/firestore");
                              if (auth.currentUser) {
                                const current = await getFacebookSettings(auth.currentUser.uid);
                                await saveFacebookSettings(auth.currentUser.uid, {
                                  ...current,
                                  storyCustomization: {
                                    storyText: fbStoryText,
                                    capitalizeStoryText: fbStoryCapitalize,
                                    urlEncodeStoryText: fbStoryUrlEncode,
                                    attachStoryLink: fbStoryAttachLink,
                                    backgroundColor: storyBgColor,
                                    titleBackgroundColor: storyTitleBgColor,
                                    titleBackgroundOpacity: storyTitleOpacity,
                                    titleColor: storyTitleColor,
                                    titleTopOffset: storyTopOffset,
                                    titleLeftOffset: storyLeftOffset,
                                    titleWidth: storyWidth,
                                    titleFontSize: storyFontSize,
                                    titleFontFamily: storyFontFamily,
                                    titleRtlMode: storyRtlMode,
                                  },
                                });
                              }
                              setSettingsSavedSuccess(true);
                              setTimeout(() => setSettingsSavedSuccess(false), 3000);
                            } catch (err) {
                              console.error("Save Facebook Story Settings error:", err);
                            } finally {
                              setSettingsSaving(false);
                            }
                          }}
                          className="space-y-8 max-w-4xl"
                        >
                          {/* 1. Story text (Matching Image 1: media_1788261394283.png) */}
                          <div className="flex items-start justify-between pb-8 border-b border-slate-100">
                            <div className="max-w-xs space-y-1">
                              <h3 className="text-base font-bold text-slate-800">Story text</h3>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Customize the shared story content by using available keywords and AI. Click on the desired keyword to add it to the custom message section.
                              </p>
                            </div>

                            <div className="w-full max-w-md relative">
                              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-500 transition-all">
                                <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 relative">
                                  {/* Tag badge with red dot indicator */}
                                  <button
                                    type="button"
                                    onClick={() => setFbStoryTagSettingsOpen(!fbStoryTagSettingsOpen)}
                                    className="bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-slate-300 transition-colors relative"
                                  >
                                    Post title ⚙
                                    <span className="w-2 h-2 rounded-full bg-red-500 absolute -top-1 -right-1"></span>
                                  </button>

                                  {/* Tag Popover Settings (Matching Image 1) */}
                                  <AnimatePresence>
                                    {fbStoryTagSettingsOpen && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 w-72 space-y-3"
                                      >
                                        {/* Code snippet tooltip */}
                                        <div className="bg-slate-900 text-white text-[10px] font-mono px-3 py-1.5 rounded-lg text-center font-bold">
                                          {`{post_title ${fbStoryCapitalize ? 'ucfirst="true"' : ''} ${fbStoryUrlEncode ? 'encoded="true"' : ''}}`}
                                        </div>

                                        {/* Capitalize option */}
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold text-slate-700">Capitalize</span>
                                          <button
                                            type="button"
                                            onClick={() => setFbStoryCapitalize(!fbStoryCapitalize)}
                                            className={`w-10 h-5 rounded-full transition-colors p-0.5 relative flex items-center ${
                                              fbStoryCapitalize ? "bg-emerald-500" : "bg-slate-300"
                                            }`}
                                          >
                                            <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform shadow-md ${
                                              fbStoryCapitalize ? "translate-x-5" : "translate-x-0"
                                            }`}></div>
                                          </button>
                                        </div>

                                        {/* URL Encode option */}
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold text-slate-700">URL Encode</span>
                                          <button
                                            type="button"
                                            onClick={() => setFbStoryUrlEncode(!fbStoryUrlEncode)}
                                            className={`w-10 h-5 rounded-full transition-colors p-0.5 relative flex items-center ${
                                              fbStoryUrlEncode ? "bg-emerald-500" : "bg-slate-300"
                                            }`}
                                          >
                                            <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform shadow-md ${
                                              fbStoryUrlEncode ? "translate-x-5" : "translate-x-0"
                                            }`}></div>
                                          </button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                <textarea
                                  rows={3}
                                  value={fbStoryText}
                                  onChange={(e) => setFbStoryText(e.target.value)}
                                  className="w-full p-3 text-xs font-mono text-slate-800 outline-none resize-none"
                                />

                                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => setFbStoryText("{title} — Watch full story!")}
                                    className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Use AI
                                  </button>
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setIsStoryKeywordMenuOpen(!isStoryKeywordMenuOpen)}
                                      className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                                    >
                                      <ListIcon className="w-3.5 h-3.5 text-slate-500" /> Keywords
                                    </button>
                                    {isStoryKeywordMenuOpen && (
                                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 text-xs space-y-1 w-36">
                                        {["{title}", "{url}", "{excerpt}"].map(kw => (
                                          <div
                                            key={kw}
                                            onClick={() => {
                                              setFbStoryText(prev => prev + ` ${kw}`);
                                              setIsStoryKeywordMenuOpen(false);
                                            }}
                                            className="px-2 py-1 hover:bg-slate-50 rounded cursor-pointer font-mono font-bold text-slate-700"
                                          >
                                            {kw}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 2. Attach story link (Matching Image 1) */}
                          <div className="flex items-center justify-between pb-8 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-800">Attach story link</h3>
                            <button
                              type="button"
                              onClick={() => setFbStoryAttachLink(!fbStoryAttachLink)}
                              className={`w-12 h-6 rounded-full transition-colors p-1 relative flex items-center ${
                                fbStoryAttachLink ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                                fbStoryAttachLink ? "translate-x-6" : "translate-x-0"
                              }`}></div>
                            </button>
                          </div>

                          {/* 3. Appearances & Live Preview (Matching Images 2, 3, 4: media_1788261415355.png - media_1788261452164.png) */}
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-bold text-slate-800">Appearances</h3>
                              <p className="text-xs text-slate-400 mt-0.5">Customize story appearances</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                              {/* Left Controls */}
                              <div className="space-y-5">
                                {/* Story background color */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Story background color</label>
                                  <div className="flex items-center border border-slate-200 rounded-xl px-4 py-2.5 bg-white justify-between">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="color"
                                        value={storyBgColor}
                                        onChange={(e) => setStoryBgColor(e.target.value)}
                                        className="w-6 h-6 rounded-full border-none cursor-pointer"
                                      />
                                      <span className="text-xs font-mono text-slate-700 font-bold">{storyBgColor}</span>
                                    </div>
                                    <Pencil className="w-4 h-4 text-slate-400" />
                                  </div>
                                </div>

                                {/* Title background color */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Title background color</label>
                                  <div className="flex items-center border border-slate-200 rounded-xl px-4 py-2.5 bg-white justify-between">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="color"
                                        value={storyTitleBgColor}
                                        onChange={(e) => setStoryTitleBgColor(e.target.value)}
                                        className="w-6 h-6 rounded-full border-none cursor-pointer"
                                      />
                                      <span className="text-xs font-mono text-slate-700 font-bold">{storyTitleBgColor}</span>
                                    </div>
                                    <Pencil className="w-4 h-4 text-slate-400" />
                                  </div>
                                </div>

                                {/* Title background opacity (Matching Image: media_1788261779261.png) */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-xs font-semibold text-slate-700">Title background opacity</label>
                                  </div>
                                  <div className="relative pt-4">
                                    {/* Tooltip value badge floating over slider handle (Matching Screenshot) */}
                                    <div
                                      className="absolute top-0 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm transition-all pointer-events-none"
                                      style={{ left: `${storyTitleOpacity}%` }}
                                    >
                                      {storyTitleOpacity}
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={storyTitleOpacity}
                                      onChange={(e) => setStoryTitleOpacity(Number(e.target.value))}
                                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                  </div>
                                </div>

                                {/* Title color (Matching Image: media_1788261779261.png) */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Title color</label>
                                  <div className="flex items-center border border-slate-200 rounded-xl px-4 py-2.5 bg-white justify-between">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="color"
                                        value={storyTitleColor}
                                        onChange={(e) => setStoryTitleColor(e.target.value)}
                                        className="w-6 h-6 rounded-full border-none cursor-pointer"
                                      />
                                      <span className="text-xs font-mono text-slate-700 font-bold">{storyTitleColor}</span>
                                    </div>
                                    <Pencil className="w-4 h-4 text-slate-400" />
                                  </div>
                                </div>

                                {/* Title top offset (Matching Image: media_1788261779261.png) */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Title top offset</label>
                                  <input
                                    type="number"
                                    value={storyTopOffset}
                                    onChange={(e) => setStoryTopOffset(Number(e.target.value))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500"
                                  />
                                </div>

                                {/* Title left offset (Matching Image: media_1788261779261.png) */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Title left offset</label>
                                  <input
                                    type="number"
                                    value={storyLeftOffset}
                                    onChange={(e) => setStoryLeftOffset(Number(e.target.value))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500"
                                  />
                                </div>

                                {/* Title width */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Title width</label>
                                  <input
                                    type="number"
                                    value={storyWidth}
                                    onChange={(e) => setStoryWidth(Number(e.target.value))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500"
                                  />
                                </div>

                                {/* Title font size */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Title font size</label>
                                  <input
                                    type="number"
                                    value={storyFontSize}
                                    onChange={(e) => setStoryFontSize(Number(e.target.value))}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500"
                                  />
                                </div>

                                {/* Title font family (Matching Image 4) */}
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Title font family</label>
                                  <select
                                    value={storyFontFamily}
                                    onChange={(e) => setStoryFontFamily(e.target.value)}
                                    className="w-full border border-blue-400 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-600 bg-white"
                                  >
                                    {fontFamilyList.map(font => (
                                      <option key={font} value={font}>{font}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Title RTL mode (Matching Image 4) */}
                                <div className="pt-2">
                                  <label
                                    onClick={() => setStoryRtlMode(!storyRtlMode)}
                                    className="flex items-center gap-3 cursor-pointer select-none"
                                  >
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                      storyRtlMode
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : "border-slate-300 bg-white"
                                    }`}>
                                      {storyRtlMode && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">Title RTL mode</span>
                                  </label>
                                </div>
                              </div>

                              {/* Right Live Story Preview Canvas (Matching Image 2 & Screenshot) */}
                              <div className="flex flex-col items-center justify-center sticky top-6">
                                <span className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Live Story Preview</span>
                                <div
                                  className="w-full max-w-[280px] h-[440px] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-start items-start p-4 border border-slate-200"
                                  style={{ backgroundColor: storyBgColor }}
                                >
                                  {/* Floating Story Title Card with Opacity & Positioning */}
                                  <div
                                    className="px-4 py-3 rounded-lg text-center font-bold shadow-lg transition-all"
                                    style={{
                                      backgroundColor: `${storyTitleBgColor}${Math.round((storyTitleOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
                                      color: storyTitleColor,
                                      fontSize: `${Math.min(storyFontSize, 24)}px`,
                                      fontFamily: storyFontFamily,
                                      direction: storyRtlMode ? "rtl" : "ltr",
                                      width: `${Math.min(storyWidth, 240)}px`,
                                      marginTop: `${Math.min(storyTopOffset / 3, 160)}px`,
                                      marginLeft: `${Math.min(storyLeftOffset / 3, 40)}px`,
                                    }}
                                  >
                                    {fbStoryText || "{title}"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                            <a
                              href="https://smm.clicktaketech.com/docs"
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-[#635BFF] hover:underline"
                            >
                              See documentation
                            </a>
                            <div className="flex items-center gap-4">
                              {settingsSavedSuccess && (
                                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Story settings saved!
                                </span>
                              )}
                              <button
                                type="submit"
                                disabled={settingsSaving}
                                className="px-8 py-3 bg-[#635BFF] hover:bg-[#5249e6] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-[#635BFF]/20 disabled:opacity-50"
                              >
                                {settingsSaving ? "Saving..." : "Save changes"}
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {activeSettingsMenu === "Apps" && (
                    <div className="space-y-6">
                      {/* Top Action Bar matching Image 3 (media_1788260324491.png) */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Apps</h2>
                          <p className="text-xs text-slate-400 mt-0.5">Manage your Developer Apps for social network integrations.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {selectedAppIds.length > 0 && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const { deleteSocialApp } = await import("@/lib/firestore");
                                  const deletePromises = selectedAppIds.map(async (id) => {
                                    if (!id.startsWith("app-")) {
                                      await deleteSocialApp(id);
                                    }
                                  });
                                  await Promise.all(deletePromises);
                                  setSocialApps(prev => prev.filter(a => !selectedAppIds.includes(a.id)));
                                  setSelectedAppIds([]);
                                } catch (err) {
                                  console.error("Bulk delete error:", err);
                                }
                              }}
                              className="flex items-center gap-2 px-4 py-2 border border-red-500 bg-white hover:bg-red-50 text-red-600 rounded-xl font-bold text-sm transition-all shadow-sm"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                              <span>Delete {selectedAppIds.length}</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setIsAddAppModalOpen(true);
                              setSelectedNetworkForApp(null);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#635BFF] hover:bg-[#5249e6] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-[#635BFF]/20"
                          >
                            <Plus className="w-4 h-4" /> Add app
                          </button>
                        </div>
                      </div>

                      {/* Apps Table matching Reference Screenshots */}
                      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <tbody>
                            {socialApps.map((app, idx) => {
                              const platformUpper = (app.platform || "app").toUpperCase();
                              let badgeStyle = "bg-slate-100 text-slate-700";
                              if (platformUpper === "BLOGGER") badgeStyle = "bg-amber-100 text-amber-700";
                              if (platformUpper === "FACEBOOK") badgeStyle = "bg-blue-100 text-blue-700";
                              if (platformUpper === "LINKEDIN") badgeStyle = "bg-sky-100 text-sky-700";
                              if (platformUpper === "REDDIT") badgeStyle = "bg-amber-100 text-orange-700";
                              if (platformUpper === "TUMBLR") badgeStyle = "bg-slate-100 text-slate-700";
                              if (platformUpper === "INSTAGRAM") badgeStyle = "bg-pink-100 text-pink-700";

                              const isChecked = selectedAppIds.includes(app.id);

                              return (
                                <tr
                                  key={app.id || idx}
                                  className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors group last:border-b-0 ${
                                    isChecked ? "bg-slate-50/40" : ""
                                  }`}
                                >
                                  {/* Green Checkbox Column (Matching Image 3) */}
                                  <td className="py-4 px-6 w-12 cursor-pointer" onClick={() => {
                                    if (isChecked) setSelectedAppIds(prev => prev.filter(id => id !== app.id));
                                    else setSelectedAppIds(prev => [...prev, app.id]);
                                  }}>
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                      isChecked
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : "border-slate-300 bg-white hover:border-slate-400"
                                    }`}>
                                      {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </div>
                                  </td>
                                  <td className="py-4 px-4 w-40">
                                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full tracking-wider ${badgeStyle}`}>
                                      {platformUpper}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 font-semibold text-slate-800 text-sm">
                                    {app.name}
                                  </td>
                                  <td className="py-4 px-6 w-16 text-right">
                                    <button
                                      onClick={async () => {
                                        try {
                                          const { deleteSocialApp } = await import("@/lib/firestore");
                                          if (app.id && !app.id.startsWith("app-")) {
                                            await deleteSocialApp(app.id);
                                          }
                                          setSocialApps(prev => prev.filter(a => a.id !== app.id));
                                          setSelectedAppIds(prev => prev.filter(id => id !== app.id));
                                        } catch (err) {
                                          console.error("Delete app error:", err);
                                        }
                                      }}
                                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete App"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {socialApps.length === 0 && (
                              <tr>
                                <td colSpan={4} className="py-12 text-center text-slate-400 text-sm">
                                  No apps configured yet. Click "+ Add app" to create your first developer app.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeSettingsMenu !== "General" && activeSettingsMenu !== "Facebook" && activeSettingsMenu !== "Apps" && (
                    <div className="space-y-6 max-w-2xl">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{activeSettingsMenu} Settings</h3>
                        <p className="text-xs text-slate-400 mt-1">Configure automated posting parameters and content templates for {activeSettingsMenu}.</p>
                      </div>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setSettingsSaving(true);
                          setSettingsSavedSuccess(false);
                          try {
                            const { auth } = await import("@/lib/firebase");
                            const { saveSocialNetworkSettings } = await import("@/lib/firestore");
                            if (auth.currentUser) {
                              await saveSocialNetworkSettings(auth.currentUser.uid, activeSettingsMenu, {
                                customMessage: fbCustomMessage,
                                attachLink: fbAttachLink,
                                autoShare: true,
                              });
                            }
                            setSettingsSavedSuccess(true);
                            setTimeout(() => setSettingsSavedSuccess(false), 3000);
                          } catch (err) {
                            console.error(`Save ${activeSettingsMenu} settings error:`, err);
                          } finally {
                            setSettingsSaving(false);
                          }
                        }}
                        className="space-y-6"
                      >
                        {/* Custom Message Template */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700">Custom Post Template</label>
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-500 transition-all">
                            <textarea
                              rows={4}
                              value={fbCustomMessage}
                              onChange={(e) => setFbCustomMessage(e.target.value)}
                              className="w-full p-3 text-xs font-mono text-slate-800 outline-none resize-none"
                            />
                            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
                              <button
                                type="button"
                                onClick={() => setFbCustomMessage(prev => prev + " \n\n✨ AI Generated Content!")}
                                className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Use AI
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Attach Link Toggle */}
                        <div className="flex items-center justify-between py-4 border-t border-slate-100">
                          <span className="text-xs font-bold text-slate-700">Attach Post Link</span>
                          <button
                            type="button"
                            onClick={() => setFbAttachLink(!fbAttachLink)}
                            className={`w-12 h-6 rounded-full transition-colors p-1 relative flex items-center ${
                              fbAttachLink ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                              fbAttachLink ? "translate-x-6" : "translate-x-0"
                            }`}></div>
                          </button>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                          <a
                            href="https://smm.clicktaketech.com/docs"
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-[#635BFF] hover:underline"
                          >
                            See documentation
                          </a>
                          <div className="flex items-center gap-4">
                            {settingsSavedSuccess && (
                              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> {activeSettingsMenu} settings saved!
                              </span>
                            )}
                            <button
                              type="submit"
                              disabled={settingsSaving}
                              className="px-8 py-3 bg-[#635BFF] hover:bg-[#5249e6] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-[#635BFF]/20 disabled:opacity-50"
                            >
                              {settingsSaving ? "Saving..." : "Save changes"}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>

              {/* Add App Modal — Matching Image 2 Exactly */}
              <AnimatePresence>
                {isAddAppModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[580px] overflow-hidden flex flex-col border border-slate-100"
                    >
                      {/* Header */}
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-lg">Add Developer App</h3>
                        <button
                          onClick={() => {
                            setIsAddAppModalOpen(false);
                            setSelectedNetworkForApp(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Body: Left Networks List + Right Form (Image 2) */}
                      <div className="flex flex-1 overflow-hidden">
                        {/* Left Networks List matching Image 2 */}
                        <div className="w-64 border-r border-slate-100 overflow-y-auto p-3 space-y-1 bg-slate-50/50">
                          {[
                            { id: "facebook", name: "Facebook", Icon: FaFacebook, color: "text-blue-600" },
                            { id: "instagram", name: "Instagram", Icon: FaInstagram, color: "text-pink-600" },
                            { id: "threads", name: "Threads", Icon: SiThreads, color: "text-slate-900" },
                            { id: "tiktok", name: "Tiktok", Icon: FaTiktok, color: "text-slate-900" },
                            { id: "linkedin", name: "Linkedin", Icon: FaLinkedin, color: "text-blue-600" },
                            { id: "pinterest", name: "Pinterest", Icon: FaPinterest, color: "text-red-600" },
                            { id: "reddit", name: "Reddit", Icon: FaReddit, color: "text-orange-600" },
                            { id: "youtube", name: "YouTube Shorts", Icon: FaYoutube, color: "text-red-600" },
                            { id: "google_business", name: "Google Business", Icon: FaGoogle, color: "text-blue-600" },
                            { id: "blogger", name: "Blogger", Icon: FaBlogger, color: "text-amber-600" },
                          ].map(net => (
                            <div
                              key={net.id}
                              onClick={() => {
                                setSelectedNetworkForApp(net);
                                setAppNameInput(`${net.name} App`);
                              }}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                                selectedNetworkForApp?.id === net.id
                                  ? "bg-white text-slate-900 font-bold shadow-sm border border-slate-200"
                                  : "text-slate-700 hover:bg-white hover:text-slate-900 font-medium"
                              }`}
                            >
                              <net.Icon className={`w-5 h-5 ${net.color}`} />
                              <span className="text-sm">{net.name}</span>
                            </div>
                          ))}
                        </div>

                        {/* Right Area Content matching Image 2 */}
                        <div className="flex-1 p-8 bg-white overflow-y-auto">
                          {!selectedNetworkForApp ? (
                            <div className="flex items-center text-slate-500 text-sm font-semibold h-full pt-12">
                              <ArrowLeft className="w-5 h-5 mr-3 text-slate-400" />
                              Please choose a social network to add an App.
                            </div>
                          ) : (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (!appNameInput || !appIdInput) return;
                                setIsSubmittingApp(true);
                                setAppSaveSuccess(false);
                                try {
                                  const { auth } = await import("@/lib/firebase");
                                  const { addSocialApp } = await import("@/lib/firestore");
                                  const userId = auth.currentUser?.uid || "demo";
                                  const newAppId = await addSocialApp({
                                    userId,
                                    name: appNameInput,
                                    platform: selectedNetworkForApp.id,
                                    appId: appIdInput,
                                    appSecret: appSecretInput,
                                  });
                                  setSocialApps(prev => [
                                    {
                                      id: newAppId,
                                      userId,
                                      name: appNameInput,
                                      platform: selectedNetworkForApp.id,
                                      appId: appIdInput,
                                    },
                                    ...prev,
                                  ]);
                                  setAppSaveSuccess(true);
                                  setTimeout(() => {
                                    setIsAddAppModalOpen(false);
                                    setAppSaveSuccess(false);
                                  }, 1500);
                                } catch (err) {
                                  console.error("Save app error:", err);
                                } finally {
                                  setIsSubmittingApp(false);
                                }
                              }}
                              className="space-y-6 max-w-md"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                  <selectedNetworkForApp.Icon className={`w-6 h-6 ${selectedNetworkForApp.color}`} />
                                  <h4 className="font-bold text-slate-800 text-lg">{selectedNetworkForApp.name} App</h4>
                                </div>
                                <a
                                  href="https://smm.clicktaketech.com/docs"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-600 font-semibold hover:underline"
                                >
                                  See documentation
                                </a>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">App Name *</label>
                                <input
                                  type="text"
                                  required
                                  value={appNameInput}
                                  onChange={(e) => setAppNameInput(e.target.value)}
                                  placeholder="e.g. My App"
                                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">App ID / Client ID *</label>
                                <input
                                  type="text"
                                  required
                                  value={appIdInput}
                                  onChange={(e) => setAppIdInput(e.target.value)}
                                  placeholder="Enter App ID"
                                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 font-mono text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">App Secret / Client Secret</label>
                                <input
                                  type="password"
                                  value={appSecretInput}
                                  onChange={(e) => setAppSecretInput(e.target.value)}
                                  placeholder="Enter App Secret"
                                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 font-mono text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">OAuth Redirect URI</label>
                                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs font-mono text-slate-600 flex items-center justify-between">
                                  <span className="truncate">http://localhost:3000/api/oauth/callback</span>
                                  <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText("http://localhost:3000/api/oauth/callback")}
                                    className="text-blue-600 text-xs font-bold hover:underline shrink-0 ml-2"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>

                              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => setIsAddAppModalOpen(false)}
                                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                  Cancel
                                </button>
                                <div className="flex items-center gap-3">
                                  {appSaveSuccess && (
                                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-4 h-4" /> App Saved!
                                    </span>
                                  )}
                                  <button
                                    type="submit"
                                    disabled={isSubmittingApp}
                                    className="px-6 py-2.5 bg-[#635BFF] hover:bg-[#5249e6] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#635BFF]/20 disabled:opacity-50"
                                  >
                                    {isSubmittingApp ? "Saving..." : "Save App"}
                                  </button>
                                </div>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Channel Modal */}
      <AnimatePresence>
        {isAddChannelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[600px] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-200 flex justify-end">
                <button onClick={() => {
                  setIsAddChannelModalOpen(false);
                  setSelectedNetworkToAdd(null);
                  setAddChannelMode("easy");
                }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar Networks */}
                <div className="w-64 border-r border-slate-200 overflow-y-auto py-2">
                  {networkOptionsAddModal.map(net => (
                    <div 
                      key={net.id}
                      onClick={() => {
                        setSelectedNetworkToAdd(net);
                        setAddChannelMode("easy");
                      }}
                      className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${selectedNetworkToAdd?.id === net.id ? 'bg-slate-50 border-r-2 border-[#635BFF]' : 'hover:bg-slate-50'}`}
                    >
                      <NetAvatar net={net} size="sm" />
                      <span className={`text-sm font-medium ${selectedNetworkToAdd?.id === net.id ? 'text-slate-900' : 'text-slate-700'}`}>{net.name}</span>
                    </div>
                  ))}
                </div>

                {/* Right Area Content */}
                <div className="flex-1 p-6 bg-white flex flex-col overflow-y-auto">
                  {!selectedNetworkToAdd ? (
                    <div className="flex items-center justify-center h-full text-slate-500 font-medium">
                      <ArrowLeft className="w-5 h-5 mr-4 text-slate-400" />
                      Please choose a social network from the list.
                    </div>
                  ) : selectedNetworkToAdd.id === "fb" || selectedNetworkToAdd.id === "facebook" ? (
                    <div className="flex flex-col h-full max-w-lg mx-auto w-full">
                      {/* Method Selector Tabs */}
                      <div className="flex border-b border-slate-200 mb-6">
                        <button
                          onClick={() => setFbMethodTab("app")}
                          className={`flex-1 py-2.5 text-center text-sm font-semibold border-b-2 transition-all ${
                            fbMethodTab === "app"
                              ? "border-blue-600 text-blue-600"
                              : "border-transparent text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          App Method (Official API)
                        </button>
                        <button
                          onClick={() => setFbMethodTab("cookie")}
                          className={`flex-1 py-2.5 text-center text-sm font-semibold border-b-2 transition-all ${
                            fbMethodTab === "cookie"
                              ? "border-blue-600 text-blue-600"
                              : "border-transparent text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Cookie Method (Account/Groups/Stories)
                        </button>
                      </div>

                      {fbMethodTab === "app" ? (
                        <div className="flex flex-col justify-between flex-1">
                          <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
                              <h4 className="font-bold mb-1">App Method Details</h4>
                              <p className="text-xs text-blue-700 leading-relaxed">
                                Connect your Facebook Pages safely using Facebook's official Graph API.
                                100% reliable with zero risk of account restriction. Supports <b>Pages only</b>.
                              </p>
                            </div>

                            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs space-y-2 text-slate-600">
                              <div className="flex items-center justify-between font-semibold text-slate-800">
                                <span>Supported Channels:</span>
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Pages Only</span>
                              </div>
                              <p>• Automatically fetches all Pages managed by your Facebook account.</p>
                              <p>• Uses long-lived Page Access Tokens that act as the Page itself.</p>
                            </div>
                          </div>

                          <div className="pt-6">
                            <a
                              href="/api/oauth/login?network=facebook"
                              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold rounded-xl transition-all shadow-md"
                            >
                              <FaFacebook className="text-xl" />
                              <span>Add Pages via Facebook App</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col flex-1 space-y-4">
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                            <h4 className="font-bold mb-0.5">Cookie Method (FS Poster Standard)</h4>
                            <p className="text-amber-800">
                              Enables posting to Personal Timelines, Groups, Personal Stories, and Page Stories.
                            </p>
                          </div>

                          {/* Browser Cookie Extraction Instructions */}
                          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 text-xs text-slate-600 space-y-1">
                            <p className="font-bold text-slate-800">How to get your Facebook cookies:</p>
                            <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                              <li>Open <b>facebook.com</b> in Chrome/Edge and log in to your account.</li>
                              <li>Press <b>F12</b> to open Developer Tools → click <b>Application</b> tab.</li>
                              <li>In the left sidebar, expand <b>Cookies</b> → select <b>https://www.facebook.com</b>.</li>
                              <li>Copy the value of <b>c_user</b> (Numeric ID) and <b>xs</b> (Session String).</li>
                            </ol>
                          </div>

                          {cookieError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                              {cookieError}
                            </div>
                          )}
                          {cookieSuccess && (
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
                              {cookieSuccess}
                            </div>
                          )}

                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!cookieCUser || !cookieXs) {
                                setCookieError("Both c_user and xs cookies are required.");
                                return;
                              }
                              setCookieSubmitting(true);
                              setCookieError(null);
                              setCookieSuccess(null);
                              try {
                                const { auth } = await import("@/lib/firebase");
                                const token = await auth.currentUser?.getIdToken();
                                const res = await fetch("/api/facebook/cookie", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({
                                    c_user: cookieCUser,
                                    xs: cookieXs,
                                    datr: cookieDatr,
                                  }),
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error || "Cookie authentication failed.");
                                setCookieSuccess(`Success! Created ${data.channelsCount} channels for ${data.accountName}.`);
                                refreshChannels();
                                setTimeout(() => {
                                  setIsAddChannelModalOpen(false);
                                  setCookieSuccess(null);
                                }, 2000);
                              } catch (err: any) {
                                setCookieError(err.message);
                              } finally {
                                setCookieSubmitting(false);
                              }
                            }}
                            className="space-y-3"
                          >
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">c_user Cookie *</label>
                              <input
                                type="text"
                                required
                                value={cookieCUser}
                                onChange={(e) => setCookieCUser(e.target.value)}
                                placeholder="e.g. 1000849201948"
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">xs Cookie *</label>
                              <input
                                type="password"
                                required
                                value={cookieXs}
                                onChange={(e) => setCookieXs(e.target.value)}
                                placeholder="e.g. 38%3A19482%3A2%3A169..."
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">datr Cookie (Optional)</label>
                              <input
                                type="text"
                                value={cookieDatr}
                                onChange={(e) => setCookieDatr(e.target.value)}
                                placeholder="Optional datr value"
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={cookieSubmitting}
                              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                            >
                              {cookieSubmitting ? "Connecting Channels..." : "Connect Account via Cookie"}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  ) : selectedNetworkToAdd.id === "tw" || selectedNetworkToAdd.id === "twitter" || selectedNetworkToAdd.id === "x" ? (
                    <div className="flex flex-col h-full max-w-lg mx-auto w-full">
                      {/* Twitter Method Selector Tabs (FS Poster Matching) */}
                      <div className="flex border-b border-slate-200 mb-6">
                        <button
                          onClick={() => setTwitterMethodTab("app")}
                          className={`flex-1 py-2.5 text-center text-sm font-semibold border-b-2 transition-all ${
                            twitterMethodTab === "app"
                              ? "border-blue-600 text-blue-600"
                              : "border-transparent text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Option 1: App Method (Personal App)
                        </button>
                        <button
                          onClick={() => setTwitterMethodTab("cookie")}
                          className={`flex-1 py-2.5 text-center text-sm font-semibold border-b-2 transition-all ${
                            twitterMethodTab === "cookie"
                              ? "border-blue-600 text-blue-600"
                              : "border-transparent text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Option 2: Cookie Method
                        </button>
                      </div>

                      {twitterMethodTab === "app" ? (
                        <div className="flex flex-col justify-between flex-1 space-y-4">
                          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-900 space-y-1">
                            <h4 className="font-bold text-slate-800 text-sm">App Method (Recommended)</h4>
                            <p className="text-sky-800 leading-relaxed">
                              Connect your Twitter account using your own Twitter Developer App (API Key & Secret).
                              Official and 100% reliable without risk of account restriction.
                            </p>
                          </div>

                          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs space-y-2 text-slate-600">
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span>Callback URL for Developer App:</span>
                              <button
                                onClick={() => navigator.clipboard.writeText("http://localhost:3000/api/oauth/callback")}
                                className="text-blue-600 text-xs font-bold hover:underline"
                              >
                                Copy
                              </button>
                            </div>
                            <div className="p-2 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-700 select-all">
                              http://localhost:3000/api/oauth/callback
                            </div>
                          </div>

                          <div className="pt-4">
                            <a
                              href="/api/oauth/login?network=twitter"
                              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-md"
                            >
                              <span>Sign in with Twitter App</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col flex-1 space-y-4">
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                            <h4 className="font-bold mb-0.5">Cookie Method (No Developer App needed)</h4>
                            <p className="text-amber-800">
                              Extract your session cookies directly from your browser to connect your Twitter / X account instantly.
                            </p>
                          </div>

                          {/* Browser Instructions matching FS Poster Twitter Documentation */}
                          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 text-xs text-slate-600 space-y-1">
                            <p className="font-bold text-slate-800">How to get your Twitter cookies:</p>
                            <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                              <li>Open <b>x.com</b> (or twitter.com) in Chrome and log in.</li>
                              <li>Press <b>F12</b> to open DevTools → click <b>Application</b> tab.</li>
                              <li>Expand <b>Cookies</b> → select <b>https://x.com</b>.</li>
                              <li>Copy the value of <b>auth_token</b> and <b>ct0</b>.</li>
                            </ol>
                          </div>

                          {twitterError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                              {twitterError}
                            </div>
                          )}
                          {twitterSuccess && (
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
                              {twitterSuccess}
                            </div>
                          )}

                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!twitterAuthToken || !twitterCt0) {
                                setTwitterError("Both auth_token and ct0 cookies are required.");
                                return;
                              }
                              setTwitterSubmitting(true);
                              setTwitterError(null);
                              setTwitterSuccess(null);
                              try {
                                const { auth } = await import("@/lib/firebase");
                                const token = await auth.currentUser?.getIdToken();
                                const res = await fetch("/api/twitter/cookie", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({
                                    userId: auth.currentUser?.uid || "demo",
                                    authToken: twitterAuthToken,
                                    ct0: twitterCt0,
                                  }),
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error || "Twitter cookie connection failed.");
                                setTwitterSuccess(`Success! Connected ${data.name} via Cookie method.`);
                                refreshChannels();
                                setTimeout(() => {
                                  setIsAddChannelModalOpen(false);
                                  setTwitterSuccess(null);
                                }, 2000);
                              } catch (err: any) {
                                setTwitterError(err.message);
                              } finally {
                                setTwitterSubmitting(false);
                              }
                            }}
                            className="space-y-3"
                          >
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">auth_token Cookie *</label>
                              <input
                                type="password"
                                required
                                value={twitterAuthToken}
                                onChange={(e) => setTwitterAuthToken(e.target.value)}
                                placeholder="e.g. 4d7a892b1..."
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">ct0 Cookie *</label>
                              <input
                                type="text"
                                required
                                value={twitterCt0}
                                onChange={(e) => setTwitterCt0(e.target.value)}
                                placeholder="e.g. e81a4b7f..."
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={twitterSubmitting}
                              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                            >
                              {twitterSubmitting ? "Connecting Twitter..." : "Connect Twitter via Cookie"}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col h-full max-w-md mx-auto w-full justify-center items-center text-center space-y-4">
                      <NetAvatar net={selectedNetworkToAdd} size="lg" />
                      <h3 className="text-lg font-bold text-slate-800">Connect {selectedNetworkToAdd.name}</h3>
                      <p className="text-xs text-slate-500 max-w-xs">
                        Authorize {selectedNetworkToAdd.name} to allow social auto-posting and scheduling.
                      </p>
                      <a
                        href={selectedNetworkToAdd.signInUrl}
                        className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all"
                      >
                        Sign in with {selectedNetworkToAdd.name}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4 overflow-x-auto">
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-10 h-10 rounded-full border-2 border-green-500 p-0.5 flex items-center justify-center relative">
                      <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border border-white flex items-center justify-center text-white text-[8px] font-bold">f</div>
                    </div>
                    <span className="text-xs font-medium text-slate-700">Gadg...</span>
                  </div>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex flex-col items-center gap-1 opacity-50 cursor-pointer hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full border-2 border-transparent p-0.5 flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <UserCheck className="w-5 h-5" />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-500">gadg...</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelectedPost(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 relative">
                      <UserCheck className="w-5 h-5" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border border-white flex items-center justify-center text-white text-[8px] font-bold">f</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 leading-tight">{selectedPost.authorEmail || "User"}</h4>
                      <p className="text-sm text-slate-500">location</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    Sharing date: <span className="font-semibold text-slate-700">
                      {selectedPost.createdAt?.toDate 
                        ? selectedPost.createdAt.toDate().toLocaleString() 
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                {selectedPost.status === "published" ? (
                  <div className="bg-[#dcfce7] border border-[#bbf7d0] rounded-lg p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center text-green-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Shared successfully
                    </div>
                    <button className="flex items-center px-4 py-1.5 border border-green-600 text-green-700 rounded text-sm font-medium hover:bg-green-50 transition-colors bg-transparent">
                      Go to post <ExternalLink className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center text-red-700 font-medium">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Failed to share or Pending
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg border border-slate-200 mb-6 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 font-bold text-slate-800">Media</div>
                  <div className="p-4">
                    <div className="w-40 h-40 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-medium overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center">
                         Image/Video Content
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border-y border-slate-100 font-bold text-slate-800">Content</div>
                  <div className="p-4 text-sm text-slate-600 whitespace-pre-wrap">
                    {selectedPost.content}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="flex items-center px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </button>
                  <button className="flex items-center px-4 py-2 text-green-600 border border-green-200 hover:bg-green-50 rounded-lg font-medium text-sm transition-colors">
                    <RefreshCw className="w-4 h-4 mr-2" /> Reschedule
                  </button>
                </div>
                <div className="relative group">
                  <button className="flex items-center px-4 py-2 text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors">
                    <BarChart className="w-4 h-4 mr-2" /> Insights
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-32 bg-white text-slate-700 text-center text-sm py-2 px-3 rounded-lg shadow-lg border border-slate-100 font-medium">
                    Hits: 0
                    <div className="absolute -bottom-1 right-6 w-2 h-2 bg-white border-b border-r border-slate-100 transform rotate-45"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Schedule Post Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              key={`schedule-modal-step-${scheduleStep}`}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden ${
                scheduleStep === 2 ? "max-w-4xl" : "max-w-2xl"
              }`}
            >

              {/* ─── STEP 1: Choose a Channel ─── */}
              {scheduleStep === 1 && (
                <div className="relative flex flex-col items-center justify-center py-20 px-8 text-center">
                  <button
                    onClick={() => { setIsScheduleModalOpen(false); setScheduleStep(1); setSelectedChannelsForPost([]); setPostContent(""); }}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Icon */}
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <MonitorPlay className="w-9 h-9 text-slate-400" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 mb-2">No channels chosen, yet.</h3>
                  <p className="text-slate-500 mb-8 max-w-xs">
                    Select the social channels you want to post to before composing your content.
                  </p>

                  <button
                    onClick={() => setScheduleStep(2)}
                    className="inline-flex items-center gap-2 bg-[#635BFF] hover:bg-[#5249e6] text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Choose channels <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ─── STEP 2: Channel Selector ─── */}
              {scheduleStep === 2 && (
                <div className="flex flex-col h-[620px]">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800 text-lg">Select Channels</h2>
                    <button
                      onClick={() => { setIsScheduleModalOpen(false); setScheduleStep(1); setSelectedChannelsForPost([]); }}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-1 overflow-hidden">
                    {/* Left — Available Channels */}
                    <div className="flex-1 flex flex-col border-r border-slate-100">
                      <div className="px-4 pt-4 pb-2">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search channels…"
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] transition-all"
                            value={channelSearchQuery}
                            onChange={(e) => setChannelSearchQuery(e.target.value)}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 pl-1">
                          {channels.filter(c => !selectedChannelsForPost.find(sc => sc.id === c.id)).length} available
                        </p>
                      </div>
                      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
                        {channels
                          .filter(c => !selectedChannelsForPost.find(sc => sc.id === c.id))
                          .filter(c => c.name.toLowerCase().includes(channelSearchQuery.toLowerCase()))
                          .map(channel => {
                            const netCfg = networkOptionsAddModal.find(n => n.id === channel.network);
                            return (
                              <div
                                key={channel.id}
                                onClick={() => setSelectedChannelsForPost(prev => [...prev, channel])}
                                className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer group transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-bold text-base uppercase shadow-sm">
                                      {channel.name.charAt(0)}
                                    </div>
                                    {netCfg && (
                                      <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 ${netCfg.bg} rounded-full flex items-center justify-center border-2 border-white shadow`}>
                                        <netCfg.Icon className="w-2.5 h-2.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-slate-800 text-sm truncate">{channel.name}</p>
                                      {channel.channelType && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                          channel.channelType.includes("story")
                                            ? "bg-purple-100 text-purple-700"
                                            : channel.channelType === "group"
                                            ? "bg-amber-100 text-amber-700"
                                            : channel.channelType === "account"
                                            ? "bg-slate-100 text-slate-700"
                                            : "bg-blue-100 text-blue-700"
                                        }`}>
                                          {channel.channelType}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${channel.status === "connected" ? "bg-green-500" : "bg-red-400"}`}></span>
                                      <span className="text-[11px] text-slate-400 capitalize">{channel.status}</span>
                                      <span className="text-[10px] text-slate-400 font-medium">({channel.method === "app" ? "App" : "Cookie"})</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-6 h-6 bg-[#635BFF]/10 rounded-full flex items-center justify-center">
                                    <ArrowRight className="w-3 h-3 text-[#635BFF]" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        {channels.filter(c => !selectedChannelsForPost.find(sc => sc.id === c.id) && c.name.toLowerCase().includes(channelSearchQuery.toLowerCase())).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                              <Search className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">No channels found</p>
                            <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Center — Move Buttons */}
                    <div className="flex flex-col justify-center items-center gap-2 px-4 bg-slate-50/50">
                      <button
                        onClick={() => {
                          const unselected = channels.filter(c => !selectedChannelsForPost.find(sc => sc.id === c.id));
                          setSelectedChannelsForPost(prev => [...prev, ...unselected]);
                        }}
                        title="Add all"
                        className="w-9 h-9 flex items-center justify-center border border-slate-200 bg-white rounded-lg shadow-sm hover:bg-[#635BFF] hover:text-white hover:border-[#635BFF] text-slate-500 transition-all text-xs font-bold"
                      >
                        »
                      </button>
                      <button
                        onClick={() => setSelectedChannelsForPost([])}
                        title="Remove all"
                        className="w-9 h-9 flex items-center justify-center border border-slate-200 bg-white rounded-lg shadow-sm hover:bg-red-500 hover:text-white hover:border-red-500 text-slate-400 transition-all text-xs font-bold"
                      >
                        «
                      </button>
                    </div>

                    {/* Right — Selected Channels */}
                    <div className="flex-1 flex flex-col">
                      <div className="px-4 pt-4 pb-2">
                        <p className="text-sm font-semibold text-slate-700">Selected</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {selectedChannelsForPost.length} channel{selectedChannelsForPost.length !== 1 ? "s" : ""} chosen
                        </p>
                      </div>
                      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
                        {selectedChannelsForPost.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                              <MonitorPlay className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">No result</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-[160px]">Click a channel on the left to add it here</p>
                          </div>
                        ) : (
                          selectedChannelsForPost.map(channel => {
                            const netCfg = networkOptionsAddModal.find(n => n.id === channel.network);
                            return (
                              <div
                                key={channel.id}
                                onClick={() => setSelectedChannelsForPost(prev => prev.filter(c => c.id !== channel.id))}
                                className="flex items-center justify-between px-3 py-2.5 hover:bg-red-50 rounded-xl cursor-pointer group transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-bold text-base uppercase shadow-sm">
                                      {channel.name.charAt(0)}
                                    </div>
                                    {netCfg && (
                                      <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 ${netCfg.bg} rounded-full flex items-center justify-center border-2 border-white shadow`}>
                                        <netCfg.Icon className="w-2.5 h-2.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 text-sm truncate">{channel.name}</p>
                                    <span className="text-[11px] text-green-600 font-medium">✓ Selected</span>
                                  </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                    <X className="w-3 h-3 text-red-500" />
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() => setScheduleStep(1)}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setIsScheduleModalOpen(false); setScheduleStep(1); setSelectedChannelsForPost([]); }}
                        className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { if (selectedChannelsForPost.length > 0) setScheduleStep(3); }}
                        disabled={selectedChannelsForPost.length === 0}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                          selectedChannelsForPost.length > 0
                            ? "bg-[#635BFF] text-white hover:bg-[#5249e6] shadow-[#635BFF]/30"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        Add {selectedChannelsForPost.length > 0 && `(${selectedChannelsForPost.length})`}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Post Composer ─── */}
              {scheduleStep === 3 && (
                <div className="flex flex-col max-h-[85vh]">
                  {/* Channel Tabs Header */}
                  <div className="flex items-center border-b border-slate-100 relative bg-white px-4 pt-4 pb-0">
                    <div className="flex items-end gap-1 overflow-x-auto pr-20 w-full">
                      {selectedChannelsForPost.map((c, i) => {
                        const netCfg = networkOptionsAddModal.find(n => n.id === c.network);
                        return (
                          <div
                            key={c.id}
                            className={`flex flex-col items-center gap-1.5 px-3 pb-3 pt-1 min-w-[72px] cursor-pointer rounded-t-xl border-b-2 transition-all ${
                              i === 0 ? "border-[#635BFF] bg-[#635BFF]/5" : "border-transparent hover:bg-slate-50"
                            }`}
                          >
                            <div className="relative">
                              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base uppercase shadow-sm ${
                                i === 0 ? "ring-2 ring-[#635BFF] ring-offset-2" : "bg-slate-100 text-slate-500"
                              } ${i === 0 ? "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700" : ""}`}>
                                {c.name.charAt(0)}
                              </div>
                              {netCfg && (
                                <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 ${netCfg.bg} rounded-full flex items-center justify-center border-2 border-white shadow`}>
                                  <netCfg.Icon className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <span className={`text-[10px] font-semibold truncate w-16 text-center ${i === 0 ? "text-[#635BFF]" : "text-slate-500"}`}>
                              {c.name.length > 8 ? c.name.slice(0, 8) + "…" : c.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setScheduleStep(2)}
                      className="absolute right-4 top-1/2 -translate-y-1/3 flex flex-col items-center gap-0.5 text-slate-400 hover:text-[#635BFF] transition-colors"
                    >
                      <div className="w-9 h-9 border-2 border-dashed border-slate-200 hover:border-[#635BFF] rounded-full flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium">Add</span>
                    </button>
                  </div>

                  {/* Scrollable Body */}
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Channel Info + Sync Row */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const c = selectedChannelsForPost[0];
                          const netCfg = c ? networkOptionsAddModal.find(n => n.id === c.network) : null;
                          return c ? (
                            <>
                              <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-bold uppercase text-sm">
                                  {c.name.charAt(0)}
                                </div>
                                {netCfg && (
                                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${netCfg.bg} rounded-full flex items-center justify-center border-2 border-white`}>
                                    <netCfg.Icon className="w-2 h-2 text-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                                <p className="text-[11px] text-slate-400 capitalize">{netCfg?.name || c.network}</p>
                              </div>
                            </>
                          ) : null;
                        })()}
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="w-5 h-5 bg-green-500 rounded-md flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm text-slate-700 font-medium">Sync content</span>
                        <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
                      </label>
                    </div>

                    {/* Attach Link */}
                    <div>
                      <label 
                        className="flex items-center gap-3 cursor-pointer group mb-2"
                        onClick={() => { setAttachLink(!attachLink); if (!attachLink) setUploadMedia(false); }}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shadow-sm ${attachLink ? 'bg-green-500' : 'border-2 border-slate-200 group-hover:border-[#635BFF]'}`}>
                          {attachLink && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-slate-700 font-medium text-sm">Attach link</span>
                      </label>
                      {attachLink && (
                        <div className="pl-8 mb-4">
                          <input 
                            type="text" 
                            placeholder="Custom link" 
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#635BFF]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Upload Media */}
                    <div>
                      <label 
                        className="flex items-center gap-3 cursor-pointer mb-3 group"
                        onClick={() => { setUploadMedia(!uploadMedia); if (!uploadMedia) setAttachLink(false); }}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shadow-sm ${uploadMedia ? 'bg-green-500' : 'border-2 border-slate-200 group-hover:border-[#635BFF]'}`}>
                          {uploadMedia && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-slate-700 font-medium text-sm">Upload media</span>
                      </label>
                      {uploadMedia && (
                        <div className="pl-8 mb-4">
                          <div className="w-28 h-28 border-2 border-dashed border-slate-200 hover:border-[#635BFF] rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-[#635BFF] cursor-pointer hover:bg-[#635BFF]/5 transition-all group">
                            <svg className="w-7 h-7 mb-1 text-slate-300 group-hover:text-[#635BFF] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect width="18" height="18" x="3" y="3" rx="3" ry="3"/>
                              <circle cx="9" cy="9" r="2"/>
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                            </svg>
                            <span className="text-[10px] font-medium">Add media</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div>
                      <label className="block font-semibold text-slate-800 text-sm mb-2">Post content</label>
                      <div className={`border rounded-xl overflow-hidden transition-all ${
                        postContent.length > 0 ? "border-[#635BFF] shadow-sm shadow-[#635BFF]/10" : "border-slate-200"
                      } focus-within:border-[#635BFF] focus-within:shadow-sm focus-within:shadow-[#635BFF]/10`}>
                        <textarea
                          className="w-full p-4 text-sm text-slate-700 focus:outline-none resize-none bg-white"
                          rows={5}
                          placeholder="What do you want to share today?"
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                        />
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-slate-400">
                            <button className="hover:text-slate-600 transition-colors" title="Emoji">
                              <span className="text-base">😊</span>
                            </button>
                          </div>
                          <span className={`text-xs font-semibold tabular-nums ${postContent.length > 240 ? "text-red-500" : "text-slate-400"}`}>
                            {postContent.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4 relative">
                    {/* Date-time picker */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <button 
                          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                          className="flex items-center gap-2 border border-slate-200 hover:border-[#635BFF] rounded-xl px-3 py-2 cursor-pointer group transition-all bg-white text-left min-w-[200px]"
                        >
                          <CalendarIcon className="w-4 h-4 text-slate-400 group-hover:text-[#635BFF] transition-colors" />
                          <span className="text-sm font-medium text-slate-700">
                            {formatScheduleDate(scheduleDate)}
                          </span>
                        </button>
                        
                        {/* Custom Calendar Popup */}
                        {isCalendarOpen && (
                          <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4">
                            <div className="flex items-center justify-between mb-4">
                              <button onClick={() => { const d = new Date(calViewDate); d.setMonth(d.getMonth() - 1); setCalViewDate(d); }} className="p-1 hover:bg-slate-100 rounded">
                                <ChevronLeft className="w-4 h-4 text-slate-600" />
                              </button>
                              <span className="font-semibold text-slate-800 text-sm">
                                {calViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                              </span>
                              <button onClick={() => { const d = new Date(calViewDate); d.setMonth(d.getMonth() + 1); setCalViewDate(d); }} className="p-1 hover:bg-slate-100 rounded">
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                              </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                                <div key={day} className="text-[11px] font-medium text-slate-400">{day}</div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center mb-4">
                              {/* Very basic calendar rendering (mock for visual representation) */}
                              {Array.from({ length: 31 }).map((_, i) => {
                                const day = i + 1;
                                const isWeekend = (i + 1) % 7 === 6 || (i + 1) % 7 === 0; // rough mock
                                const isSelected = scheduleDate.getDate() === day && scheduleDate.getMonth() === calViewDate.getMonth();
                                return (
                                  <button 
                                    key={i} 
                                    onClick={() => {
                                      const d = new Date(scheduleDate);
                                      d.setMonth(calViewDate.getMonth());
                                      d.setFullYear(calViewDate.getFullYear());
                                      d.setDate(day);
                                      setScheduleDate(d);
                                    }}
                                    className={`w-8 h-8 mx-auto flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                                      isSelected 
                                        ? 'bg-[#1D8BE6] text-white shadow-sm' 
                                        : isWeekend 
                                          ? 'text-red-500 hover:bg-slate-50' 
                                          : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-2">
                              <input 
                                type="time" 
                                className="w-full text-sm font-medium text-slate-700 bg-transparent focus:outline-none"
                                value={scheduleDate.toTimeString().slice(0,5)}
                                onChange={(e) => {
                                  const [h,m] = e.target.value.split(':');
                                  const d = new Date(scheduleDate);
                                  d.setHours(parseInt(h), parseInt(m));
                                  setScheduleDate(d);
                                }}
                              />
                            </div>
                            <button onClick={() => setIsCalendarOpen(false)} className="w-full mt-3 bg-slate-900 text-white text-sm font-medium py-2 rounded-lg">
                              Done
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Timezone</p>
                        <p className="text-xs font-bold text-slate-600">+00:00</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setIsScheduleModalOpen(false); setScheduleStep(1); setSelectedChannelsForPost([]); setPostContent(""); }}
                        className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <div className="flex rounded-xl overflow-visible shadow-md shadow-[#635BFF]/20 relative">
                        <button
                          onClick={() => handleSchedule()}
                          disabled={isScheduling || !postContent.trim()}
                          className={`px-7 py-2.5 text-sm font-semibold transition-all flex items-center gap-2 rounded-l-xl ${
                            isScheduling || !postContent.trim()
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-[#635BFF] hover:bg-[#5249e6] text-white"
                          }`}
                        >
                          {isScheduling ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Scheduling…
                            </>
                          ) : (
                            "Schedule"
                          )}
                        </button>
                        <button
                          onClick={() => setShareNowDropdown(!shareNowDropdown)}
                          disabled={isScheduling || !postContent.trim()}
                          className="bg-[#5249e6] hover:bg-[#4338ca] text-white px-2.5 py-2.5 border-l border-white/20 transition-colors disabled:opacity-40 rounded-r-xl"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* Share Now Dropdown */}
                        {shareNowDropdown && (
                          <div className="absolute bottom-[calc(100%+12px)] right-0 bg-white border border-slate-100 rounded-xl shadow-xl w-40 z-50 overflow-hidden origin-bottom-right">
                            <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-white border-b border-r border-slate-100 transform rotate-45"></div>
                            <button 
                              onClick={() => {
                                setShareNowDropdown(false);
                                handleSchedule(true); // pass true for immediate sharing
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <SendHorizonal className="w-4 h-4" />
                              Share now
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PostCard({ 
  title, 
  time, 
  status,
  hasMedia = true,
  isFiltered = false,
}: { 
  title: string, 
  time: string, 
  status: 'success' | 'error',
  hasMedia?: boolean,
  isFiltered?: boolean,
}) {
  const borderColor = status === 'success' ? 'border-[#20d489]' : 'border-[#ff3838]';
  const textColor = status === 'success' ? 'text-[#20d489]' : 'text-[#ff3838]';
  const Icon = status === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className={`relative bg-white rounded-xl border-[1.5px] ${borderColor} shadow-sm overflow-hidden p-2 flex flex-col ${!isFiltered ? 'h-[130px]' : ''}`}>
      {hasMedia ? (
        <>
          <div className={`w-full h-16 rounded-md bg-slate-800 mb-2 flex items-center justify-center text-[10px] text-white/50 font-bold overflow-hidden relative shrink-0`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <span className="relative z-10 opacity-70 px-1 text-center line-clamp-2 leading-tight">Post visual content</span>
          </div>
          <p className="text-xs font-bold text-slate-800 truncate mb-2">{title}</p>
        </>
      ) : (
        !isFiltered ? <div className="flex-1"></div> : null
      )}
      
      <div className={`flex items-center text-[11px] font-medium ${textColor} mb-2 mt-auto pt-1`}>
        <Icon className="w-3 h-3 mr-1" />
        {time}
      </div>
      
      <div className="flex items-center gap-1">
        <div className="w-5 h-5 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 shadow-sm overflow-hidden">
          <span className="text-[10px] font-bold">C</span>
        </div>
        <div className="h-5 px-1.5 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 text-[10px] font-bold shadow-sm -ml-2 bg-white">
          +1
        </div>
      </div>
    </div>
  );
}

function ContentIdeasTabSection({ onScheduleToChannels }: { onScheduleToChannels?: () => void }) {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [ideasCount, setIdeasCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewIdeaModal, setPreviewIdeaModal] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPlatforms, setFormPlatforms] = useState<string[]>(["linkedin", "twitter"]);
  const [formStatus, setFormStatus] = useState("Draft");
  const [formTags, setFormTags] = useState("");
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formFirstComment, setFormFirstComment] = useState("");
  const [formIsStarred, setFormIsStarred] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchIdeas = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const q = searchQuery !== undefined ? searchQuery : search;
      const data = await getContentIdeas(q);
      setIdeas(data);
      setIdeasCount(data.length);
    } catch (e) {
      console.error("fetchIdeas error:", e);
      setIdeas([]);
      setIdeasCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setIsSubmitting(true);
    try {
      await addContentIdea({
        title: formTitle,
        content_preview: formContent,
        platforms: formPlatforms,
        status: formStatus as any,
        tags: formTags,
        link_url: formLinkUrl,
        first_comment: formFirstComment,
        is_starred: formIsStarred,
        media_url: mediaPreviewUrl || "",
        created_by: "Admin"
      });

      setIsCreateModalOpen(false);
      setFormTitle("");
      setFormContent("");
      setFormTags("");
      setFormLinkUrl("");
      setFormFirstComment("");
      setFormIsStarred(false);
      setMediaFile(null);
      setMediaPreviewUrl("");
      fetchIdeas();
    } catch (err) {
      console.error(err);
      alert("Error creating idea in Firestore.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStar = async (idea: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const newStarred = !idea.is_starred;
      if (idea.id) {
        await updateContentIdea(idea.id, { is_starred: newStarred });
        fetchIdeas();
        if (previewIdeaModal && previewIdeaModal.id === idea.id) {
          setPreviewIdeaModal({ ...previewIdeaModal, is_starred: newStarred });
        }
      }
    } catch (e) {
      console.error("Star toggle error:", e);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content idea?")) return;
    try {
      await deleteContentIdea(id);
      if (previewIdeaModal?.id === id) setPreviewIdeaModal(null);
      fetchIdeas();
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  return (
    <motion.div
      key="content-ideas-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-6"
    >
      {/* Header Controls - Exact Reference 1 layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Content Ideas</h1>
          <span className="bg-[#facc15] text-slate-900 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
            {ideasCount}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded text-slate-600 transition-colors ${viewMode === "list" ? "bg-slate-100 font-bold" : "hover:bg-slate-50"}`}
              title="List view"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded text-slate-600 transition-colors ${viewMode === "grid" ? "bg-slate-100 font-bold" : "hover:bg-slate-50"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                fetchIdeas(e.target.value);
              }}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 w-64 shadow-sm"
            />
          </div>

          {/* Filter */}
          <button className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 font-medium text-sm px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>

          {/* Create Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#635BFF] hover:bg-[#5249e6] text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Create New Idea
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading content ideas from server...
        </div>
      )}

      {/* Empty State */}
      {!loading && ideas.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="text-4xl mb-3">💡</div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No content ideas found</h3>
          <p className="text-sm text-slate-500 max-w-sm mb-5">
            Your library is empty. Click "Create New Idea" above to add your first post idea.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#635BFF] text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-[#5249e6] transition-colors"
          >
            + Create New Idea
          </button>
        </div>
      )}

      {/* Table List View - Reference 1 Design */}
      {!loading && ideas.length > 0 && viewMode === "list" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 bg-white">
                <th className="py-4 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === ideas.length && ideas.length > 0}
                    onChange={(e) => setSelectedIds(e.target.checked ? ideas.map(i => i.id) : [])}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="py-4 px-4 font-semibold text-slate-500">Title</th>
                <th className="py-4 px-4 font-semibold text-slate-500">Content preview</th>
                <th className="py-4 px-4 font-semibold text-slate-500">Created by</th>
                <th className="py-4 px-4 font-semibold text-slate-500 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {ideas.map((idea) => (
                <tr key={idea.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(idea.id)}
                      onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, idea.id] : prev.filter(x => x !== idea.id))}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => toggleStar(idea, e)}
                        className={`text-base transition-transform hover:scale-125 ${idea.is_starred ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
                      >
                        {idea.is_starred ? '★' : '☆'}
                      </button>
                      <span
                        onClick={() => setPreviewIdeaModal(idea)}
                        className="font-bold text-slate-800 hover:text-indigo-600 cursor-pointer truncate max-w-[200px]"
                      >
                        {idea.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p
                      onClick={() => setPreviewIdeaModal(idea)}
                      className="text-slate-600 cursor-pointer line-clamp-1 max-w-md"
                    >
                      {idea.content_preview}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-xs">
                      <div className="font-semibold text-slate-700">{idea.created_by || "qxjFFtL4kY"}</div>
                      <div className="text-slate-400">
                        {new Date(idea.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          if (onScheduleToChannels) onScheduleToChannels();
                          else alert("Directing to Channels selection...");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs transition-colors"
                      >
                        Schedule <CalendarIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPreviewIdeaModal(idea)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Preview idea"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete idea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 text-xs font-semibold text-slate-600 bg-white">
            <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40">‹</button>
            <span className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 text-slate-800">1</span>
            <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40">›</button>
          </div>
        </div>
      )}

      {/* Ideas Grid View */}
      {!loading && ideas.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ideas.map((idea) => (
            <div key={idea.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    idea.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                    idea.status === 'Scheduled' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {idea.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleStar(idea, e)}
                      className={`text-base transition-transform hover:scale-125 ${idea.is_starred ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
                      title={idea.is_starred ? 'Starred' : 'Star idea'}
                    >
                      {idea.is_starred ? '★' : '☆'}
                    </button>
                  </div>
                </div>
                <h3 onClick={() => setPreviewIdeaModal(idea)} className="font-bold text-slate-800 text-base mb-2 cursor-pointer hover:text-indigo-600">{idea.title}</h3>
                <p onClick={() => setPreviewIdeaModal(idea)} className="text-slate-600 text-sm line-clamp-3 mb-3 leading-relaxed cursor-pointer">
                  {idea.content_preview}
                </p>

                {idea.media_url && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-slate-100 h-28 bg-slate-50 flex items-center justify-center">
                    <img src={idea.media_url} alt="Media" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>By {idea.created_by || "Admin"}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onScheduleToChannels) onScheduleToChannels();
                      else alert("Directing to Channels selection...");
                    }}
                    className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    Schedule <CalendarIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Detail Modal - Exact Reference 3 Design */}
      {previewIdeaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Header with star & close */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => toggleStar(previewIdeaModal, e)}
                  className={`text-xl transition-transform hover:scale-125 ${previewIdeaModal.is_starred ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
                >
                  {previewIdeaModal.is_starred ? '★' : '☆'}
                </button>
                <h2 className="font-bold text-slate-900 text-lg truncate max-w-md">
                  {previewIdeaModal.title}
                </h2>
              </div>
              <button
                onClick={() => setPreviewIdeaModal(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Preview Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Content text */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {previewIdeaModal.content_preview}
              </div>

              {/* Media Block */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Media</label>
                {previewIdeaModal.media_url ? (
                  <div className="w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                    <img src={previewIdeaModal.media_url} alt="Media" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
                    No media
                  </div>
                )}
              </div>

              {/* Link */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Link</label>
                <div className="flex items-center gap-2 border border-slate-100 rounded-xl p-3 bg-slate-50/40 text-sm text-indigo-600 font-medium">
                  <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={previewIdeaModal.link_url || "https://www.clicktaketech.com/"} target="_blank" rel="noreferrer" className="truncate hover:underline">
                    {previewIdeaModal.link_url || "https://www.clicktaketech.com/"}
                  </a>
                </div>
              </div>

              {/* First comment */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">First comment</label>
                <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/40 text-sm text-slate-700">
                  {previewIdeaModal.first_comment || "Why are your lead generation efforts falling short?"}
                </div>
              </div>

              {/* Created by */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Created by</label>
                <div className="text-xs text-slate-500 font-medium">
                  {previewIdeaModal.created_by || "Admin"}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-white">
              <button
                onClick={() => handleDeleteIdea(previewIdeaModal.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-all"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button
                onClick={() => {
                  setPreviewIdeaModal(null);
                  if (onScheduleToChannels) onScheduleToChannels();
                  else alert("Directing to Channels selection...");
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5249e6] text-white text-sm font-semibold transition-all shadow-md shadow-indigo-100"
              >
                Schedule <CalendarIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal - Reference UI exact design */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-xl">Create Content Idea</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Scroll Area */}
            <form onSubmit={handleCreateIdea} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Product Launch"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>

              {/* Post content */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Post content</label>
                <textarea
                  required
                  rows={5}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="min character 300"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-500 transition-all shadow-sm resize-none"
                />
              </div>

              {/* Media Upload Box */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Media</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-slate-200 rounded-xl p-5 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                      {mediaPreviewUrl ? (
                        <img src={mediaPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <LayoutGrid className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">
                        <span className="text-indigo-600 font-semibold hover:underline">
                          {mediaFile ? mediaFile.name : "Click to upload"}
                        </span>{" "}
                        {mediaFile ? "" : "media"}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">SVG, PNG, JPG, GIF or MP4</div>
                    </div>
                  </div>
                  {mediaFile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaFile(null);
                        setMediaPreviewUrl("");
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Add Link */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Add Link</label>
                <div className="relative">
                  <Link2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={formLinkUrl}
                    onChange={(e) => setFormLinkUrl(e.target.value)}
                    placeholder="https://"
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* First comment */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">First comment</label>
                <textarea
                  rows={3}
                  value={formFirstComment}
                  onChange={(e) => setFormFirstComment(e.target.value)}
                  placeholder="Add your first comment"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-500 transition-all shadow-sm resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setFormIsStarred(!formIsStarred)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    formIsStarred
                      ? "border-amber-300 bg-amber-50 text-amber-600"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{formIsStarred ? "★" : "☆"}</span> {formIsStarred ? "Starred" : "Star"}
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5249e6] text-white text-sm font-semibold transition-all shadow-md shadow-indigo-100"
                  >
                    {isSubmitting ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
