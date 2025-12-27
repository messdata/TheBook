"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Clock, TrendingUp, Loader2 } from "lucide-react";

interface PaySettingsProps {
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

export default function PaySettings({ userId, initialData, onUpdate }: PaySettingsProps) {
  const [formData, setFormData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from('user_profiles')
      .update({
        hourly_rate: formData.hourlyRate,
        break_duration: formData.breakDuration,
        overtime_enabled: formData.overtimeEnabled,
        overtime_threshold: formData.overtimeThreshold,
        overtime_rate: formData.overtimeRate,
        sunday_rate: formData.sundayRate,
      })
      .eq('user_id', userId);

    if (error) {
      setMessage("Failed to save settings");
    } else {
      setMessage("Settings saved successfully!");
      onUpdate();
    }

    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <Card className="bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Pay Settings
        </CardTitle>
        <p className="text-sm text-slate-600 dark:text-neutral-400">
          Configure your hourly rate, breaks, and overtime calculations
        </p>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Basic Pay */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hourlyRate" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Hourly Rate (€)
            </Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="breakDuration" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Break Duration (minutes)
            </Label>
            <Input
              id="breakDuration"
              type="number"
              value={formData.breakDuration}
              onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Overtime Settings */}
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4" />
                Overtime Enabled
              </Label>
              <p className="text-sm text-slate-600 dark:text-neutral-400">
                Calculate overtime pay for hours exceeding threshold
              </p>
            </div>
            <Switch
              checked={formData.overtimeEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, overtimeEnabled: checked })}
            />
          </div>

          {formData.overtimeEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-neutral-700">
              <div className="space-y-2">
                <Label htmlFor="overtimeThreshold">Weekly Threshold (hours)</Label>
                <Input
                  id="overtimeThreshold"
                  type="number"
                  value={formData.overtimeThreshold}
                  onChange={(e) => setFormData({ ...formData, overtimeThreshold: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="overtimeRate">Overtime Multiplier</Label>
                <Input
                  id="overtimeRate"
                  type="number"
                  step="0.1"
                  value={formData.overtimeRate}
                  onChange={(e) => setFormData({ ...formData, overtimeRate: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  e.g., 1.5 = time and a half
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sunday Premium */}
        <div className="space-y-2">
          <Label htmlFor="sundayRate">Sunday Premium Multiplier</Label>
          <Input
            id="sundayRate"
            type="number"
            step="0.1"
            value={formData.sundayRate}
            onChange={(e) => setFormData({ ...formData, sundayRate: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-xs text-slate-600 dark:text-neutral-400">
            e.g., 2.0 = double pay for Sunday shifts
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
          {message && (
            <span className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}