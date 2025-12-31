"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
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
    Wallet,
    Plus,
    Trash2,
    Edit,
    Coffee,
    Bus,
    Film,
    Dumbbell,
    Cloud,
    ShoppingBag,
    X,
    ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Subscription {
    id: string;
    name: string;
    amount: number;
    frequency: "weekly" | "monthly";
    category: string;
    is_active: boolean;
    renewal_day?: number;
}

interface Spending {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
}

export default function ViewClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [currency, setCurrency] = useState('EUR');

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [spending, setSpending] = useState<Spending[]>([]);
    const [monthlyIncome, setMonthlyIncome] = useState(0);

    const [showSubModal, setShowSubModal] = useState(false);
    const [showSpendModal, setShowSpendModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Subscription | Spending | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [subForm, setSubForm] = useState({
        name: "",
        amount: "",
        frequency: "monthly" as "weekly" | "monthly",
        category: "entertainment",
        renewal_day: 1, // Day of month (1-31) or day of week (0-6)
        start_month: new Date().getMonth() + 1 // Current month (1-12)
    });
    const [spendForm, setSpendForm] = useState({ description: "", amount: "", category: "food", date: new Date().toISOString().split('T')[0] });

    // Calculate totals
    const monthlySubsTotal = subscriptions.filter(s => s.frequency === "monthly" && s.is_active).reduce((sum, s) => sum + s.amount, 0);
    const weeklySubsTotal = subscriptions.filter(s => s.frequency === "weekly" && s.is_active).reduce((sum, s) => sum + (s.amount * 4.33), 0);
    const totalSpending = spending.reduce((sum, s) => sum + s.amount, 0);
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - totalSpending) / monthlyIncome * 100).toFixed(0) : "0";

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return router.push("/login");
            setUserId(session.user.id);

            await Promise.all([
                fetchSubscriptions(session.user.id),
                fetchSpending(session.user.id),
                fetchCurrency(session.user.id),
                fetchMonthlyIncome(session.user.id)
            ]);

            setLoading(false);
        };
        init();
    }, [router]);

    const fetchSubscriptions = async (uid: string) => {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching subscriptions:', error);
        } else {
            setSubscriptions(data || []);
        }
    };

    const fetchCurrency = async (uid: string) => {
        const { data } = await supabase
            .from('user_profiles')
            .select('currency')
            .eq('user_id', uid)
            .single();
        if (data) setCurrency(data.currency || 'EUR');
    };

    const fetchMonthlyIncome = async (uid: string) => {
        // Fetch hourly rate
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('hourly_rate')
            .eq('user_id', uid)
            .single();

        const hourlyRate = profile?.hourly_rate || 13.50;

        // Fetch roster data for current month
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const { data: roster } = await supabase
            .from('roster')
            .select('*')
            .eq('user_id', uid)
            .gte('date', startOfMonth.toISOString().split('T')[0])
            .lte('date', endOfMonth.toISOString().split('T')[0]);

        if (roster) {
            let totalPay = 0;
            roster.forEach((shift: any) => {
                if (shift.type === 'working') {
                    const [startHour, startMin] = shift.shift_start.split(':').map(Number);
                    const [endHour, endMin] = shift.shift_end.split(':').map(Number);
                    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin) - 30; // 30 min break
                    const hours = Math.max(0, durationMinutes / 60);

                    const shiftDate = new Date(shift.date);
                    const isSunday = shiftDate.getDay() === 0;
                    const rate = isSunday ? hourlyRate * 2 : hourlyRate;

                    totalPay += hours * rate;
                }
            });
            setMonthlyIncome(totalPay);
        }
    };

    const fetchSpending = async (uid: string) => {
        const { data, error } = await supabase
            .from('spending')
            .select('*')
            .eq('user_id', uid)
            .order('date', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching spending:', error);
        } else {
            setSpending(data || []);
        }
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, any> = {
            entertainment: Film,
            fitness: Dumbbell,
            utilities: Cloud,
            food: Coffee,
            transport: Bus,
            shopping: ShoppingBag,
        };
        return icons[category] || Wallet;
    };

    const handleSaveSub = async () => {
        if (!userId || !subForm.name || !subForm.amount) return;

        const subData = {
            user_id: userId,
            name: subForm.name,
            amount: parseFloat(subForm.amount),
            frequency: subForm.frequency,
            category: subForm.category,
            is_active: true,
            renewal_day: subForm.renewal_day,
        };

        if (isEditing && editingItem && 'frequency' in editingItem) {
            const { error } = await supabase
                .from('subscriptions')
                .update(subData)
                .eq('id', editingItem.id);

            if (!error) {
                await fetchSubscriptions(userId);
            }
        } else {
            const { error } = await supabase
                .from('subscriptions')
                .insert([subData]);

            if (!error) {
                await fetchSubscriptions(userId);
            }
        }

        setShowSubModal(false);
        resetForms();
    };

    const handleSaveSpend = async () => {
        if (!userId || !spendForm.description || !spendForm.amount) return;

        const spendData = {
            user_id: userId,
            description: spendForm.description,
            amount: parseFloat(spendForm.amount),
            category: spendForm.category,
            date: spendForm.date,
        };

        if (isEditing && editingItem && 'description' in editingItem) {
            const { error } = await supabase
                .from('spending')
                .update(spendData)
                .eq('id', editingItem.id);

            if (!error) {
                await fetchSpending(userId);
            }
        } else {
            const { error } = await supabase
                .from('spending')
                .insert([spendData]);

            if (!error) {
                await fetchSpending(userId);
            }
        }

        setShowSpendModal(false);
        resetForms();
    };

    const handleEditSub = (sub: Subscription) => {
        setSubForm({
            name: sub.name,
            amount: sub.amount.toString(),
            frequency: sub.frequency,
            category: sub.category,
            renewal_day: sub.renewal_day || 1,
            start_month: new Date().getMonth() + 1
        });
        setEditingItem(sub);
        setIsEditing(true);
        setShowSubModal(true);
    };

    const handleEditSpend = (spend: Spending) => {
        setSpendForm({ description: spend.description, amount: spend.amount.toString(), category: spend.category, date: spend.date });
        setEditingItem(spend);
        setIsEditing(true);
        setShowSpendModal(true);
    };

    const handleDeleteSub = async (id: string) => {
        if (!userId) return;
        const { error } = await supabase.from('subscriptions').delete().eq('id', id);
        if (!error) await fetchSubscriptions(userId);
    };

    const handleDeleteSpend = async (id: string) => {
        if (!userId) return;
        const { error } = await supabase.from('spending').delete().eq('id', id);
        if (!error) await fetchSpending(userId);
    };

    const resetForms = () => {
        setSubForm({
            name: "",
            amount: "",
            frequency: "monthly",
            category: "entertainment",
            renewal_day: 1,
            start_month: new Date().getMonth() + 1
        });
        setSpendForm({ description: "", amount: "", category: "food", date: new Date().toISOString().split('T')[0] });
        setEditingItem(null);
        setIsEditing(false);
    };

    const getCurrencySymbol = (curr: string) => {
        const symbols: Record<string, string> = {
            EUR: '€', USD: '$', GBP: '£', JPY: '¥', CAD: '$', AUD: '$'
        };
        return symbols[curr] || '€';
    };

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-black dark:via-neutral-950 dark:to-zinc-950">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

    const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

    const chartData = {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        datasets: [
            {
                label: "Income",
                data: [520, 520, 520, 520],
                borderColor: "#22c55e",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: "Spending",
                data: [285, 320, 290, 310],
                borderColor: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                labels: {
                    color: isDark ? "#a3a3a3" : "#64748b",
                    usePointStyle: true,
                    padding: 15,
                },
            },
            tooltip: {
                backgroundColor: isDark ? "rgba(26, 26, 26, 0.98)" : "rgba(255, 255, 255, 0.95)",
                titleColor: isDark ? "#f5f5f5" : "#1e293b",
                bodyColor: isDark ? "#d4d4d4" : "#64748b",
                borderColor: isDark ? "#404040" : "#e2e8f0",
                borderWidth: 1,
                padding: 12,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    color: isDark ? "#a3a3a3" : "#64748b",
                    font: { size: 12 },
                },
            },
            y: {
                grid: {
                    color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                    drawBorder: false,
                },
                border: { display: false },
                ticks: {
                    color: isDark ? "#a3a3a3" : "#64748b",
                    font: { size: 12 },
                    callback: function (value: any) {
                        return getCurrencySymbol(currency) + value;
                    },
                },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="h-full w-full bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-black dark:via-neutral-950 dark:to-zinc-950 overflow-y-auto overflow-x-hidden">
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">

                {/* Page Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2" style={{ fontFamily: "'Caveat', cursive" }}>View</h1>
                    <p className="text-slate-600 dark:text-neutral-400">Track your finances </p>
                </motion.div>

                {/* Summary Cards */}
                <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[
                        { label: "Monthly Subs", value: `${getCurrencySymbol(currency)}${monthlySubsTotal.toFixed(2)}`, trend: `${subscriptions.filter(s => s.frequency === "monthly" && s.is_active).length} active` },
                        { label: "Weekly Subs", value: `${getCurrencySymbol(currency)}${weeklySubsTotal.toFixed(2)}`, trend: `~${getCurrencySymbol(currency)}${(weeklySubsTotal / 4.33).toFixed(2)}/wk` },
                        { label: "Total Spending", value: `${getCurrencySymbol(currency)}${totalSpending.toFixed(2)}`, trend: `${spending.length} transactions` },
                        { label: "Savings Rate", value: `${savingsRate}%`, trend: `${getCurrencySymbol(currency)}${(monthlyIncome - totalSpending).toFixed(2)} saved` },
                    ].map((stat, i) => (
                        <motion.div key={i} variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }} className="group relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-2xl transition-all">
                            <div className="flex justify-between items-start mb-3 md:mb-4">
                                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{stat.label}</p>
                                <div className="p-1.5 md:p-2 rounded-full bg-slate-50 dark:bg-neutral-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                    <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                </div>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-slate-900 dark:text-white">{stat.value}</h2>
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 mt-1.5 md:mt-2"><span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">{stat.trend}</span></p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8">

                    {/* Subscriptions */}
                    <motion.div variants={itemVariants} className="lg:col-span-7 space-y-4 md:space-y-6">
                        <div className="flex items-center justify-between px-1 md:px-2">
                            <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-500">Subscriptions</h3>
                            <Button onClick={() => { resetForms(); setShowSubModal(true); }} className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-200 text-xs md:text-sm h-8 md:h-10">
                                <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> Add
                            </Button>
                        </div>

                        <div className="space-y-2 md:space-y-3">
                            {subscriptions.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 dark:text-neutral-500">
                                    <p className="text-sm">No subscriptions yet. Add your first one!</p>
                                </div>
                            ) : (
                                subscriptions.map((sub, idx) => {
                                    const Icon = getCategoryIcon(sub.category);
                                    return (
                                        <motion.div key={sub.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} whileHover={{ scale: 1.01 }} className="group p-3 md:p-4 rounded-2xl md:rounded-3xl bg-white/40 dark:bg-neutral-900/40 border border-slate-200/50 dark:border-neutral-800/50 backdrop-blur-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                                            {/* Mobile: Stacked Layout */}
                                            <div className="flex md:hidden flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                            <Icon className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{sub.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{sub.frequency}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-black text-blue-600 dark:text-blue-400">{getCurrencySymbol(currency)}{sub.amount.toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${sub.is_active ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                        {sub.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleEditSub(sub)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-neutral-700">
                                                            <Edit className="w-3 h-3 text-slate-500" />
                                                        </button>
                                                        <button onClick={() => handleDeleteSub(sub.id)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/20">
                                                            <Trash2 className="w-3 h-3 text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Desktop: Horizontal Layout */}
                                            <div className="hidden md:flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                                                        <Icon className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{sub.name}</p>
                                                        <p className="text-xs text-slate-400 font-medium mt-0.5">{sub.frequency} • {sub.is_active ? 'Active' : 'Inactive'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="text-sm font-black text-blue-600 dark:text-blue-400">{getCurrencySymbol(currency)}{sub.amount.toFixed(2)}</p>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditSub(sub)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-neutral-700">
                                                            <Edit className="w-4 h-4 text-slate-500" />
                                                        </button>
                                                        <button onClick={() => handleDeleteSub(sub.id)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/20">
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>

                    {/* Spending */}
                    <motion.div variants={itemVariants} className="lg:col-span-5 space-y-4 md:space-y-6">
                        <div className="flex items-center justify-between px-1 md:px-2">
                            <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-500">Recent Spending</h3>
                            <Button onClick={() => { resetForms(); setShowSpendModal(true); }} className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-200 text-xs md:text-sm h-8 md:h-10">
                                <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> Add
                            </Button>
                        </div>

                        <div className="space-y-2 md:space-y-3">
                            {spending.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 dark:text-neutral-500">
                                    <p className="text-sm">No spending recorded yet.</p>
                                </div>
                            ) : (
                                spending.map((item, idx) => {
                                    const Icon = getCategoryIcon(item.category);
                                    return (
                                        <motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} whileHover={{ scale: 1.01 }} className="group p-3 md:p-4 rounded-2xl md:rounded-3xl bg-white/40 dark:bg-neutral-900/40 border border-slate-200/50 dark:border-neutral-800/50 backdrop-blur-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                                            {/* Mobile: Stacked Layout */}
                                            <div className="flex md:hidden flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
                                                            <Icon className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{item.description}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">{getCurrencySymbol(currency)}{item.amount.toFixed(2)}</p>
                                                </div>
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => handleEditSpend(item)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-neutral-700">
                                                        <Edit className="w-3 h-3 text-slate-500" />
                                                    </button>
                                                    <button onClick={() => handleDeleteSpend(item.id)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/20">
                                                        <Trash2 className="w-3 h-3 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Desktop: Horizontal Layout */}
                                            <div className="hidden md:flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
                                                        <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.description}</p>
                                                        <p className="text-xs text-slate-400 font-medium">{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">{getCurrencySymbol(currency)}{item.amount.toFixed(2)}</p>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditSpend(item)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-neutral-700">
                                                            <Edit className="w-3 h-3 text-slate-500" />
                                                        </button>
                                                        <button onClick={() => handleDeleteSpend(item.id)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/20">
                                                            <Trash2 className="w-3 h-3 text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Chart */}
                <motion.div variants={itemVariants} className="w-full">
                    <div className="p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <div>
                                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">Income vs Spending</h3>
                                <p className="text-[10px] md:text-xs text-slate-500 dark:text-neutral-500 mt-1">Monthly analysis of your financial flow</p>
                            </div>
                        </div>
                        <div className="h-[200px] sm:h-[250px] md:h-[300px]">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>
                </motion.div>

                {/* Modals */}
                <AnimatePresence>
                    {showSubModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-neutral-800 shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Edit' : 'Add'} Subscription</h3>
                                    <Button variant="ghost" size="icon" onClick={() => { setShowSubModal(false); resetForms(); }} className="rounded-full">
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wide">Name</Label>
                                        <Input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} placeholder="Netflix, Spotify, etc." className="mt-1 h-11 rounded-xl" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wide">Amount ({getCurrencySymbol(currency)})</Label>
                                        <Input type="number" value={subForm.amount} onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })} placeholder="9.99" className="mt-1 h-11 rounded-xl" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wide">Frequency</Label>
                                        <select value={subForm.frequency} onChange={(e) => setSubForm({ ...subForm, frequency: e.target.value as "weekly" | "monthly" })} className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 mt-1 text-slate-900 dark:text-white">
                                            <option value="monthly">Monthly</option>
                                            <option value="weekly">Weekly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wide">Category</Label>
                                        <select value={subForm.category} onChange={(e) => setSubForm({ ...subForm, category: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 mt-1 text-slate-900 dark:text-white">
                                            <option value="entertainment">Entertainment</option>
                                            <option value="fitness">Fitness</option>
                                            <option value="utilities">Utilities</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    {/* Renewal Day Selector */}
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wide">
                                            {subForm.frequency === "monthly" ? "Renewal Day (Day of Month)" : "Renewal Day (Day of Week)"}
                                        </Label>
                                        <select
                                            value={subForm.renewal_day}
                                            onChange={(e) => setSubForm({ ...subForm, renewal_day: parseInt(e.target.value) })}
                                            className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 mt-1 text-slate-900 dark:text-white"
                                        >
                                            {subForm.frequency === "monthly" ? (
                                                // Days 1-31 for monthly
                                                Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                    <option key={day} value={day}>{day}</option>
                                                ))
                                            ) : (
                                                // Days of week for weekly
                                                <>
                                                    <option value={0}>Sunday</option>
                                                    <option value={1}>Monday</option>
                                                    <option value={2}>Tuesday</option>
                                                    <option value={3}>Wednesday</option>
                                                    <option value={4}>Thursday</option>
                                                    <option value={5}>Friday</option>
                                                    <option value={6}>Saturday</option>
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    {/* Start Month (for first payment reference) */}
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wide">First Payment Month</Label>
                                        <select
                                            value={subForm.start_month}
                                            onChange={(e) => setSubForm({ ...subForm, start_month: parseInt(e.target.value) })}
                                            className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 mt-1 text-slate-900 dark:text-white"
                                        >
                                            <option value={1}>January</option>
                                            <option value={2}>February</option>
                                            <option value={3}>March</option>
                                            <option value={4}>April</option>
                                            <option value={5}>May</option>
                                            <option value={6}>June</option>
                                            <option value={7}>July</option>
                                            <option value={8}>August</option>
                                            <option value={9}>September</option>
                                            <option value={10}>October</option>
                                            <option value={11}>November</option>
                                            <option value={12}>December</option>
                                        </select>
                                        <p className="text-[10px] text-slate-500 dark:text-neutral-500 mt-1">
                                            {subForm.frequency === "monthly"
                                                ? `Renews on the ${subForm.renewal_day}${subForm.renewal_day === 1 ? 'st' : subForm.renewal_day === 2 ? 'nd' : subForm.renewal_day === 3 ? 'rd' : 'th'} of each month`
                                                : `Renews every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][subForm.renewal_day]}`
                                            }
                                        </p>
                                    </div>

                                    <Button onClick={handleSaveSub} className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-200 rounded-xl font-bold">
                                        {isEditing ? 'Update' : 'Add'} Subscription
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showSpendModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-neutral-800 shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Edit' : 'Add'} Spending</h3>
                                    <Button variant="ghost" size="icon" onClick={() => { setShowSpendModal(false); resetForms(); }} className="rounded-full">
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wide">Description</Label>
                                        <Input value={spendForm.description} onChange={(e) => setSpendForm({ ...spendForm, description: e.target.value })} placeholder="Groceries, Coffee, etc." className="mt-1 h-11 rounded-xl" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wide">Amount ({getCurrencySymbol(currency)})</Label>
                                        <Input type="number" value={spendForm.amount} onChange={(e) => setSpendForm({ ...spendForm, amount: e.target.value })} placeholder="25.50" className="mt-1 h-11 rounded-xl" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wide">Category</Label>
                                        <select value={spendForm.category} onChange={(e) => setSpendForm({ ...spendForm, category: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 mt-1 text-slate-900 dark:text-white">
                                            <option value="food">Food</option>
                                            <option value="transport">Transport</option>
                                            <option value="shopping">Shopping</option>
                                            <option value="entertainment">Entertainment</option>
                                            <option value="utilities">Utilities</option>
                                            <option value="fitness">Fitness</option>
                                            <option value="healthcare">Healthcare</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wide">Date</Label>
                                        <Input type="date" value={spendForm.date} onChange={(e) => setSpendForm({ ...spendForm, date: e.target.value })} className="mt-1 h-11 rounded-xl" />
                                    </div>
                                    <Button onClick={handleSaveSpend} className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-200 rounded-xl font-bold">
                                        {isEditing ? 'Update' : 'Add'} Spending
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
