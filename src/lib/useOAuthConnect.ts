/**
 * useOAuthConnect — React hook for connecting/disconnecting social accounts.
 *
 * Usage:
 *   const { connect, disconnect, connecting } = useOAuthConnect();
 *   connect("linkedin")  →  opens LinkedIn OAuth in same tab
 *   disconnect(channelId) →  calls DELETE /api/oauth/disconnect
 *
 * The hook sends the Firebase ID token to /api/oauth/initiate (server-side),
 * which returns the OAuth authorization URL. The secret (Client Secret) is
 * NEVER sent to the browser — all credential use is server-side only.
 */

"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";

export function useOAuthConnect() {
  const [connecting, setConnecting] = useState<string | null>(null); // platform being connected
  const [disconnecting, setDisconnecting] = useState<string | null>(null); // channelId being disconnected
  const [error, setError] = useState<string | null>(null);

  /**
   * Initiates OAuth for the given platform by:
   * 1. Getting the current user's Firebase ID token
   * 2. Sending it to /api/oauth/initiate to get the authorization URL
   * 3. Redirecting the browser to the OAuth provider
   */
  async function connect(platform: string) {
    setError(null);
    setConnecting(platform);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You must be logged in to connect an account.");

      const idToken = await user.getIdToken();

      const res = await fetch("/api/oauth/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ platform }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate OAuth");
      }

      // Redirect browser to the provider's authorization page
      window.location.href = data.authUrl;
    } catch (err: any) {
      setError(err.message);
      setConnecting(null);
    }
  }

  /**
   * Disconnects (deletes) a channel by:
   * 1. Getting the current user's Firebase ID token
   * 2. Sending a DELETE to /api/oauth/disconnect
   * Ownership is verified server-side.
   */
  async function disconnect(channelId: string): Promise<boolean> {
    setError(null);
    setDisconnecting(channelId);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You must be logged in.");

      const idToken = await user.getIdToken();

      const res = await fetch("/api/oauth/disconnect", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ channelId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to disconnect");
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setDisconnecting(null);
    }
  }

  return { connect, disconnect, connecting, disconnecting, error };
}
