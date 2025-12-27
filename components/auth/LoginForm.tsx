"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Sun, Moon } from "lucide-react";

export default function LoginForm() {
    const router = useRouter();

    // Initialize theme state - start with true to match server render
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(true);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Load theme from localStorage after mounting (client-side only)
    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('theme');
        if (stored) {
            setIsDark(stored === 'dark');
        } else {
            setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
    }, []);

    // Persist theme changes
    useEffect(() => {
        if (mounted) {
            const root = window.document.documentElement;
            if (isDark) {
                root.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                root.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }
    }, [isDark, mounted]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get('error');

        if (errorParam === 'no_account') {
            setError('No account found. Please sign up first.');
        } else if (errorParam === 'auth_failed') {
            setError('Authentication failed. Please try again.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err.message || "Failed to sign in");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError("");
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?from=login`,
                    queryParams: {
                        prompt: 'select_account'
                    }
                },
            });

            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "Failed to sign in with Google");
        } finally {
            setIsLoading(false);
        }
    };

    const glassPanel = isDark
        ? "bg-slate-900/60 border-slate-800/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]"
        : "bg-white/50 border-slate-200/40 shadow-[0_8px_32px_0_rgba(100,116,139,0.12)]"

    const glassInput = "h-11 sm:h-12 md:h-14 bg-slate-100/40 dark:bg-black/20 border-slate-300/40 dark:border-white/10 backdrop-blur-sm focus:ring-blue-500/50 transition-all rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"

    return (
        <div className={`relative min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-700 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>

            {/* Background Animation Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-blue-500/30 dark:bg-blue-500/10 blur-[120px]"
                />
                <motion.div
                    animate={{ x: [0, -80, 0], y: [0, -100, 0], scale: [1, 1.3, 1] }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className="absolute -bottom-[10%] -right-[10%] w-[600px] h-[600px] rounded-full bg-purple-500/30 dark:bg-indigo-500/10 blur-[120px]"
                />
            </div>

            {/* Theme Toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDark(!isDark)}
                className="fixed top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-50 rounded-full w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 backdrop-blur-xl bg-white/10 dark:bg-white/5 hover:scale-110 active:scale-95 transition-all"
            >
                {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />}
            </Button>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className={`backdrop-blur-3xl border ${glassPanel} rounded-[2.5rem] overflow-hidden`}>
                    <div className="p-6 sm:p-8 md:p-10 lg:p-12">

                        {/* Header */}
                        <div className="flex flex-col space-y-2 text-center mb-6 sm:mb-8">
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Welcome back.
                            </h1>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                                Sign in to continue your journey
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800 dark:text-red-200">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Google Sign In */}
                        <Button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full h-12 sm:h-14 md:h-16 rounded-2xl bg-white text-black hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-3 text-base sm:text-lg font-semibold transition-all shadow-xl mb-4 sm:mb-6"
                        >
                            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 sm:w-5 sm:h-5" alt="G" />
                            Continue with Google
                        </Button>

                        {/* Divider */}
                        <div className="relative flex items-center gap-4 py-3 sm:py-4 mb-4 sm:mb-6">
                            <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-muted-foreground">Or continue with email</span>
                            <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            <div className="space-y-3 sm:space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs uppercase tracking-tighter ml-1 text-slate-700 dark:text-slate-300">
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        placeholder="name@example.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className={glassInput}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-xs uppercase tracking-tighter ml-1 text-slate-700 dark:text-slate-300">
                                            Password
                                        </Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        >
                                            Forgot?
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className={glassInput}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-11 sm:h-12 md:h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-base sm:text-lg font-semibold shadow-lg transition-all mt-2"
                                >
                                    {isLoading ? "Signing in..." : "Sign In"}
                                </Button>
                            </div>
                        </form>

                        {/* Sign Up Link */}
                        <p className="mt-6 sm:mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/signup"
                                className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-all"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-6 sm:mt-8 text-center text-[10px] sm:text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase opacity-30 flex items-center justify-center gap-2 text-slate-900 dark:text-white">
                    Secure Authentication
                </p>
            </motion.div>
        </div>
    );
}