"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LoginFormProps {
    onBack: () => void;
    onSignupClick: () => void;
}

function LoginForm({ onBack, onSignupClick }: LoginFormProps) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

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

    return (
        <div className="flex flex-col md:flex-row h-full">
            {/* Left Page (Back button & Info) */}
            <div className="flex-1 p-6 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 bg-[#fafafa] flex flex-col">
                <Button
                    onClick={onBack}
                    variant="ghost"
                    className="w-fit mb-6 text-slate-600 hover:text-slate-900 p-0"
                >
                    <ArrowLeft size={18} className="mr-2" />
                    <span className="text-xs uppercase font-bold">Back</span>
                </Button>

                <div className="flex-1 flex flex-col justify-center space-y-6">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                            Secure Access
                        </h3>
                        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                            Your work data is encrypted and protected. Sign in to access your personalized dashboard.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">End-to-end encryption</p>
                                <p className="text-xs text-slate-600">Your data is yours alone</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">Instant sync</p>
                                <p className="text-xs text-slate-600">Access from anywhere</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Page (Login Form) */}
            <div className="flex-1 p-6 md:p-12 bg-white flex flex-col">
                <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                        Welcome back.
                    </h2>
                    <p className="text-xs md:text-sm text-slate-600">
                        Sign in to continue your journey
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-800">{error}</p>
                    </div>
                )}

                {/* Google Sign In */}
                <Button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full h-11 md:h-12 rounded-xl bg-white text-black hover:bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm mb-4"
                >
                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
                    Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative flex items-center gap-3 py-3 mb-4">
                    <div className="flex-1 h-[1px] bg-slate-200" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Or continue with email</span>
                    <div className="flex-1 h-[1px] bg-slate-200" />
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-[10px] uppercase tracking-wider font-bold text-slate-700">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-11 bg-white border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-[10px] uppercase tracking-wider font-bold text-slate-700">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-11 bg-white border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-md"
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </div>

                    {/* Sign Up Link */}
                    <p className="mt-auto text-center text-xs text-slate-600">
                        Don&apos;t have an account?{" "}
                        <button
                            type="button"
                            onClick={onSignupClick}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            Sign up
                        </button>
                    </p>
                </form>
            </div>

            {/* Center Binding Crease */}
            <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/5 via-black/10 to-transparent pointer-events-none hidden md:block" />
        </div>
    );
}
export default LoginForm;
