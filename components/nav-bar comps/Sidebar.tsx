"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu, LogOut, Bell, ChevronLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import NotificationBell from "@/components/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";

const menuItems = [
  { name: "Home", href: "/dashboard", id: "01", color: "#3b82f6" },
  { name: "Roster", href: "/roster", id: "02", color: "#10b981" },
  { name: "Wallet", href: "/wallet", id: "03", color: "#f59e0b" },
  { name: "History", href: "/view", id: "04", color: "#8b5cf6" },
  { name: "Profile", href: "/profile", id: "05", color: "#ec4899" },
];

interface UserProfile {
  first_name: string;
  surname: string;
  email: string;
  avatar_url: string | null;
}

export default function UnifiedSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "notifications">("menu");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
    setView("menu");
  }, [pathname]);

  // Scroll-hide behavior for profile icon
  useEffect(() => {
    let lastScrollY = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('first_name, surname, email, avatar_url')
            .eq('user_id', user.id)
            .single();
          if (profile) setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getInitials = () => {
    if (userProfile) return `${userProfile.first_name[0]}${userProfile.surname[0]}`.toUpperCase();
    return 'U';
  };

  return (
    <>
      {/* PROFILE TRIGGER - Right on Mobile, Left on Desktop */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{
          y: isVisible ? 0 : -80,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-4 right-4 md:left-4 md:right-auto z-[100] outline-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Avatar className="h-10 w-10 shadow-lg ring-2 ring-white dark:ring-zinc-900 border border-zinc-200/50 dark:border-white/10">
          <AvatarImage src={userProfile?.avatar_url || undefined} />
          <AvatarFallback className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-white text-xs font-bold">
            {loading ? '...' : getInitials()}
          </AvatarFallback>
        </Avatar>
        {/* X indicator when open */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border-2 border-white dark:border-zinc-950"
            >
              <X size={10} strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* SIDEBAR OVERLAY + PANEL */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[89] bg-black/40 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 240 }}
              className="fixed top-0 left-0 h-[100dvh] w-full md:w-80 z-[90] bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-white/10 shadow-2xl flex flex-col"
            >

              {/* MINIMAL HEADER: Profile + Controls */}
              <div className="p-6 pt-20 border-b border-zinc-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                      {userProfile?.first_name || 'User'}
                    </h2>
                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
                      {view === "notifications" ? "Alerts" : "Navigation"}
                    </p>
                  </div>

                  {/* Integrated Minimal Controls */}
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 p-1 rounded-full">
                    <ThemeToggle />
                    <button
                      onClick={() => setView(view === "menu" ? "notifications" : "menu")}
                      className={`p-2 rounded-full transition-colors ${view === "notifications"
                          ? "bg-white dark:bg-white/10 text-blue-500"
                          : "text-zinc-500 hover:bg-white dark:hover:bg-white/10"
                        }`}
                    >
                      <Bell size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* DYNAMIC CONTENT AREA */}
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <AnimatePresence mode="wait">
                  {view === "menu" ? (
                    <motion.nav
                      key="menu"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-1"
                    >
                      {menuItems.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${pathname === item.href
                              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950"
                              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                            }`}
                        >
                          <span className="text-[10px] font-mono opacity-50">{item.id}</span>
                          <span className="font-bold text-xl tracking-tighter uppercase">{item.name}</span>
                        </Link>
                      ))}
                    </motion.nav>
                  ) : (
                    <motion.div
                      key="notifications"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="h-full"
                    >
                      <button
                        onClick={() => setView("menu")}
                        className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors"
                      >
                        <ChevronLeft size={14} /> Back to Menu
                      </button>

                      {/* NOTIFICATION VIEWPORT */}
                      <div className="rounded-2xl bg-zinc-50 dark:bg-white/5 p-4 min-h-[300px]">
                        <NotificationBell />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* FOOTER */}
              <div className="p-6 border-t border-zinc-100 dark:border-white/5">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-bold text-sm"
                >
                  <LogOut size={16} />
                  SIGN OUT
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
