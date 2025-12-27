"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Loader2, Check, DollarSign, Clock, TrendingUp, Sun } from "lucide-react";
import { motion } from "framer-motion";

interface PayTabProps {
  userId: string;
  initialData: {
    hourlyRate: number;
    breakDuration: number;
    overtimeEnabled: boolean;
    overtimeThreshold: number;
    overtimeRate: number;
    sundayRate: number;
  };
  onUpdate: () => void;
}

export default function PayTab({ userId, initialData, onUpdate }: PayTabProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState(initialData);

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setSaved(false);

    console.log('💾 Saving pay settings:', {
      hourly_rate: formData.hourlyRate,
      break_duration: formData.breakDuration,
      overtime_enabled: formData.overtimeEnabled,
      overtime_threshold: formData.overtimeThreshold,
      overtime_rate: formData.overtimeRate,
      sunday_rate: formData.sundayRate,
    });

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        hourly_rate: formData.hourlyRate,
        break_duration: formData.breakDuration,
        overtime_enabled: formData.overtimeEnabled,
        overtime_threshold: formData.overtimeThreshold,
        overtime_rate: formData.overtimeRate,
        sunday_rate: formData.sundayRate,
      })
      .eq('user_id', userId)
      .select();

    setSaving(false);

    if (error) {
      console.error('❌ Error saving pay settings:', error);
      alert('Failed to save settings: ' + error.message);
    } else {
      console.log('✅ Pay settings saved successfully:', data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onUpdate();
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            Pay Settings
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-neutral-400">
            Configure your hourly rate, breaks, and premium pay calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Base Pay Section */}
          <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              Base Pay
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                  Hourly Rate (€) <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                    placeholder="13.50"
                    className="h-11 rounded-lg border-slate-300 dark:border-neutral-700 pl-8"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-500 mt-2">
                  Your standard hourly pay rate
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                  Break Duration (minutes)
                </Label>
                <div className="relative mt-2">
                  <Input
                    type="number"
                    min="0"
                    step="15"
                    value={formData.breakDuration}
                    onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 0 })}
                    placeholder="30"
                    className="h-11 rounded-lg border-slate-300 dark:border-neutral-700"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">min</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-500 mt-2">
                  Unpaid break time per shift
                </p>
              </div>
            </div>

            {/* Weekly Earnings Preview */}
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Estimated Weekly Earnings</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    €{(() => {
                      const baseHours = 40;
                      let earnings = 0;

                      if (formData.overtimeEnabled && baseHours > formData.overtimeThreshold) {
                        // Calculate with overtime
                        const regularHours = formData.overtimeThreshold;
                        const overtimeHours = baseHours - formData.overtimeThreshold;
                        earnings = (regularHours * formData.hourlyRate) + (overtimeHours * formData.hourlyRate * formData.overtimeRate);
                      } else {
                        // No overtime
                        earnings = baseHours * formData.hourlyRate;
                      }

                      return earnings.toFixed(2);
                    })()}
                  </p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                    Based on 40 hours/week {formData.overtimeEnabled && formData.overtimeThreshold < 40 && `(${formData.overtimeThreshold}h regular + ${40 - formData.overtimeThreshold}h OT)`}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600/30 dark:text-green-400/30" />
              </div>
            </div>
          </div>

          {/* Overtime Section */}
          <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Overtime Settings
              </div>
              <button
                onClick={() => setFormData({ ...formData, overtimeEnabled: !formData.overtimeEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.overtimeEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-neutral-700'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.overtimeEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            {formData.overtimeEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                    Overtime Threshold (hours/week)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.overtimeThreshold}
                    onChange={(e) => setFormData({ ...formData, overtimeThreshold: parseInt(e.target.value) || 40 })}
                    placeholder="40"
                    className="mt-2 h-11 rounded-lg border-slate-300 dark:border-neutral-700"
                  />
                  <p className="text-xs text-slate-500 dark:text-neutral-500 mt-2">
                    Hours before overtime kicks in
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                    Overtime Rate Multiplier
                  </Label>
                  <select
                    value={formData.overtimeRate}
                    onChange={(e) => setFormData({ ...formData, overtimeRate: parseFloat(e.target.value) })}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 mt-2 text-slate-900 dark:text-white"
                  >
                    <option value="1.25">1.25× (Time and quarter)</option>
                    <option value="1.5">1.5× (Time and half)</option>
                    <option value="2">2× (Double time)</option>
                    <option value="2.5">2.5× (Double time and half)</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-neutral-500 mt-2">
                    Pay rate = €{formData.hourlyRate.toFixed(2)} × {formData.overtimeRate} = €{(formData.hourlyRate * formData.overtimeRate).toFixed(2)}/hr
                  </p>
                </div>
              </motion.div>
            )}

            {!formData.overtimeEnabled && (
              <p className="text-sm text-slate-500 dark:text-neutral-500 italic">
                Overtime calculation is currently disabled
              </p>
            )}
          </div>

          {/* Sunday Premium Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
              <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Sunday Premium Rate
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                Sunday Rate Multiplier
              </Label>
              <select
                value={formData.sundayRate}
                onChange={(e) => setFormData({ ...formData, sundayRate: parseFloat(e.target.value) })}
                className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 mt-2 text-slate-900 dark:text-white"
              >
                <option value="1">1× (Standard rate)</option>
                <option value="1.5">1.5× (Time and half)</option>
                <option value="2">2× (Double time)</option>
                <option value="2.5">2.5× (Double time and half)</option>
              </select>
              <p className="text-xs text-slate-500 dark:text-neutral-500 mt-2">
                Sunday pay rate = €{formData.hourlyRate.toFixed(2)} × {formData.sundayRate} = €{(formData.hourlyRate * formData.sundayRate).toFixed(2)}/hr
              </p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Sunday Premium Active</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    All Sunday shifts will be calculated at {formData.sundayRate}× your hourly rate
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-neutral-800">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 rounded-lg font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}