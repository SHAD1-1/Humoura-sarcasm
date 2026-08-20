"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setLoading(true);
        setError("");
        setMessage("");

        const { error } =
            await supabase.auth.resetPasswordForEmail(
                email.trim(),
                {
                    redirectTo:
                        `${window.location.origin}/update-password`,
                }
            );

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setMessage(
            "If an account exists for that email, a password reset link has been sent."
        );

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
                        Reset your password
                    </h1>

                    <p className="mt-2 text-sm text-white/40">
                        Enter your email and we’ll send you a reset link.
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        className="mt-6 space-y-4"
                    >
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="Email"
                            autoComplete="email"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/30"
                        />

                        {error && (
                            <p className="text-sm text-red-400">
                                {error}
                            </p>
                        )}

                        {message && (
                            <p className="text-sm text-green-400">
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-full bg-white py-3 font-semibold text-black disabled:opacity-50"
                        >
                            {loading
                                ? "Sending..."
                                : "Send reset link"}
                        </button>
                    </form>

                    <Link
                        href="/"
                        className="mt-5 block text-center text-sm text-white/50 hover:text-white"
                    >
                        Back to login
                    </Link>
                </div>
            </div>
        </main>
    );
}