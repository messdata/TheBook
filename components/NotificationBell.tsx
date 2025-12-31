"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Inbox, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    fetchNotifications();
  };

  const clearAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notifications").delete().eq("user_id", user.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <TooltipProvider>
      <div className="relative inline-block" ref={dropdownRef}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-all active:scale-95 group"
            >
              <Bell size={22} className="text-slate-600 dark:text-neutral-400 group-hover:text-blue-600 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600 text-[10px] font-bold text-white items-center justify-center">
                    {unreadCount}
                  </span>
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent sideOffset={10}>
            <p className="text-xs font-medium">Notifications</p>
          </TooltipContent>
        </Tooltip>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 mt-3 w-[360px] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200/60 dark:border-neutral-800/60 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white tracking-tight">Activity</h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-[420px] overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-neutral-500">
                    <Inbox size={40} strokeWidth={1.5} className="mb-2 opacity-20" />
                    <p className="text-sm">All caught up!</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      layout
                      onClick={() => !notif.read && markAsRead(notif.id)}
                      className={`group relative p-5 border-b border-slate-50 dark:border-neutral-800 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-neutral-800/50 transition-all ${!notif.read ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`mt-1 h-2 w-2 rounded-full shrink-0 transition-transform duration-300 ${!notif.read ? "bg-blue-600 scale-100" : "bg-transparent scale-0"
                            }`}
                        />

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4
                              className={`text-sm leading-none ${!notif.read
                                  ? "font-bold text-slate-900 dark:text-white"
                                  : "font-medium text-slate-700 dark:text-neutral-300"
                                }`}
                            >
                              {notif.title}
                            </h4>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-neutral-500 whitespace-nowrap">
                              {new Date(notif.created_at).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 bg-slate-50/50 dark:bg-neutral-800/50 border-t border-slate-100 dark:border-neutral-800 flex justify-between items-center">
                  <button className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white uppercase tracking-widest transition-colors">
                    View All Activity
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 uppercase tracking-widest transition-colors"
                  >
                    <Trash2 size={12} />
                    Clear All
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
