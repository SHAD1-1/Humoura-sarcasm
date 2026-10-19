"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
    const supabase = createClient();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        let mounted = true;

        const initializeRecovery = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (mounted && session) {
                setReady(true);
            }
        };

        initializeRecovery();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (
                    (event === "PASSWORD_RECOVERY" ||
                        event === "SIGNED_IN") &&
                    session &&
                    mounted
                ) {
                    setReady(true);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!ready) {
            setError(
                "Your password reset session is not ready. Please use the latest reset email."
            );
            return;
        }

        if (password.length < 8) {
            setError(
                "Use a password with at least 8 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError(
                "Passwords do not match."
            );
            return;
        }

        setLoading(true);

        const { error } =
            await supabase.auth.updateUser({
                password,
            });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setSuccess(
            "Password updated successfully. Redirecting to login..."
        );

        await supabase.auth.signOut();

        setTimeout(() => {
            window.location.href = "/";
        }, 1200);
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
            <div className="w-full max-w-md">

                <Link
                    href="/"
                    className="mb-6 inline-block text-sm text-white/50 hover:text-white"
                >
                    ← Home
                </Link>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

                    <h1 className="text-2xl font-bold">
                        Set a new password
                    </h1>

                    <p className="mt-2 text-sm text-white/40">
                        Choose a new password for your Humoura account.
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        className="mt-6 space-y-4"
                    >
                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="New password"
                            autoComplete="new-password"
                            required
                            minLength={8}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/30"
                        />

                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                            required
                            minLength={8}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/30"
                        />

                        {error && (
                            <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
                                {error}
                            </p>
                        )}

                        {success && (
                            <p className="rounded-xl bg-green-500/10 p-3 text-sm text-green-400">
                                {success}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !ready
                            }
                            className="w-full rounded-full bg-white py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {!ready
                                ? "Checking reset link..."
                                : loading
                                    ? "Updating..."
                                    : "Update password"}
                        </button>
                    </form>

                </div>
            </div>
        </main>
    );
}