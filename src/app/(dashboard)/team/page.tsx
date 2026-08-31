"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ShieldAlert, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocialPoster } from "@/context/SocialPosterContext";
import { Table, Badge, Button } from "@/components/ui";
import type { Column } from "@/components/ui";
import { isAdmin } from "@/lib/permissions";

type UserRecord = {
  uid: string;
  email: string;
  displayName: string;
  creationTime: string;
  role: string;
};

export default function AllUsers() {
  const { user, role, loading: authLoading } = useAuth();
  const { posts } = useSocialPoster();
  
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [roleToChange, setRoleToChange] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (authLoading || !isAdmin(role || "")) {
      if (!authLoading) setLoading(false);
      return;
    }
    fetchUsers();
  }, [role, authLoading]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const idToken = await user.getIdToken();
      const res = await fetch("/api/users", {
        headers: { "Authorization": `Bearer ${idToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Get user's post count from social posts context
  const getPostCount = (userId: string) => {
    return posts ? posts.filter(p => p.authorId === userId).length : 0;
  };

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all users except current logged-in user (to prevent self-actions)
      const nonSelfIds = filteredUsers
        .filter(u => u.uid !== user?.uid)
        .map(u => u.uid);
      setSelectedIds(nonSelfIds);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (uid: string) => {
    setSelectedIds(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  // Apply Bulk Action (Delete or Password Reset)
  const handleApplyBulkAction = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one user.");
      return;
    }

    if (bulkAction === "delete") {
      if (!confirm(`Are you sure you want to delete ${selectedIds.length} user(s)? This cannot be undone.`)) {
        return;
      }

      setIsProcessing(true);
      try {
        if (!user) return;
        const idToken = await user.getIdToken();

        for (const targetUserId of selectedIds) {
          const res = await fetch("/api/users", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({ targetUserId }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to delete user");
          }
        }

        setUsers(prev => prev.filter(u => !selectedIds.includes(u.uid)));
        setSelectedIds([]);
        setBulkAction("");
        alert("User(s) deleted successfully.");
      } catch (err: any) {
        console.error(err);
        alert("Error executing bulk delete: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    } else if (bulkAction === "reset_password") {
      if (!confirm(`Are you sure you want to send a password reset email to the ${selectedIds.length} selected user(s)?`)) {
        return;
      }

      setIsProcessing(true);
      try {
        const { sendPasswordResetEmail } = await import("firebase/auth");
        const { auth } = await import("@/lib/firebase");

        for (const targetUserId of selectedIds) {
          const targetUser = users.find(u => u.uid === targetUserId);
          if (targetUser && targetUser.email) {
            await sendPasswordResetEmail(auth, targetUser.email);
          }
        }

        setSelectedIds([]);
        setBulkAction("");
        alert("Password reset email(s) sent successfully.");
      } catch (err: any) {
        console.error(err);
        alert("Error sending password resets: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    } else {
      alert("Please select a valid bulk action.");
    }
  };

  // Apply Change Role
  const handleChangeRoles = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one user.");
      return;
    }
    if (!roleToChange) {
      alert("Please select a target role.");
      return;
    }

    setIsProcessing(true);
    try {
      if (!user) return;
      const idToken = await user.getIdToken();

      for (const targetUserId of selectedIds) {
        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({ targetUserId, newRole: roleToChange }),
        });
        if (!res.ok) {
          throw new Error("Failed to update role");
        }
      }

      setUsers(prev => prev.map(u => 
        selectedIds.includes(u.uid) ? { ...u, role: roleToChange } : u
      ));
      setSelectedIds([]);
      setRoleToChange("");
      alert("User roles updated successfully.");
    } catch (err: any) {
      console.error(err);
      alert("Error changing roles: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter & Search computation
  const filteredUsers = users.filter(u => {
    const safeRole = (u.role || "").toLowerCase();
    const roleMatch = activeFilter === "all" || safeRole === activeFilter;
    const nameMatch = 
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.displayName || "").toLowerCase().includes(searchQuery.toLowerCase());
    return roleMatch && nameMatch;
  });

  // Role Counts
  const totalCount = users.length;
  const adminCount = users.filter(u => (u.role || "").toLowerCase() === "administrator").length;
  const editorCount = users.filter(u => (u.role || "").toLowerCase() === "editor").length;
  const authorCount = users.filter(u => (u.role || "").toLowerCase() === "author").length;
  const contributorCount = users.filter(u => (u.role || "").toLowerCase() === "contributor").length;
  const subscriberCount = users.filter(u => (u.role || "").toLowerCase() === "subscriber").length;
  const noneCount = users.filter(u => !(u.role) || (u.role || "").toLowerCase() === "none").length;

  if (authLoading) return null;

  if (!isAdmin(role || "")) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-slate-800">Access Denied</h1>
        <p className="text-slate-500 mb-6 text-sm max-w-sm leading-relaxed">You need administrator privileges to view this page.</p>
        <Link href="/team/profile">
          <Button variant="secondary" className="font-semibold text-xs py-2 px-4 bg-slate-100 border border-slate-200 hover:bg-slate-200">
            Go to My Profile
          </Button>
        </Link>
      </div>
    );
  }

  // Table Columns Definition
  const columns: Column<UserRecord & { postCount: number }>[] = [
    {
      key: "select",
      header: "",
      headerClassName: "w-12 text-center",
      className: "text-center",
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.uid)}
          onChange={() => toggleSelect(row.uid)}
          disabled={row.uid === user?.uid} // Can't select/delete yourself
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        />
      ),
    },
    {
      key: "email",
      header: "Username",
      render: (email, row) => {
        const safeEmail = email || "";
        const initial = row.displayName 
          ? row.displayName[0].toUpperCase() 
          : (safeEmail ? safeEmail[0].toUpperCase() : "?");
        const username = safeEmail ? safeEmail.split("@")[0] : "user_" + row.uid.slice(0, 5);

        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 font-bold border border-slate-200">
              {initial}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-slate-800 block truncate text-sm">
                {username}
              </span>
              {row.uid === user?.uid && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full font-medium inline-block mt-0.5">You</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "displayName",
      header: "Name",
      render: (name, row) => {
        const safeEmail = row.email || "";
        return (
          <span className="text-slate-600 text-sm font-medium">
            {name || (safeEmail ? safeEmail.split("@")[0] : "Unnamed User")}
          </span>
        );
      },
    },
    {
      key: "email",
      header: "Email",
      render: (email) => (
        email ? (
          <a href={`mailto:${email}`} className="text-blue-600 hover:underline text-sm font-medium">
            {email}
          </a>
        ) : (
          <span className="text-slate-400 text-xs italic">No email address</span>
        )
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (roleVal) => {
        const lower = (roleVal || "").toLowerCase();
        const variant = 
          lower === "administrator" ? "purple" :
          lower === "editor" ? "info" :
          lower === "author" ? "success" :
          lower === "contributor" ? "warning" :
          lower === "subscriber" ? "default" :
          "default";
        return (
          <Badge variant={variant}>
            {roleVal || "None"}
          </Badge>
        );
      },
    },
    {
      key: "postCount",
      header: "Posts",
      headerClassName: "text-center w-24",
      className: "text-center font-semibold text-slate-700 text-sm",
      render: (count) => count,
    }
  ];

  // Map user records to include post counts
  const dataForTable = filteredUsers.map(u => ({
    ...u,
    postCount: getPostCount(u.uid)
  }));

  // Render Action controls
  const renderControls = (isBottom = false) => (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isBottom ? "mt-4" : "mb-4"}`}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {/* Bulk Action selector */}
        <select
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[150px]"
        >
          <option value="">Bulk actions</option>
          <option value="delete">Delete</option>
          <option value="reset_password">Send password reset</option>
        </select>
        <Button
          variant="secondary"
          size="sm"
          disabled={isProcessing || !bulkAction}
          onClick={handleApplyBulkAction}
        >
          Apply
        </Button>

        {/* Change Role selector */}
        <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

        <select
          value={roleToChange}
          onChange={(e) => setRoleToChange(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[180px]"
        >
          <option value="">Change role to...</option>
          <option value="subscriber">Subscriber</option>
          <option value="contributor">Contributor</option>
          <option value="author">Author</option>
          <option value="editor">Editor</option>
          <option value="administrator">Administrator</option>
          <option value="none">— No role for this site —</option>
        </select>
        <Button
          variant="secondary"
          size="sm"
          disabled={isProcessing || !roleToChange}
          onClick={handleChangeRoles}
        >
          Change
        </Button>
      </div>

      <div className="text-xs text-slate-400 font-medium">
        {filteredUsers.length} items
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Users</h1>
          <Link href="/team/add">
            <Button variant="secondary" size="sm" className="bg-white hover:bg-slate-50 border border-slate-200 font-semibold text-xs py-1 px-3">
              Add User
            </Button>
          </Link>
        </div>

        {/* Search box */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs w-48 transition-all focus:w-60"
            />
          </div>
        </div>
      </div>

      {/* WP style filter tabs */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-400 border-b border-slate-200 pb-2.5">
        <button
          onClick={() => setActiveFilter("all")}
          className={`transition-colors ${activeFilter === "all" ? "text-blue-600 font-bold" : "hover:text-slate-700"}`}
        >
          All ({totalCount})
        </button>
        <span>|</span>
        <button
          onClick={() => setActiveFilter("administrator")}
          className={`transition-colors ${activeFilter === "administrator" ? "text-blue-600 font-bold" : "hover:text-slate-700"}`}
        >
          Administrators ({adminCount})
        </button>
        <span>|</span>
        <button
          onClick={() => setActiveFilter("editor")}
          className={`transition-colors ${activeFilter === "editor" ? "text-blue-600 font-bold" : "hover:text-slate-700"}`}
        >
          Editors ({editorCount})
        </button>
        <span>|</span>
        <button
          onClick={() => setActiveFilter("author")}
          className={`transition-colors ${activeFilter === "author" ? "text-blue-600 font-bold" : "hover:text-slate-700"}`}
        >
          Authors ({authorCount})
        </button>
        <span>|</span>
        <button
          onClick={() => setActiveFilter("contributor")}
          className={`transition-colors ${activeFilter === "contributor" ? "text-blue-600 font-bold" : "hover:text-slate-700"}`}
        >
          Contributors ({contributorCount})
        </button>
        <span>|</span>
        <button
          onClick={() => setActiveFilter("subscriber")}
          className={`transition-colors ${activeFilter === "subscriber" ? "text-blue-600 font-bold" : "hover:text-slate-700"}`}
        >
          Subscribers ({subscriberCount})
        </button>
        <span>|</span>
        <button
          onClick={() => setActiveFilter("none")}
          className={`transition-colors ${activeFilter === "none" ? "text-blue-600 font-bold" : "hover:text-slate-700"}`}
        >
          None ({noneCount})
        </button>
      </div>

      {/* Action Controls (Top) */}
      {renderControls(false)}

      {/* Table wrapper */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-400 text-xs">Loading user list...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Table
            columns={columns}
            data={dataForTable}
            keyExtractor={(row) => row.uid}
            emptyMessage="No users found matching the filter."
            striped={true}
            hoverable={true}
            className="bg-white shadow-xs"
          />

          {/* Select All Checkbox logic */}
          <div className="flex items-center gap-2 pl-4 text-xs font-semibold text-slate-500 uppercase tracking-wider py-1.5">
            <input
              type="checkbox"
              onChange={(e) => handleSelectAll(e.target.checked)}
              checked={selectedIds.length > 0 && selectedIds.length === filteredUsers.filter(u => u.uid !== user?.uid).length}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">Select All (excludes you)</span>
          </div>

          {/* Action Controls (Bottom) */}
          {renderControls(true)}
        </div>
      )}
    </div>
  );
}
