"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    CalendarOff,
    Clock,
    Plus,
    History,
    Settings,
    Calendar,
    CalendarDays,
    Building2,
    LayoutGrid,
    ChevronDown,
    Info,
} from "lucide-react";
import {
    Tooltip as RadixTooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/Tooltip";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRoster } from "@/app/context/RosterContext";
import { supabase } from "@/lib/supabase";
import { TooltipPortal, TooltipArrow } from "@radix-ui/react-tooltip";

// Import Share Tech Mono font
import "@fontsource/share-tech-mono";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function DashboardClient() {
    const router = useRouter();
    const [timeRange, setTimeRange] = useState<"week" | "2weeks" | "month" | "3months">("week");

    // User data state
    const [userName, setUserName] = useState("User");
    const [userEmail, setUserEmail] = useState("");
    const [userImage, setUserImage] = useState<string | null>(null);
    const [initials, setInitials] = useState("U");
    const [companyName, setCompanyName] = useState("Company Name");
    const [hourlyRate, setHourlyRate] = useState(13.50); // Default hourly rate
    const [jobType, setJobType] = useState("Part-time"); // Default job type
    const [currency, setCurrency] = useState("EUR"); // Default currency
    const [loading, setLoading] = useState(true);

    // Metrics state
    const [highestIncomeWeek, setHighestIncomeWeek] = useState({ week: "N/A", amount: 0 });
    const [highestSubscription, setHighestSubscription] = useState({ name: "N/A", amount: 0 });
    const [highestSpentWeek, setHighestSpentWeek] = useState({ week: "N/A", amount: 0 });
    const [mostSpentCategory, setMostSpentCategory] = useState({ category: "N/A", amount: 0 });

    // Currency symbol helper
    const getCurrencySymbol = (curr: string) => {
        const symbols: Record<string, string> = {
            EUR: '€', USD: '$', GBP: '£', JPY: '¥', CAD: '$', AUD: '$'
        };
        return symbols[curr] || '€';
    };

    // Fetch metrics data
    const fetchMetrics = async (userId: string) => {
        try {
            // Fetch subscriptions for highest subscription
            const { data: subs } = await supabase
                .from('subscriptions')
                .select('name, amount')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('amount', { ascending: false })
                .limit(1)
                .single();

            if (subs) {
                setHighestSubscription({ name: subs.name, amount: subs.amount });
            }

            // Fetch spending for most spent category (current month)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data: spending } = await supabase
                .from('spending')
                .select('category, amount, date')  // ← Add 'date' here
                .eq('user_id', userId)
                .gte('date', startOfMonth.toISOString().split('T')[0]);

            if (spending && spending.length > 0) {
                // Group by category and sum amounts
                const categoryTotals: Record<string, number> = {};
                spending.forEach((item) => {
                    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
                });

                // Find highest
                const highest = Object.entries(categoryTotals).reduce((max, [cat, amt]) =>
                    amt > max.amount ? { category: cat, amount: amt } : max,
                    { category: "N/A", amount: 0 }
                );
                setMostSpentCategory(highest);

                // Calculate highest spent week
                const weekTotals: Record<string, number> = {};
                spending.forEach((item) => {
                    const date = new Date(item.date);
                    const startOfWeek = new Date(date);
                    startOfWeek.setDate(date.getDate() - date.getDay());
                    const weekKey = startOfWeek.toISOString().split('T')[0];
                    weekTotals[weekKey] = (weekTotals[weekKey] || 0) + item.amount;
                });

                const highestWeek = Object.entries(weekTotals).reduce((max, [week, amt]) =>
                    amt > max.amount ? { week, amount: amt } : max,
                    { week: "N/A", amount: 0 }
                );
                setHighestSpentWeek(highestWeek);
            }

        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    };

    // Calculate highest income week from roster
    const calculateHighestIncomeWeek = () => {
        const weeklyIncomes: Record<string, number> = {};

        roster.forEach((dayData) => {
            if (dayData.type === "working") {
                const date = dayData.date;
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - date.getDay());
                const weekKey = startOfWeek.toISOString().split('T')[0];

                const [startHour, startMin] = dayData.shiftStart.split(':').map(Number);
                const [endHour, endMin] = dayData.shiftEnd.split(':').map(Number);
                const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin) - 30;
                const hours = Math.max(0, durationMinutes / 60);

                const isSunday = date.getDay() === 0;
                const rate = isSunday ? hourlyRate * 2 : hourlyRate;
                const income = hours * rate;

                weeklyIncomes[weekKey] = (weeklyIncomes[weekKey] || 0) + income;
            }
        });

        const highest = Object.entries(weeklyIncomes).reduce((max, [week, amt]) =>
            amt > max.amount ? { week, amount: amt } : max,
            { week: "N/A", amount: 0 }
        );
        setHighestIncomeWeek(highest);
    };

    const isDark = typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Use Roster Context
    const { getNextShift, getNextDayOff, getTotalHoursThisWeek, syncRoster, roster } = useRoster();

    // Calculate current week number
    const getCurrentWeekNumber = () => {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const days = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    };

    // Calculate weekly pay based on roster data
    const calculateWeeklyPay = () => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        let totalPay = 0;

        roster.forEach((dayData) => {
            if (dayData.type === "working" && dayData.date >= startOfWeek && dayData.date <= endOfWeek) {
                // Calculate hours for this shift
                const [startHour, startMin] = dayData.shiftStart.split(':').map(Number);
                const [endHour, endMin] = dayData.shiftEnd.split(':').map(Number);
                const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin) - 30; // 30 min break
                const hours = Math.max(0, durationMinutes / 60);

                // Check if Sunday for premium rate
                const isSunday = dayData.date.getDay() === 0;
                const rate = isSunday ? hourlyRate * 2 : hourlyRate;

                totalPay += hours * rate;
            }
        });

        return totalPay;
    };

    // Generate live chart data based on timeRange
    const generateChartData = () => {
        const today = new Date();

        if (timeRange === "week") {
            // Current week - Mon to Sun
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const hours: number[] = [];
            const income: number[] = [];

            for (let i = 0; i < 7; i++) {
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + i);

                let dayHours = 0;
                let dayIncome = 0;

                roster.forEach((dayData) => {
                    if (dayData.type === "working" &&
                        dayData.date.toDateString() === dayDate.toDateString()) {
                        const [startHour, startMin] = dayData.shiftStart.split(':').map(Number);
                        const [endHour, endMin] = dayData.shiftEnd.split(':').map(Number);
                        const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin) - 30;
                        dayHours = Math.max(0, durationMinutes / 60);

                        const isSunday = dayData.date.getDay() === 0;
                        const rate = isSunday ? hourlyRate * 2 : hourlyRate;
                        dayIncome = dayHours * rate;
                    }
                });

                hours.push(dayHours);
                income.push(dayIncome);
            }

            return { labels, hours, income };
        }

        // For other ranges, return empty data (can be implemented later)
        return {
            labels: timeRange === "2weeks" ? ["W1", "W2"] : timeRange === "month" ? ["Wk1", "Wk2", "Wk3", "Wk4"] : ["M1", "M2", "M3"],
            hours: [],
            income: []
        };
    };

    const currentWeekNumber = getCurrentWeekNumber();
    const weeklyPay = calculateWeeklyPay();
    const currentData = generateChartData();

    // Fetch user data from Supabase
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Check if user is authenticated
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    router.push("/login");
                    return;
                }

                // Fetch profile and sync roster in parallel
                const [profileResult] = await Promise.all([
                    supabase
                        .from('user_profiles')
                        .select('first_name, surname, email, avatar_url, company_name, hourly_rate, job_type, currency')
                        .eq('user_id', session.user.id)
                        .single(),
                    syncRoster(session.user.id)
                ]);

                const { data: profile, error } = profileResult;

                if (error) {
                    console.error('Error fetching profile:', error);
                    // Only set if not already set
                    if (!userEmail) setUserEmail(session.user.email || "");
                    if (!userName) {
                        const name = session.user.user_metadata?.full_name ||
                            session.user.email?.split('@')[0] || "User";
                        setUserName(name);
                    }
                } else if (profile) {
                    // Set profile data
                    const fullName = `${profile.first_name} ${profile.surname}`.trim();
                    setUserName(fullName || "User");
                    setUserEmail(profile.email);
                    setUserImage(profile.avatar_url);
                    setCompanyName(profile.company_name || "Company Name");
                    setHourlyRate(profile.hourly_rate || 13.50); // Set hourly rate from profile
                    setJobType(profile.job_type || "Part-time"); // Set job type from profile
                    setCurrency(profile.currency || "EUR"); // Set currency from profile

                    const userInitials = fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U";
                    setInitials(userInitials);
                }

                // Fetch metrics data
                await fetchMetrics(session.user.id);
            } catch (err) {
                console.error('Error in fetchUserData:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [router, syncRoster]);

    // Calculate highest income week when roster or hourlyRate changes
    useEffect(() => {
        if (roster.size > 0 && hourlyRate > 0) {
            calculateHighestIncomeWeek();
        }
    }, [roster, hourlyRate]);



    // Get roster data
    const nextShift = getNextShift();
    const nextDayOff = getNextDayOff();
    const totalHours = getTotalHoursThisWeek();

    // Loading state
    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-black dark:via-neutral-950 dark:to-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-600 dark:text-neutral-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Chart configuration
    const chartData = {
        labels: currentData.labels,
        datasets: [
            {
                label: "Hours Worked",
                data: currentData.hours,
                borderColor: isDark ? "hsl(220, 15%, 70%)" : "hsl(220, 70%, 55%)",
                backgroundColor: isDark ? "hsla(220, 15%, 70%, 0.1)" : "hsla(220, 70%, 55%, 0.2)",
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: isDark ? "hsl(220, 15%, 70%)" : "hsl(220, 70%, 55%)",
                pointBorderColor: isDark ? "#1a1a1a" : "#fff",
                pointBorderWidth: 2,
                yAxisID: 'y',
            },
            {
                label: `Income (${getCurrencySymbol(currency)})`,
                data: currentData.income,
                borderColor: isDark ? "hsl(160, 15%, 65%)" : "hsl(160, 60%, 45%)",
                backgroundColor: isDark ? "hsla(160, 15%, 65%, 0.1)" : "hsla(160, 60%, 45%, 0.2)",
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: isDark ? "hsl(160, 15%, 65%)" : "hsl(160, 60%, 45%)",
                pointBorderColor: isDark ? "#1a1a1a" : "#fff",
                pointBorderWidth: 2,
                yAxisID: 'y1',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                labels: {
                    color: isDark ? "#a3a3a3" : "#737373",
                    usePointStyle: true,
                    padding: 15,
                },
            },
            tooltip: {
                backgroundColor: isDark ? "rgba(26, 26, 26, 0.98)" : "rgba(255, 255, 255, 0.95)",
                titleColor: isDark ? "#f5f5f5" : "#1a1a1a",
                bodyColor: isDark ? "#d4d4d4" : "#525252",
                borderColor: isDark ? "#404040" : "#e5e5e5",
                borderWidth: 1,
                padding: 12,
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                border: {
                    display: false,
                },
                ticks: {
                    color: isDark ? "#a3a3a3" : "#737373",
                    font: {
                        size: 12,
                    },
                },
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                grid: {
                    color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                    drawBorder: false,
                },
                border: {
                    display: false,
                },
                ticks: {
                    color: isDark ? "#a3a3a3" : "#737373",
                    font: {
                        size: 12,
                    },
                    callback: function (value: any) {
                        return value + "h";
                    },
                },
                beginAtZero: true,
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                grid: {
                    drawOnChartArea: false,
                },
                border: {
                    display: false,
                },
                ticks: {
                    color: isDark ? "#a3a3a3" : "#737373",
                    font: {
                        size: 12,
                    },
                    callback: function (value: any) {
                        return getCurrencySymbol(currency) + value;
                    },
                },
                beginAtZero: true,
            },
        },
    };

    // Full month calendar component - FIXED OVERFLOW
    const FullMonthCalendar = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentDay = today.getDate();

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const monthName = today.toLocaleString('default', { month: 'short' });

        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-6 h-6" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === currentDay;
            days.push(
                <div
                    key={day}
                    className={`w-6 h-6 flex items-center justify-center text-[10px] font-medium rounded-md
                    ${isToday
                            ? 'bg-amber-500 text-white font-bold shadow-md'
                            : 'text-slate-700 dark:text-neutral-400'
                        }`}
                >
                    {day}
                </div>
            );
        }

        return (
            <div className="p-2 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-900/30">
                {/* Month/Year header */}
                <div className="text-center mb-1.5">
                    <p className="text-[10px] font-bold text-amber-900 dark:text-amber-400">
                        {monthName} {currentYear}
                    </p>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="w-6 h-5 flex items-center justify-center text-[9px] font-semibold text-slate-600 dark:text-neutral-500">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-0.5">
                    {days}
                </div>
            </div>
        );
    };

    return (
        <TooltipProvider>
            <div className="h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
                <div className="h-full w-full bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-black dark:via-neutral-950 dark:to-zinc-950 overflow-y-auto">
                    {/* Bento Grid Container */}
                    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6">

                        {/* Page Title */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mb-6"
                        >
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2" style={{ fontFamily: "'Caveat', cursive" }}>Dashboard</h1>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

                            {/* Row 1: Current Week, Schedule, Quick Actions */}
                            {/* Current Week Summary */}
                            <Card className="bento-card bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-slate-200 dark:border-neutral-800">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base md:text-lg text-slate-700 dark:text-neutral-200">
                                            Current Week
                                        </CardTitle>
                                        <RadixTooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help transition-colors" />
                                            </TooltipTrigger>
                                            {/* The TooltipPortal is the key to stopping the layout shift */}
                                            <TooltipPortal>
                                                <TooltipContent
                                                    side="bottom"
                                                    align="end"
                                                    sideOffset={10}
                                                    className="z-[100] w-64 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95"
                                                >
                                                    <p className="text-xs leading-relaxed text-slate-600 dark:text-neutral-300">
                                                        Shows your working hours and earnings for the current week
                                                    </p>
                                                    {/* Adding a TooltipArrow helps anchor it visually */}
                                                    <TooltipArrow className="fill-white dark:fill-neutral-900" />
                                                </TooltipContent>
                                            </TooltipPortal>
                                        </RadixTooltip>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Week Number</p>
                                        <p className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-neutral-100">
                                            Week {currentWeekNumber}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-neutral-800">
                                        <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Hours Worked</p>
                                        <p className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-neutral-100">
                                            {totalHours > 0 ? `${totalHours.toFixed(1)}hr` : '0h'}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-neutral-800">
                                        <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Pay Generated</p>
                                        <p className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                            {getCurrencySymbol(currency)}{weeklyPay.toFixed(2)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Schedule - Modern Redesign */}
                            <Card className="bento-card bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden group">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base md:text-lg text-slate-700 dark:text-neutral-200">
                                            Schedule
                                        </CardTitle>
                                        <RadixTooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help transition-colors" />
                                            </TooltipTrigger>
                                            {/* The TooltipPortal is the key to stopping the layout shift */}
                                            <TooltipPortal>
                                                <TooltipContent
                                                    side="bottom"
                                                    align="end"
                                                    sideOffset={10}
                                                    className="z-[100] w-64 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95"
                                                >
                                                    <p className="text-xs leading-relaxed text-slate-600 dark:text-neutral-300">
                                                        Your upcoming shift and next day off
                                                    </p>
                                                    {/* Adding a TooltipArrow helps anchor it visually */}
                                                    <TooltipArrow className="fill-white dark:fill-neutral-900" />
                                                </TooltipContent>
                                            </TooltipPortal>
                                        </RadixTooltip>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex gap-6 items-center px-6 pb-6 h-[calc(100%-4rem)]">
                                    {/* Left: Calendar with a subtle container - HIDDEN ON MOBILE */}
                                    <div className="hidden md:block flex-shrink-0 p-2 rounded-2xl bg-slate-50/50 dark:bg-neutral-950/30 border border-slate-100 dark:border-neutral-800/50 shadow-inner">
                                        <FullMonthCalendar />
                                    </div>

                                    {/* Right: Info Section - FULL WIDTH ON MOBILE */}
                                    <div className="flex-1 space-y-4 min-w-0 md:border-l border-slate-100 dark:border-neutral-800/50 md:pl-6 h-full flex flex-col justify-center items-center">

                                        {/* Next Shift Section */}
                                        <div className="group/item flex flex-col items-center w-full">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-500 mb-1 text-center">
                                                Next Shift
                                            </p>
                                            <p className="text-xl md:text-2xl font-black tracking-tighter text-amber-500 dark:text-amber-500 truncate text-center transition-transform group-hover/item:scale-105">
                                                {nextShift ? nextShift.day : 'None'}
                                            </p>
                                            {nextShift && nextShift.date && (
                                                <p className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 mt-1 text-center">
                                                    {new Date(nextShift.date).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            )}
                                        </div>

                                        {/* Next Off Section */}
                                        <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/50 flex flex-col items-center w-full">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-neutral-500 mb-1 text-center">
                                                Next Off
                                            </p>
                                            <p className="text-lg font-black tracking-tighter text-amber-600 dark:text-amber-500 truncate text-center">
                                                {nextDayOff ? nextDayOff.day : 'None'}
                                            </p>
                                            {nextDayOff && nextDayOff.date && (
                                                <p className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 mt-0.5 text-center">
                                                    {new Date(nextDayOff.date).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            )}

                                            {nextDayOff && nextDayOff.daysFromNow > 0 && (
                                                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-tight">
                                                        {nextDayOff.daysFromNow} Days to go
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Financial Metrics */}
                            <Card className="bento-card bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-900 dark:to-neutral-950 backdrop-blur-sm border-slate-300 dark:border-neutral-700 shadow-md">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base md:text-lg font-bold text-slate-800 dark:text-neutral-100">
                                        Financial Insights
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="grid grid-cols-2 gap-4 p-4">
                                    {/* Highest Income Week */}
                                    <div className="group relative flex flex-col p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-normal uppercase tracking-widest text-emerald-100" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                                Highest Income Week
                                            </p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-sm font-normal text-white" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                                    {highestIncomeWeek.week !== "N/A"
                                                        ? `Week ${Math.ceil((new Date(highestIncomeWeek.week).getTime() - new Date(new Date(highestIncomeWeek.week).getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`
                                                        : "No Data"
                                                    }
                                                </p>
                                            </div>
                                            <p className="text-2xl font-normal text-white" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                                {getCurrencySymbol(currency)}{highestIncomeWeek.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Highest Spent Week */}
                                    <div className="group relative flex flex-col p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 dark:from-rose-600 dark:to-pink-700 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-normal uppercase tracking-widest text-rose-100" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                                Highest Spent Week
                                            </p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-sm font-normal text-white" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                                    {highestSpentWeek.week !== "N/A"
                                                        ? `Week ${Math.ceil((new Date(highestSpentWeek.week).getTime() - new Date(new Date(highestSpentWeek.week).getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`
                                                        : "No Data"
                                                    }
                                                </p>
                                            </div>
                                            <p className="text-2xl font-normal text-white" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                                {getCurrencySymbol(currency)}{highestSpentWeek.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Highest Subscription */}
                                    <div className="group relative flex flex-col p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-normal uppercase tracking-widest text-amber-100" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                                Highest Subscription
                                            </p>
                                            <p className="text-sm font-normal text-white truncate" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                                {highestSubscription.name}
                                            </p>
                                            <p className="text-2xl font-normal text-white" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                                {getCurrencySymbol(currency)}{highestSubscription.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Most Spent Category */}
                                    <div className="group relative flex flex-col p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-normal uppercase tracking-widest text-blue-100" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                                Most Spent Category
                                            </p>
                                            <p className="text-sm font-normal text-white capitalize truncate" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                                {mostSpentCategory.category}
                                            </p>
                                            <p className="text-2xl font-normal text-white" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                                {getCurrencySymbol(currency)}{mostSpentCategory.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Profile - Redesigned */}
                            {/* Row 2: User Profile, Chart (spans 2 columns) */}
                            <Card className="relative overflow-hidden bg-white dark:bg-neutral-950 border border-slate-200/60 dark:border-neutral-800/60 shadow-sm">
                                {/* Subtle Decorative Background Element */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] -mr-16 -mt-16" />

                                <CardContent className="p-6">
                                    {/* Profile Header */}
                                    <div className="flex flex-col items-center text-center space-y-4 mb-6">
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <Avatar className="w-24 h-24 ring-[6px] ring-slate-50 dark:ring-neutral-900 shadow-2xl relative z-10">
                                                <AvatarImage src={userImage || undefined} alt={userName} />
                                                <AvatarFallback className="bg-neutral-900 dark:bg-white text-white dark:text-black text-2xl font-bold">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-white dark:border-neutral-950 z-20" />
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                                                {userName}
                                            </h3>
                                            <p className="text-sm font-medium text-slate-400 dark:text-neutral-500">
                                                {userEmail}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Primary Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-neutral-600">Rate</span>
                                            <p className="text-lg font-bold text-slate-800 dark:text-neutral-200">{getCurrencySymbol(currency)}{hourlyRate}<span className="text-xs text-slate-400 ml-1">/hr</span></p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-neutral-600">Type</span>
                                            <p className="text-lg font-bold text-slate-800 dark:text-neutral-200 capitalize">{jobType}</p>
                                        </div>
                                    </div>

                                    {/* Info List */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-neutral-900">
                                        {/* Employer */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-500 dark:text-neutral-400">Employer</span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-neutral-200">{companyName}</span>
                                        </div>

                                        {/* Status/Activity */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-500 dark:text-neutral-400">Status</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-sm font-semibold text-slate-900 dark:text-neutral-200">Active now</span>
                                            </div>
                                        </div>

                                        {/* Weekly Schedule Summary */}
                                        <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/50 border border-slate-100 dark:border-neutral-800/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <CalendarDays className="w-4 h-4 text-blue-500" />
                                                    <span className="text-sm font-bold text-slate-700 dark:text-neutral-300">Schedule</span>
                                                </div>
                                                <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                    {(() => {
                                                        const today = new Date();
                                                        const startOfWeek = new Date(today);
                                                        startOfWeek.setDate(today.getDate() - today.getDay());
                                                        startOfWeek.setHours(0, 0, 0, 0);
                                                        const endOfWeek = new Date(startOfWeek);
                                                        endOfWeek.setDate(startOfWeek.getDate() + 6);

                                                        const shifts = Array.from(roster.values()).filter(day =>
                                                            day.type === "working" &&
                                                            day.date >= startOfWeek &&
                                                            day.date <= endOfWeek
                                                        ).length;

                                                        return `${shifts} ${shifts === 1 ? 'Shift' : 'Shifts'}`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>


                            {/* Chart */}
                            <Card className="md:col-span-2 lg:col-span-2 bento-card bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-slate-200 dark:border-neutral-800">
                                <CardHeader className="pb-3">
                                    <div className="flex flex-row items-start justify-between">
                                        <div className="flex flex-col gap-1">
                                            <CardTitle className="text-base md:text-lg text-slate-700 dark:text-neutral-200">
                                                Weekly Hours Overview
                                            </CardTitle>
                                            <RadixTooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 cursor-help transition-colors">
                                                        <Info className="w-3.5 h-3.5" />
                                                        <span className="text-[10px]">Info</span>
                                                    </div>
                                                </TooltipTrigger>
                                                {/* The TooltipPortal is the key to stopping the layout shift */}
                                                <TooltipPortal>
                                                    <TooltipContent
                                                        side="bottom"
                                                        align="start"
                                                        sideOffset={10}
                                                        className="z-[100] w-64 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95"
                                                    >
                                                        <p className="text-xs leading-relaxed text-slate-600 dark:text-neutral-300">
                                                            View your hours and income trends. Use the dropdown to change time range
                                                        </p>
                                                        {/* Adding a TooltipArrow helps anchor it visually */}
                                                        <TooltipArrow className="fill-white dark:fill-neutral-900" />
                                                    </TooltipContent>
                                                </TooltipPortal>
                                            </RadixTooltip>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 shadow-sm hover:bg-slate-50 dark:hover:bg-neutral-700"
                                                >
                                                    <Clock className="mr-1.5 h-3 w-3 text-amber-500" />
                                                    {timeRange === "week" && "1 Week"}
                                                    {timeRange === "2weeks" && "2 Weeks"}
                                                    {timeRange === "month" && "1 Month"}
                                                    {timeRange === "3months" && "3 Months"}
                                                    <ChevronDown className="ml-1.5 h-3 w-3 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            {/* Opacity set to 1 (solid) for maximum clarity */}
                                            <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-neutral-900 opacity-100 border-slate-200 dark:border-neutral-800 shadow-xl">
                                                <DropdownMenuItem className="text-xs py-2 cursor-pointer" onClick={() => setTimeRange("week")}>1 Week</DropdownMenuItem>
                                                <DropdownMenuItem className="text-xs py-2 cursor-pointer" onClick={() => setTimeRange("2weeks")}>2 Weeks</DropdownMenuItem>
                                                <DropdownMenuItem className="text-xs py-2 cursor-pointer" onClick={() => setTimeRange("month")}>1 Month</DropdownMenuItem>
                                                <DropdownMenuItem className="text-xs py-2 cursor-pointer" onClick={() => setTimeRange("3months")}>3 Months</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="h-48 sm:h-56 md:h-64 lg:h-80">
                                    <Line data={chartData} options={chartOptions} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
