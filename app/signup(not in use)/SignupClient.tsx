// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/lib/supabase";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";
// import { ArrowRight, AlertCircle, User, Briefcase, Building2, Lock, Sparkles, Sun, Moon } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useTheme } from "next-themes";

// // Animation Variants
// const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//         opacity: 1,
//         transition: { staggerChildren: 0.1, delayChildren: 0.2 }
//     }
// };

// const itemVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: {
//         opacity: 1,
//         y: 0,
//         transition: { type: "spring", stiffness: 260, damping: 20 }
//     }
// };

// export default function SignupClient() {
//     const router = useRouter();
//     const { theme, setTheme } = useTheme();
//     const [mounted, setMounted] = useState(false);

//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");

//     // Google OAuth state
//     const [isGoogleUser, setIsGoogleUser] = useState(false);
//     const [googleUserData, setGoogleUserData] = useState<any>(null);

//     // Form state
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [confirmPassword, setConfirmPassword] = useState("");
//     const [firstName, setFirstName] = useState("");
//     const [surname, setSurname] = useState("");
//     const [hourlyRate, setHourlyRate] = useState(13.5);
//     const [employerName, setEmployerName] = useState("");
//     const [overtimeThreshold, setOvertimeThreshold] = useState(40);
//     const [overtimeRate, setOvertimeRate] = useState(1.5);
//     const [sundayRate, setSundayRate] = useState(2);

//     // Prevent hydration mismatch
//     useEffect(() => setMounted(true), []);

//     // Check if user came from Google OAuth
//     useEffect(() => {
//         const checkGoogleUser = async () => {
//             const params = new URLSearchParams(window.location.search);
//             if (params.get('google') === 'true') {
//                 const { data: { session } } = await supabase.auth.getSession();
//                 if (session) {
//                     setIsGoogleUser(true);
//                     setGoogleUserData(session.user);
//                     setEmail(session.user.email || '');
//                     setFirstName(session.user.user_metadata.full_name?.split(' ')[0] || '');
//                     setSurname(session.user.user_metadata.full_name?.split(' ').slice(1).join(' ') || '');
//                 }
//             }
//         };
//         checkGoogleUser();
//     }, []);

//     const handleSignup = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setError("");

//         try {
//             // For Google users, only update work details
//             if (isGoogleUser && googleUserData) {
//                 const { error: updateError } = await supabase
//                     .from("user_profiles")
//                     .update({
//                         hourly_rate: hourlyRate,
//                         company_name: employerName,
//                         overtime_threshold: overtimeThreshold,
//                         // Add overtime_rate and sunday_rate if your schema has these fields
//                     })
//                     .eq('user_id', googleUserData.id);

//                 if (updateError) throw updateError;

//                 router.push("/dashboard");
//                 return;
//             }

//             // Email/Password signup flow
//             if (password !== confirmPassword) {
//                 setError("Passwords do not match");
//                 setLoading(false);
//                 return;
//             }

//             if (password.length < 6) {
//                 setError("Password must be at least 6 characters");
//                 setLoading(false);
//                 return;
//             }

//             const { data: authData, error: authError } = await supabase.auth.signUp({
//                 email,
//                 password,
//                 options: {
//                     data: {
//                         first_name: firstName,
//                         surname: surname,
//                         full_name: `${firstName} ${surname}`.trim(),
//                     }
//                 }
//             });

//             if (authError) throw authError;

//             if (authData.user) {
//                 const { error: profileError } = await supabase
//                     .from("user_profiles")
//                     .insert({
//                         user_id: authData.user.id,
//                         email: email,
//                         first_name: firstName,
//                         surname: surname,
//                         auth_provider: 'email',
//                         hourly_rate: hourlyRate,
//                         company_name: employerName,
//                         overtime_threshold: overtimeThreshold,
//                     });

//                 if (profileError) {
//                     console.error("Profile creation error:", profileError);
//                     throw profileError;
//                 }

//                 router.push("/dashboard");
//             }
//         } catch (err: any) {
//             setError(err.message || "An error occurred during signup");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleGoogleSignup = async () => {
//         setError("");
//         try {
//             const { error } = await supabase.auth.signInWithOAuth({
//                 provider: "google",
//                 options: {
//                     redirectTo: `${window.location.origin}/auth/callback?from=signup`,
//                 },
//             });

//             if (error) throw error;
//         } catch (err: any) {
//             setError(err.message || "Failed to sign up with Google");
//         }
//     };

//     if (!mounted) return null;

//     return (
//         <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950 transition-colors duration-500">

//             {/* Ambient Background Effects */}
//             <div className="fixed inset-0 overflow-hidden pointer-events-none">
//                 <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] rounded-full" />
//                 <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-500/5 dark:bg-zinc-100/5 blur-[120px] rounded-full" />
//             </div>

//             {/* Theme Toggle Button */}
//             <div className="fixed top-6 right-6 z-50">
//                 <Button
//                     variant="outline"
//                     size="icon"
//                     onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//                     className="rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm"
//                 >
//                     {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
//                 </Button>
//             </div>

//             <motion.div
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//                 className="w-full max-w-2xl relative z-10"
//             >
//                 <motion.div variants={itemVariants} className="text-center mb-8">
//                     <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 mb-4">
//                         <Sparkles className="w-6 h-6 text-white dark:text-zinc-900" />
//                     </div>
//                     <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">
//                         {isGoogleUser ? "Complete Your Profile" : "Create Account"}
//                     </h1>
//                     <p className="text-slate-500 dark:text-zinc-400 mt-2">
//                         {isGoogleUser ? "Add your work details to continue" : "Join your workplace dashboard"}
//                     </p>
//                 </motion.div>

//                 <motion.div
//                     variants={itemVariants}
//                     className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl rounded-3xl overflow-hidden"
//                 >
//                     <form onSubmit={handleSignup} className="p-8 space-y-8">
//                         {error && (
//                             <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
//                                 <AlertCircle className="w-4 h-4" />
//                                 {error}
//                             </div>
//                         )}

//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                             {/* Personal Info */}
//                             <div className="space-y-4">
//                                 <Label className="text-slate-700 dark:text-zinc-300">Personal Details</Label>
//                                 <div className="space-y-3">
//                                     <div className="relative">
//                                         <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
//                                         <Input
//                                             placeholder="First Name"
//                                             value={firstName}
//                                             onChange={(e) => setFirstName(e.target.value)}
//                                             required
//                                             disabled={isGoogleUser}
//                                             className="pl-10 dark:bg-zinc-800 dark:border-zinc-700 disabled:opacity-60"
//                                         />
//                                     </div>
//                                     <Input
//                                         placeholder="Surname"
//                                         value={surname}
//                                         onChange={(e) => setSurname(e.target.value)}
//                                         required
//                                         disabled={isGoogleUser}
//                                         className="dark:bg-zinc-800 dark:border-zinc-700 disabled:opacity-60"
//                                     />
//                                 </div>
//                             </div>

//                             {/* Employment Info */}
//                             <div className="space-y-4">
//                                 <Label className="text-slate-700 dark:text-zinc-300">Employment</Label>
//                                 <div className="space-y-3">
//                                     <div className="relative">
//                                         <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
//                                         <Input
//                                             placeholder="Employer Name"
//                                             value={employerName}
//                                             onChange={(e) => setEmployerName(e.target.value)}
//                                             required
//                                             className="pl-10 dark:bg-zinc-800 dark:border-zinc-700"
//                                         />
//                                     </div>
//                                     <div className="relative">
//                                         <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
//                                         <Input
//                                             type="number"
//                                             step="0.01"
//                                             placeholder="Hourly Rate (€)"
//                                             value={hourlyRate}
//                                             onChange={(e) => setHourlyRate(Number(e.target.value))}
//                                             required
//                                             className="pl-10 dark:bg-zinc-800 dark:border-zinc-700"
//                                         />
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Credentials - Only show for email signup */}
//                             {!isGoogleUser && (
//                                 <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
//                                     <Label className="text-slate-700 dark:text-zinc-300">Account Access</Label>
//                                     <Input
//                                         type="email"
//                                         placeholder="Email Address"
//                                         value={email}
//                                         onChange={(e) => setEmail(e.target.value)}
//                                         required
//                                         className="dark:bg-zinc-800 dark:border-zinc-700"
//                                     />
//                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                         <div className="relative">
//                                             <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
//                                             <Input
//                                                 type="password"
//                                                 placeholder="Password"
//                                                 value={password}
//                                                 onChange={(e) => setPassword(e.target.value)}
//                                                 required
//                                                 className="pl-10 dark:bg-zinc-800 dark:border-zinc-700"
//                                             />
//                                         </div>
//                                         <Input
//                                             type="password"
//                                             placeholder="Confirm Password"
//                                             value={confirmPassword}
//                                             onChange={(e) => setConfirmPassword(e.target.value)}
//                                             required
//                                             className="dark:bg-zinc-800 dark:border-zinc-700"
//                                         />
//                                     </div>
//                                 </div>
//                             )}

//                             {/* Email display for Google users */}
//                             {isGoogleUser && (
//                                 <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
//                                     <Label className="text-slate-700 dark:text-zinc-300 mb-2">Email</Label>
//                                     <Input
//                                         type="email"
//                                         value={email}
//                                         disabled
//                                         className="dark:bg-zinc-800 dark:border-zinc-700 opacity-60"
//                                     />
//                                 </div>
//                             )}
//                         </div>

//                         <Button
//                             type="submit"
//                             disabled={loading}
//                             className="w-full h-12 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
//                         >
//                             {loading ? "Processing..." : isGoogleUser ? "Complete Setup" : "Create Account"}
//                             {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
//                         </Button>

//                         {/* Google Signup - Only show for non-Google users */}
//                         {!isGoogleUser && (
//                             <>
//                                 <div className="relative">
//                                     <div className="absolute inset-0 flex items-center">
//                                         <span className="w-full border-t border-slate-200 dark:border-zinc-800" />
//                                     </div>
//                                     <div className="relative flex justify-center text-xs uppercase">
//                                         <span className="bg-white dark:bg-zinc-900 px-2 text-slate-500 dark:text-zinc-400">
//                                             Or continue with
//                                         </span>
//                                     </div>
//                                 </div>

//                                 <Button
//                                     type="button"
//                                     variant="outline"
//                                     onClick={handleGoogleSignup}
//                                     className="w-full h-12 rounded-xl border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
//                                 >
//                                     <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
//                                         <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
//                                         <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
//                                         <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
//                                         <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
//                                     </svg>
//                                     Sign up with Google
//                                 </Button>
//                             </>
//                         )}

//                         <p className="text-center text-sm text-slate-500 dark:text-zinc-400">
//                             Already have an account?{" "}
//                             <button
//                                 type="button"
//                                 onClick={() => router.push("/login")}
//                                 className="text-zinc-900 dark:text-zinc-100 font-bold hover:underline"
//                             >
//                                 Sign In
//                             </button>
//                         </p>
//                     </form>
//                 </motion.div>
//             </motion.div>
//         </div>
//     );
// }