"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu } from "lucide-react";

const menuItems = [
  { name: "Home", href: "/dashboard", id: "01", color: "#3b82f6", description: "Overview & Analytics" },
  { name: "Roster", href: "/roster", id: "02", color: "#10b981", description: "Manage Work Schedule" },
  { name: "Wallet", href: "/wallet", id: "03", color: "#f59e0b", description: "Earnings & Payments" },
  { name: "History", href: "/view", id: "04", color: "#8b5cf6", description: "View Past Records" },
  { name: "Profile", href: "/profile", id: "05", color: "#ec4899", description: "Account Settings" },
];

const menuVariants = {
  initial: { clipPath: "circle(0% at 5% 5%)" },
  animate: {
    clipPath: "circle(150% at 5% 5%)",
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
  },
  exit: {
    clipPath: "circle(0% at 5% 5%)",
    transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] },
  },
};

const linkVariants = {
  initial: { y: 120, opacity: 0 },
  animate: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { delay: 0.3 + i * 0.1, duration: 0.7, ease: [0.215, 0.61, 0.355, 1] },
  }),
};

const descriptionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Determine current theme color based on hover
  const currentThemeColor = hoveredIndex !== null
    ? menuItems[hoveredIndex].color
    : "#ffffff";

  return (
    <>
      {/* Glassmorphic Toggle Button - LEFT SIDE */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-8 left-8 z-[100] w-10 h-10 rounded-full bg-black/30 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 text-white dark:text-white flex items-center justify-center shadow-4xl "
        whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)" }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={28} strokeWidth={2} />
            </motion.div>
          ) : (
            <motion.div
              key="m"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu size={28} strokeWidth={2} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            variants={menuVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-[90] flex flex-col bg-white dark:bg-zinc-950 overflow-hidden"
          >
            {/* Reactive Animated Background Blobs - Theme Aware */}
            <motion.div
              animate={{
                backgroundColor: currentThemeColor,
                scale: [1, 1.2, 1],
                x: hoveredIndex !== null ? 50 : 0
              }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] opacity-10 dark:opacity-20 blur-[120px] rounded-full"
            />
            <motion.div
              animate={{
                backgroundColor: currentThemeColor,
                scale: [1.2, 1, 1.2],
                y: hoveredIndex !== null ? -50 : 0
              }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] opacity-5 dark:opacity-10 blur-[120px] rounded-full"
            />

            {/* Grid Pattern Overlay - Theme Aware */}
            <div
              className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
              style={{
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                color: 'rgb(0, 0, 0)'
              }}
            />

            {/* Top Bar with Branding */}
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="absolute top-12 left-12 md:left-24"
            >
              <div className="flex flex-col">
                <h1 className="text-3xl md:text-4xl font-serif italic text-zinc-900 dark:text-white">
                  The.Book
                </h1>
                <span className="text-zinc-400 dark:text-white/40 text-xs uppercase tracking-[0.3em] font-bold mt-1">
                  Work Tracker
                </span>
              </div>
            </motion.div>

            <nav className="relative z-10 flex flex-col justify-center h-full px-8 md:px-24">
              <div className="flex flex-col space-y-4">
                {menuItems.map((item, i) => {
                  const isActive = pathname === item.href;
                  const isHovered = hoveredIndex === i;

                  return (
                    <motion.div
                      key={item.name}
                      custom={i}
                      variants={linkVariants}
                      initial="initial"
                      animate="animate"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="overflow-hidden py-3 group cursor-pointer"
                    >
                      <Link
                        href={item.href}
                        className="flex flex-col gap-3"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex items-center gap-6 md:gap-8">
                          {/* ID Number with Color Transition */}
                          <span
                            className="text-base md:text-2xl font-mono transition-colors duration-500"
                            style={{
                              color: (isHovered || isActive)
                                ? item.color
                                : 'rgb(161, 161, 170)' // zinc-400 for both themes
                            }}
                          >
                            {item.id}
                          </span>

                          {/* Bold Name - TOUCH FRIENDLY SIZE */}
                          <div className="flex items-center gap-6">
                            <motion.span
                              className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter transition-all duration-500"
                              style={{
                                color: (isHovered || isActive) ? item.color : 'transparent',
                                WebkitTextStroke: (isHovered || isActive)
                                  ? "0px"
                                  : "1px rgba(161, 161, 170, 0.3)" // Works for both themes
                              }}
                              whileHover={{ x: 20 }}
                            >
                              {item.name}
                            </motion.span>
                          </div>
                        </div>

                        {/* Description on Hover */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              variants={descriptionVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              className="ml-12 md:ml-20 lg:ml-32"
                            >
                              <span
                                className="text-base md:text-lg font-light transition-colors duration-500"
                                style={{ color: `${item.color}cc` }}
                              >
                                {item.description}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </nav>

            {/* Simplified Footer - Theme Aware */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute bottom-12 left-12 md:left-24 right-12 border-t pt-8"
              style={{ borderColor: `${currentThemeColor}33` }}
            >
              <div className="flex flex-col">
                <span className="text-zinc-400 dark:text-white/40 uppercase text-[10px] tracking-[0.3em] font-bold mb-2">
                  Navigation System
                </span>
                <span className="text-zinc-600 dark:text-white text-sm font-light opacity-50">
                  Select a module to initialize
                </span>
              </div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
