"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

interface LoginFormContentProps {
  onSuccess: () => void;
  onLoading: (isLoading: boolean) => void;
  authError?: string | null;
}

export default function LoginFormContent({ onSuccess, onLoading, authError: externalError }: LoginFormContentProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (externalError) setError(externalError);
  }, [externalError]);

  const validateForm = () => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    if (!validateForm()) return;

    onLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Map common errors to user-friendly messages
        if (authError.message === "Invalid login credentials") {
          setError("The email or password you entered is incorrect.");
        } else {
          setError(authError.message);
        }
        onLoading(false);
        return;
      }

      if (data?.user) {
        onSuccess();
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
      onLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    onLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?from=login` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      onLoading(false);
    }
  };

  return (
    <form id="login-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Subtle Monochrome Google Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 rounded-[2rem] border border-white/10 bg-white/[0.03] backdrop-blur-xl px-4 py-3 text-[13px] font-medium text-white/70 transition-all hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98]"
      >
        <svg className="h-4 w-4 opacity-60" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        <span>Continue with Google</span>
      </button>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-white/[0.05]"></div>
        <span className="flex-shrink mx-4 text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">Or</span>
        <div className="flex-grow border-t border-white/[0.05]"></div>
      </div>

      <div className="space-y-4">
        {/* Email Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-4">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
            placeholder="name@company.com"
            className={`w-full rounded-[2rem] border ${error.includes("email") ? 'border-red-400/20' : 'border-white/10'} bg-white/[0.03] backdrop-blur-xl px-6 py-3.5 text-sm text-white placeholder:text-white/10 outline-none focus:border-white/30 transition-all`}
            required
          />
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-4">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
              placeholder="••••••••"
              className={`w-full rounded-[2rem] border ${error.includes("Password") ? 'border-red-400/20' : 'border-white/10'} bg-white/[0.03] backdrop-blur-xl px-6 py-3.5 text-sm text-white placeholder:text-white/10 outline-none focus:border-white/30 transition-all`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-white/20 hover:text-white/50 transition-colors"
            >
              {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Glassy Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-500/5 border border-red-500/10 p-3 text-[11px] text-red-300/70 backdrop-blur-md">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}
