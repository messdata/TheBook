"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";

interface PersonalTabProps {
  userId: string;
  initialData: {
    firstName: string;
    surname: string;
    email: string;
    phoneNumber: string;
    username: string;
    avatarUrl: string;
  };
  onUpdate: () => void;
}

export default function PersonalTab({ userId, initialData, onUpdate }: PersonalTabProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({ firstName: "", surname: "" });

  // Calculate initials
  const getInitials = () => {
    const fullName = `${formData.firstName} ${formData.surname}`.trim();
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  const handleSave = async () => {
    if (!userId) return;

    // Validate required fields
    const newErrors = { firstName: "", surname: "" };
    let isValid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    }

    if (!formData.surname.trim()) {
      newErrors.surname = "Surname is required";
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        first_name: formData.firstName.trim(),
        surname: formData.surname.trim(),
        phone_number: formData.phoneNumber.trim(),
        username: formData.username.trim(),
        avatar_url: formData.avatarUrl.trim(),
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
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Personal Information</CardTitle>
          <CardDescription className="text-slate-600 dark:text-neutral-400">
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Avatar Section */}
          <div className="flex items-center gap-6 pb-6 border-b border-slate-200 dark:border-neutral-800">
            <Avatar className="w-24 h-24 border-4 border-slate-200 dark:border-neutral-700">
              <AvatarImage src={formData.avatarUrl} alt={formData.firstName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-2xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Avatar URL</Label>
              <Input
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                className="mt-2 h-11 rounded-lg border-slate-300 dark:border-neutral-700"
              />
              <p className="text-xs text-slate-500 dark:text-neutral-500 mt-2">
                💡 Right-click an image → "Copy Image Address" or use Imgur/ImgBB
              </p>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value });
                  if (errors.firstName) setErrors({ ...errors, firstName: "" });
                }}
                placeholder="John"
                className={`mt-2 h-11 rounded-lg ${errors.firstName
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-slate-300 dark:border-neutral-700"
                  }`}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                Surname <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.surname}
                onChange={(e) => {
                  setFormData({ ...formData, surname: e.target.value });
                  if (errors.surname) setErrors({ ...errors, surname: "" });
                }}
                placeholder="Doe"
                className={`mt-2 h-11 rounded-lg ${errors.surname
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-slate-300 dark:border-neutral-700"
                  }`}
              />
              {errors.surname && (
                <p className="text-xs text-red-500 mt-1">{errors.surname}</p>
              )}
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Email</Label>
            <Input
              value={formData.email}
              disabled
              className="mt-2 h-11 rounded-lg border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 dark:text-neutral-500 mt-2">
              Email cannot be changed from here
            </p>
          </div>

          {/* Username */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Username</Label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="johndoe"
              className="mt-2 h-11 rounded-lg border-slate-300 dark:border-neutral-700"
            />
          </div>

          {/* Phone Number */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Phone Number</Label>
            <Input
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+353 87 123 4567"
              className="mt-2 h-11 rounded-lg border-slate-300 dark:border-neutral-700"
            />
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