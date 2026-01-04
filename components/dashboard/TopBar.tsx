"use client";

import { Search, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import NotificationBell from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TopBar() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();
        setUserProfile(data);
      }
    };
    fetchProfile();
  }, []);

  return (
    <header className="fixed top-0 right-0 z-50 w-auto">
      <div className="flex items-center p-6 gap-4 md:gap-6">
        {/* Search - Muted Adaptive Color */}
        <button className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
          <Search className="w-5 h-5" />
        </button>

        {/* Theme Toggle - Adaptive */}
        <div className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
          <ThemeToggle />
        </div>

        {/* Notifications - Adaptive */}
        <div className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
          <NotificationBell />
        </div>

        {/* Profile Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-800 transition-transform active:scale-95">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold">
                {userProfile ? `${userProfile.first_name[0]}${userProfile.surname[0]}` : 'U'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-zinc-200 dark:border-zinc-800">
            <DropdownMenuItem onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-red-500">
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
