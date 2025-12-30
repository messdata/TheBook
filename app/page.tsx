"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import {
  ArrowRight,
  Plus,
  ChevronLeft,
  MousePointerClick,
} from "lucide-react";
import LoginFormContent from "@/components/auth/LoginFormContent";
import SignUpFormContent from "@/components/auth/SignUpFormContent";

export default function TheMidnightBookPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"landing" | "login" | "signup">("landing");
  const [mounted, setMounted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // Handle OAuth callback errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');

      if (error) {
        setIsOpen(true);
        setView("login");

        switch (error) {
          case 'no_account':
            setAuthError('No account found. Please sign up first.');
            break;
          case 'account_exists':
            setAuthError('Account exists. Please sign in instead.');
            break;
          case 'auth_failed':
            setAuthError('Authentication failed. Please try again.');
            break;
          default:
            setAuthError('An error occurred. Please try again.');
        }

        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  if (!mounted) return null;

  const flipTransition = { duration: 1.6, ease: cubicBezier(0.19, 1, 0.22, 1) };

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center bg-[#080808] overflow-hidden p-4 sm:p-8">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,30,50,1)_0%,rgba(5,5,5,1)_100%)]" />

      {/* "CLICK ME" - Hidden on Mobile */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed left-150 top-1/2 -translate-y-1/2 z-[100] hidden lg:flex items-center gap-6 pointer-events-none"
          >
            <motion.span
              className="text-white text-5xl font-serif italic opacity-20 relative"
              animate={{
                textShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
                  "0 0 30px rgba(59, 130, 246, 0.7), 0 0 60px rgba(59, 130, 246, 0.5)",
                  "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
                ],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))"
              }}
            >
              Click Me
            </motion.span>
            <motion.div
              className="h-px w-32 bg-gradient-to-r from-blue-500/50 to-transparent"
              animate={{
                opacity: [0.5, 1, 0.5],
                boxShadow: [
                  "0 0 10px rgba(59, 130, 246, 0.3)",
                  "0 0 20px rgba(59, 130, 246, 0.6)",
                  "0 0 10px rgba(59, 130, 246, 0.3)",
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOOK CONTAINER */}
      <div className="relative w-full max-w-[1000px] aspect-[0.65/1] md:aspect-[1.5/1] [perspective:2500px] flex items-center justify-center scale-[0.75] xs:scale-90 sm:scale-100 transition-transform duration-500">

        {/* RIGHT PAGE - Embedded Forms */}
        <div className="absolute right-0 w-1/2 h-full bg-[#fcfcf9] shadow-2xl rounded-r-sm overflow-hidden border-l border-slate-200/50">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            <AnimatePresence mode="wait">
              {view === "landing" ? (
                <motion.div
                  key="landing"
                  exit={{ opacity: 0 }}
                  className="p-6 md:p-16 flex flex-col justify-center h-full space-y-8 md:space-y-12"
                >
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-3xl font-serif text-slate-900">Access Portal</h3>
                    <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-slate-400">Authorized Access Only</p>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <button
                      onClick={() => setView("login")}
                      className="w-full py-4 md:py-5 px-6 bg-slate-900 text-white flex justify-between items-center group active:scale-95 transition-transform hover:bg-black"
                    >
                      <span className="text-[9px] md:text-[10px] font-bold tracking-[0.3em]">SIGN IN</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => setView("signup")}
                      className="w-full py-4 md:py-5 px-6 border-2 border-slate-300 flex justify-between items-center text-slate-900 active:scale-95 transition-transform hover:bg-slate-50"
                    >
                      <span className="text-[9px] md:text-[10px] font-bold tracking-[0.3em]">REGISTER</span>
                      <Plus size={16} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={view}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 md:p-12"
                >
                  <button
                    onClick={() => {
                      setView("landing");
                      setAuthError(null);
                    }}
                    className="mb-6 text-[9px] uppercase font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft size={12} /> Back
                  </button>
                  {view === "login" ? (
                    <LoginFormContent onSuccess={() => { }} authError={authError} />
                  ) : (
                    <SignUpFormContent onSuccess={() => { }} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Left shadow gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/[0.05] to-transparent pointer-events-none" />
        </div>

        {/* FLIPPING COVER */}
        <motion.div
          onClick={() => setIsOpen(!isOpen)}
          animate={{ rotateY: isOpen ? -180 : 0 }}
          transition={flipTransition}
          style={{ transformOrigin: "left center", zIndex: 50, transformStyle: "preserve-3d", left: "50%" }}
          className="absolute top-0 w-1/2 h-full cursor-pointer"
        >
          {/* FRONT COVER */}
          <div
            className="absolute inset-0 bg-[#0f0f11] rounded-r-sm shadow-[20px_0_50px_rgba(0,0,0,0.6)] border-l-4 border-slate-800 flex flex-col items-center justify-center overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <h1 className="text-4xl md:text-7xl font-serif text-white tracking-tighter">
              The<span className="text-blue-500">.</span>Book
            </h1>
            {!isOpen && (
              <div className="absolute bottom-10 flex flex-col items-center gap-2 text-white/20 animate-pulse">
                <MousePointerClick size={20} />
                <span className="text-[8px] uppercase tracking-widest">Tap to Open</span>
              </div>
            )}
          </div>

          {/* LEFT INTERIOR PAGE */}
          <div
            className="absolute inset-0 bg-[#fcfcf9] rounded-l-sm border-r border-slate-200/50 p-4 md:p-8 lg:p-12 flex flex-col justify-between overflow-y-auto"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {/* Header with fade-in animation */}
            <motion.div
              className="space-y-6 md:space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-6xl font-serif text-slate-900 italic leading-tight">
                Track. <br /> Visualize. <br /> Succeed.
              </h2>

              {/* Introduction Text */}
              <div className="space-y-4 text-slate-700">
                <p className="text-sm md:text-base leading-relaxed">
                  Your comprehensive shift management system. Built for professionals who demand precision in time tracking and payroll calculations.
                </p>
              </div>

              {/* Feature List with stagger animation */}
              <div className="space-y-3 pt-2">
                {[
                  { title: "Smart Scheduling", desc: "Intelligent roster management with conflict detection" },
                  { title: "Pay Calculation", desc: "Automatic overtime, breaks, and bonus tracking" },
                  { title: "Real-time Analytics", desc: "Live insights into earnings and work patterns" },
                  { title: "Secure Archive", desc: "Bank-grade encryption for your data" }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: 1.0 + (index * 0.1), duration: 0.4 }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Footer with fade-in */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={isOpen ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              <div className="h-px w-full bg-slate-200" />
              <p className="text-[8px] md:text-[10px] font-mono text-blue-600 font-bold uppercase tracking-widest">
                Entry_Log // 088
              </p>
            </motion.div>

            {/* Right shadow gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/[0.05] to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-4 md:bottom-6 w-full px-6 md:px-10 flex justify-between items-center opacity-30 text-[7px] sm:text-[8px] md:text-[10px] font-mono text-white tracking-widest pointer-events-none">
        <span>EST. 2024</span>
        <span className="uppercase">Secure Session</span>
      </div>
    </div>
  );
}
