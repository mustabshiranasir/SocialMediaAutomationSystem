"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldAlert, Users, UserCog, Plus, X } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

type UserRecord = {
  uid: string;
  email: string;
  creationTime: string;
  role: "admin" | "user";
};

export default function TeamManagement() {
  const { user, role, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (authLoading || role !== "admin") {
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
        headers: {
          "Authorization": `Bearer ${idToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
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

  const handleRoleChange = async (targetUserId: string, newRole: "admin" | "user") => {
    if (!user) return;
    if (targetUserId === user.uid && newRole === "user") {
      if (!confirm("Are you sure you want to remove your own admin privileges? You won't be able to access this page anymore.")) {
        return;
      }
    }

    setUpdatingId(targetUserId);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ targetUserId, newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");

      // Update local state
      setUsers(users.map(u => u.uid === targetUserId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error(error);
      alert("Error updating user role");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsAdding(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          name: newName,
          role: newRole
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(`${data.error}\n\nStack:\n${data.stack || 'None'}`);
      
      setUsers([data.user, ...users]);
      setShowAddModal(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewRole("user");
    } catch (error: any) {
      console.error(error);
      alert("Error adding user: " + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  if (authLoading) return null;

  if (role !== "admin") {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
          <ShieldAlert className="w-16 h-16 text-slate-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">You need admin privileges to manage the team.</p>
          <Link href="/" className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your team's access and roles
          </p>
        </motion.div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-blue-600 text-white transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-sm font-medium text-slate-300">User Email</th>
                  <th className="p-4 text-sm font-medium text-slate-300">Joined</th>
                  <th className="p-4 text-sm font-medium text-slate-300">Role</th>
                  <th className="p-4 text-sm font-medium text-slate-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {u.email[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-200">{u.email}</span>
                      {u.uid === user?.uid && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-medium">You</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {new Date(u.creationTime).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wide
                        ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {u.role === 'admin' ? <UserCog className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                        {u.role}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {updatingId === u.uid ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          </div>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.uid, e.target.value as "admin" | "user")}
                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer hover:border-white/20 transition-colors"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-6 rounded-2xl w-full max-w-md border border-white/10 relative shadow-2xl"
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name (Optional)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="e.g. newuser@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "admin" | "user")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="user">User (Standard)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create User
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </main>
    </ProtectedRoute>
  );
}
