"use client";

import { useState } from "react";
import LoginFormContent from "@/components/auth/LoginFormContent";
import SignUpFormContent from "@/components/auth/SignUpFormContent";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#070707] py-8">
      {/* Enhanced Depth Background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{
          backgroundImage: "url('/bg.jpg')",
          filter: "blur(20px) brightness(0.25)",
        }}
      />

      {/* Animated Light Source */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] animate-pulse pointer-events-none" />

      <Card
        className="w-[92%] max-w-[440px] border border-white/[0.08] bg-white/[0.01] backdrop-blur-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{ borderRadius: '3rem' }}
      >
        <CardBody className="p-8 pt-12 space-y-8">
          {/* Elegant Logo */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-serif text-white tracking-tight italic opacity-90">The.Book</h1>
            <motion.p
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-white/20 uppercase tracking-[0.5em] font-bold"
            >
              {activeTab === 'login' ? 'Authentication' : 'Registration'}
            </motion.p>
          </div>

          <div className="relative min-h-[380px]">
            <AnimatePresence mode="wait">
              {activeTab === 'login' ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <LoginFormContent
                    onSuccess={() => { }}
                    onLoading={setIsLoading}
                  />

                  {/* Glass Primary Button */}
                  <button
                    type="submit"
                    form="login-form"
                    disabled={isLoading}
                    className="w-full bg-white text-black py-4 text-sm font-bold active:scale-[0.97] transition-all shadow-[0_15px_35px_rgba(255,255,255,0.1)] disabled:opacity-50"
                    style={{ borderRadius: '2rem' }}
                  >
                    {isLoading ? "Validating..." : "Sign In"}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                >
                  <SignUpFormContent onSuccess={() => { }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardBody>

        {/* Ultra-Soft Segmented Control */}
        <CardFooter className="p-2 pb-10 flex justify-center">
          <div className="flex bg-white/[0.02] backdrop-blur-3xl border border-white/[0.05] p-1.5 rounded-[3rem] w-[80%] relative">
            {/* Sliding Background Indicator - FIXED */}
            <motion.div
              className="absolute top-1.5 bottom-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] shadow-inner shadow-white/5"
              initial={false}
              animate={{
                left: activeTab === 'login' ? '0.375rem' : '50%',
                right: activeTab === 'login' ? '50%' : '0.375rem',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />

            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 text-[10px] font-bold tracking-widest transition-colors relative z-10 ${activeTab === 'login' ? 'text-white' : 'text-white/20'}`}
            >
              LOGIN
            </button>

            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2.5 text-[10px] font-bold tracking-widest transition-colors relative z-10 ${activeTab === 'signup' ? 'text-white' : 'text-white/20'}`}
            >
              SIGN UP
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
