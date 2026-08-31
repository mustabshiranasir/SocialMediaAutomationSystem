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
} from "lucide-react";
import { getAllPosts, getChannels, addChannel, Post, Channel } from "@/lib/firestore";
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
} from "react-icons/fa";
import { SiThreads, SiGoogle } from "react-icons/si";
import { ResponsiveContainer, BarChart as ReChartsBarChart, Bar as ReChartsBar, XAxis, YAxis, Tooltip as ReChartsTooltip, CartesianGrid } from "recharts";


// Social network config with real brand icons
const networkOptionsAddModal = [
  { id: "fb",  name: "Facebook",          Icon: FaFacebook,        iconColor: "text-white",    bg: "bg-blue-600",    signInUrl: "/api/oauth/login?network=fb" },
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
    refreshData,
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
                    const count = channels.filter(c => c.network === net.id).length;
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
                              <NetAvatar net={networkOptionsAddModal.find(n => n.id === channel.network) || networkOptionsAddModal[0]} size="sm" />
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
                              <button className="p-1.5 text-slate-400 hover:text-red-600 rounded bg-white border border-slate-200 hover:border-red-200 shadow-sm transition-colors">
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
                <div className="flex-1 p-8 bg-white flex flex-col">
                  {!selectedNetworkToAdd ? (
                    <div className="flex items-center text-slate-500 font-medium">
                      <ArrowLeft className="w-5 h-5 mr-4" />
                      Please choose a social network to add a channel.
                    </div>
                  ) : addChannelMode === "easy" ? (
                    <div className="flex flex-col h-full max-w-md mx-auto w-full">
                      <div className="h-48 rounded-xl bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex items-center justify-center gap-6 shadow-inner mb-auto mt-8 relative overflow-hidden">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center overflow-hidden">
                          <img src="/fs-poster-logo.png" alt="FS Poster" className="w-full h-full object-cover rounded-2xl" />
                        </div>
                        <ArrowRightLeft className="w-6 h-6 text-slate-400" />
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center">
                          <NetAvatar net={selectedNetworkToAdd} size="lg" />
                        </div>
                      </div>

                      <div className="mt-auto pt-8">
                        <a
                          href={selectedNetworkToAdd.signInUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center py-3 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors mb-6 shadow-sm"
                        >
                          <NetAvatar net={selectedNetworkToAdd} size="sm" />
                          <span className="ml-3">Sign in with {selectedNetworkToAdd.name}</span>
                        </a>
                        
                        <label className="flex items-center gap-3 text-sm text-slate-700 font-medium cursor-pointer mb-8">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]" />
                          Enable proxy
                        </label>
                        
                        <div className="flex justify-center">
                          <button onClick={() => setAddChannelMode("advanced")} className="flex items-center text-slate-500 font-medium hover:text-slate-800 transition-colors">
                            More options <ArrowRight className="w-4 h-4 ml-2" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full max-w-md mx-auto w-full">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <NetAvatar net={selectedNetworkToAdd} size="sm" />
                          <span className="font-semibold text-slate-800">{selectedNetworkToAdd.name}</span>
                        </div>
                        <a href="#" className="text-sm text-blue-500 font-medium hover:underline">See documentation</a>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Choose method</label>
                        <div className="relative">
                          <select className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 appearance-none bg-white">
                            <option>Official method</option>
                            <option>Custom method</option>
                          </select>
                          <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex items-center mb-6">
                        <div className="flex-1 border-t border-slate-200"></div>
                        <span className="px-4 text-xs font-medium text-slate-400">Official method</span>
                        <div className="flex-1 border-t border-slate-200"></div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
                        <h4 className="font-bold text-blue-600 mb-2">No apps</h4>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          You do not have any apps added for the official method. Please add a new app from 'Settings &gt; App' or select a different method.
                        </p>
                      </div>

                      <label className="flex items-center gap-3 text-sm text-slate-700 font-medium cursor-pointer mb-auto">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]" />
                        Enable proxy
                      </label>

                      <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-100">
                        <button onClick={() => setAddChannelMode("easy")} className="flex items-center text-slate-500 font-medium hover:text-slate-800 transition-colors">
                          <ArrowLeft className="w-4 h-4 mr-2" /> Easy mode
                        </button>
                        <button 
                          onClick={async () => {
                            if (selectedNetworkToAdd) {
                              try {
                                const newChannel: Omit<Channel, "id" | "createdAt"> = {
                                  name: selectedNetworkToAdd.name,
                                  network: selectedNetworkToAdd.id,
                                  isAutoShare: true,
                                  status: "connected"
                                };
                                await addChannel(newChannel);
                                // Refresh channels via context
                                refreshData();
                                setIsAddChannelModalOpen(false);
                                setSelectedNetworkToAdd(null);
                                setAddChannelMode("easy");
                              } catch (err) {
                                console.error("Error adding channel:", err);
                              }
                            }
                          }}
                          className="bg-[#635BFF] hover:bg-[#5249e6] text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors shadow-sm"
                        >
                          Continue
                        </button>
                      </div>
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
                                    <p className="font-semibold text-slate-800 text-sm truncate">{channel.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${channel.status === "connected" ? "bg-green-500" : "bg-red-400"}`}></span>
                                      <span className="text-[11px] text-slate-400 capitalize">{channel.status}</span>
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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
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
      const res = await fetch(`http://localhost:8000/api/content-ideas${q ? `?search=${encodeURIComponent(q)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setIdeas(Array.isArray(data) ? data : []);
        setIdeasCount(Array.isArray(data) ? data.length : 0);
      } else {
        setIdeas([]);
        setIdeasCount(0);
      }
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
      const res = await fetch("http://localhost:8000/api/content-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          content_preview: formContent,
          platforms: formPlatforms,
          status: formStatus,
          tags: formTags,
          link_url: formLinkUrl,
          first_comment: formFirstComment,
          is_starred: formIsStarred,
          media_url: mediaPreviewUrl || ""
        })
      });

      if (res.ok) {
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
      } else {
        alert("Failed to create idea. Please check backend API.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating idea.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStar = async (idea: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const newStarred = !idea.is_starred;
      await fetch(`http://localhost:8000/api/content-ideas/${idea.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: newStarred })
      });
      fetchIdeas();
      if (previewIdeaModal && previewIdeaModal.id === idea.id) {
        setPreviewIdeaModal({ ...previewIdeaModal, is_starred: newStarred });
      }
    } catch (e) {
      console.error("Star toggle error:", e);
    }
  };

  const handleDeleteIdea = async (id: number) => {
    if (!confirm("Are you sure you want to delete this content idea?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/content-ideas/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (previewIdeaModal?.id === id) setPreviewIdeaModal(null);
        fetchIdeas();
      }
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
