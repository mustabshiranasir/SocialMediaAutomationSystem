"use client";

import { useState, useEffect } from "react";
import { updateProfile, updatePassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Save, User, ShieldCheck, AlertCircle, CheckCircle2, Key } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { Input, Button } from "@/components/ui";
import { isAdmin } from "@/lib/permissions";

interface ValidationErrors {
  name?: string;
  password?: string;
  confirmPassword?: string;
}

export default function UserProfile() {
  const { user, role, loading: authLoading } = useAuth();
  
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    
    // Load display name from auth first
    setName(user.displayName || "");

    // Also attempt to load custom profile data from Firestore
    const loadProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().displayName) {
          setName(docSnap.data().displayName);
        }
      } catch (err) {
        console.warn("Could not load display name from firestore:", err);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (newPassword) {
      if (newPassword.length < 6) {
        newErrors.password = "New password must be at least 6 characters.";
      }
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) return;

    setIsSaving(true);
    setApiError("");
    setApiSuccess("");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No active user session.");

      // 1. Update Firebase Auth display name if changed
      if (name.trim() !== (currentUser.displayName || "")) {
        await updateProfile(currentUser, {
          displayName: name.trim()
        });
      }

      // 2. Sync to Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, {
        displayName: name.trim(),
        email: currentUser.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Update password if provided
      if (newPassword) {
        try {
          await updatePassword(currentUser, newPassword);
          setNewPassword("");
          setConfirmPassword("");
        } catch (passErr: any) {
          if (passErr.code === "auth/requires-recent-login") {
            throw new Error("Password change requires a fresh login. Please log out, log back in, and try again.");
          }
          throw passErr;
        }
      }

      setApiSuccess("Profile updated successfully!");
      setTimeout(() => setApiSuccess(""), 4000);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-xs">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">My Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your personal account details and security settings</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden"
      >
        {/* Decorative Background Icon */}
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <User className="w-32 h-32 text-slate-400" />
        </div>

        <AnimatePresence>
          {apiSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl mb-6"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-xs font-semibold">{apiSuccess}</span>
            </motion.div>
          )}
          {apiError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 text-red-700 bg-red-50 border border-red-100 px-4 py-3 rounded-xl mb-6"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-xs font-semibold">{apiError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSaveProfile} className="space-y-6 relative z-10">
          {/* Account Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-lg font-bold shrink-0 uppercase">
                {name ? name[0] : (user?.email ? user.email[0] : "?")}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{user?.email}</h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  Role: <span className={isAdmin(role || "") ? "text-purple-600 font-bold" : "text-slate-600"}>{role || "User"}</span>
                </div>
              </div>
            </div>

            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              error={errors.name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }}
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-400 text-sm cursor-not-allowed select-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Contact your administrator to change your registered email address.</p>
            </div>
          </div>

          {/* Password security header */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-1.5">
              <Key className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700">Change Password</h3>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Leave blank if you do not wish to change your password.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                error={errors.password}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-type new password"
                value={confirmPassword}
                error={errors.confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button type="submit" loading={isSaving} icon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
