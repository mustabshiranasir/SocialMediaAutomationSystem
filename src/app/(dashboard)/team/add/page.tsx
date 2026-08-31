"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui";
import { isAdmin } from "@/lib/permissions";

interface ValidationErrors {
  username?: string;
  email?: string;
  password?: string;
}

export default function AddUser() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [website, setWebsite] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [targetRole, setTargetRole] = useState("subscriber");
  
  const [isAdding, setIsAdding] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  // Generate a random secure password
  const generateSecurePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let pass = "";
    // Ensure we pick at least one of each class
    pass += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    pass += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    pass += "0123456789"[Math.floor(Math.random() * 10)];
    pass += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)];
    for (let i = 0; i < 12; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    // Shuffle the result
    pass = pass.split("").sort(() => 0.5 - Math.random()).join("");
    setPassword(pass);
  };

  // Generate default password on mount
  useEffect(() => {
    generateSecurePassword();
  }, []);

  // Determine password strength
  const getPasswordStrength = () => {
    if (!password) return { label: "Empty", color: "bg-slate-200 text-slate-500 border-slate-300" };
    if (password.length < 6) return { label: "Very Weak", color: "bg-red-100 text-red-700 border-red-200" };
    
    let score = 0;
    if (password.length >= 10) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score >= 4) return { label: "Strong", color: "bg-emerald-100 text-emerald-700 border-emerald-300" };
    if (score >= 2) return { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-300" };
    return { label: "Weak", color: "bg-red-100 text-red-700 border-red-200" };
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Username validation
    if (!username.trim()) {
      newErrors.username = "Username is required.";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validateForm()) return;

    setIsAdding(true);
    setApiError("");
    setSuccess(false);

    try {
      const idToken = await user.getIdToken();
      // Store first/last name as name
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          email,
          password,
          name: fullName || username,
          role: targetRole
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setSuccess(true);
      setUsername("");
      setEmail("");
      setFirstName("");
      setLastName("");
      setWebsite("");
      generateSecurePassword();
      setTargetRole("subscriber");
      
      // Auto redirect to users list page after a brief delay
      setTimeout(() => {
        router.push("/team");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "An unexpected error occurred.");
    } finally {
      setIsAdding(false);
    }
  };

  if (authLoading) return null;

  if (!isAdmin(role || "")) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-slate-800">Access Denied</h1>
        <p className="text-slate-500 mb-6 text-sm max-w-sm leading-relaxed">You need administrator privileges to add users.</p>
        <Link href="/" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-md">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const strength = getPasswordStrength();
  const formRowClass = "grid grid-cols-1 md:grid-cols-4 items-start gap-3 py-4 border-b border-slate-100";
  const labelClass = "text-sm font-semibold text-slate-800 pt-2.5 md:col-span-1";
  const inputClass = "w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm max-w-lg transition-all";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/team" className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Add User</h1>
          <p className="text-sm text-slate-500 mt-1">Create a brand new user and add them to this site.</p>
        </div>
      </div>

      {/* Form panel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#f0f0f1]/50 border border-slate-200 rounded-xl p-8 shadow-xs"
      >
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl mb-6 shadow-xs"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-sm font-semibold">User created successfully! Redirecting...</span>
            </motion.div>
          )}
          {apiError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 text-red-700 bg-red-50 border border-red-100 px-4 py-3 rounded-xl mb-6 shadow-xs"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-sm font-semibold">{apiError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAddUser} className="space-y-1">
          {/* Username */}
          <div className={formRowClass}>
            <label className={labelClass}>Username (required)</label>
            <div className="md:col-span-3 space-y-1">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
                }}
                className={`${inputClass} ${errors.username ? "border-red-400 focus:ring-red-400" : ""}`}
              />
              {errors.username && <p className="text-xs text-red-500 font-medium">{errors.username}</p>}
            </div>
          </div>

          {/* Email */}
          <div className={formRowClass}>
            <label className={labelClass}>Email (required)</label>
            <div className="md:col-span-3 space-y-1">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                className={`${inputClass} ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`}
              />
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
            </div>
          </div>

          {/* First Name */}
          <div className={formRowClass}>
            <label className={labelClass}>First Name</label>
            <div className="md:col-span-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Last Name */}
          <div className={formRowClass}>
            <label className={labelClass}>Last Name</label>
            <div className="md:col-span-3">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Website */}
          <div className={formRowClass}>
            <label className={labelClass}>Website</label>
            <div className="md:col-span-3">
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Password Generator */}
          <div className={formRowClass}>
            <label className={labelClass}>Password</label>
            <div className="md:col-span-3 space-y-3 max-w-lg">
              <button
                type="button"
                onClick={generateSecurePassword}
                className="px-4 py-2 border border-blue-600 bg-white hover:bg-blue-50 text-blue-600 rounded text-xs font-semibold shadow-xs transition-colors"
              >
                Generate password
              </button>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    className={`w-full bg-white border rounded px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm ${
                      errors.password ? "border-red-400 focus:ring-red-400" : "border-slate-300"
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Password strength feedback */}
              <div className={`w-full border rounded text-center py-1 text-xs font-bold transition-all ${strength.color}`}>
                {strength.label}
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password}</p>}
            </div>
          </div>

          {/* Send User Notification */}
          <div className={formRowClass}>
            <label className={labelClass}>Send User Notification</label>
            <div className="md:col-span-3 pt-2">
              <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                />
                Send the new user an email about their account
              </label>
            </div>
          </div>

          {/* Role */}
          <div className={formRowClass}>
            <label className={labelClass}>Role</label>
            <div className="md:col-span-3">
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-white border border-slate-300 rounded px-3 py-2 text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer w-full max-w-xs transition-colors"
              >
                <option value="subscriber">Subscriber</option>
                <option value="contributor">Contributor</option>
                <option value="author">Author</option>
                <option value="editor">Editor</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 flex justify-start">
            <button
              type="submit"
              disabled={isAdding}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAdding && <Loader2 className="w-4 h-4 animate-spin" />}
              Add User
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
