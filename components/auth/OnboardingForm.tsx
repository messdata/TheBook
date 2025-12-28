"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertCircle,
    ArrowLeft,
    User,
    Briefcase,
    Building2,
    ShieldCheck,
    Check
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface OnboardingFormProps {
    onBack: () => void;
    currentStep: number;
    onStepChange: (step: number) => void;
}

export default function OnboardingForm({ onBack, currentStep, onStepChange }: OnboardingFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        firstName: '',
        surname: '',
        email: '',
        profession: '',
        jobType: '',
        city: '',
        county: '',
        eir: '',
        companyName: '',
        companyEmail: '',
        companyContact: '',
        username: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
        if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
        if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
        return null;
    };

    const handleGoogleSignUp = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?from=signup`,
            },
        });
        if (error) {
            setErrors({ submit: error.message });
            setIsLoading(false);
        }
    };

    const handleStep1Next = async () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.surname) newErrors.surname = 'Surname is required';
        if (!formData.email) newErrors.email = 'Email is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: 'temporary_password_12345',
            options: {
                data: { full_name: `${formData.firstName} ${formData.surname}` },
            },
        });

        if (error) {
            setErrors({ submit: error.message });
            setIsLoading(false);
            return;
        }

        if (data.user) {
            setUserId(data.user.id);
            await supabase.from('user_profiles').insert({
                user_id: data.user.id,
                email: formData.email,
                first_name: formData.firstName,
                surname: formData.surname,
                auth_provider: 'email',
                onboarding_completed: false,
            });
            onStepChange(2);
        }
        setIsLoading(false);
    };

    const handleStep2Next = async () => {
        const newErrors: Record<string, string> = {};

        if (!formData.profession) newErrors.profession = 'Profession is required';
        if (!formData.jobType) newErrors.jobType = 'Job type is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (!formData.county) newErrors.county = 'County is required';
        if (!formData.eir) newErrors.eir = 'Eircode is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (userId) {
            await supabase.from('user_profiles').update({
                profession: formData.profession,
                job_type: formData.jobType,
                city: formData.city,
                county: formData.county,
                eircode: formData.eir,
            }).eq('user_id', userId);
        }

        onStepChange(3);
    };

    const handleStep3Next = async () => {
        const newErrors: Record<string, string> = {};
        if (!formData.companyName) newErrors.companyName = 'Company name is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (userId) {
            await supabase.from('user_profiles').update({
                company_name: formData.companyName,
                company_email: formData.companyEmail,
                company_contact: formData.companyContact,
            }).eq('user_id', userId);
        }

        onStepChange(4);
    };

    const handleFinalSubmit = async () => {
        const newErrors: Record<string, string> = {};

        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else {
            const passwordError = validatePassword(formData.password);
            if (passwordError) newErrors.password = passwordError;
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);

        if (userId) {
            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.password,
            });

            if (updateError) {
                setErrors({ submit: updateError.message });
                setIsLoading(false);
                return;
            }

            await supabase.from('user_profiles').update({
                username: formData.username,
                phone_number: formData.phoneNumber,
                onboarding_completed: true,
            }).eq('user_id', userId);

            router.push('/dashboard');
        }
        setIsLoading(false);
    };

    const renderStep = () => {
        const inputClass = "h-11 bg-slate-50 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400";

        switch (currentStep) {
            case 1:
                return (
                    <div className="flex flex-col md:flex-row h-full">
                        {/* Left Page */}
                        <div className="flex-1 p-6 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 bg-[#fafafa] flex flex-col">
                            <Button onClick={onBack} variant="ghost" className="w-fit mb-6 p-0 text-slate-600 hover:text-slate-900">
                                <ArrowLeft size={18} className="mr-2" />
                                <span className="text-xs uppercase font-bold">Back</span>
                            </Button>

                            <div className="flex-1 flex flex-col justify-center space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-blue-500/20 rounded-2xl">
                                        <User className="text-blue-500 w-6 h-6" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900">Personal.</h2>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Let's start with the basics. Your information is secure and private.
                                </p>
                            </div>
                        </div>

                        {/* Right Page */}
                        <div className="flex-1 p-6 md:p-12 bg-white flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Create your account</h3>
                                <p className="text-xs text-slate-600">Step 1 of 4</p>
                            </div>

                            {/* Google Sign Up */}
                            <Button
                                onClick={handleGoogleSignUp}
                                disabled={isLoading}
                                className="w-full h-11 md:h-12 rounded-xl bg-white text-black hover:bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm mb-4"
                            >
                                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
                                Continue with Google
                            </Button>

                            <div className="relative flex items-center gap-3 py-3 mb-4">
                                <div className="flex-1 h-[1px] bg-slate-200" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Or with email</span>
                                <div className="flex-1 h-[1px] bg-slate-200" />
                            </div>

                            <div className="space-y-3 flex-1">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">First Name *</Label>
                                    <Input
                                        className={`${inputClass} ${errors.firstName ? 'border-red-500' : ''}`}
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        placeholder="John"
                                    />
                                    {errors.firstName && (
                                        <div className="flex items-center gap-1.5 text-red-500 text-xs">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errors.firstName}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Surname *</Label>
                                    <Input
                                        className={`${inputClass} ${errors.surname ? 'border-red-500' : ''}`}
                                        value={formData.surname}
                                        onChange={(e) => handleInputChange('surname', e.target.value)}
                                        placeholder="Doe"
                                    />
                                    {errors.surname && (
                                        <div className="flex items-center gap-1.5 text-red-500 text-xs">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errors.surname}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Email *</Label>
                                    <Input
                                        type="email"
                                        className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder="john@example.com"
                                    />
                                    {errors.email && (
                                        <div className="flex items-center gap-1.5 text-red-500 text-xs">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errors.email}</span>
                                        </div>
                                    )}
                                </div>

                                {errors.submit && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-800">{errors.submit}</p>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleStep1Next}
                                disabled={isLoading}
                                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-md mt-4"
                            >
                                {isLoading ? "Creating account..." : "Continue"}
                            </Button>
                        </div>

                        <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/5 via-black/10 to-transparent pointer-events-none hidden md:block" />
                    </div>
                );

            case 2:
                return (
                    <div className="flex flex-col md:flex-row h-full">
                        <div className="flex-1 p-6 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 bg-[#fafafa] flex flex-col">
                            <Button onClick={() => onStepChange(1)} variant="ghost" className="w-fit mb-6 p-0 text-slate-600 hover:text-slate-900">
                                <ArrowLeft size={18} className="mr-2" />
                                <span className="text-xs uppercase font-bold">Back</span>
                            </Button>

                            <div className="flex-1 flex flex-col justify-center space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-orange-500/20 rounded-2xl">
                                        <Briefcase className="text-orange-500 w-6 h-6" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900">Professional.</h2>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Tell us about your work to personalize your experience.
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 p-6 md:p-12 bg-white flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Work details</h3>
                                <p className="text-xs text-slate-600">Step 2 of 4</p>
                            </div>

                            <div className="space-y-3 flex-1">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Profession *</Label>
                                    <Input
                                        className={`${inputClass} ${errors.profession ? 'border-red-500' : ''}`}
                                        placeholder="e.g., Software Engineer"
                                        value={formData.profession}
                                        onChange={(e) => handleInputChange('profession', e.target.value)}
                                    />
                                    {errors.profession && (
                                        <div className="flex items-center gap-1.5 text-red-500 text-xs">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errors.profession}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Job Type *</Label>
                                    <Input
                                        className={`${inputClass} ${errors.jobType ? 'border-red-500' : ''}`}
                                        placeholder="e.g., Full-time, Part-time"
                                        value={formData.jobType}
                                        onChange={(e) => handleInputChange('jobType', e.target.value)}
                                    />
                                    {errors.jobType && (
                                        <div className="flex items-center gap-1.5 text-red-500 text-xs">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errors.jobType}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">City *</Label>
                                        <Input
                                            className={`${inputClass} ${errors.city ? 'border-red-500' : ''}`}
                                            value={formData.city}
                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                            placeholder="Dublin"
                                        />
                                        {errors.city && (
                                            <div className="flex items-center gap-1.5 text-red-500 text-xs">
                                                <AlertCircle className="w-3 h-3" />
                                                <span>{errors.city}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">County *</Label>
                                        <Input
                                            className={`${inputClass} ${errors.county ? 'border-red-500' : ''}`}
                                            value={formData.county}
                                            onChange={(e) => handleInputChange('county', e.target.value)}
                                            placeholder="Leinster"
                                        />
                                        {errors.county && (
                                            <div className="flex items-center gap-1.5 text-red-500 text-xs">
                                                <AlertCircle className="w-3 h-3" />
                                                <span>{errors.county}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Eircode *</Label>
                                    <Input
                                        className={`${inputClass} ${errors.eir ? 'border-red-500' : ''}`}
                                        placeholder="A65 F4E2"
                                        value={formData.eir}
                                        onChange={(e) => handleInputChange('eir', e.target.value)}
                                    />
                                    {errors.eir && (
                                        <div className="flex items-center gap-1.5 text-red-500 text-xs">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errors.eir}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={handleStep2Next}
                                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-md mt-4"
                            >
                                Continue
                            </Button>
                        </div>

                        <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/5 via-black/10 to-transparent pointer-events-none hidden md:block" />
                    </div>
                );

            case 3:
                return (
                    <div className="flex flex-col md:flex-row h-full">
                        <div className="flex-1 p-6 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 bg-[#fafafa] flex flex-col">
                            <Button onClick={() => onStepChange(2)} variant="ghost" className="w-fit mb-6 p-0 text-slate-600 hover:text-slate-900">
                                <ArrowLeft size={18} className="mr-2" />
                                <span className="text-xs uppercase font-bold">Back</span>
                            </Button>

                            <div className="flex-1 flex flex-col justify-center space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-purple-500/20 rounded-2xl">
                                        <Building2 className="text-purple-500 w-6 h-6" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900">Workspace.</h2>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Company details help us customize your experience.
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 p-6 md:p-12 bg-white flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Company information</h3>
                                <p className="text-xs text-slate-600">Step 3 of 4</p>
                            </div>

                            <div className="space-y-3 flex-1">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Company Name *</Label>
                                    <Input
                                        className={`${inputClass} ${errors.companyName ? 'border-red-500' : ''}`}
                                        placeholder="TechCorp Inc."
                                        value={formData.companyName}
                                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                                    />
                                    {errors.companyName && (
                                        <div className="flex items-center gap-1.5 text-red-500 text-xs">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errors.companyName}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Company Email</Label>
                                    <Input
                                        className={inputClass}
                                        placeholder="hr@company.com"
                                        value={formData.companyEmail}
                                        onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Company Contact</Label>
                                    <Input
                                        className={inputClass}
                                        placeholder="+353 1 234 5678"
                                        value={formData.companyContact}
                                        onChange={(e) => handleInputChange('companyContact', e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleStep3Next}
                                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-md mt-4"
                            >
                                Continue
                            </Button>
                        </div>

                        <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/5 via-black/10 to-transparent pointer-events-none hidden md:block" />
                    </div>
                );

            case 4:
                return (
                    <div className="flex flex-col md:flex-row h-full">
                        <div className="flex-1 p-6 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 bg-[#fafafa] flex flex-col">
                            <Button onClick={() => onStepChange(3)} variant="ghost" className="w-fit mb-6 p-0 text-slate-600 hover:text-slate-900">
                                <ArrowLeft size={18} className="mr-2" />
                                <span className="text-xs uppercase font-bold">Back</span>
                            </Button>

                            <div className="flex-1 flex flex-col justify-center space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-green-500/20 rounded-2xl">
                                        <ShieldCheck className="text-green-500 w-6 h-6" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900">Secure.</h2>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Final step! Create your credentials to secure your account.
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 p-6 md:p-12 bg-white flex flex-col overflow-y-auto">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Account security</h3>
                                <p className="text-xs text-slate-600">Step 4 of 4</p>
                            </div>

                            <div className="space-y-3 flex-1">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Username *</Label>
                                    <Input
                                        className={`${inputClass} ${errors.username ? 'border-red-500' : ''}`}
                                        value={formData.username}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        placeholder="johndoe"
                                    />
                                    {errors.username && (
                                        <div className="flex items-center gap-1.5 text-red-500 text-xs">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errors.username}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Phone Number</Label>
                                    <Input
                                        className={inputClass}
                                        placeholder="+353..."
                                        value={formData.phoneNumber}
                                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Password *</Label>
                                    <Input
                                        type="password"
                                        className={`${inputClass} ${errors.password ? 'border-red-500' : ''}`}
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                    />
                                    {errors.password && (
                                        <div className="flex items-center gap-1.5 text-red-500 text-xs">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errors.password}</span>
                                        </div>
                                    )}
                                    {!errors.password && formData.password && (
                                        <div className="space-y-1 mt-2">
                                            <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide">Requirements:</p>
                                            <div className={`flex items-center gap-1.5 text-xs ${formData.password.length >= 8 ? 'text-green-600' : 'text-slate-400'}`}>
                                                <div className="w-1 h-1 rounded-full bg-current" />
                                                <span>8+ characters</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}`}>
                                                <div className="w-1 h-1 rounded-full bg-current" />
                                                <span>Uppercase letter</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-xs ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}`}>
                                                <div className="w-1 h-1 rounded-full bg-current" />
                                                <span>Lowercase letter</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-xs ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}`}>
                                                <div className="w-1 h-1 rounded-full bg-current" />
                                                <span>Number</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Confirm Password *</Label>
                                    <Input
                                        type="password"
                                        className={`${inputClass} ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    />
                                    {errors.confirmPassword && (
                                        <div className="flex items-center gap-1.5 text-red-500 text-xs">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errors.confirmPassword}</span>
                                        </div>
                                    )}
                                    {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                                        <div className="flex items-center gap-1.5 text-green-600 text-xs">
                                            <Check className="w-3 h-3" />
                                            <span>Passwords match</span>
                                        </div>
                                    )}
                                </div>

                                {errors.submit && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-800">{errors.submit}</p>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleFinalSubmit}
                                disabled={isLoading}
                                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow-md mt-4"
                            >
                                {isLoading ? "Finishing setup..." : "Finish Setup"}
                                <Check className="ml-2 w-4 h-4" />
                            </Button>
                        </div>

                        <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/5 via-black/10 to-transparent pointer-events-none hidden md:block" />
                    </div>
                );

            default:
                return null;
        }
    };

    return renderStep();
}
