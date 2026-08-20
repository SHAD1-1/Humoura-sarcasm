"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AuthScreen() {
    const supabase = createClient();

    const [mode, setMode] =
        useState<"login" | "signup">("login");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    // ========================================
    // GOOGLE LOGIN
    // ========================================

    async function handleGoogleLogin() {
        setError("");
        setSuccess("");
        setLoading(true);

        const {
            error: googleError,
        } =
            await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo:
                        `${window.location.origin}/auth/callback`,
                },
            });

        if (googleError) {
            setError(
                googleError.message
            );
            setLoading(false);
        }
    }

    // ========================================
    // EMAIL LOGIN / SIGNUP
    // ========================================

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");

        // ========================================
        // LOGIN
        // ========================================

        if (mode === "login") {
            const {
                error: loginError,
            } =
                await supabase.auth.signInWithPassword(
                    {
                        email: email.trim(),
                        password,
                    }
                );

            if (loginError) {
                setError(
                    loginError.message
                );
                setLoading(false);
                return;
            }

            window.location.reload();
            return;
        }

        // ========================================
        // SIGN UP
        // ========================================

        const {
            data,
            error: signupError,
        } =
            await supabase.auth.signUp({
                email: email.trim(),
                password,
            });

        if (signupError) {
            setError(
                signupError.message
            );
            setLoading(false);
            return;
        }

        // ========================================
        // SESSION CREATED
        // ========================================

        if (data.session) {
            window.location.reload();
            return;
        }

        // ========================================
        // EMAIL CONFIRMATION
        // ========================================

        setSuccess(
            "Your account was created successfully. Please check your email to continue."
        );

        setMode("login");
        setPassword("");
        setLoading(false);
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">

            <div className="w-full max-w-md">

                {/* BRAND */}

                <div className="mb-8 text-center">

                    <h1 className="text-4xl font-bold tracking-tight">
                        Humoura
                    </h1>

                    <p className="mt-2 text-white/50">
                        Why so serious?
                    </p>

                </div>

                {/* AUTH CARD */}

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">

                    {/* LOGIN / SIGNUP TABS */}

                    <div className="mb-6 flex rounded-full bg-white/5 p-1">

                        <button
                            type="button"
                            onClick={() => {
                                setMode("login");
                                setError("");
                                setSuccess("");
                            }}
                            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${mode === "login"
                                    ? "bg-white text-black"
                                    : "text-white/50 hover:text-white"
                                }`}
                        >
                            Log in
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMode("signup");
                                setError("");
                                setSuccess("");
                            }}
                            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${mode === "signup"
                                    ? "bg-white text-black"
                                    : "text-white/50 hover:text-white"
                                }`}
                        >
                            Sign up
                        </button>

                    </div>

                    {/* GOOGLE */}

                    <button
                        type="button"
                        onClick={
                            handleGoogleLogin
                        }
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <span className="text-base">
                            G
                        </span>

                        Continue with Google
                    </button>

                    {/* DIVIDER */}

                    <div className="my-5 flex items-center gap-3">

                        <div className="h-px flex-1 bg-white/10" />

                        <span className="text-xs text-white/30">
                            OR
                        </span>

                        <div className="h-px flex-1 bg-white/10" />

                    </div>

                    {/* EMAIL FORM */}

                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="space-y-4"
                    >

                        {/* EMAIL */}

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                            placeholder="Email"
                            required
                            autoComplete="email"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/30"
                        />

                        {/* PASSWORD */}

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Password"
                            required
                            minLength={6}
                            autoComplete={
                                mode === "login"
                                    ? "current-password"
                                    : "new-password"
                            }
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/30"
                        />

                        {/* FORGOT PASSWORD */}

                        {mode === "login" && (
                            <div className="text-right">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-white/50 transition hover:text-white"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        )}

                        {/* ERROR */}

                        {error && (
                            <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-400">
                                {error}
                            </p>
                        )}

                        {/* SUCCESS */}

                        {success && (
                            <div className="rounded-2xl border border-green-400/20 bg-green-400/5 p-3">

                                <p className="text-sm text-green-400">
                                    {success}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode(
                                            "login"
                                        );
                                        setSuccess(
                                            ""
                                        );
                                    }}
                                    className="mt-3 text-sm font-semibold text-white underline"
                                >
                                    Go to log in
                                </button>

                            </div>
                        )}

                        {/* SUBMIT */}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-full bg-gradient-to-r from-red-500 to-rose-600 py-3 font-semibold text-white shadow-lg shadow-red-950/20 transition hover:from-red-400 hover:to-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Please wait..."
                                : mode ===
                                    "login"
                                    ? "Log in"
                                    : "Create account"}
                        </button>

                    </form>

                </div>

            </div>

        </main>
    );
}