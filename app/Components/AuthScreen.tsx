"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthScreen() {
    const supabase = createClient();

    const [mode, setMode] =
        useState<"login" | "signup">("login");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
            } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (loginError) {
                setError(loginError.message);
                setLoading(false);
                return;
            }

            // Refresh the server component so
            // app/page.tsx sees the logged-in user.
            window.location.reload();

            return;
        }

        // ========================================
        // SIGN UP
        // ========================================

        const {
            data,
            error: signupError,
        } = await supabase.auth.signUp({
            email: email.trim(),
            password,
        });

        if (signupError) {
            setError(signupError.message);
            setLoading(false);
            return;
        }

        // If Supabase immediately creates a session,
        // reload and show Home.
        if (data.session) {
            window.location.reload();
            return;
        }

        // If email confirmation is enabled,
        // there will be no session yet.
        setSuccess(
            "Account created. Please check your email to confirm your account."
        );

        setLoading(false);
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">

            <div className="w-full max-w-md">

                {/* BRAND */}

                <div className="mb-8 text-center">

                    <h1 className="text-4xl font-bold">
                        Humoura
                    </h1>

                    <p className="mt-2 text-white/50">
                        Why so serious?
                    </p>

                </div>

                {/* AUTH CARD */}

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">

                    {/* LOGIN / SIGNUP */}

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

                    {/* FORM */}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="Email"
                            required
                            autoComplete="email"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/30"
                        />

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
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

                        {/* ERROR */}

                        {error && (
                            <p className="text-sm text-red-400">
                                {error}
                            </p>
                        )}

                        {/* SUCCESS */}

                        {success && (
                            <p className="text-sm text-green-400">
                                {success}
                            </p>
                        )}

                        {/* SUBMIT */}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-full bg-white py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Please wait..."
                                : mode === "login"
                                    ? "Log in"
                                    : "Create account"}
                        </button>

                    </form>

                </div>

            </div>

        </main>
    );
}   