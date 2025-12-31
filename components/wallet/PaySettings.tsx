"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Clock, TrendingUp, Loader2, Calendar, Wallet, Percent, Info } from "lucide-react";

interface PaySettingsProps {
  userId: string;
  initialData: {
    hourlyRate: number;
    breakDuration: number;
    overtimeEnabled: boolean;
    overtimeThreshold: number;
    overtimeRate: number;
    sundayRate: number;
    payFrequency?: string;
    payDayWeekly?: number;
    payDayMonthly?: number;
    payStartDate?: string;
  };
  onUpdate: () => void;
}

export default function PaySettings({ userId, initialData, onUpdate }: PaySettingsProps) {
  const [formData, setFormData] = useState({
    ...initialData,
    payFrequency: initialData.payFrequency || 'monthly',
    payDayWeekly: initialData.payDayWeekly || 5,
    payDayMonthly: initialData.payDayMonthly || 1,
    payStartDate: initialData.payStartDate || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          hourly_rate: formData.hourlyRate,
          break_duration: formData.breakDuration,
          overtime_enabled: formData.overtimeEnabled,
          overtime_threshold: formData.overtimeThreshold,
          overtime_rate: formData.overtimeRate,
          sunday_rate: formData.sundayRate,
          pay_frequency: formData.payFrequency,
          pay_day_weekly: formData.payDayWeekly,
          pay_day_monthly: formData.payDayMonthly,
          pay_start_date: formData.payStartDate || null,
        })
        .eq("user_id", userId);

      if (error) throw error;
      setMessage("Settings updated successfully!");
      onUpdate();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Error saving settings");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full border-slate-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm shadow-xl">
      <CardHeader className="border-b border-slate-100 dark:border-neutral-800 pb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Pay & Rates</CardTitle>
            <CardDescription>Configure how your earnings and overtime are calculated</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 pt-6">
        {/* Base Rates Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Base Rates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (€)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  className="pl-9 bg-white dark:bg-neutral-950"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakDuration">Unpaid Break (Minutes)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="breakDuration"
                  type="number"
                  className="pl-9 bg-white dark:bg-neutral-950"
                  value={formData.breakDuration}
                  onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Overtime & Special Rates Section */}
        <section className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/40 border border-slate-100 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Overtime & Specials
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-neutral-400">Enable Overtime</span>
              <Switch
                checked={formData.overtimeEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, overtimeEnabled: checked })}
              />
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity duration-200 ${!formData.overtimeEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="space-y-2">
              <Label>OT Threshold (Hrs)</Label>
              <Input
                type="number"
                className="bg-white dark:bg-neutral-950"
                value={formData.overtimeThreshold}
                onChange={(e) => setFormData({ ...formData, overtimeThreshold: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>OT Rate (Multiplier)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  step="0.1"
                  className="pl-9 bg-white dark:bg-neutral-950"
                  value={formData.overtimeRate}
                  onChange={(e) => setFormData({ ...formData, overtimeRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sunday Multiplier</Label>
              <Input
                type="number"
                step="0.1"
                className="bg-white dark:bg-neutral-950"
                value={formData.sundayRate}
                onChange={(e) => setFormData({ ...formData, sundayRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </section>

        {/* Pay Cycle Section with Calendar Widget */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Pay Cycle
            </h3>
            <Select
              value={formData.payFrequency}
              onValueChange={(value) => setFormData({ ...formData, payFrequency: value })}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm bg-white dark:bg-neutral-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="fortnightly">Fortnightly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50/50 to-slate-50/50 dark:from-blue-950/20 dark:to-neutral-900/30 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <div className="mb-3 sm:mb-4 flex items-start gap-2 text-xs text-slate-600 dark:text-neutral-400">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">Select your recurring pay day - you'll get reminders 24 hours in advance</span>
            </div>

            {/* WEEKLY */}
            {formData.payFrequency === 'weekly' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
                {[
                  { value: 1, label: 'Monday', abbr: 'MON' },
                  { value: 2, label: 'Tuesday', abbr: 'TUE' },
                  { value: 3, label: 'Wednesday', abbr: 'WED' },
                  { value: 4, label: 'Thursday', abbr: 'THU' },
                  { value: 5, label: 'Friday', abbr: 'FRI' },
                  { value: 6, label: 'Saturday', abbr: 'SAT' },
                  { value: 0, label: 'Sunday', abbr: 'SUN' },
                ].map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, payDayWeekly: day.value })}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all ${formData.payDayWeekly === day.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                  >
                    <div className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-neutral-500 mb-0.5 md:mb-1">
                      {day.abbr}
                    </div>
                    <div className="text-[10px] md:text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {day.label}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* FORTNIGHTLY */}
            {formData.payFrequency === 'fortnightly' && (
              <div className="space-y-3 sm:space-y-4">
                {/* Day of week selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                    Which day do you get paid?
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
                    {[
                      { value: 1, label: 'Monday', abbr: 'MON' },
                      { value: 2, label: 'Tuesday', abbr: 'TUE' },
                      { value: 3, label: 'Wednesday', abbr: 'WED' },
                      { value: 4, label: 'Thursday', abbr: 'THU' },
                      { value: 5, label: 'Friday', abbr: 'FRI' },
                      { value: 6, label: 'Saturday', abbr: 'SAT' },
                      { value: 0, label: 'Sunday', abbr: 'SUN' },
                    ].map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, payDayWeekly: day.value })}
                        className={`p-3 md:p-4 rounded-xl border-2 transition-all ${formData.payDayWeekly === day.value
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                      >
                        <div className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-neutral-500 mb-0.5 md:mb-1">
                          {day.abbr}
                        </div>
                        <div className="text-[10px] md:text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {day.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Last Pay Date Input */}
                <div className="space-y-2 p-3 sm:p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="payStartDate" className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                        Last Pay Date (Reference Point)
                      </Label>
                      <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        Enter any recent pay day. We'll use this to calculate your fortnightly cycle.
                      </p>
                      <Input
                        id="payStartDate"
                        type="date"
                        className="bg-white dark:bg-neutral-900 border-amber-200 dark:border-amber-800 text-sm h-10"
                        value={formData.payStartDate || ''}
                        onChange={(e) => setFormData({ ...formData, payStartDate: e.target.value })}
                        placeholder="Select your last pay date"
                      />
                      {formData.payStartDate && formData.payDayWeekly !== undefined && (
                        <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium mt-2 leading-relaxed">
                          ✓ Next pay days will be every other {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][formData.payDayWeekly]} starting from this date
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MONTHLY */}
            {formData.payFrequency === 'monthly' && (
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setFormData({ ...formData, payDayMonthly: day })}
                    className={`aspect-square flex items-center justify-center text-xs sm:text-sm font-bold rounded-md sm:rounded-lg transition-all ${formData.payDayMonthly === day
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 z-10"
                      : "bg-white dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-800"
                      }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-neutral-800">
          {message && (
            <span className={`text-sm font-medium ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save All Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
