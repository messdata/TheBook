"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { User, Briefcase, Settings, Shield } from "lucide-react";

// Import tab components from components/profile
import PersonalTab from "@/components/profile/PersonalTab";
import WorkTab from "@/components/profile/WorkTab";
import PreferencesTab from "@/components/profile/PreferencesTab";
import SecurityTab from "@/components/profile/SecurityTab";

export default function ProfileClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const [personalData, setPersonalData] = useState({
        firstName: "",
        surname: "",
        email: "",
        phoneNumber: "",
        username: "",
        avatarUrl: "",
    });

    const [workData, setWorkData] = useState({
        companyName: "",
        jobType: "",
        profession: "",
        city: "",
        county: "",
        eircode: "",
    });

    const [preferencesData, setPreferencesData] = useState({
        themePreference: 'auto',
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        weekStartDay: 0,
    });

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return router.push("/login");

            setUserId(session.user.id);
            await fetchProfile(session.user.id, session.user.email || "");
            setLoading(false);
        };
        init();
    }, [router]);

    const fetchProfile = async (uid: string, email: string) => {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('first_name, surname, email, phone_number, username, avatar_url, company_name, job_type, profession, city, county, eir, theme_preference, currency, date_format, week_start_day')
            .eq('user_id', uid)
            .single();

        if (profile) {
            setPersonalData({
                firstName: profile.first_name || "",
                surname: profile.surname || "",
                email: profile.email || email,
                phoneNumber: profile.phone_number || "",
                username: profile.username || "",
                avatarUrl: profile.avatar_url || "",
            });

            setWorkData({
                companyName: profile.company_name || "",
                jobType: profile.job_type || "",
                profession: profile.profession || "",
                city: profile.city || "",
                county: profile.county || "",
                eircode: profile.eir || "",
            });

            setPreferencesData({
                themePreference: profile.theme_preference || 'auto',
                currency: profile.currency || 'EUR',
                dateFormat: profile.date_format || 'DD/MM/YYYY',
                weekStartDay: profile.week_start_day ?? 0,
            });
        }
    };

    const handleProfileUpdate = async () => {
        if (!userId) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await fetchProfile(userId, session.user.email || "");
        }
    };

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-black dark:via-neutral-950 dark:to-zinc-950">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-black dark:via-neutral-950 dark:to-zinc-950 overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2" style={{ fontFamily: "'Caveat', cursive" }}>
                        Profile
                    </h1>
                    <p className="text-slate-600 dark:text-neutral-400">Manage your account settings and preferences</p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-1 rounded-xl">
                        <TabsTrigger value="personal" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all text-xs md:text-sm">
                            <User className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                            <span className="hidden md:inline">Personal</span>
                            <span className="md:hidden">Info</span>
                        </TabsTrigger>
                        <TabsTrigger value="work" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all text-xs md:text-sm">
                            <Briefcase className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                            <span className="hidden md:inline">Work</span>
                            <span className="md:hidden">Work</span>
                        </TabsTrigger>
                        <TabsTrigger value="preferences" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all text-xs md:text-sm">
                            <Settings className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                            <span className="hidden md:inline">Preferences</span>
                            <span className="md:hidden">Prefs</span>
                        </TabsTrigger>
                        <TabsTrigger value="security" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all text-xs md:text-sm">
                            <Shield className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                            <span className="hidden md:inline">Security</span>
                            <span className="md:hidden">Safe</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab Contents */}
                    <TabsContent value="personal" className="mt-6">
                        <PersonalTab
                            userId={userId!}
                            initialData={personalData}
                            onUpdate={handleProfileUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="work" className="mt-6">
                        <WorkTab
                            userId={userId!}
                            initialData={workData}
                            onUpdate={handleProfileUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="preferences" className="mt-6">
                        <PreferencesTab
                            userId={userId!}
                            initialData={preferencesData}
                            onUpdate={handleProfileUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="security" className="mt-6">
                        <SecurityTab userId={""} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
