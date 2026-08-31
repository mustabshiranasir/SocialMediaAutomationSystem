"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  collection, query, orderBy, limit, startAfter,
  DocumentSnapshot, onSnapshot, addDoc, deleteDoc,
  doc, serverTimestamp, QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getChannels, Post, Channel } from "@/lib/firestore";

const PAGE_SIZE = 20;

interface SocialPosterContextType {
  posts: Post[];
  channels: Channel[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refreshData: () => void;
  schedulePostOptimistic: (
    newPost: Omit<Post, "id" | "createdAt">,
    apiCall: () => Promise<Post>
  ) => Promise<void>;
  deletePostOptimistic: (
    postId: string,
    apiCall: () => Promise<void>
  ) => Promise<void>;
}

const SocialPosterContext = createContext<SocialPosterContextType | undefined>(undefined);

export function SocialPosterProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts]               = useState<Post[]>([]);
  const [channels, setChannels]         = useState<Channel[]>([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [hasMore, setHasMore]           = useState(true);

  // Cursor for pagination
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  // Track the real-time unsubscribe function
  const unsubRef   = useRef<(() => void) | null>(null);

  /* ─── Subscribe to first page (real-time) ─── */
  const subscribeFirstPage = () => {
    // Tear down previous listener if any
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    setLoading(true);
    setError(null);
    lastDocRef.current = null;

    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"), limit(PAGE_SIZE));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
        setPosts(fetched);
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? null;
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore real-time listener error:", err);
        setError("Failed to connect to live data. " + err.message);
        setLoading(false);
      }
    );

    unsubRef.current = unsub;
  };

  /* ─── Load next page (one-shot fetch, appended) ─── */
  const loadMore = async () => {
    if (!hasMore || !lastDocRef.current || loading) return;
    setLoading(true);
    try {
      const { getDocs } = await import("firebase/firestore");
      const postsRef = collection(db, "posts");
      const q = query(
        postsRef,
        orderBy("createdAt", "desc"),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);
      const more = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      setPosts(prev => [...prev, ...more]);
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? null;
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Fetch channels (not real-time, low-frequency) ─── */
  useEffect(() => {
    getChannels().then(setChannels).catch(console.error);
  }, []);

  /* ─── Bootstrap real-time listener ─── */
  useEffect(() => {
    subscribeFirstPage();
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  /* ─── Optimistic Post Scheduling ─── */
  const schedulePostOptimistic = async (
    newPost: Omit<Post, "id" | "createdAt">,
    apiCall: () => Promise<Post>
  ) => {
    setActionLoading(true);
    setError(null);

    const tempId = `temp-${Date.now()}`;
    const tempPost: Post = {
      ...newPost,
      id: tempId,
      createdAt: { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    };

    const previousPosts = [...posts];
    setPosts(prev => [tempPost, ...prev]);

    try {
      const savedPost = await apiCall();
      // Real-time listener will catch the actual doc; just replace temp entry
      setPosts(prev => prev.map(p => (p.id === tempId ? savedPost : p)));
    } catch (err: any) {
      setPosts(previousPosts);
      setError(err.message || "Failed to schedule post. Rolled back changes.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  /* ─── Optimistic Post Deletion ─── */
  const deletePostOptimistic = async (
    postId: string,
    apiCall: () => Promise<void>
  ) => {
    setActionLoading(true);
    setError(null);

    const previousPosts = [...posts];
    setPosts(prev => prev.filter(p => p.id !== postId));

    try {
      await apiCall();
    } catch (err: any) {
      setPosts(previousPosts);
      setError(err.message || "Failed to delete post. Rolled back changes.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SocialPosterContext.Provider
      value={{
        posts,
        channels,
        loading,
        actionLoading,
        error,
        hasMore,
        loadMore,
        refreshData: subscribeFirstPage,
        schedulePostOptimistic,
        deletePostOptimistic,
      }}
    >
      {children}
    </SocialPosterContext.Provider>
  );
}

export function useSocialPoster() {
  const context = useContext(SocialPosterContext);
  if (context === undefined) {
    throw new Error("useSocialPoster must be used within a SocialPosterProvider");
  }
  return context;
}
