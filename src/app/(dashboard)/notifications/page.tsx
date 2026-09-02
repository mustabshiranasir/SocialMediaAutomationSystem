"use client";

// src/app/(dashboard)/notifications/page.tsx
// Full Notifications page — list all, filter, mark read, delete

import { useState, useEffect } from "react";
import { Bell, Trash2, CheckCheck, Info, CheckCircle, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { subscribeToNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, AppNotification } from "@/lib/firestore";

const DEMO_USER_ID = "demo-user";

const typeIcon = (type: AppNotification["type"]) => {
  const base = "w-5 h-5 shrink-0";
  switch (type) {
    case "success": return <CheckCircle className={`${base} text-emerald-500`} />;
    case "warning": return <AlertTriangle className={`${base} text-amber-500`} />;
    case "error":   return <AlertCircle className={`${base} text-red-500`} />;
    default:        return <Info className={`${base} text-blue-500`} />;
  }
};

const typeBadge = (type: AppNotification["type"]) => {
  const styles: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    error:   "bg-red-100 text-red-700",
    info:    "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide ${styles[type] || styles.info}`}>
      {type}
    </span>
  );
};

const timeAgo = (seconds: number) => {
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const userId = DEMO_USER_ID;

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(userId, (data) => {
      setNotifications(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await markAllNotificationsRead(userId);
    setMarkingAll(false);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 shadow"
          >
            {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "unread", "read"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
              filter === f
                ? "bg-indigo-600 text-white border-indigo-600 shadow"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f === "all" ? `All (${notifications.length})` : f === "unread" ? `Unread (${unreadCount})` : `Read (${notifications.length - unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Bell className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700 mb-1">No notifications here</h3>
          <p className="text-sm text-slate-400">
            {filter === "unread" ? "You've read all your notifications." : "Nothing to show."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(notif => (
            <div
              key={notif.id}
              className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                !notif.read
                  ? "bg-indigo-50/60 border-indigo-200 hover:bg-indigo-50"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              {/* Unread dot */}
              {!notif.read && (
                <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-indigo-500 rounded-full" />
              )}

              {/* Type Icon */}
              <div className="mt-0.5">{typeIcon(notif.type)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="text-sm font-bold text-slate-800">{notif.title}</h4>
                  {typeBadge(notif.type)}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{notif.message}</p>
                {notif.link && (
                  <a href={notif.link} className="text-xs text-indigo-600 hover:underline mt-1 inline-block">
                    View details →
                  </a>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  {notif.createdAt?.seconds ? timeAgo(notif.createdAt.seconds) : "recently"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!notif.read && (
                  <button
                    onClick={() => handleMarkRead(notif.id!)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notif.id!)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
