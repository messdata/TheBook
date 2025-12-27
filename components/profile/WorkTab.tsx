"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Loader2, Check, Briefcase, Building2, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface WorkTabProps {
  userId: string;
  initialData: {
    companyName: string;
    jobType: string;
    profession: string;
    city: string;
    county: string;
    eircode: string;
  };
  onUpdate: () => void;
}

export default function WorkTab({ userId, initialData, onUpdate }: WorkTabProps) {
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
        company_name: formData.companyName,
        job_type: formData.jobType,
        profession: formData.profession,
        city: formData.city,
        county: formData.county,
        eir: formData.eircode,
      })
      .eq('user_id', userId);

    setSaving(false);

    if (!error) {
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
            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Work Details
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-neutral-400">
            Update your employment and workplace information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Company Section */}
          <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Company Information
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Acme Corp"
                className="mt-2 h-11 rounded-lg border-slate-300 dark:border-neutral-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                  Job Type <span className="text-red-500">*</span>
                </Label>
                <select
                  value={formData.jobType}
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 mt-2 text-slate-900 dark:text-white"
                >
                  <option value="">Select type</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                  Profession / Job Title
                </Label>
                <Input
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  placeholder="Software Engineer"
                  className="mt-2 h-11 rounded-lg border-slate-300 dark:border-neutral-700"
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Work Location
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Dublin"
                  className="mt-2 h-11 rounded-lg border-slate-300 dark:border-neutral-700"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">County</Label>
                <select
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 mt-2 text-slate-900 dark:text-white"
                >
                  <option value="">Select county</option>
                  <option value="Dublin">Dublin</option>
                  <option value="Cork">Cork</option>
                  <option value="Galway">Galway</option>
                  <option value="Limerick">Limerick</option>
                  <option value="Waterford">Waterford</option>
                  <option value="Kildare">Kildare</option>
                  <option value="Meath">Meath</option>
                  <option value="Wicklow">Wicklow</option>
                  <option value="Kerry">Kerry</option>
                  <option value="Clare">Clare</option>
                  <option value="Tipperary">Tipperary</option>
                  <option value="Wexford">Wexford</option>
                  <option value="Kilkenny">Kilkenny</option>
                  <option value="Carlow">Carlow</option>
                  <option value="Laois">Laois</option>
                  <option value="Offaly">Offaly</option>
                  <option value="Westmeath">Westmeath</option>
                  <option value="Longford">Longford</option>
                  <option value="Louth">Louth</option>
                  <option value="Cavan">Cavan</option>
                  <option value="Monaghan">Monaghan</option>
                  <option value="Donegal">Donegal</option>
                  <option value="Sligo">Sligo</option>
                  <option value="Leitrim">Leitrim</option>
                  <option value="Roscommon">Roscommon</option>
                  <option value="Mayo">Mayo</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Eircode</Label>
              <Input
                value={formData.eircode}
                onChange={(e) => setFormData({ ...formData, eircode: e.target.value.toUpperCase() })}
                placeholder="D01 F5P2"
                maxLength={8}
                className="mt-2 h-11 rounded-lg border-slate-300 dark:border-neutral-700 uppercase"
              />
              <p className="text-xs text-slate-500 dark:text-neutral-500 mt-2">
                Irish postal code (e.g., D01 F5P2)
              </p>
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