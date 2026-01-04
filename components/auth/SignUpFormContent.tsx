"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AlertCircle, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SignUpFormContentProps {
  onSuccess: () => void;
  onStepChange?: (step: number) => void;
}

// Glass Input Component
const GlassInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  step,
  error,
  onBlur
}: any) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-white/80">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      step={step}
      className={`w-full rounded-2xl border-2 ${error ? 'border-red-400' : 'border-white/30 focus:border-blue-400'
        } bg-white/10 backdrop-blur-sm px-4 py-3 text-base text-white placeholder:text-white/40 outline-none transition-all`}
    />
    {error && (
      <div className="flex items-center gap-1.5 text-red-300 text-xs">
        <AlertCircle size={14} />
        <span>{error}</span>
      </div>
    )}
  </div>
);

// Glass Select Component
const GlassSelect = ({ label, value, onChange, options, required = false }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-white/80">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border-2 border-white/30 focus:border-blue-400 bg-white/10 backdrop-blur-sm px-4 py-3 text-base text-white outline-none transition-all appearance-none"
      required={required}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value} className="bg-slate-900">
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export default function SignUpFormContent({ onSuccess, onStepChange }: SignUpFormContentProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const supabase = createClient();

  // Field errors
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    surname: "",
    username: "",
  });

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
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email";
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords don't match";
    return "";
  };

  const validateRequired = (value: string, fieldName: string) => {
    if (!value) return `${fieldName} is required`;
    return "";
  };

  // Validate current step
  const validateCurrentStep = () => {
    if (currentStep === 1) {
      const emailErr = validateEmail(formData.email);
      const passwordErr = validatePassword(formData.password);
      const confirmPasswordErr = validateConfirmPassword(formData.confirmPassword, formData.password);

      setErrors((prev) => ({
        ...prev,
        email: emailErr,
        password: passwordErr,
        confirmPassword: confirmPasswordErr,
      }));

      return !emailErr && !passwordErr && !confirmPasswordErr;
    }

    if (currentStep === 2) {
      const firstNameErr = validateRequired(formData.first_name, "First name");
      const surnameErr = validateRequired(formData.surname, "Surname");
      const usernameErr = validateRequired(formData.username, "Username");

      setErrors((prev) => ({
        ...prev,
        first_name: firstNameErr,
        surname: surnameErr,
        username: usernameErr,
      }));

      return !firstNameErr && !surnameErr && !usernameErr;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < 4) {
      setDirection(1);
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          throw new Error("Email already registered. Please sign in instead.");
        }
        throw authError;
      }

      if (authData?.user) {
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
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setLoading(false);
    }
  };

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <motion.div
            key={s}
            className="h-1.5 flex-1 rounded-full"
            initial={false}
            animate={{
              backgroundColor: currentStep >= s ? '#3b82f6' : 'rgba(255,255,255,0.1)',
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Step Content with Animation */}
      <div className="relative overflow-hidden min-h-[320px]">
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full"
          >
            {currentStep === 1 && (
              <div className="space-y-5">
                <GlassInput
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(v: string) => updateField("email", v)}
                  placeholder="your@email.com"
                  error={errors.email}
                  onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(formData.email) }))}
                  required
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      onBlur={() => setErrors((prev) => ({ ...prev, password: validatePassword(formData.password) }))}
                      placeholder="Min. 6 characters"
                      className={`w-full rounded-2xl border-2 ${errors.password ? 'border-red-400' : 'border-white/30 focus:border-blue-400'
                        } bg-white/10 backdrop-blur-sm px-4 py-3 pr-12 text-base text-white placeholder:text-white/40 outline-none transition-all`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/60 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center gap-1.5 text-red-300 text-xs">
                      <AlertCircle size={14} />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      onBlur={() => setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(formData.confirmPassword, formData.password) }))}
                      placeholder="Re-enter password"
                      className={`w-full rounded-2xl border-2 ${errors.confirmPassword ? 'border-red-400' : 'border-white/30 focus:border-blue-400'
                        } bg-white/10 backdrop-blur-sm px-4 py-3 pr-12 text-base text-white placeholder:text-white/40 outline-none transition-all`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/60 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="flex items-center gap-1.5 text-red-300 text-xs">
                      <AlertCircle size={14} />
                      <span>{errors.confirmPassword}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <GlassInput
                    label="First Name"
                    value={formData.first_name}
                    onChange={(v: string) => updateField("first_name", v)}
                    placeholder="John"
                    error={errors.first_name}
                    onBlur={() => setErrors((prev) => ({ ...prev, first_name: validateRequired(formData.first_name, "First name") }))}
                    required
                  />
                  <GlassInput
                    label="Middle Name"
                    value={formData.middle_name}
                    onChange={(v: string) => updateField("middle_name", v)}
                    placeholder="Optional"
                  />
                </div>
                <GlassInput
                  label="Surname"
                  value={formData.surname}
                  onChange={(v: string) => updateField("surname", v)}
                  placeholder="Doe"
                  error={errors.surname}
                  onBlur={() => setErrors((prev) => ({ ...prev, surname: validateRequired(formData.surname, "Surname") }))}
                  required
                />
                <GlassInput
                  label="Username"
                  value={formData.username}
                  onChange={(v: string) => updateField("username", v)}
                  placeholder="johndoe"
                  error={errors.username}
                  onBlur={() => setErrors((prev) => ({ ...prev, username: validateRequired(formData.username, "Username") }))}
                  required
                />
                <GlassInput
                  label="Phone Number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(v: string) => updateField("phone_number", v)}
                  placeholder="+353 XX XXX XXXX"
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <GlassInput
                    label="Profession"
                    value={formData.profession}
                    onChange={(v: string) => updateField("profession", v)}
                    placeholder="Developer"
                  />
                  <GlassSelect
                    label="Job Type"
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
                <GlassInput
                  label="Company Name"
                  value={formData.company_name}
                  onChange={(v: string) => updateField("company_name", v)}
                  placeholder="Your Company"
                />
                <div className="grid grid-cols-2 gap-4">
                  <GlassInput
                    label="City"
                    value={formData.city}
                    onChange={(v: string) => updateField("city", v)}
                    placeholder="Dublin"
                  />
                  <GlassInput
                    label="County"
                    value={formData.county}
                    onChange={(v: string) => updateField("county", v)}
                    placeholder="Dublin"
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <GlassInput
                    label="Hourly Rate (€)"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(v: string) => updateField("hourly_rate", v)}
                    placeholder="13.50"
                  />
                  <GlassInput
                    label="Break (mins)"
                    type="number"
                    value={formData.break_duration}
                    onChange={(v: string) => updateField("break_duration", v)}
                    placeholder="30"
                  />
                </div>
                <div className="flex items-center gap-3 p-4 border-2 border-white/20 rounded-2xl bg-white/5">
                  <input
                    type="checkbox"
                    id="overtime"
                    checked={formData.overtime_enabled}
                    onChange={(e) => updateField("overtime_enabled", e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <label htmlFor="overtime" className="text-sm font-medium text-white/80">
                    Enable Overtime Tracking
                  </label>
                </div>
                {formData.overtime_enabled && (
                  <div className="grid grid-cols-3 gap-3">
                    <GlassInput
                      label="OT Threshold"
                      type="number"
                      value={formData.overtime_threshold}
                      onChange={(v: string) => updateField("overtime_threshold", v)}
                      placeholder="40"
                    />
                    <GlassInput
                      label="OT Rate (x)"
                      type="number"
                      step="0.1"
                      value={formData.overtime_rate}
                      onChange={(v: string) => updateField("overtime_rate", v)}
                      placeholder="1.5"
                    />
                    <GlassInput
                      label="Sunday (x)"
                      type="number"
                      step="0.1"
                      value={formData.sunday_rate}
                      onChange={(v: string) => updateField("sunday_rate", v)}
                      placeholder="2.0"
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-red-500/20 border border-red-500/50 p-3 flex items-start gap-2 text-sm text-red-200"
        >
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        {currentStep > 1 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </motion.button>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={currentStep === 4 ? handleComplete : handleNext}
          disabled={loading}
          className="ml-auto bg-white text-black px-8 py-3 text-sm font-bold rounded-2xl active:scale-[0.98] transition-all shadow-[0_10px_40px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </>
          ) : (
            <>
              {currentStep === 4 ? 'Create Account' : 'Next'}
              {currentStep < 4 && <ChevronRight size={16} />}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
