"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
    const supabase = createClient();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const {
            data: listener,
        } = supabase.auth.onAuthStateChange(
            (event) => {
                if (
                    event === "PASSWORD_RECOVERY" ||
                    event === "SIGNED_IN"
                ) {
                    setReady(true);
                }
            }
        );

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (password.length < 6) {
            setError(
                "Password must be at least 6 characters."
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
            "Password updated successfully."
        );

        setPassword("");
        setConfirmPassword("");
        setLoading(false);
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
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="New password"
                            autoComplete="new-password"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/30"
                        />

                        <input
                            type="password"
                            required
                            minLength={6}
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/30"
                        />

                        {error && (
                            <p className="text-sm text-red-400">
                                {error}
                            </p>
                        )}

                        {success && (
                            <p className="text-sm text-green-400">
                                {success}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !ready}
                            className="w-full rounded-full bg-white py-3 font-semibold text-black disabled:opacity-50"
                        >
                            {!ready
                                ? "Opening secure reset..."
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