"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type DayType = "working" | "off" | null;

interface DayData {
    date: Date;
    type: DayType;
    shiftStart: string;
    shiftEnd: string;
}

interface RosterContextType {
    roster: Map<string, DayData>;
    setRoster: (roster: Map<string, DayData>) => void;
    getNextShift: () => { day: string; date: Date } | null;
    getNextDayOff: () => { day: string; date: Date; daysFromNow: number } | null;
    getTotalHoursThisWeek: () => number;
    isLoading: boolean;
    syncRoster: (userId: string) => Promise<void>;
}

const RosterContext = createContext<RosterContextType | null>(null);

export function RosterProvider({ children }: { children: ReactNode }) {
    const [roster, setRosterState] = useState<Map<string, DayData>>(new Map());
    const [isLoading, setIsLoading] = useState(false);

    // Sync from Supabase - Optimized with useCallback
    const syncRoster = useCallback(async (userId: string) => {
        if (!userId) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('roster_entries')
                .select('date, type, shift_start, shift_end') // Only fetch needed columns
                .eq('user_id', userId);

            if (error) throw error;

            const map = new Map<string, DayData>();
            data?.forEach((entry) => {
                const date = new Date(entry.date);
                const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                map.set(key, {
                    date,
                    type: entry.type as DayType,
                    shiftStart: entry.shift_start || "09:00",
                    shiftEnd: entry.shift_end || "17:00",
                });
            });

            setRosterState(map);
        } catch (error) {
            console.error('Error syncing roster:', error);
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency - function never changes

    // Save to Supabase - Returns updated function that needs userId
    const setRoster = useCallback((newRoster: Map<string, DayData>) => {
        setRosterState(newRoster);
        return newRoster;
    }, []);

    // Get next working shift - Optimized with useCallback
    const getNextShift = useCallback((): { day: string; date: Date } | null => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureWorkDays = Array.from(roster.values())
            .filter(day => day.type === "working" && day.date >= today)
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (futureWorkDays.length > 0) {
            const nextShift = futureWorkDays[0];
            return {
                day: nextShift.date.toLocaleDateString('en-US', { weekday: 'long' }),
                date: nextShift.date
            };
        }

        return null;
    }, [roster]); // Depends on roster

    // Get next day off - Optimized with useCallback
    const getNextDayOff = useCallback((): { day: string; date: Date; daysFromNow: number } | null => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureDaysOff = Array.from(roster.values())
            .filter(day => day.type === "off" && day.date >= today)
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (futureDaysOff.length > 0) {
            const nextDayOff = futureDaysOff[0];
            const daysFromNow = Math.ceil(
                (nextDayOff.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
                day: nextDayOff.date.toLocaleDateString('en-US', { weekday: 'long' }),
                date: nextDayOff.date,
                daysFromNow
            };
        }

        return null;
    }, [roster]); // Depends on roster

    // Calculate total hours this week - Optimized with useCallback
    const getTotalHoursThisWeek = useCallback((): number => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        let totalHours = 0;

        roster.forEach((dayData) => {
            if (
                dayData.type === "working" &&
                dayData.date >= startOfWeek &&
                dayData.date <= endOfWeek
            ) {
                const [startHour, startMin] = dayData.shiftStart.split(':').map(Number);
                const [endHour, endMin] = dayData.shiftEnd.split(':').map(Number);

                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                const duration = (endMinutes - startMinutes) / 60;

                totalHours += duration;
            }
        });

        return totalHours;
    }, [roster]); // Depends on roster

    return (
        <RosterContext.Provider
            value={{
                roster,
                setRoster,
                getNextShift,
                getNextDayOff,
                getTotalHoursThisWeek,
                isLoading,
                syncRoster,
            }}
        >
            {children}
        </RosterContext.Provider>
    );
}

export const useRoster = () => {
    const context = useContext(RosterContext);
    if (!context) {
        throw new Error('useRoster must be used within RosterProvider');
    }
    return context;
};

// Export saveToSupabase for components to use - Optimized query
export const saveRosterToSupabase = async (userId: string, roster: Map<string, DayData>) => {
    if (!userId) return;

    try {
        const { data: existing } = await supabase
            .from('roster_entries')
            .select('date') // Only fetch date for comparison
            .eq('user_id', userId);

        const existingDates = new Set(existing?.map(e => e.date) || []);
        const newDates = new Set<string>();

        const entries = Array.from(roster.entries()).map(([key, data]) => {
            const dateStr = data.date.toISOString().split('T')[0];
            newDates.add(dateStr);

            return {
                user_id: userId,
                date: dateStr,
                type: data.type,
                shift_start: data.type === 'working' ? data.shiftStart : null,
                shift_end: data.type === 'working' ? data.shiftEnd : null,
            };
        });

        if (entries.length > 0) {
            await supabase
                .from('roster_entries')
                .upsert(entries, { onConflict: 'user_id,date' });
        }

        const toDelete = [...existingDates].filter(date => !newDates.has(date));
        if (toDelete.length > 0) {
            await supabase
                .from('roster_entries')
                .delete()
                .eq('user_id', userId)
                .in('date', toDelete);
        }
    } catch (error) {
        console.error('Error saving roster:', error);
    }
};