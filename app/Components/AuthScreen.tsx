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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    function switchMode(nextMode: Mode) {
        setMode(nextMode);
        setError("");
        setMessage("");
    }

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        const { error: otpError } =
            await supabase.auth.signInWithOtp({
                email: trimmedEmail,
                options: {
                    emailRedirectTo:
                        `${window.location.origin}/auth/callback`,
                    shouldCreateUser:
                        mode === "signup",
                },
            });

        if (otpError) {
            setError(otpError.message);
            setLoading(false);
            return;
        }

        setMessage(
            mode === "signup"
                ? "Check your email to finish creating your Humoura account."
                : "Check your email. We sent you a magic link to log in."
        );

        setLoading(false);
    }

    async function handleGoogleLogin() {
        setLoading(true);
        setError("");
        setMessage("");

        const { error } =
            await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo:
                        `${window.location.origin}/auth/callback`,
                },
            });

        if (error) {
            setError(error.message);
            setLoading(false);
        }
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">

            {/* Background */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-10%] top-[10%] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute right-[-10%] top-[5%] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute bottom-[-10%] left-[35%] h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 lg:px-8">

                <Link href="/" className="group">
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

            {/* Main */}
            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-7xl items-center px-5 pb-10 lg:px-8">

                <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_560px_1fr]">

                    {/* Left */}
                    <div className="hidden lg:block">

                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
                            HUMOURA
                        </p>

                        <h2 className="mt-4 text-5xl font-black leading-[1.05] tracking-tight">
                            {mode === "login"
                                ? "Welcome back..."
                                : "Create an account..."}
                        </h2>

                        <p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">
                            Same people.
                            <br />
                            Different sense
                            <br />
                            of humour.
                        </p>

                    </div>

                    {/* Card */}
                    <section className="w-full">

                        <div className="rounded-[2rem] border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">

                            {/* Tabs */}
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
                                    Sign Up
                                </button>

                            </div>

                            {/* Heading */}
                            <div className="mb-8">

                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
                                    HUMOURA
                                </p>

                                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                                    {mode === "login"
                                        ? "Welcome back, legend."
                                        : "Join the Cult of Sarcasm."}
                                </h1>

                                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                                    {mode === "login"
                                        ? "Enter your email and we'll send you a magic link."
                                        : "No password needed. We'll email you a link to join."}
                                </p>

                            </div>

                            {/* Google */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 font-semibold text-card-foreground shadow-sm transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-sm font-bold">
                                    G
                                </span>

                                Continue with Google
                            </button>

                            {/* Divider */}
                            <div className="my-6 flex items-center gap-3">

                                <div className="h-px flex-1 bg-border" />

                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                    or
                                </span>

                                <div className="h-px flex-1 bg-border" />

                            </div>

                            {/* Form */}
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-5"
                            >

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
                                            setEmail(e.target.value)
                                        }
                                        placeholder="you@example.com"
                                        required
                                        autoComplete="email"
                                        className="w-full rounded-full border border-border bg-background px-5 py-3.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                    />

                                </div>

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

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-full bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.01] hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading
                                        ? "Sending..."
                                        : mode === "login"
                                            ? "Send Magic Link"
                                            : "Create Account"}
                                </button>

                            </form>

                            <div className="mt-7 text-center text-sm text-muted-foreground">

                                {mode === "login" ? (
                                    <>
                                        Don't have an account?
                                        <button
                                            type="button"
                                            onClick={() =>
                                                switchMode("signup")
                                            }
                                            className="ml-1 font-bold text-primary hover:underline"
                                        >
                                            Sign up
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?
                                        <button
                                            type="button"
                                            onClick={() =>
                                                switchMode("login")
                                            }
                                            className="ml-1 font-bold text-primary hover:underline"
                                        >
                                            Log in
                                        </button>
                                    </>
                                )}

                            </div>

                        </div>

                    </section>

                    {/* Right */}
                    <div className="hidden space-y-5 lg:block">

                        <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg backdrop-blur-xl">

                            <h3 className="text-lg font-bold">
                                👑 Top Memes We Rejected Today
                            </h3>

                            <div className="mt-5 grid grid-cols-3 gap-3">
                                <div className="h-20 rounded-2xl bg-muted" />
                                <div className="h-20 rounded-2xl bg-muted" />
                                <div className="h-20 rounded-2xl bg-muted" />
                            </div>

                            <p className="mt-3 text-sm text-muted-foreground">
                                Rejected for &quot;too unfunny&quot;
                            </p>

                        </div>

                        <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg backdrop-blur-xl">

                            <h3 className="text-lg font-bold">
                                👥 Top Contributors
                            </h3>

                            <div className="mt-5 space-y-4">

                                {[
                                    ["H", "user1", "Meme Lord"],
                                    ["S", "SarcasticSteve", "Professional Cynic"],
                                    ["P", "Ironydiot", "Chaos Specialist"],
                                ].map(
                                    ([avatar, username, role]) => (
                                        <div
                                            key={username}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground">
                                                {avatar}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">
                                                    {username}
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {role}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                )}

                            </div>

                        </div>

                        <div className="flex items-center gap-3 rounded-3xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur-xl">

                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
                                👤
                            </div>

                            <div className="flex-1">
                                <p className="font-semibold">
                                    Guest User
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    Looking around (skeptically)
                                </p>
                            </div>

                            <span className="text-lg text-muted-foreground">
                                →
                            </span>

                        </div>

                    </div>

                </div>
            </div>

        </main>
    );
}