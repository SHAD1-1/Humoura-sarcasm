"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./ThemeToggle";

type Mode = "login" | "signup";

export default function AuthScreen() {
    const supabase = createClient();

    const [mode, setMode] = useState<Mode>("login");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [forgotPassword, setForgotPassword] =
        useState(false);

    function switchMode(nextMode: Mode) {
        setMode(nextMode);
        setForgotPassword(false);
        setError("");
        setMessage("");
    }

    async function handleLogin(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setLoading(true);
        setError("");
        setMessage("");

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError("Please enter your email.");
            setLoading(false);
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            setLoading(false);
            return;
        }

        const { error: loginError } =
            await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password,
            });

        if (loginError) {
            setError(loginError.message);
            setLoading(false);
            return;
        }

        window.location.href = "/";
    }

    async function handleSignup(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setLoading(true);
        setError("");
        setMessage("");

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError("Please enter your email.");
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError(
                "Password must be at least 8 characters."
            );
            setLoading(false);
            return;
        }

        const { data, error: signupError } =
            await supabase.auth.signUp({
                email: trimmedEmail,
                password,
                options: {
                    emailRedirectTo:
                        "https://humoura.com/auth/callback",
                },
            });

        if (signupError) {
            setError(signupError.message);
            setLoading(false);
            return;
        }

        if (data.session) {
            window.location.href = "/";
            return;
        }

        setMessage(
            "Account created. Check your email and confirm your account before logging in."
        );

        setMode("login");
        setPassword("");
        setLoading(false);
    }

    async function handleForgotPassword(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setLoading(true);
        setError("");
        setMessage("");

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError(
                "Enter your email address first."
            );
            setLoading(false);
            return;
        }

        const { error: resetError } =
            await supabase.auth.resetPasswordForEmail(
                trimmedEmail,
                {
                    redirectTo:
                        "https://humoura.com/update-password",
                }
            );

        if (resetError) {
            setError(resetError.message);
            setLoading(false);
            return;
        }

        setMessage(
            "Password reset link sent. Check your email."
        );

        setLoading(false);
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">

            {/* BACKGROUND */}

            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-10%] top-[10%] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute right-[-10%] top-[5%] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute bottom-[-10%] left-[35%] h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
            </div>

            {/* HEADER */}

            <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 lg:px-8">

                <Link
                    href="/"
                    className="group"
                >
                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-xl shadow-lg shadow-primary/20 transition group-hover:rotate-6">
                            🤨
                        </div>

                        <div>
                            <div className="text-xl font-black tracking-tight">
                                Humoura
                            </div>

                            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                Why so serious?
                            </div>
                        </div>

                    </div>
                </Link>

                <ThemeToggle />

            </header>

            {/* MAIN */}

            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-7xl items-center px-5 pb-10 lg:px-8">

                <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_560px_1fr]">

                    {/* LEFT */}

                    <div className="hidden lg:block">

                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
                            HUMOURA
                        </p>

                        <h2 className="mt-4 text-5xl font-black leading-[1.05] tracking-tight">
                            {forgotPassword
                                ? "Let's get you back in."
                                : mode === "login"
                                    ? "Welcome back."
                                    : "Join Humoura."}
                        </h2>

                        <p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">
                            Same people.
                            <br />
                            Different sense
                            <br />
                            of humour.
                        </p>

                    </div>

                    {/* CARD */}

                    <section className="w-full">

                        <div className="rounded-[2rem] border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">

                            {!forgotPassword && (
                                <div className="mb-8 flex rounded-full border border-border bg-muted p-1">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            switchMode("login")
                                        }
                                        className={`flex-1 rounded-full py-3 text-sm font-bold transition ${mode === "login"
                                                ? "bg-primary text-primary-foreground shadow-md"
                                                : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        Log In
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            switchMode("signup")
                                        }
                                        className={`flex-1 rounded-full py-3 text-sm font-bold transition ${mode === "signup"
                                                ? "bg-primary text-primary-foreground shadow-md"
                                                : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        Create Account
                                    </button>

                                </div>
                            )}

                            {/* HEADING */}

                            <div className="mb-8">

                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
                                    HUMOURA
                                </p>

                                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                                    {forgotPassword
                                        ? "Reset your password."
                                        : mode === "login"
                                            ? "Welcome back, legend."
                                            : "Create your account."}
                                </h1>

                                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                                    {forgotPassword
                                        ? "Enter your email and we'll send you a secure password reset link."
                                        : mode === "login"
                                            ? "Enter your email and password to continue."
                                            : "Choose an email and password for your Humoura account."}
                                </p>

                            </div>

                            {/* FORGOT PASSWORD */}

                            {forgotPassword ? (
                                <form
                                    onSubmit={
                                        handleForgotPassword
                                    }
                                    className="space-y-5"
                                >

                                    <div>

                                        <label
                                            htmlFor="reset-email"
                                            className="mb-2 block text-sm font-semibold"
                                        >
                                            Email
                                        </label>

                                        <input
                                            id="reset-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            required
                                            className="w-full rounded-full border border-border bg-background px-5 py-3.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                        />

                                    </div>

                                    {error && (
                                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                                            <p className="text-sm text-red-500 dark:text-red-400">
                                                {error}
                                            </p>
                                        </div>
                                    )}

                                    {message && (
                                        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                                            <p className="text-sm text-green-600 dark:text-green-400">
                                                {message}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full rounded-full bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading
                                            ? "Sending..."
                                            : "Send reset link"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForgotPassword(
                                                false
                                            );
                                            setError("");
                                            setMessage("");
                                        }}
                                        className="w-full text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                                    >
                                        ← Back to login
                                    </button>

                                </form>
                            ) : (
                                <form
                                    onSubmit={
                                        mode === "login"
                                            ? handleLogin
                                            : handleSignup
                                    }
                                    className="space-y-5"
                                >

                                    {/* EMAIL */}

                                    <div>

                                        <label
                                            htmlFor="auth-email"
                                            className="mb-2 block text-sm font-semibold"
                                        >
                                            Email
                                        </label>

                                        <input
                                            id="auth-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            required
                                            className="w-full rounded-full border border-border bg-background px-5 py-3.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                        />

                                    </div>

                                    {/* PASSWORD */}

                                    <div>

                                        <label
                                            htmlFor="auth-password"
                                            className="mb-2 block text-sm font-semibold"
                                        >
                                            Password
                                        </label>

                                        <input
                                            id="auth-password"
                                            type="password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="At least 8 characters"
                                            autoComplete={
                                                mode === "login"
                                                    ? "current-password"
                                                    : "new-password"
                                            }
                                            minLength={8}
                                            required
                                            className="w-full rounded-full border border-border bg-background px-5 py-3.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                        />

                                    </div>

                                    {/* MESSAGES */}

                                    {error && (
                                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                                            <p className="text-sm leading-6 text-red-500 dark:text-red-400">
                                                {error}
                                            </p>
                                        </div>
                                    )}

                                    {message && (
                                        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                                            <p className="text-sm leading-6 text-green-600 dark:text-green-400">
                                                {message}
                                            </p>
                                        </div>
                                    )}

                                    {/* SUBMIT */}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full rounded-full bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.01] hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading
                                            ? mode === "login"
                                                ? "Logging in..."
                                                : "Creating account..."
                                            : mode === "login"
                                                ? "Log in"
                                                : "Create account"}
                                    </button>

                                </form>
                            )}

                            {/* FOOTER ACTION */}

                            {!forgotPassword && mode === "login" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForgotPassword(true);
                                        setError("");
                                        setMessage("");
                                    }}
                                    className="mt-5 w-full text-center text-sm font-semibold text-primary hover:underline"
                                >
                                    Forgot your password?
                                </button>
                            )}

                            {!forgotPassword && (
                                <p className="mt-7 text-center text-sm text-muted-foreground">

                                    {mode === "login" ? (
                                        <>
                                            Don't have an account?
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    switchMode(
                                                        "signup"
                                                    )
                                                }
                                                className="ml-1 font-bold text-primary hover:underline"
                                            >
                                                Create one
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            Already have an account?
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    switchMode(
                                                        "login"
                                                    )
                                                }
                                                className="ml-1 font-bold text-primary hover:underline"
                                            >
                                                Log in
                                            </button>
                                        </>
                                    )}

                                </p>
                            )}

                        </div>

                    </section>

                    {/* RIGHT */}

                    <div className="hidden space-y-5 lg:block">

                        <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg backdrop-blur-xl">

                            <h3 className="text-lg font-bold">
                                🔐 Simple authentication
                            </h3>

                            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                                <p>• Email + password</p>
                                <p>• Confirm email when creating an account</p>
                                <p>• Forgot password? Get a reset link</p>
                                <p>• Stay logged in across visits</p>
                            </div>

                        </div>

                        <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg backdrop-blur-xl">

                            <h3 className="text-lg font-bold">
                                😂 Welcome to Humoura.
                            </h3>

                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                Make the internet slightly
                                more sarcastic.
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </main>
    );
}