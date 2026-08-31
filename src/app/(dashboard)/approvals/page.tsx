"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X, Loader2, ShieldAlert, Pencil } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { getPendingPosts, updatePostStatus, Post } from "@/lib/firestore";
import { isEditorOrAbove } from "@/lib/permissions";

export default function Approvals() {
  const { user, role, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");

  useEffect(() => {
    if (authLoading || !isEditorOrAbove(role || "")) {
      if (!authLoading) setLoading(false);
      return;
    }
    fetchPosts();
  }, [role, authLoading]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const pending = await getPendingPosts();
      setPosts(pending.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (post: Post) => { setEditingId(post.id!); setEditedContent(post.content); };
  const cancelEditing = () => { setEditingId(null); setEditedContent(""); };

  const handleApprove = async (post: Post) => {
    if (!user || !post.id) return;
    setProcessingId(post.id);
    const contentToPublish = editingId === post.id ? editedContent : post.content;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ content: contentToPublish, networks: post.networks }),
      });
      if (!res.ok) throw new Error("Failed to publish");
      await updatePostStatus(post.id, "published");
      setPosts(posts.filter(p => p.id !== post.id));
      cancelEditing();
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
      if (editingId === postId) cancelEditing();
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading) return null;

  if (!isEditorOrAbove(role || "")) {
    return (
      <ProtectedRoute>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-slate-800">Access Denied</h1>
          <p className="text-slate-500 mb-6">You need admin privileges to view the approval queue.</p>
          <Link href="/" className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Approval Queue</h1>
            <p className="text-slate-500 text-sm mt-1">Review, edit, and publish posts submitted by your team</p>
          </motion.div>
          <Link href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </header>

        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-20 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">You're all caught up!</h2>
            <p className="text-slate-500">There are no pending posts in the queue.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {posts.map((post) => {
                const isEditing = editingId === post.id;
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">
                          {post.authorEmail[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {post.authorEmail}
                        </span>
                        <span className="text-xs text-slate-400">
                          {post.createdAt?.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      {!isEditing ? (
                        <button
                          onClick={() => startEditing(post)}
                          disabled={processingId !== null}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      ) : (
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel Edit
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <AnimatePresence mode="wait">
                      {isEditing ? (
                        <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            rows={5}
                            className="w-full bg-slate-50 border border-blue-300 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all text-sm"
                            placeholder="Edit post content..."
                          />
                          <p className="text-xs text-slate-400 mt-1 text-right">{editedContent.length} chars</p>
                        </motion.div>
                      ) : (
                        <motion.p key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-sm text-slate-700 whitespace-pre-wrap mb-4 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                          {post.content}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Networks + Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 flex-wrap">
                        {post.networks.map(n => (
                          <span key={n} className="text-xs font-semibold uppercase tracking-wide bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full">
                            {n}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(post.id!)}
                          disabled={processingId !== null}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={() => handleApprove(post)}
                          disabled={processingId !== null}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {processingId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          {isEditing ? "Save & Approve" : "Approve"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
