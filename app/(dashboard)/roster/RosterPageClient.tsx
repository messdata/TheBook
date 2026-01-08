"use client";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    Sun,
    Moon,
    Check,
    X,
    Info,
    HelpCircle
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/Tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useRoster, saveRosterToSupabase } from "../../context/RosterContext";

type DayType = "working" | "off" | null;

interface DayData {
    date: Date;
    type: DayType;
    shiftStart: string;
    shiftEnd: string;
}

function isPayDay(
    date: Date,
    payFrequency: string,
    payDayWeekly: number,
    payDayMonthly: number,
    payStartDate: string
): boolean {
    if (payFrequency === 'weekly') {
        // Sunday = 0, Monday = 1, etc. but our system uses 0=Sun, 1=Mon
        return date.getDay() === (payDayWeekly === 0 ? 0 : payDayWeekly);
    }

    if (payFrequency === 'fortnightly' && payStartDate) {
        const startDate = new Date(payStartDate);
        startDate.setHours(0, 0, 0, 0);
        const currentDateNormalized = new Date(date);
        currentDateNormalized.setHours(0, 0, 0, 0);

        // Calculate weeks since start date
        const weeksSinceStart = Math.floor(
            (currentDateNormalized.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );

        // Check if it's a pay week (even weeks) AND the correct day
        return weeksSinceStart % 2 === 0 && date.getDay() === (payDayWeekly === 0 ? 0 : payDayWeekly);
    }

    if (payFrequency === 'monthly') {
        return date.getDate() === payDayMonthly;
    }

    return false;
}

// Minimalist Time Picker Wheel Component
function TimePickerWheel({
    value,
    onChange,
    label
}: {
    value: string;
    onChange: (time: string) => void;
    label: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [hour, minute] = value.split(':').map(Number);

    // Local state for the picker's internal selection
    const [selectedHour, setSelectedHour] = useState(hour);
    const [selectedMinute, setSelectedMinute] = useState(minute);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i).filter(m => m % 5 === 0);

    const formatTime = (h: number, m: number) => {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const handleConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(formatTime(selectedHour, selectedMinute));
        setIsOpen(false);
    };

    // Sub-component for the scrollable columns
    const ScrollColumn = ({
        items,
        selected,
        onSelect
    }: {
        items: number[],
        selected: number,
        onSelect: (v: number) => void
    }) => {
        const scrollRef = useRef<HTMLDivElement>(null);
        const itemHeight = 40; // Height in pixels of each row

        // Triple the items for the infinite loop effect
        const loopedItems = [...items, ...items, ...items];

        // Initial Scroll: Center on the middle set of items
        useEffect(() => {
            if (isOpen && scrollRef.current) {
                const centerOffset = items.length * itemHeight;
                const selectedIndex = items.indexOf(selected);
                scrollRef.current.scrollTop = centerOffset + (selectedIndex * itemHeight);
            }
        }, [isOpen]);

        const handleScroll = () => {
            if (!scrollRef.current) return;
            const scrollPos = scrollRef.current.scrollTop;
            const totalDataHeight = items.length * itemHeight;

            // Infinite Loop Logic: Reset to center if we move into top/bottom clones
            if (scrollPos <= 0) {
                scrollRef.current.scrollTop = totalDataHeight;
            } else if (scrollPos >= totalDataHeight * 2) {
                scrollRef.current.scrollTop = totalDataHeight;
            }

            // Update selection based on center position
            const index = Math.round(scrollPos / itemHeight) % items.length;
            const newValue = items[index];
            if (newValue !== undefined && newValue !== selected) {
                onSelect(newValue);
            }
        };

        return (
            <div className="relative h-[200px] w-14 md:w-16 flex flex-col items-center">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="h-full w-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        maskImage: 'linear-gradient(to bottom, transparent, black 40%, black 60%, transparent)'
                    }}
                >
                    {/* Padding ensures the selected item can align with the center highlight */}
                    <div className="h-[80px]" />
                    {loopedItems.map((item, idx) => {
                        const isSelected = selected === item && Math.floor(idx / items.length) === 1;
                        return (
                            <div
                                key={`${item}-${idx}`}
                                className={`
                                    snap-center h-[40px] flex items-center justify-center cursor-pointer transition-all duration-200
                                    ${selected === item ? 'scale-110' : 'scale-90 opacity-30 blur-[0.5px]'}
                                `}
                            >
                                <span className={`font-mono text-lg md:text-xl ${selected === item ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                                    {item.toString().padStart(2, '0')}
                                </span>
                            </div>
                        );
                    })}
                    <div className="h-[80px]" />
                </div>
            </div>
        );
    };

    return (
        <div className="relative flex-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 block ml-1">
                {label}
            </label>

            <Button
                onClick={() => setIsOpen(true)}
                variant="outline"
                className="w-full h-11 bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 font-mono text-lg"
            >
                {value}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
                        >
                            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-neutral-800 p-4 w-[180px] md:w-[220px]">
                                <div className="relative flex justify-center items-center h-[200px] bg-slate-50/50 dark:bg-neutral-950/50 rounded-2xl overflow-hidden">
                                    {/* Selection Bar */}
                                    <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl pointer-events-none" />

                                    <ScrollColumn items={hours} selected={selectedHour} onSelect={setSelectedHour} />
                                    <div className="text-xl font-bold text-slate-300 mx-1">:</div>
                                    <ScrollColumn items={minutes} selected={selectedMinute} onSelect={setSelectedMinute} />
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleConfirm} className="bg-zinc-900 dark:bg-white dark:text-black">Set</Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function RosterPageClient() {
    const { theme, setTheme } = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<"month" | "week">("month");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);


    // USE ROSTER CONTEXT
    const { roster, setRoster, syncRoster } = useRoster();

    // Form state for selected day
    const [shiftStart, setShiftStart] = useState("09:00");
    const [shiftEnd, setShiftEnd] = useState("17:00");
    const [isSaving, setIsSaving] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    // Animation direction for calendar transitions
    const [direction, setDirection] = useState(0);

    // Pay day settings
    const [payFrequency, setPayFrequency] = useState<string>('monthly');
    const [payDayWeekly, setPayDayWeekly] = useState<number>(5);
    const [payDayMonthly, setPayDayMonthly] = useState<number>(1);
    const [payStartDate, setPayStartDate] = useState<string>('');

    // Load roster data on mount
    useEffect(() => {
        const initializeUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    router.push("/login");
                    return;
                }
                setUserId(session.user.id);
                await syncRoster(session.user.id);

                setLoading(false);
            } catch (err) {
                console.error('Error initializing user:', err);
                router.push("/login");
            }
        };
        initializeUser();
    }, [router, syncRoster]);

    // Fetch pay settings
    useEffect(() => {
        const fetchPaySettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('pay_frequency, pay_day_weekly, pay_day_monthly, pay_start_date')
                .eq('user_id', user.id)
                .single();

            if (profile) {
                setPayFrequency(profile.pay_frequency || 'monthly');
                setPayDayWeekly(profile.pay_day_weekly || 5);
                setPayDayMonthly(profile.pay_day_monthly || 1);
                setPayStartDate(profile.pay_start_date || '');
            }
        };

        fetchPaySettings();
    }, []);

    // Update your handleSave function to use userId
    const handleSave = async () => {
        if (!userId) return;

        try {
            setSaving(true);
            await saveRosterToSupabase(userId, roster);
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving roster:', error);
        } finally {
            setSaving(false);
        }
    };
    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Loading roster...</p>
                </div>
            </div>
        );
    }

    // Helper to get date key
    const getDateKey = (date: Date): string => {
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };

    // Get day data
    const getDayData = (date: Date): DayData | null => {
        return roster.get(getDateKey(date)) || null;
    };

    // Calculate accumulated pay up to a given date
    const getAccumulatedPay = (upToDate: Date, hourlyRate: number = 15): number => {
        let totalHours = 0;

        // Get all dates from roster up to the given date
        roster.forEach((dayData, key) => {
            const [year, month, day] = key.split('-').map(Number);
            const rosterDate = new Date(year, month, day);

            if (rosterDate <= upToDate && dayData.type === 'working') {
                const [startHour, startMin] = dayData.shiftStart.split(':').map(Number);
                const [endHour, endMin] = dayData.shiftEnd.split(':').map(Number);

                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                const hoursWorked = (endMinutes - startMinutes) / 60;

                totalHours += hoursWorked;
            }
        });

        return totalHours * hourlyRate;
    };

    // Just select date - no toggle
    const selectDate = (date: Date) => {
        setSelectedDate(date);

        // Load existing data into form
        const key = getDateKey(date);
        const current = roster.get(key);

        if (current && current.type === "working") {
            setShiftStart(current.shiftStart);
            setShiftEnd(current.shiftEnd);
        } else if (current && current.type === "off") {
            // Keep previous times for display
            setShiftStart(current.shiftStart || "09:00");
            setShiftEnd(current.shiftEnd || "17:00");
        } else {
            // New entry - set defaults
            setShiftStart("09:00");
            setShiftEnd("17:00");
        }
    };

    // Set day type from dropdown
    const setDayType = async (date: Date, type: DayType) => {
        const key = getDateKey(date);
        const current = roster.get(key);
        const newRoster = new Map(roster);

        if (type === null) {
            // Clear the day
            newRoster.delete(key);
        } else if (type === "working") {
            newRoster.set(key, {
                date,
                type: "working",
                shiftStart: current?.shiftStart || shiftStart,
                shiftEnd: current?.shiftEnd || shiftEnd,
            });
        } else {
            // off
            newRoster.set(key, {
                date,
                type: "off",
                shiftStart: current?.shiftStart || shiftStart,
                shiftEnd: current?.shiftEnd || shiftEnd,
            });
        }

        setRoster(newRoster);

        // SAVE TO SUPABASE
        if (userId) await saveRosterToSupabase(userId, newRoster);
    };

    // Update shift times - WITH SUPABASE SAVE
    const updateShiftTimes = async () => {
        if (!selectedDate) return;

        setIsSaving(true);
        try {
            const key = getDateKey(selectedDate);
            const current = roster.get(key);

            if (current && current.type === "working") {
                const newRoster = new Map(roster);
                newRoster.set(key, {
                    ...current,
                    shiftStart,
                    shiftEnd,
                });
                setRoster(newRoster);

                // SAVE TO SUPABASE
                if (userId) await saveRosterToSupabase(userId, newRoster);
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Navigation
    const goToPreviousMonth = () => {
        setDirection(-1);
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setDirection(1);
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToPreviousWeek = () => {
        setDirection(-1);
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const goToNextWeek = () => {
        setDirection(1);
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setDirection(0);
        setCurrentDate(new Date());
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.02,
            }
        },
    };

    const dayVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 24
            }
        }
    };

    const editorVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            height: 0
        },
        visible: {
            opacity: 1,
            y: 0,
            height: "auto" as const,
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 30
            }
        },
    };

    // Render Month View
    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const days = [];


        for (let i = 0; i < firstDay; i++) {
            days.push(
                <motion.div
                    key={`empty-${i}`}
                    className="aspect-square"
                    variants={dayVariants}
                />
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
            const isSelected =
                selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();

            const dayData = getDayData(date);
            const dayType = dayData?.type;
            const isPayDayDate = isPayDay(date, payFrequency, payDayWeekly, payDayMonthly, payStartDate);
            const accumulatedPay = isPayDayDate ? getAccumulatedPay(date) : 0;

            days.push(
                <motion.div
                    key={day}
                    variants={dayVariants}
                    whileTap={{ scale: 0.95 }}
                    style={isPayDayDate ? {
                        boxShadow: '0 0 15px rgba(34, 197, 94, 0.3), inset 0 0 15px rgba(34, 197, 94, 0.08)'
                    } : {}}
                    className={`
                        aspect-square p-1 md:p-2 border rounded-md md:rounded-lg relative
                        cursor-pointer transition-all duration-300
                        ${isPayDayDate
                            ? "border-green-400/50 dark:border-green-500/50"
                            : "border-slate-200 dark:border-neutral-800"
                        }
                        ${isToday ? "ring-1 md:ring-2 ring-slate-400 dark:ring-neutral-600" : ""}
                        ${isSelected ? "ring-1 md:ring-2 ring-slate-600 dark:ring-neutral-400" : ""}
                        ${dayType === "working" ? "bg-blue-100 dark:bg-blue-950/30 hover:bg-blue-200 dark:hover:bg-blue-950/50" : ""}
                        ${dayType === "off" ? "bg-red-100 dark:bg-red-950/30 hover:bg-red-200 dark:hover:bg-red-950/50" : ""}
                        ${!dayType ? "bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800" : ""}
                    `}
                >
                    {/* Pulsing indicator for pay day */}
                    {isPayDayDate && (
                        <div className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center pointer-events-none z-20">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        </div>
                    )}

                    {/* Tooltip wrapper for entire cell */}
                    {isPayDayDate ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        onClick={() => selectDate(date)}
                                        className="absolute inset-0 z-10"
                                    >
                                        <motion.div
                                            className="flex flex-col h-full justify-between items-center p-1 md:p-2"
                                            animate={dayType ? { scale: [1, 1.05, 1] } : {}}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <span className={`text-xs md:text-sm font-semibold self-start ${isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-neutral-200"}`}>
                                                {day}
                                            </span>
                                            <AnimatePresence mode="wait">
                                                {dayData && dayType === "working" && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0 }}
                                                        className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 mb-0.5"
                                                    />
                                                )}
                                                {dayData && dayType === "off" && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0 }}
                                                        className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-600 dark:bg-red-400 mb-0.5"
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-green-600 dark:bg-green-500 text-white border-green-500">
                                    <p className="text-xs font-semibold">Pay Day!</p>
                                    <p className="text-[10px] opacity-90">Accumulated: €{accumulatedPay.toFixed(2)}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <motion.div
                            onClick={() => selectDate(date)}
                            className="flex flex-col h-full justify-between items-center"
                            animate={dayType ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            <span className={`text-xs md:text-sm font-semibold self-start ${isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-neutral-200"}`}>
                                {day}
                            </span>
                            <AnimatePresence mode="wait">
                                {dayData && dayType === "working" && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 mb-0.5"
                                    />
                                )}
                                {dayData && dayType === "off" && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-600 dark:bg-red-400 mb-0.5"
                                    />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </motion.div>
            );
        }

        return (
            <motion.div
                className="grid grid-cols-7 gap-1 md:gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                    <div
                        key={day}
                        className="text-center text-[10px] md:text-sm font-bold text-slate-600 dark:text-neutral-400 py-1 md:py-2"
                    >
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.charAt(0)}</span>
                    </div>
                ))}
                {days}
            </motion.div>
        );
    };

    // Render Week View
    const renderWeekView = () => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const days = [];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);

            const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
            const isSelected =
                selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();

            const dayData = getDayData(date);
            const dayType = dayData?.type;
            const isPayDayDate = isPayDay(date, payFrequency, payDayWeekly, payDayMonthly, payStartDate);
            const accumulatedPay = isPayDayDate ? getAccumulatedPay(date) : 0;

            days.push(
                <motion.div
                    key={i}
                    className="flex-1 min-w-[100px] md:min-w-[120px]"
                    variants={dayVariants}
                    whileTap={{ scale: 0.98 }}
                >
                    <motion.div
                        style={isPayDayDate ? {
                            boxShadow: '0 0 20px rgba(34, 197, 94, 0.4), inset 0 0 20px rgba(34, 197, 94, 0.1)'
                        } : {}}
                        className={`
                            p-2 md:p-4 border rounded-lg relative
                            cursor-pointer transition-all duration-300 min-h-[160px] md:min-h-[200px]
                            ${isPayDayDate
                                ? "border-green-400/50 dark:border-green-500/50"
                                : "border-slate-200 dark:border-neutral-800"
                            }
                            ${isToday ? "ring-1 md:ring-2 ring-slate-400 dark:ring-neutral-600" : ""}
                            ${isSelected ? "ring-1 md:ring-2 ring-slate-600 dark:ring-neutral-400" : ""}
                            ${dayType === "working" ? "bg-blue-100 dark:bg-blue-950/30 hover:bg-blue-200 dark:hover:bg-blue-950/50" : ""}
                            ${dayType === "off" ? "bg-red-100 dark:bg-red-950/30 hover:bg-red-200 dark:hover:bg-red-950/50" : ""}
                            ${!dayType ? "bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800" : ""}
                        `}
                    >
                        {/* Pulsing indicator for pay day */}
                        {isPayDayDate && (
                            <div className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center pointer-events-none z-20">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            </div>
                        )}

                        {/* Tooltip wrapper for entire card */}
                        {isPayDayDate ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            onClick={() => selectDate(date)}
                                            className="absolute inset-0 z-10 flex flex-col"
                                        >
                                            <div className="text-center mb-2 pt-2 md:pt-4">
                                                <div className="text-[10px] md:text-xs font-semibold text-slate-600 dark:text-neutral-400">
                                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                                <div className={`text-xl md:text-2xl font-bold ${isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-neutral-200"}`}>
                                                    {date.getDate()}
                                                </div>
                                            </div>
                                            <AnimatePresence mode="wait">
                                                {dayData && dayType === "working" && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="mt-2 md:mt-4 text-center"
                                                    >
                                                        <div className="text-xs md:text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                            Working Day
                                                        </div>
                                                        <div className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                            {dayData.shiftStart} - {dayData.shiftEnd}
                                                        </div>
                                                    </motion.div>
                                                )}
                                                {dayData && dayType === "off" && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="mt-2 md:mt-4 text-center"
                                                    >
                                                        <div className="text-xs md:text-sm font-semibold text-red-700 dark:text-red-300">
                                                            Day Off
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-green-600 dark:bg-green-500 text-white border-green-500">
                                        <p className="text-xs font-semibold">Pay Day!</p>
                                        <p className="text-[10px] opacity-90">Accumulated: €{accumulatedPay.toFixed(2)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <div onClick={() => selectDate(date)}>
                                <div className="text-center mb-2">
                                    <div className="text-[10px] md:text-xs font-semibold text-slate-600 dark:text-neutral-400">
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className={`text-xl md:text-2xl font-bold ${isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-neutral-200"}`}>
                                        {date.getDate()}
                                    </div>
                                </div>
                                <AnimatePresence mode="wait">
                                    {dayData && dayType === "working" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="mt-2 md:mt-4 text-center"
                                        >
                                            <div className="text-xs md:text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                Working Day
                                            </div>
                                            <div className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                {dayData.shiftStart} - {dayData.shiftEnd}
                                            </div>
                                        </motion.div>
                                    )}
                                    {dayData && dayType === "off" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="mt-2 md:mt-4 text-center"
                                        >
                                            <div className="text-xs md:text-sm font-semibold text-red-700 dark:text-red-300">
                                                Day Off
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            );
        }

        return (
            <motion.div
                className="flex gap-1 md:gap-2 overflow-x-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {days}
            </motion.div>
        );
    };

    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const weekRange = viewMode === "week"
        ? (() => {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        })()
        : "";

    const selectedDayData = selectedDate ? getDayData(selectedDate) : null;
    const canEditShift = selectedDate !== null;

    return (
        <div className="px-4 py-6 md:px-6 lg:px-8 xl:px-12">
            <div className="w-full max-w-[1600px] mx-auto">

                {/* Page Title - Space for profile icon on mobile */}
                <div className="mb-6 mt-12 md:mt-0">
                    <h1 className="text-4xl md:text-5xl font-serif italic text-zinc-900 dark:text-white">
                        Roster
                    </h1>
                </div>

                {/* Header Controls */}
                <motion.div
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-4">
                        {/* <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 cursor-help transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none max-w-xs">
                                    <p className="text-xs font-semibold">Manage your work schedule by selecting dates and setting shift times</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider> */}
                        {/* <Button
                            onClick={goToToday}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Today
                        </Button> */}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Toggle - Glassmorphic */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl p-1 rounded-xl border border-white/20 dark:border-neutral-700/30 shadow-lg mb-4">
                                        <Button
                                            onClick={() => setViewMode("month")}
                                            variant={viewMode === "month" ? "default" : "ghost"}
                                            size="sm"
                                            className={viewMode === "month" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" : "hover:bg-white/50 dark:hover:bg-neutral-800/50"}
                                        >
                                            Month
                                        </Button>
                                        <Button
                                            onClick={() => setViewMode("week")}
                                            variant={viewMode === "week" ? "default" : "ghost"}
                                            size="sm"
                                            className={viewMode === "week" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" : "hover:bg-white/50 dark:hover:bg-neutral-800/50"}
                                        >
                                            Week
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none">
                                    <p className="text-xs font-semibold">Switch between monthly and weekly calendar view</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </motion.div>

                {/* Navigation */}
                <motion.div
                    className="flex items-center justify-between"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={viewMode === "month" ? goToPreviousMonth : goToPreviousWeek}
                                    variant="outline"
                                    size="icon"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none">
                                <p className="text-xs font-semibold">Previous {viewMode === "month" ? "Month" : "Week"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <motion.h2
                        key={viewMode === "month" ? monthName : weekRange}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-xl font-bold text-slate-800 dark:text-neutral-200"
                    >
                        {viewMode === "month" ? monthName : weekRange}
                    </motion.h2>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={viewMode === "month" ? goToNextMonth : goToNextWeek}
                                    variant="outline"
                                    size="icon"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none">
                                <p className="text-xs font-semibold">Next {viewMode === "month" ? "Month" : "Week"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </motion.div>

                {/* Calendar and Shift Editor Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                    {/* Calendar - Takes 2 columns on large screens */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bento-card bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-slate-200 dark:border-neutral-800">
                            <CardContent className="p-4 md:p-6">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${viewMode}-${currentDate.getMonth()}-${currentDate.getFullYear()}`}
                                        initial={{ opacity: 0, x: direction * 100 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: direction * -100 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-8 min-h-[400px]"
                                    >
                                        {viewMode === "month" ? renderMonthView() : renderWeekView()}
                                    </motion.div>
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Shift Editor - Minimalist Redesign */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            className="lg:col-span-1"
                            variants={editorVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Card className="border-zinc-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-visible">
                                <CardHeader className="pb-4 border-b border-zinc-50">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-light tracking-tight text-zinc-900">
                                            {selectedDate ? (
                                                <>
                                                    <span className="font-semibold block text-sm uppercase tracking-widest text-zinc-400 mb-1">Editing Shift</span>
                                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                                                </>
                                            ) : (
                                                "Shift Editor"
                                            )}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <AnimatePresence mode="wait">
                                        {selectedDate && canEditShift ? (
                                            <motion.div
                                                key="edit-form"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="space-y-8"
                                            >
                                                {/* Day Type Selector */}
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                                                        Day Type
                                                    </label>
                                                    <select
                                                        value={getDayData(selectedDate)?.type || ""}
                                                        onChange={(e) => setDayType(selectedDate, e.target.value as DayType || null)}
                                                        className="w-full h-12 px-4 bg-white border border-zinc-200 rounded-xl text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                                                    >
                                                        <option value="">Not Set</option>
                                                        <option value="working">Working Day</option>
                                                        <option value="off">Day Off</option>
                                                    </select>
                                                </div>

                                                {/* Time Selectors with more breathing room */}
                                                <div className="flex justify-between items-center bg-zinc-50/50 p-3 md:p-4 rounded-2xl border border-zinc-100/50">
                                                    <TimePickerWheel
                                                        value={shiftStart}
                                                        onChange={setShiftStart}
                                                        label="Start"
                                                    />
                                                    <div className="h-8 w-[1px] bg-zinc-200" />
                                                    <TimePickerWheel
                                                        value={shiftEnd}
                                                        onChange={setShiftEnd}
                                                        label="End"
                                                    />
                                                </div>

                                                <div className="space-y-4">
                                                    <motion.div whileTap={{ scale: 0.98 }}>
                                                        <Button
                                                            onClick={updateShiftTimes}
                                                            disabled={isSaving}
                                                            className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isSaving ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                    <span>Saving...</span>
                                                                </div>
                                                            ) : (
                                                                "Apply Changes"
                                                            )}
                                                        </Button>
                                                    </motion.div>

                                                    {/* Minimalist Legend */}
                                                    <div className="flex justify-center gap-6 pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Working</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                                                            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Off</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="no-selection"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="space-y-6"
                                            >
                                                {/* Original empty state */}
                                                <div className="py-6 flex flex-col items-center text-center space-y-3">
                                                    <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-sm text-zinc-500 max-w-[180px] leading-relaxed">
                                                        Select a date on the calendar to manage your shift.
                                                    </p>
                                                </div>

                                                {/* How to Use Guide */}
                                                <div className="border-t border-zinc-100 pt-4">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <HelpCircle className="w-4 h-4 text-blue-500" />
                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">How to Use</h4>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                                                                1
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-semibold text-zinc-800 mb-0.5">Select a Date</p>
                                                                <p className="text-[11px] text-zinc-500 leading-relaxed">Click any date on the calendar</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                                                                2
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-semibold text-zinc-800 mb-0.5">Choose Day Type</p>
                                                                <p className="text-[11px] text-zinc-500 leading-relaxed">Select Working, Off, or Not Set from dropdown</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                                                                3
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-semibold text-zinc-800 mb-0.5">Set Shift Times</p>
                                                                <p className="text-[11px] text-zinc-500 leading-relaxed">Use time picker and click Apply</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Legend - Inside Shift Editor */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="mt-6 pt-6 border-t border-zinc-100"
                                    >
                                        <div className="flex flex-wrap items-center justify-center gap-4 px-2 py-3 bg-zinc-50/50 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm" />
                                                <span className="text-xs font-medium text-zinc-600">Working Day</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm" />
                                                <span className="text-xs font-medium text-zinc-600">Day Off</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-md border-2 border-zinc-400 bg-white/50" />
                                                <span className="text-xs font-medium text-zinc-600">Today</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full bg-green-500/30 border border-green-500/50"
                                                    style={{
                                                        boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)'
                                                    }}
                                                />
                                                <span className="text-xs font-medium text-zinc-600">Pay Day</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
