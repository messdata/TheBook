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
  Sparkles
} from "lucide-react";

export default function TheMidnightBook() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050505] overflow-hidden p-4">
      
      {/* Enhanced Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.08, 0.05]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none"
      />

      {/* THE BOOK STACK */}
      <div className="relative w-full max-w-[900px] aspect-[1.4/1] perspective-[2000px]">
        
        {/* THE PAGES (Underneath the cover) */}
        <div className="absolute inset-0 flex bg-white shadow-2xl rounded-r-lg overflow-hidden">
          {/* Left Page (Static under cover) */}
          <div className="flex-1 p-8 md:p-12 border-r border-slate-100 flex flex-col justify-between bg-[#fafafa]">
             <div className="space-y-6">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: isOpen ? 1 : 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg"
                >
                    <BookOpen size={20} />
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isOpen ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 }}
                  className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight"
                >
                    Your Work, <br />
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Documented.
                    </span>
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isOpen ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 }}
                  className="text-slate-500 max-w-xs leading-relaxed text-sm md:text-base"
                >
                    A precision tool designed to turn your hours into visual data and clear earnings.
                </motion.p>
             </div>

             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={isOpen ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: 0.6 }}
               className="flex flex-col sm:flex-row gap-3"
             >
                <Button 
                  onClick={() => router.push('/signup')} 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg px-6 shadow-lg hover:shadow-xl transition-all group"
                >
                  Create Entry
                  <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  onClick={() => router.push('/login')} 
                  variant="ghost" 
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                >
                  Sign In
                </Button>
             </motion.div>
          </div>

          {/* Right Page (The "Index") */}
          <div className="flex-1 p-8 md:p-12 bg-white flex flex-col">
            <motion.h3 
              initial={{ opacity: 0 }}
              animate={isOpen ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
              className="text-[10px] font-black tracking-[0.3em] text-slate-300 uppercase mb-10"
            >
              System_Capabilities
            </motion.h3>
            
            <div className="space-y-6 md:space-y-8">
                {[
                  { icon: <Calendar size={18} />, label: "Shift Scheduling", delay: 0.6 },
                  { icon: <DollarSign size={18} />, label: "Wage Calculation", delay: 0.7 },
                  { icon: <Zap size={18} />, label: "Instant Analytics", delay: 0.8 },
                  { icon: <Clock size={18} />, label: "Overtime Tracking", delay: 0.9 }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isOpen ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: item.delay }}
                  >
                    <FeatureItem icon={item.icon} label={item.label} />
                  </motion.div>
                ))}
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isOpen ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1 }}
                className="mt-auto p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-l-2 border-blue-500 rounded-r-lg italic text-sm text-blue-700 backdrop-blur-sm"
            >
                <Sparkles className="w-4 h-4 inline mr-2 text-blue-500" />
                "The best way to predict your paycheck is to track it yourself."
            </motion.div>
          </div>

          {/* Enhanced Center Binding Crease */}
          <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/5 via-black/10 to-transparent pointer-events-none" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px -ml-px bg-black/20 pointer-events-none" />
        </div>

        {/* THE FRONT COVER (The Animated Hinge) */}
        <motion.div
          onClick={() => setIsOpen(!isOpen)}
          initial={false}
          animate={{ 
            rotateY: isOpen ? -110 : 0,
            transition: { duration: 1.2, ease: [0.645, 0.045, 0.355, 1] }
          }}
          style={{ transformOrigin: "left center", zIndex: isOpen ? 0 : 50 }}
          className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1a1a] shadow-[10px_0_50px_rgba(0,0,0,0.5)] rounded-r-lg border-l-[4px] border-slate-800 flex flex-col items-center justify-center cursor-pointer group overflow-hidden"
        >
          {/* Subtle Texture Overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30 pointer-events-none" />

          {/* Gold Embossed Title */}
          <motion.div 
            animate={{ opacity: isOpen ? 0 : 1 }}
            className="text-center relative z-10"
          >
            <motion.h1 
                style={{ fontFamily: "'Caveat', cursive" }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-6xl md:text-8xl bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-2 select-none drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
                The Book
            </motion.h1>
            <div className="flex items-center justify-center gap-2 text-slate-500 tracking-[0.4em] text-[10px] uppercase">
                <motion.div 
                  animate={{ width: [32, 40, 32] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"
                />
                <span>Shift Ledger</span>
                <motion.div 
                  animate={{ width: [32, 40, 32] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                  className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"
                />
            </div>
          </motion.div>

          {/* Enhanced Interaction Hint */}
          <motion.div 
             animate={{ 
               y: [0, 8, 0],
               opacity: isOpen ? 0 : [0.5, 1, 0.5]
             }}
             transition={{ duration: 2, repeat: Infinity }}
             className="absolute bottom-8 md:bottom-12 flex flex-col items-center gap-2 text-slate-500 group-hover:text-slate-300 transition-colors"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MousePointerClick size={20} />
            </motion.div>
            <span className="text-[10px] uppercase tracking-widest font-bold">Tap to Open</span>
          </motion.div>

          {/* Enhanced Inner Cover Texture */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/5 pointer-events-none" />
          
          {/* Subtle Edge Highlight */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none" />
        </motion.div>

        {/* Enhanced BOOKMARK RIBBON */}
        <motion.div 
            animate={{ 
                y: isOpen ? 20 : 0,
                height: isOpen ? "140px" : "120px"
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute top-[-10px] right-16 md:right-20 w-6 md:w-8 bg-gradient-to-b from-red-600 to-red-800 shadow-[0_10px_30px_rgba(220,38,38,0.3)] z-10 rounded-b-sm overflow-hidden"
        >
            <div className="absolute bottom-0 w-0 h-0 border-l-[12px] md:border-l-[16px] border-l-transparent border-r-[12px] md:border-r-[16px] border-r-transparent border-t-[20px] border-t-red-900/50 left-1/2 -translate-x-1/2" />
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
        </motion.div>

      </div>

      {/* Enhanced FOOTER STATS */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-4 md:bottom-8 left-0 w-full px-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-2 text-[9px] md:text-[10px] font-mono text-slate-700 tracking-[0.2em] pointer-events-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          SECURE • ENCRYPTED
        </div>
        <div className="flex gap-4 md:gap-8">
            <span>CLOUDSYNC ENABLED</span>
            <span className="hidden md:inline">v2.0.1</span>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <motion.div 
        whileHover={{ x: 5 }}
        className="flex items-center gap-3 md:gap-4 group cursor-default"
    >
      <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-blue-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
        {icon}
      </div>
      <span className="text-sm md:text-base text-slate-800 font-medium group-hover:translate-x-1 transition-transform flex-1">
        {label}
      </span>
      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
    </motion.div>
  );
}
