"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  History,
  CalendarDays,
  Wallet,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Custom Book Icon Component
const BookIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 6h4" />
    <path d="M2 10h4" />
    <path d="M2 14h4" />
    <path d="M2 18h4" />
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <path d="M16 2v20" />
  </svg>
);

export default function Sidebar() {
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();

  // Load from localStorage only after mounting (client-side only)
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebarExpanded');
    if (saved !== null) {
      setIsExpanded(JSON.parse(saved));
    }
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebarExpanded', JSON.stringify(isExpanded));
    }
  }, [isExpanded, mounted]);

  const menuItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Roster", href: "/roster", icon: CalendarDays },
    { name: "Wallet", href: "/wallet", icon: Wallet },
    { name: "View", href: "/view", icon: History },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isExpanded ? 256 : 80
      }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }}
      className="sticky top-0 h-screen bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border-r border-slate-200 dark:border-neutral-800 flex flex-col z-50"
    >
      {/* Brand Header */}
      <motion.div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center h-20 px-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3 w-full">
          {/* Book Icon */}
          <motion.div
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 flex items-center justify-center shadow-sm"
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            <BookIcon className="w-5 h-5 text-white" />
          </motion.div>

          {/* Brand Name with Animation */}
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  The Book
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-500">
                  Work Tracker
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-neutral-800 to-transparent mx-4" />

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={`relative group flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50"
                  }`}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-8 bg-blue-600 dark:bg-blue-400 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? "" : ""
                  }`} />

                {/* Label with Animation */}
                <AnimatePresence mode="wait">
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-semibold"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed mode */}
                {!isExpanded && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.name}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-4 border-transparent border-r-slate-900 dark:border-r-white" />
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-neutral-800 to-transparent mx-4" />

      {/* Bottom Toggle */}
      <motion.div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer group hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between w-full"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                    Collapse
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-600">
                    Hide menu
                  </span>
                </div>
                <motion.div
                  whileHover={{ x: -3 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="mx-auto"
              >
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.aside>
  );
}