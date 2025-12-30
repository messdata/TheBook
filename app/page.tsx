"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  DollarSign,
  Zap,
  Clock,
  ChevronRight,
  MousePointerClick,
} from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import OnboardingForm from "@/components/auth/OnboardingForm";

export default function TheMidnightBook() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLoginClick = () => {
    if (!isOpen) setIsOpen(true);
    setShowSignup(false);
    setTimeout(() => setShowLogin(true), isOpen ? 0 : 600);
  };

  const handleSignupClick = () => {
    if (!isOpen) setIsOpen(true);
    setShowLogin(false);
    setSignupStep(1);
    setTimeout(() => setShowSignup(true), isOpen ? 0 : 600);
  };

  const handleBackToFeatures = () => {
    setShowLogin(false);
    setShowSignup(false);
    setSignupStep(1);
  };

  const handleSignupStepChange = (step: number) => {
    setSignupStep(step);
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050505] overflow-hidden p-4 md:p-8">

      {/* Enhanced Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-blue-500/10 rounded-full blur-[80px] md:blur-[140px] pointer-events-none" />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.08, 0.05]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-indigo-500/5 rounded-full blur-[100px] md:blur-[150px] pointer-events-none"
      />

      {/* THE BOOK STACK */}
      <div className="relative w-full max-w-[900px] aspect-[0.7/1] md:aspect-[1.4/1] perspective-[2000px]">

        {/* Features Spread - Base Layer */}
        <motion.div
          animate={{
            rotateY: (showLogin || showSignup) ? -180 : 0,
            transition: { duration: 1.2, ease: [0.645, 0.045, 0.355, 1] }
          }}
          style={{
            transformOrigin: "left center",
            backfaceVisibility: "hidden",
            position: "absolute",
            inset: 0
          }}
          className="flex flex-col md:flex-row bg-white shadow-2xl rounded-lg md:rounded-r-lg overflow-hidden"
        >
          {/* Left Page (Intro) */}
          <div className="flex-1 p-6 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between bg-[#fafafa]">
            <div className="space-y-4 md:space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: isOpen ? 1 : 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg"
              >
                <BookOpen size={18} />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={isOpen ? { opacity: 1, y: 0 } : {}}
                className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight"
              >
                Your Work, <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Documented.
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isOpen ? { opacity: 1, y: 0 } : {}}
                className="text-slate-500 max-w-xs leading-relaxed text-xs md:text-base"
              >
                A precision tool designed to turn your hours into visual data and clear earnings.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isOpen ? { opacity: 1, y: 0 } : {}}
              className="mt-4 flex flex-row gap-3"
            >
              <Button
                onClick={handleSignupClick}
                className="flex-1 md:flex-none bg-slate-900 text-white rounded-lg h-10 md:h-12 px-4 md:px-6 text-xs md:text-sm"
              >
                Create Entry
              </Button>
              <Button
                onClick={handleLoginClick}
                variant="ghost"
                className="flex-1 md:flex-none text-slate-600 text-xs md:text-sm"
              >
                Sign In
              </Button>
            </motion.div>
          </div>

          {/* Right Page (Features) */}
          <div className="flex-1 p-6 md:p-12 bg-white flex flex-col">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={isOpen ? { opacity: 1 } : {}}
              className="text-[8px] md:text-[10px] font-black tracking-[0.3em] text-slate-300 uppercase mb-6 md:mb-10"
            >
              System_Capabilities
            </motion.h3>

            <div className="space-y-4 md:space-y-8">
              {[
                { icon: <Calendar size={16} />, label: "Shift Scheduling" },
                { icon: <DollarSign size={16} />, label: "Wage Calculation" },
                { icon: <Zap size={16} />, label: "Instant Analytics" },
                { icon: <Clock size={16} />, label: "Overtime Tracking" }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isOpen ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 * idx }}
                >
                  <FeatureItem icon={item.icon} label={item.label} />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isOpen ? { opacity: 1, y: 0 } : {}}
              className="mt-auto p-3 md:p-4 bg-blue-50/50 border-l-2 border-blue-500 italic text-[10px] md:text-sm text-blue-700"
            >
              "The best way to predict your paycheck is to track it yourself."
            </motion.div>
          </div>

          {/* Center Binding Crease */}
          <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/5 via-black/10 to-transparent pointer-events-none hidden md:block" />
        </motion.div>

        {/* Login/Signup Spread - Flipped Layer */}
        <motion.div
          animate={{
            rotateY: (showLogin || showSignup) ? 0 : 180,
            transition: { duration: 1.2, ease: [0.645, 0.045, 0.355, 1] }
          }}
          style={{
            transformOrigin: "left center",
            backfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
            transform: "rotateY(180deg)"
          }}
          className="bg-white shadow-2xl rounded-lg md:rounded-r-lg overflow-y-auto md:overflow-hidden"
        >
          {showLogin && <LoginForm onBack={handleBackToFeatures} onSignupClick={handleSignupClick} />}
          {showSignup && (
            <OnboardingForm
              onBack={handleBackToFeatures}
              currentStep={signupStep}
              onStepChange={handleSignupStepChange}
            />
          )}
        </motion.div>

        {/* THE FRONT COVER */}
        <motion.div
          onClick={() => setIsOpen(!isOpen)}
          animate={{
            rotateY: isOpen ? -110 : 0,
            transition: { duration: 1.2, ease: [0.645, 0.045, 0.355, 1] }
          }}
          style={{ transformOrigin: "left center", zIndex: isOpen ? 0 : 50 }}
          className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] shadow-[10px_0_50px_rgba(0,0,0,0.5)] rounded-lg border-l-[4px] border-slate-800 flex flex-col items-center justify-center cursor-pointer group overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-20 pointer-events-none" />

          <motion.div animate={{ opacity: isOpen ? 0 : 1 }} className="text-center relative z-10 px-4">
            <h1
              style={{ fontFamily: "'Caveat', cursive" }}
              className="text-5xl md:text-8xl text-white mb-2 select-none"
            >
              The Book
            </h1>
            <div className="flex items-center justify-center gap-2 text-slate-500 tracking-[0.4em] text-[8px] md:text-[10px] uppercase">
              <div className="h-px w-6 md:w-8 bg-slate-800" />
              <span>Shift Ledger</span>
              <div className="h-px w-6 md:w-8 bg-slate-800" />
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 5, 0], opacity: isOpen ? 0 : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 flex flex-col items-center gap-2 text-slate-500"
          >
            <MousePointerClick size={18} />
            <span className="text-[8px] md:text-[10px] uppercase tracking-widest font-bold">Tap to Open</span>
          </motion.div>
        </motion.div>


        {/* BOOKMARK RIBBON */}

        {/* BOOKMARK RIBBON
 (Multiple changes for mobile view adjustments)
  <motion.div
    animate={{
      y: isOpen ? 15 : 0,
      height: isOpen ? "100px" : "80px",
      opacity: (showLogin || showSignup) ? 0 : 1
    }}
    className="absolute top-[-10px] right-6 md:right-16 w-5 md:w-8 bg-red-700 shadow-md z-10 rounded-b-sm"

  />

        /> */}
        (Multiple changes for mobile view adjustments)
      </div >

      {/* FOOTER STATS */}
      < motion.div
        initial={{ opacity: 0 }
        }
        animate={{ opacity: 1 }}
        className="fixed bottom-4 left-0 w-full px-6 flex justify-between items-center text-[8px] md:text-[10px] font-mono text-slate-700 tracking-[0.2em] pointer-events-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-green-500" />
          SECURE
        </div>
        <div className="flex gap-4">
          <span className="hidden sm:inline">CLOUDSYNC ENABLED</span>
          <span>v2.0.1</span>
        </div>
      </motion.div >
    </div >
  );
}

function FeatureItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <motion.div
      whileHover={{ x: 5 }}
      className="flex items-center gap-3 md:gap-4 group cursor-default"
    >
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-blue-500 transition-all">
        {icon}
      </div>
      <span className="text-xs md:text-base text-slate-800 font-medium flex-1">
        {label}
      </span>
      <ChevronRight size={12} className="text-slate-300" />
    </motion.div>
  );

}


