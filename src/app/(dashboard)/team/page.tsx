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

const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";

export default function TeamManagement() {
  const { user, role, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
      const res = await fetch("/api/users", { headers: { "Authorization": `Bearer ${idToken}` } });
      const data = await res.json();
      if (res.ok) setUsers(data.users);
      else throw new Error(data.error);
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
      if (!confirm("Are you sure you want to remove your own admin privileges?")) return;
    }
    setUpdatingId(targetUserId);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ targetUserId, newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
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
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ email: newEmail, password: newPassword, name: newName, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`${data.error}\n\nStack:\n${data.stack || "None"}`);
      setUsers([data.user, ...users]);
      setShowAddModal(false);
      setNewEmail(""); setNewPassword(""); setNewName(""); setNewRole("user");
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
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-slate-800">Access Denied</h1>
          <p className="text-slate-500 mb-6">You need admin privileges to manage the team.</p>
          <Link href="/" className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Team Management</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your team's access and roles</p>
          </motion.div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
            <Link href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                            {u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-slate-800 text-sm">{u.email}</span>
                            {u.uid === user?.uid && (
                              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">You</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 text-sm">
                        {new Date(u.creationTime).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
                          ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                          {u.role === "admin" ? <UserCog className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                          {u.role}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {updatingId === u.uid ? (
                          <div className="flex justify-end px-3 py-1.5">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          </div>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.uid, e.target.value as "admin" | "user")}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-slate-300 transition-colors"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-2xl w-full max-w-md border border-slate-200 shadow-xl relative"
            >
              <button onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-6 text-slate-800">Add New User</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name (Optional)</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    className={inputClass} placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                    className={inputClass} placeholder="e.g. newuser@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass} placeholder="Minimum 6 characters" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "user")}
                    className={inputClass + " cursor-pointer"}>
                    <option value="user">User (Standard)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isAdding}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70">
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
