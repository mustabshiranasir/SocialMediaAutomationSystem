"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Settings, PenSquare, ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto overflow-hidden">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-12"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            SocialAuto
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Your unified social media engine
          </p>
        </div>
        <nav className="flex gap-4">
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors group"
          >
            <Settings className="w-4 h-4 text-slate-400 group-hover:rotate-45 transition-transform" />
            Settings
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/compose"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
            >
              <PenSquare className="w-4 h-4" />
              New Post
            </Link>
          </motion.div>
        </nav>
      </motion.header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Stats Card */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors"></div>
          <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
            Total Posts
          </h3>
          <p className="text-5xl font-bold mt-2">0</p>
          <div className="mt-4 text-sm text-slate-500 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> Get started by posting
          </div>
        </motion.div>

        {/* Connected Accounts */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 col-span-1 md:col-span-2 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>
          <h3 className="text-sm font-medium text-slate-400 mb-4">
            Connected Accounts (Preview)
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.div whileHover={{ y: -5 }} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 flex-1 cursor-pointer hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#1877F2]/20">
                f
              </div>
              <div className="flex-1">
                <p className="font-medium">Facebook</p>
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5"><AlertCircle className="w-3 h-3" /> Pending Setup</p>
              </div>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 flex-1 cursor-pointer hover:border-white/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-black border border-white/20 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-black/20">
                𝕏
              </div>
              <div className="flex-1">
                <p className="font-medium">Twitter (X)</p>
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5"><AlertCircle className="w-3 h-3" /> Pending Setup</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring" }}
        className="mt-8 glass-panel rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>
        <h3 className="text-lg font-medium mb-6">Recent Activity</h3>
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="text-6xl opacity-50"
          >
            📭
          </motion.div>
          <p>No recent posts. Head over to compose to create one!</p>
        </div>
      </motion.div>
    </main>
  );
}
