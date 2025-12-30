"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SignUpFormContentProps {
  onSuccess: () => void;
}

// Reusable Ledger Input Component
const LedgerInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  step
}: any) => (
  <div className="group space-y-1.5 md:space-y-2">
    <label className="text-[8px] md:text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] group-focus-within:text-blue-600 transition-colors">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative border-b border-slate-200 group-focus-within:border-blue-600 transition-all">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        className="w-full bg-transparent py-2 text-sm md:text-base outline-none placeholder:text-slate-300 text-slate-900 appearance-none"
        required={required}
      />
    </div>
  </div>
);

// Ledger Select Component
const LedgerSelect = ({ label, value, onChange, options, required = false }: any) => (
  <div className="group space-y-1.5 md:space-y-2">
    <label className="text-[8px] md:text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] group-focus-within:text-blue-600 transition-colors">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative border-b border-slate-200 group-focus-within:border-blue-600 transition-all">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-2 text-sm md:text-base outline-none text-slate-900 appearance-none"
        required={required}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  </div>
);

export default function SignUpFormContent({ onSuccess }: SignUpFormContentProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    middle_name: "",
    surname: "",
    username: "",
    phone_number: "",
    profession: "",
    job_type: "",
    company_name: "",
    city: "",
    county: "",
    hourly_rate: "13.50",
    break_duration: "30",
    overtime_enabled: true,
    overtime_threshold: "40",
    overtime_rate: "1.5",
    sunday_rate: "2.0",
    currency: "EUR",
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError("Please fill in all required fields");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    if (step === 2) {
      if (!formData.first_name || !formData.surname || !formData.username) {
        setError("Please fill in all required fields");
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
      setError("");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({
            first_name: formData.first_name,
            middle_name: formData.middle_name || null,
            surname: formData.surname,
            username: formData.username,
            phone_number: formData.phone_number || null,
            profession: formData.profession || null,
            job_type: formData.job_type || null,
            company_name: formData.company_name || null,
            city: formData.city || null,
            county: formData.county || null,
            hourly_rate: parseFloat(formData.hourly_rate),
            break_duration: parseInt(formData.break_duration),
            overtime_enabled: formData.overtime_enabled,
            overtime_threshold: parseInt(formData.overtime_threshold),
            overtime_rate: parseFloat(formData.overtime_rate),
            sunday_rate: parseFloat(formData.sunday_rate),
            currency: formData.currency,
            onboarding_completed: true,
          })
          .eq('user_id', authData.user.id);

        if (updateError) throw updateError;

        onSuccess();
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex gap-2 mb-6 md:mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 transition-all ${step >= s ? "bg-blue-600" : "bg-slate-100"}`}
          />
        ))}
      </div>

      {/* Header */}
      <h2 className="text-xl md:text-2xl font-serif italic text-slate-900 mb-6 md:mb-8">
        Section 0{step}
      </h2>

      <div className="min-h-[200px] md:min-h-[250px] space-y-5 md:space-y-6">
        {/* Step 1: Authentication */}
        {step === 1 && (
          <>
            <LedgerInput
              label="EMAIL ADDRESS"
              type="email"
              value={formData.email}
              onChange={(v: string) => updateField("email", v)}
              placeholder="user@archive.com"
              required
            />
            <LedgerInput
              label="PASSWORD"
              type="password"
              value={formData.password}
              onChange={(v: string) => updateField("password", v)}
              placeholder="Min. 6 characters"
              required
            />
            <LedgerInput
              label="CONFIRM PASSWORD"
              type="password"
              value={formData.confirmPassword}
              onChange={(v: string) => updateField("confirmPassword", v)}
              placeholder="Re-enter password"
              required
            />
          </>
        )}

        {/* Step 2: Personal Information */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <LedgerInput
                label="FIRST NAME"
                value={formData.first_name}
                onChange={(v: string) => updateField("first_name", v)}
                placeholder="John"
                required
              />
              <LedgerInput
                label="MIDDLE NAME"
                value={formData.middle_name}
                onChange={(v: string) => updateField("middle_name", v)}
                placeholder="Optional"
              />
            </div>
            <LedgerInput
              label="SURNAME"
              value={formData.surname}
              onChange={(v: string) => updateField("surname", v)}
              placeholder="Doe"
              required
            />
            <LedgerInput
              label="USERNAME"
              value={formData.username}
              onChange={(v: string) => updateField("username", v)}
              placeholder="system_id"
              required
            />
            <LedgerInput
              label="PHONE NUMBER"
              type="tel"
              value={formData.phone_number}
              onChange={(v: string) => updateField("phone_number", v)}
              placeholder="+353 XX XXX XXXX"
            />
          </>
        )}

        {/* Step 3: Work Details */}
        {step === 3 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <LedgerInput
                label="PROFESSION"
                value={formData.profession}
                onChange={(v: string) => updateField("profession", v)}
                placeholder="e.g., Developer"
              />
              <LedgerSelect
                label="JOB TYPE"
                value={formData.job_type}
                onChange={(v: string) => updateField("job_type", v)}
                options={[
                  { value: "", label: "Select..." },
                  { value: "full-time", label: "Full-time" },
                  { value: "part-time", label: "Part-time" },
                  { value: "contract", label: "Contract" },
                  { value: "freelance", label: "Freelance" },
                ]}
              />
            </div>
            <LedgerInput
              label="COMPANY NAME"
              value={formData.company_name}
              onChange={(v: string) => updateField("company_name", v)}
              placeholder="Your company"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <LedgerInput
                label="CITY"
                value={formData.city}
                onChange={(v: string) => updateField("city", v)}
                placeholder="Dublin"
              />
              <LedgerInput
                label="COUNTY"
                value={formData.county}
                onChange={(v: string) => updateField("county", v)}
                placeholder="Dublin"
              />
            </div>
          </>
        )}

        {/* Step 4: Pay Settings */}
        {step === 4 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <LedgerInput
                label="HOURLY RATE (€)"
                type="number"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(v: string) => updateField("hourly_rate", v)}
                placeholder="13.50"
              />
              <LedgerInput
                label="BREAK (MINS)"
                type="number"
                value={formData.break_duration}
                onChange={(v: string) => updateField("break_duration", v)}
                placeholder="30"
              />
            </div>
            <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 border border-slate-200 rounded-sm">
              <input
                type="checkbox"
                id="overtime"
                checked={formData.overtime_enabled}
                onChange={(e) => updateField("overtime_enabled", e.target.checked)}
                className="h-3.5 w-3.5 md:h-4 md:w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
              <label htmlFor="overtime" className="text-xs md:text-sm font-medium text-slate-700">
                Enable Overtime Tracking
              </label>
            </div>
            {formData.overtime_enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <LedgerInput
                  label="OT THRESHOLD (HRS)"
                  type="number"
                  value={formData.overtime_threshold}
                  onChange={(v: string) => updateField("overtime_threshold", v)}
                  placeholder="40"
                />
                <LedgerInput
                  label="OT RATE (X)"
                  type="number"
                  step="0.1"
                  value={formData.overtime_rate}
                  onChange={(v: string) => updateField("overtime_rate", v)}
                  placeholder="1.5"
                />
                <LedgerInput
                  label="SUNDAY RATE (X)"
                  type="number"
                  step="0.1"
                  value={formData.sunday_rate}
                  onChange={(v: string) => updateField("sunday_rate", v)}
                  placeholder="2.0"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 md:mt-6 rounded-sm bg-red-50 border-l-2 border-red-500 p-3 md:p-4 text-xs md:text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 md:mt-8 pt-4 border-t border-slate-100">
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-[9px] md:text-[10px] uppercase font-bold text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft size={14} />
            Back
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="ml-auto bg-slate-900 text-white px-5 md:px-6 py-3 md:py-3.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
        >
          {loading ? "Processing..." : step === 4 ? "Finalize" : "Next"}
          <ChevronRight size={14} />
        </button>
      </div>
    </form>
  );
}
