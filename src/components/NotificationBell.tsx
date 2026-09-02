"use client";

// src/components/NotificationBell.tsx
// Real-time notification bell with dropdown for the dashboard header

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, Info, CheckCircle, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { subscribeToNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, AppNotification } from "@/lib/firestore";
import Link from "next/link";

const DEMO_USER_ID = "demo-user"; // Fallback for unauthenticated users

const typeIcon = (type: AppNotification["type"]) => {
  switch (type) {
    case "success": return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
    case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
    case "error":   return <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
    default:        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
  }
};

const timeAgo = (seconds: number) => {
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userId = DEMO_USER_ID; // Force demo notifications for UI display

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(userId, setNotifications);
    return () => unsubscribe();
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await markAllNotificationsRead(userId);
    setMarkingAll(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-400">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-semibold disabled:opacity-50"
                >
                  {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                  Mark all read
                </button>
              )}
              <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">
                View all
              </Link>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 10).map(notif => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && handleMarkRead(notif.id!)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors group ${!notif.read ? "bg-indigo-50/50" : ""}`}
                >
                  {/* Icon */}
                  <div className="mt-0.5">{typeIcon(notif.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold text-slate-800 leading-snug ${!notif.read ? "font-bold" : ""}`}>
                        {notif.title}
                      </p>
                      <button
                        onClick={(e) => handleDelete(notif.id!, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500 transition-all shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {notif.createdAt?.seconds ? timeAgo(notif.createdAt.seconds) : "recently"}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2 text-center">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                See all {notifications.length} notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
