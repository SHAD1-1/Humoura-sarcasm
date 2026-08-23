"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
    const supabase = createClient();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    async function handleSignup(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setLoading(true);
        setMessage("");
        setError("");

        const {
            data,
            error: signupError,
        } =
            await supabase.auth.signUp({
                email: email.trim(),
                password,
            });

        // ========================================
        // ERROR
        // ========================================

        if (signupError) {
            const errorMessage =
                signupError.message.toLowerCase();

            if (
                errorMessage.includes(
                    "already registered"
                ) ||
                errorMessage.includes(
                    "already exists"
                ) ||
                errorMessage.includes(
                    "user already"
                )
            ) {
                setError(
                    "An account with this email already exists. Please log in instead."
                );

                setLoading(false);
                return;
            }

            setError(
                signupError.message
            );

            setLoading(false);
            return;
        }

        // ========================================
        // NO USER
        // ========================================

        if (!data.user) {
            setError(
                "We couldn't create your account. Please try again."
            );

            setLoading(false);
            return;
        }

        // ========================================
        // SESSION CREATED
        // ========================================

        if (data.session) {
            window.location.href = "/";
            return;
        }

        // ========================================
        // NO SESSION
        // ========================================

        setMessage(
            "Your account was created. Please log in."
        );

        setLoading(false);
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">

            <div className="w-full max-w-md">

                <div className="mb-8 text-center">

                    <h1 className="text-4xl font-bold">
                        Humoura
                    </h1>

                    <p className="mt-2 text-white/50">
                        Create your account
                    </p>

                </div>

                <form
                    onSubmit={
                        handleSignup
                    }
                    className="flex w-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl"
                >

                    <h2 className="text-2xl font-bold">
                        Sign up
                    </h2>

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) =>
                            setEmail(
                                e.target.value
                            )
                        }
                        required
                        autoComplete="email"
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/30"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/30"
                    />

                    {error && (
                        <div className="rounded-2xl bg-red-500/10 p-3">
                            <p className="text-sm text-red-400">
                                {error}
                            </p>

                            <Link
                                href="/"
                                className="mt-2 inline-block text-sm font-semibold text-white underline"
                            >
                                Go to log in
                            </Link>
                        </div>
                    )}

                    {message && (
                        <div className="rounded-2xl border border-green-400/20 bg-green-400/5 p-3">
                            <p className="text-sm text-green-400">
                                {message}
                            </p>

                            <Link
                                href="/"
                                className="mt-2 inline-block text-sm font-semibold text-white underline"
                            >
                                Go to log in
                            </Link>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-4 py-3 font-semibold text-white shadow-lg shadow-red-950/20 transition hover:from-red-400 hover:to-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "Creating account..."
                            : "Create account"}
                    </button>

                    <Link
                        href="/"
                        className="text-center text-sm text-white/50 transition hover:text-white"
                    >
                        Already have an account? Log in
                    </Link>

                </form>

            </div>

        </main>
    );
}