"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X, Loader2, ShieldAlert } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { getPendingPosts, updatePostStatus, Post } from "@/lib/firestore";

export default function Approvals() {
  const { user, role, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || role !== "admin") {
      if (!authLoading) setLoading(false);
      return;
    }
    fetchPosts();
  }, [role, authLoading]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const pending = await getPendingPosts();
      // Sort newest first
      setPosts(pending.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (post: Post) => {
    if (!user || !post.id) return;
    setProcessingId(post.id);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ content: post.content, networks: post.networks }),
      });

      if (!res.ok) {
        throw new Error("Failed to publish to networks");
      }

      await updatePostStatus(post.id, "published");
      setPosts(posts.filter(p => p.id !== post.id));
    } catch (error) {
      console.error(error);
      alert("Error approving post. Ensure your API keys are configured in Settings.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (postId: string) => {
    setProcessingId(postId);
    try {
      await updatePostStatus(postId, "rejected");
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading) return null;

  if (role !== "admin") {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
          <ShieldAlert className="w-16 h-16 text-slate-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">You need admin privileges to view the approval queue.</p>
          <Link href="/" className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight">Approval Queue</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review and publish posts submitted by your team
          </p>
        </motion.div>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </header>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center p-20 glass-panel rounded-2xl">
          <Check className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium">You're all caught up!</h2>
          <p className="text-slate-400 mt-2">There are no pending posts in the queue.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel rounded-2xl p-6"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-slate-300 bg-white/5 px-2.5 py-1 rounded-md">
                        {post.authorEmail}
                      </span>
                      <span className="text-xs text-slate-500">
                        {post.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-lg whitespace-pre-wrap mb-4">{post.content}</p>
                    <div className="flex gap-2">
                      {post.networks.map(n => (
                        <span key={n} className="text-xs font-medium uppercase tracking-wider bg-primary/20 text-blue-300 px-2 py-1 rounded">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(post)}
                      disabled={processingId !== null}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {processingId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(post.id!)}
                      disabled={processingId !== null}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </main>
    </ProtectedRoute>
  );
}
