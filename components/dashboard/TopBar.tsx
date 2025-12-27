"use client";

import { Bell, Search, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
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

interface TopBarProps {
  userName?: string;
}

interface UserProfile {
  first_name: string;
  surname: string;
  email: string;
  avatar_url: string | null;
}

export default function TopBar({ userName }: TopBarProps) {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
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

          if (profile) {
            setUserProfile(profile);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Logout function
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (userProfile) {
      return `${userProfile.first_name[0]}${userProfile.surname[0]}`.toUpperCase();
    }
    return 'U';
  };
  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800">
      <div className="flex items-center justify-between px-8 h-20">

        {/* Left: Page Title with Friendly Font */}
        <div className="flex items-center gap-4">
          {/* <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-neutral-100" style={{ fontFamily: "'Caveat', cursive" }}>
            Home
          </h1> */}
        </div>

        {/* Right: Actions Area */}
        <div className="flex items-center gap-3">

          {/* Search Bar */}
          <div className="hidden lg:flex items-center bg-slate-100/50 dark:bg-neutral-800/50 border border-slate-200/50 dark:border-neutral-700/50 rounded-xl px-3 py-1.5 mr-2 group focus-within:bg-white dark:focus-within:bg-neutral-900 transition-all">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none focus:ring-0 text-xs font-medium ml-2 w-40 outline-none text-slate-600 dark:text-neutral-300 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center bg-slate-50 dark:bg-neutral-800/40 p-1.5 rounded-2xl border border-slate-200/50 dark:border-neutral-700/50 gap-1">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications with Tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-xl hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm transition-all text-slate-500 dark:text-neutral-400"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-neutral-900 animate-pulse"></span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none">
                  <p className="text-xs font-semibold">Coming Soon!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm transition-all p-0"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={userProfile?.avatar_url || undefined}
                      alt={userProfile ? `${userProfile.first_name} ${userProfile.surname}` : 'User'}
                    />
                    <AvatarFallback className="bg-blue-500 text-white text-sm font-semibold">
                      {loading ? '...' : getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                      {userProfile ? `${userProfile.first_name} ${userProfile.surname}` : 'User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      {userProfile?.email || 'Loading...'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200 dark:bg-neutral-800" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}