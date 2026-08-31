"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getAllPosts, getChannels, Post, Channel } from "@/lib/firestore";

interface SocialPosterContextType {
  posts: Post[];
  channels: Channel[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedPosts, fetchedChannels] = await Promise.all([
        getAllPosts(),
        getChannels(),
      ]);
      setPosts(fetchedPosts);
      setChannels(fetchedChannels);
    } catch (err: any) {
      setError(err.message || "Failed to fetch social media data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Optimistic Post Scheduling
  const schedulePostOptimistic = async (
    newPost: Omit<Post, "id" | "createdAt">,
    apiCall: () => Promise<Post>
  ) => {
    setActionLoading(true);
    setError(null);

    // Create a temporary post with a client-side ID and timestamp
    const tempId = `temp-${Date.now()}`;
    const tempPost: Post = {
      ...newPost,
      id: tempId,
      createdAt: {
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      },
    };

    // Save previous state in case we need to roll back
    const previousPosts = [...posts];

    // Optimistically update UI state
    setPosts((prev) => [tempPost, ...prev]);

    try {
      const savedPost = await apiCall();
      // Replace the temp post with the actual saved post from the server
      setPosts((prev) =>
        prev.map((p) => (p.id === tempId ? savedPost : p))
      );
    } catch (err: any) {
      // Rollback to previous state on failure
      setPosts(previousPosts);
      setError(err.message || "Failed to schedule post. Rolled back changes.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Optimistic Post Deletion
  const deletePostOptimistic = async (
    postId: string,
    apiCall: () => Promise<void>
  ) => {
    setActionLoading(true);
    setError(null);

    // Save previous state for rollback
    const previousPosts = [...posts];

    // Optimistically remove from state
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    try {
      await apiCall();
    } catch (err: any) {
      // Rollback to previous state on failure
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
        refreshData,
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
