"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRoster } from "@/app/context/RosterContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  DollarSign,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Info,
  Settings,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import PaySlip from "@/components/wallet/PaySlip";
import PaySettings from "@/components/wallet/PaySettings";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 },
  },
};

export default function WalletClient() {
  const router = useRouter();
  const { roster, syncRoster } = useRoster();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("EUR");
  const [weekStartDay, setWeekStartDay] = useState(0); // 0 = Sunday, 1 = Monday, etc.
  const [hourlyRate, setHourlyRate] = useState(13.5);
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [overtimeEnabled, setOvertimeEnabled] = useState(true);
  const [overtimeThreshold, setOvertimeThreshold] = useState(40);
  const [overtimeRate, setOvertimeRate] = useState(1.5);
  const [sundayRate, setSundayRate] = useState(2);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [showPaySlip, setShowPaySlip] = useState(false);
  const [paySlipMode, setPaySlipMode] = useState<'week' | 'month'>('week');

  // Currency symbol helper
  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      EUR: '€', USD: '$', GBP: '£', JPY: '¥', CAD: '$', AUD: '$'
    };
    return symbols[curr] || '€';
  };

  // Function to fetch pay settings from database
  const fetchPaySettings = async (uid: string) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('currency, week_start_day, hourly_rate, break_duration, overtime_enabled, overtime_threshold, overtime_rate, sunday_rate')
      .eq('user_id', uid)
      .single();

    if (profile) {
      console.log('📊 Loaded pay settings from database:', profile);
      
      // Batch all state updates together using React 18's automatic batching
      // Or wrap in startTransition for non-urgent updates
      setCurrency(profile.currency || 'EUR');
      setWeekStartDay(profile.week_start_day ?? 0);
      setHourlyRate(profile.hourly_rate || 13.5);
      setBreakMinutes(profile.break_duration || 30);
      setOvertimeEnabled(profile.overtime_enabled ?? true);
      setOvertimeThreshold(profile.overtime_threshold || 40);
      setOvertimeRate(profile.overtime_rate || 1.5);
      setSundayRate(profile.sunday_rate || 2);
      
      console.log('✅ Overtime enabled:', profile.overtime_enabled, '| Threshold:', profile.overtime_threshold);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");
      setUserId(session.user.id);

      // Fetch pay settings
      await fetchPaySettings(session.user.id);

      await syncRoster(session.user.id);
      setLoading(false);
    };
    init();
  }, [router, syncRoster]);

  const getWeekBounds = (offset: number) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate days to subtract to get to the week start day
    let daysToSubtract = (currentDay - weekStartDay + 7) % 7;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysToSubtract + (offset * 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  };

  const calculateShiftHours = (shiftStart: string, shiftEnd: string): number => {
    const [startHour, startMin] = shiftStart.split(':').map(Number);
    const [endHour, endMin] = shiftEnd.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin) - breakMinutes;
    return Math.max(0, durationMinutes / 60);
  };

  const calculateWeeklyPay = (weekOffset: number) => {
    const { startOfWeek, endOfWeek } = getWeekBounds(weekOffset);
    let regularHours = 0, overtimeHours = 0, sundayHours = 0;
    const shifts: any[] = [];

    roster.forEach((dayData) => {
      if (dayData.type === "working" && dayData.date >= startOfWeek && dayData.date <= endOfWeek) {
        const hours = calculateShiftHours(dayData.shiftStart, dayData.shiftEnd);
        const isSunday = dayData.date.getDay() === 0;
        shifts.push({ date: dayData.date, day: dayData.date.toLocaleDateString('en-US', { weekday: 'short' }), hours, isSunday });
        if (isSunday) sundayHours += hours; else regularHours += hours;
      }
    });

    // Calculate overtime: Check TOTAL hours (regular + Sunday) against threshold
    const totalHours = regularHours + sundayHours;
    if (overtimeEnabled && totalHours > overtimeThreshold) {
      const excessHours = totalHours - overtimeThreshold;
      
      // Take overtime from regular hours first, then Sunday if needed
      if (regularHours >= excessHours) {
        // All OT comes from regular hours
        overtimeHours = excessHours;
        regularHours -= excessHours;
      } else {
        // OT comes from both regular and Sunday hours
        overtimeHours = regularHours; // All remaining regular hours become OT
        const remainingOT = excessHours - regularHours;
        sundayHours -= remainingOT; // Reduce Sunday hours by remaining OT
        overtimeHours += remainingOT; // Add to OT
        regularHours = 0;
      }
    }

    return {
      regularHours, overtimeHours, sundayHours,
      regularPay: regularHours * hourlyRate,
      overtimePay: overtimeHours * hourlyRate * overtimeRate,
      sundayPay: sundayHours * hourlyRate * sundayRate,
      totalPay: (regularHours * hourlyRate) + (overtimeHours * hourlyRate * overtimeRate) + (sundayHours * hourlyRate * sundayRate),
      shifts: shifts.sort((a, b) => a.date.getTime() - b.date.getTime()),
      weekStart: startOfWeek, weekEnd: endOfWeek
    };
  };

  const calculateMonthlyPay = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    let regularHours = 0, overtimeHours = 0, sundayHours = 0;
    const shifts: any[] = [];

    roster.forEach((dayData) => {
      if (dayData.type === "working" && dayData.date >= startOfMonth && dayData.date <= endOfMonth) {
        const hours = calculateShiftHours(dayData.shiftStart, dayData.shiftEnd);
        const isSunday = dayData.date.getDay() === 0;
        shifts.push({ date: dayData.date, day: dayData.date.toLocaleDateString('en-US', { weekday: 'short' }), hours, isSunday });
        if (isSunday) sundayHours += hours; else regularHours += hours;
      }
    });

    // Calculate overtime: Check TOTAL hours against monthly threshold (4 weeks)
    const totalHours = regularHours + sundayHours;
    const monthlyThreshold = overtimeThreshold * 4;
    
    if (overtimeEnabled && totalHours > monthlyThreshold) {
      const excessHours = totalHours - monthlyThreshold;
      
      // Take overtime from regular hours first, then Sunday if needed
      if (regularHours >= excessHours) {
        overtimeHours = excessHours;
        regularHours -= excessHours;
      } else {
        overtimeHours = regularHours;
        const remainingOT = excessHours - regularHours;
        sundayHours -= remainingOT;
        overtimeHours += remainingOT;
        regularHours = 0;
      }
    }

    return {
      regularHours, overtimeHours, sundayHours,
      regularPay: regularHours * hourlyRate,
      overtimePay: overtimeHours * hourlyRate * overtimeRate,
      sundayPay: sundayHours * hourlyRate * sundayRate,
      totalPay: (regularHours * hourlyRate) + (overtimeHours * hourlyRate * overtimeRate) + (sundayHours * hourlyRate * sundayRate),
      shifts: shifts.sort((a, b) => a.date.getTime() - b.date.getTime()),
      weekStart: startOfMonth, weekEnd: endOfMonth
    };
  };

  const currentWeek = useMemo(() => calculateWeeklyPay(currentWeekOffset), [currentWeekOffset, roster, hourlyRate, breakMinutes, overtimeEnabled, overtimeThreshold, weekStartDay]);
  const currentMonth = useMemo(() => calculateMonthlyPay(), [roster, hourlyRate, breakMinutes, overtimeEnabled, overtimeThreshold]);

  // Prepare pay data for PaySettings component
  const payData = {
    hourlyRate,
    breakDuration: breakMinutes,
    overtimeEnabled,
    overtimeThreshold,
    overtimeRate,
    sundayRate,
  };

  if (loading) return <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center font-mono text-[10px] tracking-[0.4em] text-black dark:text-zinc-500">INIT_FINANCIAL_DATA...</div>;

  return (
    <div className="h-full w-full bg-white dark:bg-black overflow-auto selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10">

        {/* Header - Minimal High Contrast */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2" style={{ fontFamily: "'Caveat', cursive" }}>Wallet</h1>
            <p className="text-slate-600 dark:text-neutral-400">Track your earnings and manage pay settings</p>
          </div>
        </motion.div>

        {/* Tabs for Overview and Settings */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-1 rounded-xl max-w-md">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
              <DollarSign className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
              <Settings className="w-4 h-4 mr-2" />
              Pay Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            {/* Pay Slip Button */}
            <div className="flex items-center justify-end gap-3 mb-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => setShowPaySlip(true)}
                      className="rounded-none bg-black dark:bg-white text-white dark:text-black h-10 px-6 font-bold text-[10px] uppercase tracking-widest hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.8)] transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 mr-2" />
                      Pay_Slip
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none">
                    <p className="text-xs font-semibold">Generate and view detailed pay slip for the selected period</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          <div className="lg:col-span-2 space-y-8">
            {/* Nav Bar - Sharp Elevation */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="flex items-center justify-between bg-white dark:bg-zinc-900/40 p-1.5 rounded-none border-2 border-black dark:border-white/10 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentWeekOffset(v => v - 1)} className="hover:bg-black/5 dark:hover:bg-white/5">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none">
                    <p className="text-xs font-semibold">Previous Week</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="text-center py-2 px-6 border-x-2 border-black dark:border-white/10">
                <span className="block text-[8px] uppercase tracking-[0.2em] font-black text-zinc-400 mb-0.5">Timeframe_Range</span>
                <span className="text-[11px] font-bold font-mono uppercase tracking-tighter">
                  {currentWeek.weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} — {currentWeek.weekEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentWeekOffset(v => v + 1)} className="hover:bg-black/5 dark:hover:bg-white/5">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none">
                    <p className="text-xs font-semibold">Next Week</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>

            {/* Bento Grid Stats - High Contrast Borders */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Net Pay", val: `${getCurrencySymbol(currency)}${currentWeek.totalPay.toFixed(2)}`, icon: DollarSign },
                { label: "Hours", val: `${(currentWeek.regularHours + currentWeek.overtimeHours + currentWeek.sundayHours).toFixed(1)}h`, icon: Clock },
                { label: "Shifts", val: currentWeek.shifts.length, icon: Calendar },
                { label: "Daily Avg", val: `${getCurrencySymbol(currency)}${currentWeek.shifts.length ? (currentWeek.totalPay / currentWeek.shifts.length).toFixed(2) : '0'}`, icon: TrendingUp }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="bg-white dark:bg-neutral-900 p-6 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="w-4 h-4 text-slate-400 dark:text-neutral-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    <span className="text-xs font-mono text-slate-300 dark:text-neutral-700">0{i + 1}</span>
                  </div>
                  <span className="block text-xs uppercase tracking-wide font-bold text-slate-500 dark:text-neutral-500 mb-1">{stat.label}</span>
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stat.val}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Activity Log - Flat & Clean */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible">
              <Card className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-lg">
                <CardHeader className="border-b border-slate-200 dark:border-neutral-800 py-4 px-6 bg-slate-50 dark:bg-neutral-950">
                  <CardTitle className="text-xs uppercase tracking-wide text-slate-700 dark:text-neutral-400 font-bold flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>Shift Activity Log</span>
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 cursor-help transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            align="start"
                            sideOffset={5}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none max-w-xs z-50"
                          >
                            <p className="text-xs font-semibold">Detailed list of all your shifts for the selected week with hours and earnings breakdown</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-mono text-slate-500 dark:text-neutral-500">{currentWeek.shifts.length} ENTRIES</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {currentWeek.shifts.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 dark:text-neutral-600 text-xs font-medium tracking-wide">NO SHIFTS RECORDED</div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                      {currentWeek.shifts.map((shift: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all group cursor-default">
                          <div className="flex items-center gap-6">
                            <div className="w-10 h-10 border border-slate-300 dark:border-neutral-700 rounded-lg flex items-center justify-center text-xs font-bold font-mono group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                              {shift.day.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-white">{shift.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long' })}</div>
                              <div className="text-xs text-slate-500 dark:text-neutral-500 font-medium mt-0.5">{shift.hours.toFixed(2)} hours {shift.isSunday && <span className="text-purple-600 dark:text-purple-400 font-bold ml-1">Sunday</span>}</div>
                            </div>
                          </div>
                          <div className="text-base font-bold text-slate-900 dark:text-white">
                            {getCurrencySymbol(currency)}{(shift.hours * hourlyRate * (shift.isSunday ? sundayRate : 1)).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Sidebar - Brutalist Detail */}
          <div className="space-y-6">

            {/* Total Breakdown - Elevation Shadow */}
            <Card className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-900 dark:bg-neutral-950 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign className="w-20 h-20 rotate-12" />
              </div>
              <CardHeader className="relative z-10 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xs uppercase tracking-wide text-slate-400 font-bold">Weekly Breakdown</CardTitle>
                  {/* <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-help transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white border-slate-200 dark:border-neutral-700 max-w-xs">
                        <p className="text-xs font-semibold">Shows your pay breakdown including regular hours, overtime, and Sunday premium rates for the selected week</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider> */}
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-5 relative z-10">
                <div className="space-y-3">
                  {/* Regular Pay */}
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-slate-400">Regular Pay</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{currentWeek.regularHours.toFixed(1)}h × {getCurrencySymbol(currency)}{hourlyRate.toFixed(2)}</p>
                    </div>
                    <span className="font-semibold">{getCurrencySymbol(currency)}{currentWeek.regularPay.toFixed(2)}</span>
                  </div>

                  {/* Overtime Pay with Details */}
                  {currentWeek.overtimePay > 0 && (
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <div>
                        <span className="text-blue-400 font-semibold">Overtime</span>
                        <p className="text-[10px] text-blue-300 mt-0.5">
                          {currentWeek.overtimeHours.toFixed(1)}h × {getCurrencySymbol(currency)}{(hourlyRate * overtimeRate).toFixed(2)} ({overtimeRate}×)
                        </p>
                      </div>
                      <span className="text-blue-400 font-semibold">+{getCurrencySymbol(currency)}{currentWeek.overtimePay.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Sunday Pay with Details */}
                  {currentWeek.sundayPay > 0 && (
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <div>
                        <span className="text-purple-400 font-semibold">Sunday</span>
                        <p className="text-[10px] text-purple-300 mt-0.5">
                          {currentWeek.sundayHours.toFixed(1)}h × {getCurrencySymbol(currency)}{(hourlyRate * sundayRate).toFixed(2)} ({sundayRate}×)
                        </p>
                      </div>
                      <span className="text-purple-400 font-semibold">+{getCurrencySymbol(currency)}{currentWeek.sundayPay.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="pt-6 flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide font-bold text-slate-500">Total Estimated</span>
                  <span className="text-5xl font-bold text-white tracking-tight leading-none py-2 group-hover:scale-[1.02] transition-transform origin-left">{getCurrencySymbol(currency)}{currentWeek.totalPay.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Help & Tips Card - Below Weekly Breakdown */}
            <Card className="rounded-xl border border-blue-200 dark:border-blue-800/30 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                    <Info className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-neutral-100">
                      Quick Note
                    </h4>
                    <div className="space-y-2 text-xs text-slate-700 dark:text-neutral-300">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <p><span className="font-semibold">Regular Pay:</span> Standard hourly rate × hours worked</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <p><span className="font-semibold">Overtime:</span> Kicks in after threshold hours per week</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <p><span className="font-semibold">Sunday:</span> Premium rate applied to Sunday shifts</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <PaySettings 
              userId={userId!} 
              initialData={payData}
              onUpdate={() => fetchPaySettings(userId!)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {showPaySlip && (
        <PaySlip
          data={currentWeek}
          monthData={currentMonth}
          onClose={() => setShowPaySlip(false)}
          hourlyRate={hourlyRate}
          overtimeRate={overtimeRate}
          sundayRate={sundayRate}
          mode={paySlipMode}
          setMode={setPaySlipMode}
          currency={currency}
        />
      )}
    </div>
  );
}
