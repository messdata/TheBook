"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Chrome, ArrowRight, Check, AlertCircle } from "lucide-react";

export default function SignupClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);

  // Basic Info
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [surname, setSurname] = useState("");

  // Work Settings
  const [hourlyRate, setHourlyRate] = useState(13.5);
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [overtimeEnabled, setOvertimeEnabled] = useState(true);
  const [overtimeThreshold, setOvertimeThreshold] = useState(40);
  const [companyName, setCompanyName] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyContact, setCompanyContact] = useState("");

  // Track scroll progress
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight - target.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    const scrollContainer = document.getElementById("signup-scroll");
    scrollContainer?.addEventListener("scroll", handleScroll);
    return () => scrollContainer?.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate completion percentage
  const calculateCompletion = () => {
    const required = [email, password, confirmPassword, firstName, surname];
    const optional = [
      middleName,
      hourlyRate,
      breakMinutes,
      companyName,
      companyLocation,
      companyEmail,
      companyContact,
    ];

    const requiredFilled = required.filter((field) => field).length;
    const optionalFilled = optional.filter((field) => field).length;

    const requiredWeight = 70; // 70% for required fields
    const optionalWeight = 30; // 30% for optional fields

    const requiredProgress = (requiredFilled / required.length) * requiredWeight;
    const optionalProgress = (optionalFilled / optional.length) * optionalWeight;

    return Math.round(requiredProgress + optionalProgress);
  };

  const completion = calculateCompletion();

  // Google Sign Up
  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Email Sign Up
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email || !password || !confirmPassword || !firstName || !surname) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Sign up user
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            middle_name: middleName,
            surname: surname,
            full_name: `${firstName} ${middleName} ${surname}`.trim(),
          },
        },
      });

      if (signupError) throw signupError;

      if (authData.user) {
        // Save user profile and work settings
        const { error: profileError } = await supabase.from("user_profiles").insert({
          user_id: authData.user.id,
          email: email,
          first_name: firstName,
          middle_name: middleName || null,
          surname: surname,
          hourly_rate: hourlyRate,
          break_minutes: breakMinutes,
          overtime_enabled: overtimeEnabled,
          overtime_threshold: overtimeThreshold,
          company_name: companyName || null,
          company_location: companyLocation || null,
          company_email: companyEmail || null,
          company_contact: companyContact || null,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Don't throw - user is created, profile can be added later
        }

        // Redirect to dashboard
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-2xl border-slate-200 dark:border-slate-800">

        {/* Progress Bar */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Create Account
              </h2>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {completion}%
                </div>
                {completion === 100 && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>

            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ease-out"
                style={{ width: `${completion}%` }}
              />
            </div>

            {/* Scroll indicator */}
            <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-400 dark:bg-slate-600 transition-all duration-150"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          id="signup-scroll"
          className="max-h-[600px] overflow-y-auto px-6 pb-6"
        >
          {/* Google Sign Up */}
          <div className="mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <Chrome className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-900 text-slate-500">
                  or continue with email
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-6">

            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Basic Information
                <span className="text-xs text-red-500">* Required</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Middle Name</Label>
                  <Input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>
                  Surname <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Doe"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label>
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label>
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="mt-1"
                />
              </div>
            </div>

            {/* Work Settings Section */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Work Settings (Optional)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Hourly Rate (€)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 13.5)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Break Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 30)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <Label className="font-medium">Enable Overtime</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Calculate overtime pay after threshold
                  </p>
                </div>
                <Switch
                  checked={overtimeEnabled}
                  onCheckedChange={setOvertimeEnabled}
                />
              </div>

              {overtimeEnabled && (
                <div>
                  <Label>Overtime Threshold (hours/week)</Label>
                  <Input
                    type="number"
                    value={overtimeThreshold}
                    onChange={(e) => setOvertimeThreshold(parseInt(e.target.value) || 40)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* Company Info Section */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Company Information (Optional)</h3>

              <div>
                <Label>Company Name</Label>
                <Input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corp"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Company Location</Label>
                <Input
                  type="text"
                  value={companyLocation}
                  onChange={(e) => setCompanyLocation(e.target.value)}
                  placeholder="Dublin, Ireland"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Company Email</Label>
                <Input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="hr@company.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Company Contact Details</Label>
                <Input
                  type="tel"
                  value={companyContact}
                  onChange={(e) => setCompanyContact(e.target.value)}
                  placeholder="+353 1 234 5678"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </a>
            </p>
          </form>
        </div>
      </Card>
    </div>
  );
}