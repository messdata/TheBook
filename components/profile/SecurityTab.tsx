"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Loader2, Check, Shield, Key, AlertTriangle, Trash2, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface SecurityTabProps {
    userId: string;
}

export default function SecurityTab({ userId }: SecurityTabProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [sessions, setSessions] = useState<any[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Mock session data (Supabase doesn't expose all sessions via client SDK)
                setSessions([{
                    id: session.user.id,
                    device: "Current Device",
                    location: "Current Session",
                    lastActive: new Date().toISOString(),
                    current: true,
                }]);
            }
        } catch (err) {
            console.error("Error fetching sessions:", err);
        }
    };

    const handleChangePassword = async () => {
        setError("");

        // Validation
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setError("All fields are required");
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setError("New password must be at least 6 characters");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError("New passwords don't match");
            return;
        }

        setSaving(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordForm.newPassword
            });

            if (updateError) {
                setError(updateError.message);
            } else {
                setSaved(true);
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err: any) {
            setError(err.message || "Failed to update password");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") {
            setError("Please type DELETE to confirm");
            return;
        }

        setDeleting(true);
        setError("");

        try {
            // Delete user data first
            const { error: profileError } = await supabase
                .from('user_profiles')
                .delete()
                .eq('user_id', userId);

            if (profileError) throw profileError;

            // Sign out and redirect
            await supabase.auth.signOut();
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Failed to delete account");
            setDeleting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Change Password Card */}
            <Card className="border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Change Password
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-neutral-400">
                        Update your password to keep your account secure
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
                        >
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </motion.div>
                    )}

                    <div>
                        <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                            Current Password
                        </Label>
                        <Input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            placeholder="Enter current password"
                            className="mt-2 h-11 rounded-lg border-slate-300 dark:border-neutral-700"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                            New Password
                        </Label>
                        <Input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            placeholder="Enter new password (min. 6 characters)"
                            className="mt-2 h-11 rounded-lg border-slate-300 dark:border-neutral-700"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                            Confirm New Password
                        </Label>
                        <Input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            placeholder="Confirm new password"
                            className="mt-2 h-11 rounded-lg border-slate-300 dark:border-neutral-700"
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-neutral-800">
                        <Button
                            type="button"
                            onClick={handleChangePassword}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 rounded-lg font-semibold"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : saved ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Updated!
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Active Sessions Card */}
            <Card className="border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Active Sessions
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-neutral-400">
                        Manage devices with access to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {sessions.map((session, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-green-50 dark:bg-green-900/20">
                                        <Monitor className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {session.device}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-neutral-400">
                                            Last active: {new Date(session.lastActive).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                {session.current && (
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                        Current
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone Card */}
            <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-red-900 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-red-700 dark:text-red-300">
                        Irreversible actions that affect your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Delete Account</h3>
                                <p className="text-xs text-slate-600 dark:text-neutral-400">
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        {!showDeleteConfirm ? (
                            <Button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                variant="outline"
                                className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Account
                            </Button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="space-y-4"
                            >
                                <div>
                                    <Label className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                                        Type <span className="font-mono text-red-600 dark:text-red-400">DELETE</span> to confirm
                                    </Label>
                                    <Input
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="DELETE"
                                        className="mt-2 h-11 rounded-lg border-red-300 dark:border-red-800"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        onClick={handleDeleteAccount}
                                        disabled={deleting || deleteConfirmText !== "DELETE"}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        {deleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Confirm Delete
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setDeleteConfirmText("");
                                            setError("");
                                        }}
                                        variant="outline"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {error && showDeleteConfirm && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
                        >
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}