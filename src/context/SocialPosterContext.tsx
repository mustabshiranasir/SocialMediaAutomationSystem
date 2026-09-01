"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  collection, query, orderBy, limit, startAfter,
  onSnapshot, QueryDocumentSnapshot, where,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { getChannels, Post, Channel } from "@/lib/firestore";
import { onAuthStateChanged } from "firebase/auth";

const PAGE_SIZE = 20;

interface SocialPosterContextType {
  posts: Post[];
  channels: Channel[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  hasMore: boolean;
  currentUserId: string | null;
  loadMore: () => void;
  refreshData: () => void;
  refreshChannels: () => void;
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
  const [posts, setPosts]                 = useState<Post[]>([]);
  const [channels, setChannels]           = useState<Channel[]>([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [hasMore, setHasMore]             = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const unsubRef   = useRef<(() => void) | null>(null);

  /* ── Listen to Firebase Auth state to get userId ── */
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
      }
    });
    return () => unsubAuth();
  }, []);

  /* ── Fetch Channels scoped to user ── */
  const fetchUserChannels = () => {
    getChannels(currentUserId || undefined)
      .then(setChannels)
      .catch(err => console.error("Error fetching channels:", err));
  };

  useEffect(() => {
    fetchUserChannels();
  }, [currentUserId]);

  /* ── Subscribe to real-time posts ── */
  const subscribeFirstPage = () => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    setLoading(true);
    setError(null);
    lastDocRef.current = null;

    const postsRef = collection(db, "posts");
    let q = currentUserId
      ? query(postsRef, where("authorId", "==", currentUserId), orderBy("createdAt", "desc"), limit(PAGE_SIZE))
      : query(postsRef, orderBy("createdAt", "desc"), limit(PAGE_SIZE));

    let unsub = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
        setPosts(fetched);
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? null;
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setLoading(false);
      },
      (err) => {
        console.warn("Primary query requires index or failed, falling back to simple query:", err.message);
        // Fallback for missing index: query by authorId without orderBy and sort in JS
        const fallbackQ = currentUserId
          ? query(postsRef, where("authorId", "==", currentUserId), limit(PAGE_SIZE))
          : query(postsRef, limit(PAGE_SIZE));

        const fallbackUnsub = onSnapshot(
          fallbackQ,
          (snapshot) => {
            const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
            fetched.sort((a, b) => {
              const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
              const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
              return tB - tA;
            });
            setPosts(fetched);
            setLoading(false);
          },
          (fallbackErr) => {
            console.error("Fallback query error:", fallbackErr);
            setError("Failed to load posts: " + fallbackErr.message);
            setLoading(false);
          }
        );
        unsubRef.current = fallbackUnsub;
      }
    );

    unsubRef.current = unsub;
  };

  const loadMore = async () => {
    if (!hasMore || !lastDocRef.current || loading) return;
    setLoading(true);
    try {
      const { getDocs } = await import("firebase/firestore");
      const postsRef = collection(db, "posts");
      const q = currentUserId
        ? query(postsRef, where("authorId", "==", currentUserId), orderBy("createdAt", "desc"), startAfter(lastDocRef.current), limit(PAGE_SIZE))
        : query(postsRef, orderBy("createdAt", "desc"), startAfter(lastDocRef.current), limit(PAGE_SIZE));

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

  useEffect(() => {
    subscribeFirstPage();
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [currentUserId]);

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

    const previous = [...posts];
    setPosts(prev => [tempPost, ...prev]);

    try {
      const saved = await apiCall();
      setPosts(prev => prev.map(p => (p.id === tempId ? saved : p)));
    } catch (err: any) {
      setPosts(previous);
      setError(err.message || "Failed to schedule post.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const deletePostOptimistic = async (
    postId: string,
    apiCall: () => Promise<void>
  ) => {
    setActionLoading(true);
    setError(null);
    const previous = [...posts];
    setPosts(prev => prev.filter(p => p.id !== postId));

    try {
      await apiCall();
    } catch (err: any) {
      setPosts(previous);
      setError(err.message || "Failed to delete post.");
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
        currentUserId,
        loadMore,
        refreshData: subscribeFirstPage,
        refreshChannels: fetchUserChannels,
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
