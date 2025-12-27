"use client";

import { motion } from "framer-motion";
import { X, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ShiftData {
  date: Date;
  day: string;
  hours: number;
  isSunday: boolean;
}

interface WeeklyCalculation {
  regularHours: number;
  overtimeHours: number;
  sundayHours: number;
  regularPay: number;
  overtimePay: number;
  sundayPay: number;
  totalPay: number;
  shifts: ShiftData[];
  weekStart: Date;
  weekEnd: Date;
}

interface PaySlipProps {
  data: WeeklyCalculation;
  monthData?: WeeklyCalculation;
  mode: 'week' | 'month';
  setMode: (mode: 'week' | 'month') => void;
  hourlyRate: number;
  overtimeRate: number;
  sundayRate: number;
  currency: string;
  onClose: () => void;
}

export default function PaySlip({
  data,
  monthData,
  mode,
  setMode,
  hourlyRate,
  overtimeRate,
  sundayRate,
  currency,
  onClose,
}: PaySlipProps) {

  const [isSharing, setIsSharing] = useState(false);

  // Currency symbol helper - SINGLE IMPLEMENTATION
  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      EUR: '€', USD: '$', GBP: '£', JPY: '¥', CAD: '$', AUD: '$'
    };
    return symbols[curr] || '€';
  };

  const formatCurrency = (amount: number) => `${getCurrencySymbol(currency)}${amount.toFixed(2)}`;

  // Use month data if in month mode and available, otherwise use week data
  const displayData = mode === 'month' && monthData ? monthData : data;

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (isSharing) return;

    const currentData = mode === 'month' && monthData ? monthData : data;
    const shareData = {
      title: `Pay Slip: ${currentData.weekStart.toLocaleDateString()}`,
      text: `Statement for ${getCurrencySymbol(currency)}${currentData.totalPay.toFixed(2)} generated via The Book.`,
      url: window.location.href,
    };

    try {
      setIsSharing(true);

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert("Statement details copied to clipboard!");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error("Error sharing:", err);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm print:hidden"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
      >

        {/* Header - Soft Tabs */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-800 print:hidden bg-slate-50 dark:bg-neutral-950">
          <div className="flex gap-3">
            {['week', 'month'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m as 'week' | 'month')}
                className={`px-4 py-2 text-xs uppercase tracking-wider font-bold rounded-lg transition-all ${mode === m
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-neutral-800'
                  }`}
              >
                {m}ly
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-full transition-all hover:rotate-90 duration-300"
          >
            <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>

        <div className="p-8 md:p-10 overflow-y-auto">
          {/* Header Branding */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              {mode === 'week' ? 'Weekly' : 'Monthly'} Statement
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8 pb-6 border-b border-slate-200 dark:border-neutral-800">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Period</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {displayData.weekStart.toLocaleDateString()} — {displayData.weekEnd.toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Status</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                Verified
              </span>
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="space-y-4 mb-10">
            <div className="flex justify-between items-center p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
              <div>
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">Regular Pay</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {displayData.regularHours.toFixed(2)}h @ {formatCurrency(hourlyRate)}
                </span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(displayData.regularPay)}</span>
            </div>

            {displayData.overtimeHours > 0 && (
              <div className="flex justify-between items-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div>
                  <span className="block text-sm font-semibold text-blue-900 dark:text-blue-200">Overtime Premium</span>
                  <span className="text-xs text-blue-700 dark:text-blue-300">
                    {displayData.overtimeHours.toFixed(2)}h @ x{overtimeRate} Rate
                  </span>
                </div>
                <span className="font-semibold text-blue-900 dark:text-blue-200">
                  +{formatCurrency(displayData.overtimePay)}
                </span>
              </div>
            )}

            {displayData.sundayHours > 0 && (
              <div className="flex justify-between items-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div>
                  <span className="block text-sm font-semibold text-purple-900 dark:text-purple-200">Sunday Premium</span>
                  <span className="text-xs text-purple-700 dark:text-purple-300">
                    {displayData.sundayHours.toFixed(2)}h @ x{sundayRate} Rate
                  </span>
                </div>
                <span className="font-semibold text-purple-900 dark:text-purple-200">
                  +{formatCurrency(displayData.sundayPay)}
                </span>
              </div>
            )}
          </div>

          {/* Large Total Display */}
          <div className="border-t-2 border-slate-300 dark:border-neutral-700 pt-6 mb-4">
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Net Amount
              </span>
              <span className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(displayData.totalPay)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto border-t border-slate-200 dark:border-neutral-800 grid grid-cols-2 print:hidden bg-slate-50 dark:bg-neutral-950">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 h-14 border-r border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all group"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Print</span>
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center justify-center gap-2 h-14 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all group"
          >
            <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Share</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
}