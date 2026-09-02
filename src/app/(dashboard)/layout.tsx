"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SocialPosterProvider } from "@/context/SocialPosterContext";
import { Menu, X } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <SocialPosterProvider>
        <div className="flex min-h-screen bg-slate-50">
          {/* Mobile Top Navbar Header (Visible only on screens below md/768px) */}
          <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f1117] border-b border-white/5 flex items-center justify-between px-5 z-40 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                <img src="/fs-poster-logo.png" alt="Social Auto" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white">Social Auto</span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-slate-400 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Toggle Sidebar"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Desktop Top Bar with Bell (Visible only on md+) */}
          <div className="hidden md:flex fixed top-0 left-56 right-0 h-14 bg-white border-b border-slate-200 items-center justify-end px-6 z-30 shadow-sm">
            <NotificationBell />
          </div>

          {/* Collapsible drawer sidebar (Desktop fixed, Mobile toggle-drawer) */}
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          {/* Main content body with responsive padding and offsets */}
          <main className="flex-1 min-h-screen p-4 md:p-8 pt-20 md:pt-20 md:ml-56 overflow-y-auto w-full max-w-full">
            {/* Global breadcrumb — auto-generated from current route */}
            <Breadcrumb />
            {children}
          </main>
        </div>
      </SocialPosterProvider>
    </ProtectedRoute>
  );
}
