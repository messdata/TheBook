"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, ChevronRight } from "lucide-react";

interface LoginFormContentProps {
  onSuccess: () => void;
  authError?: string | null;
}

// Reusable Ledger Input Component
const LedgerInput = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  isPassword = false,
  showPassword,
  setShowPassword,
  required = false
}: any) => (
  <div className="group space-y-1.5 md:space-y-2">
    <label className="text-[8px] md:text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] group-focus-within:text-blue-600 transition-colors">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative border-b border-slate-200 group-focus-within:border-blue-600 transition-all">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent py-2 text-sm md:text-base outline-none placeholder:text-slate-300 text-slate-900 appearance-none"
        required={required}
      />
      {isPassword && (
        <button 
          type="button" 
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-blue-600 transition-colors"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  </div>
);

export default function LoginFormContent({ onSuccess, authError: externalError }: LoginFormContentProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  // Show external auth error if provided
  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        onSuccess();
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?from=login`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-[8px] md:text-[9px] font-mono text-blue-600 uppercase tracking-widest">Verification</p>
        <h2 className="text-2xl md:text-4xl font-serif italic text-slate-900">Sign In</h2>
      </div>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 md:gap-3 rounded-sm border-2 border-slate-300 bg-white px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-semibold text-slate-800 transition-all hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 active:scale-95"
      >
        <svg className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="font-semibold">Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-[8px] md:text-[9px] uppercase">
          <span className="bg-[#fcfcf9] px-2 text-slate-400 tracking-wider">Or</span>
        </div>
      </div>

      {/* Ledger Inputs */}
      <div className="space-y-5 md:space-y-6">
        <LedgerInput
          label="01. USER EMAIL"
          value={email}
          onChange={setEmail}
          placeholder="admin@system.com"
          type="email"
          required
        />
        <LedgerInput
          label="02. ACCESS KEY"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          isPassword
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          required
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-sm bg-red-50 border-l-2 border-red-500 p-3 md:p-4 text-xs md:text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 md:py-4 bg-slate-900 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-black transition-all group disabled:opacity-50 active:scale-95"
      >
        {loading ? "Authenticating..." : "Establish Link"}
        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </form>
  );
}
