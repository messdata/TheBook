"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Loader2, Check, Settings, Globe, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface PreferencesTabProps {
  userId: string;
  initialData: {
    currency: string;
    weekStartDay: number;
  };
  onUpdate: () => void;
}

export default function PreferencesTab({ userId, initialData, onUpdate }: PreferencesTabProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState(initialData);

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        currency: formData.currency,
        week_start_day: formData.weekStartDay,
      })
      .eq('user_id', userId);

    setSaving(false);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onUpdate();
    }
  };

  const getDayName = (dayValue: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayValue] || 'Sunday';
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
            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Preferences
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-neutral-400">
            Customize your app experience and display settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Localization Section */}
          <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
              <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Localization
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                Currency
              </Label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 mt-2 text-slate-900 dark:text-white"
              >
                <option value="EUR">€ Euro (EUR)</option>
                <option value="USD">$ US Dollar (USD)</option>
                <option value="GBP">£ British Pound (GBP)</option>
                <option value="JPY">¥ Japanese Yen (JPY)</option>
                <option value="CAD">$ Canadian Dollar (CAD)</option>
                <option value="AUD">$ Australian Dollar (AUD)</option>
              </select>
              <p className="text-xs text-slate-500 dark:text-neutral-500 mt-2">
                Used for displaying prices and earnings
              </p>
            </div>
          </div>

          {/* Week Start Day Section */}
          <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Calendar Settings
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                Week Starts On
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3 mt-2">
                {[
                  { value: 0, label: 'Sunday', abbr: 'SUN' },
                  { value: 1, label: 'Monday', abbr: 'MON' },
                  { value: 2, label: 'Tuesday', abbr: 'TUE' },
                  { value: 3, label: 'Wednesday', abbr: 'WED' },
                  { value: 4, label: 'Thursday', abbr: 'THU' },
                  { value: 5, label: 'Friday', abbr: 'FRI' },
                  { value: 6, label: 'Saturday', abbr: 'SAT' },
                ].map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, weekStartDay: day.value })}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all ${formData.weekStartDay === day.value
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
              <p className="text-xs text-slate-500 dark:text-neutral-500 mt-2">
                First day of the week in calendar and roster views
              </p>
            </div>
          </div>

          {/* Preview Card */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">Current Settings</p>
                <div className="text-xs text-purple-700 dark:text-purple-300 mt-2 space-y-1">
                  <p>• Currency: <span className="font-semibold">{formData.currency}</span></p>
                  <p>• Week starts: <span className="font-semibold">{getDayName(formData.weekStartDay)}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-neutral-800">
            <Button
              type="button"
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
