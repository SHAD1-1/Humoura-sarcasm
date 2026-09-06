"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "../Components/ThemeToggle";

export default function SignupPage() {
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
        } = await supabase.auth.signUp({
            email: email.trim(),
            password,
        });

        if (signupError) {
            const errorMessage =
                signupError.message.toLowerCase();

            if (
                errorMessage.includes("already registered") ||
                errorMessage.includes("already exists") ||
                errorMessage.includes("user already")
            ) {
                setError(
                    "An account with this email already exists. Please log in instead."
                );

                setLoading(false);
                return;
            }

            setError(signupError.message);
            setLoading(false);
            return;
        }

        if (!data.user) {
            setError(
                "We couldn't create your account. Please try again."
            );

            setLoading(false);
            return;
        }

        if (data.session) {
            window.location.href = "/";
            return;
        }

        setMessage(
            "Your account was created. Please check your email, then log in."
        );

        setLoading(false);
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-background text-foreground">

            {/* BACKGROUND GLOW */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute right-0 top-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
            </div>

            {/* TOP BAR */}
            <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 lg:px-8">

                <Link href="/" className="group">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-xl shadow-lg shadow-primary/20 transition-transform group-hover:rotate-6">
                            🤨
                        </div>

                        <div>
                            <h1 className="text-xl font-black tracking-tight">
                                Humoura
                            </h1>

                            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                Why so serious?
                            </p>
                        </div>
                    </div>
                </Link>

                <ThemeToggle />
            </div>

            {/* MAIN */}
            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-7xl items-center px-5 pb-10 lg:px-8">

                <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_560px_1fr]">

                    {/* LEFT DECORATION */}
                    <div className="hidden lg:block">

                        <div className="max-w-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
                                HUMOURA
                            </p>

                            <h2 className="mt-4 text-5xl font-black leading-[1.05] tracking-tight">
                                Create an account...
                                <br />
                                maybe?
                            </h2>

                            <p className="mt-5 max-w-xs text-base leading-7 text-muted-foreground">
                                Join the internet&apos;s most questionable
                                collection of sarcasm, bad jokes and
                                suspiciously confident opinions.
                            </p>

                            <div className="mt-10 rotate-[-5deg] text-4xl">
                                ↗
                            </div>

                            <p className="mt-2 max-w-[220px] text-lg font-semibold italic text-muted-foreground">
                                Same people.
                                <br />
                                Different sense
                                <br />
                                of humour.
                            </p>
                        </div>

                    </div>

                    {/* AUTH CARD */}
                    <section className="w-full">

                        <div className="rounded-[2rem] border border-border bg-card/95 p-6 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-8">

                            {/* TABS */}
                            <div className="mb-8 flex rounded-full border border-border bg-muted p-1">

                                <Link
                                    href="/"
                                    className="flex flex-1 items-center justify-center rounded-full py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                                >
                                    Log In
                                </Link>

                                <div className="flex flex-1 items-center justify-center rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md">
                                    Sign Up
                                </div>

                            </div>

                            {/* HEADING */}
                            <div className="mb-8">
                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
                                    HUMOURA
                                </p>

                                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                                    Join the Cult of Sarcasm.
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                                    Sign up below. Or don&apos;t.
                                    We&apos;re not your mother.
                                </p>
                            </div>

                            <form
                                onSubmit={handleSignup}
                                className="space-y-5"
                            >

                                {/* EMAIL */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-semibold"
                                    >
                                        Email
                                        <span className="ml-1 text-muted-foreground">
                                            (The one your ex doesn&apos;t know)
                                        </span>
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="e.g., email@example.com"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        required
                                        autoComplete="email"
                                        className="w-full rounded-full border border-border bg-background px-5 py-3.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                    />
                                </div>

                                {/* PASSWORD */}
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-2 block text-sm font-semibold"
                                    >
                                        Create a Password
                                        <span className="ml-1 text-muted-foreground">
                                            (Make it hard, for once)
                                        </span>
                                    </label>

                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="At least 8 characters"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        className="w-full rounded-full border border-border bg-background px-5 py-3.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                    />
                                </div>

                                {/* ERROR */}
                                {error && (
                                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                                        <p className="text-sm leading-6 text-red-500 dark:text-red-400">
                                            {error}
                                        </p>

                                        <Link
                                            href="/"
                                            className="mt-2 inline-block text-sm font-bold underline underline-offset-4"
                                        >
                                            Go to Log In
                                        </Link>
                                    </div>
                                )}

                                {/* SUCCESS */}
                                {message && (
                                    <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                                        <p className="text-sm leading-6 text-green-600 dark:text-green-400">
                                            {message}
                                        </p>

                                        <Link
                                            href="/"
                                            className="mt-2 inline-block text-sm font-bold underline underline-offset-4"
                                        >
                                            Go to Log In
                                        </Link>
                                    </div>
                                )}

                                {/* BUTTON */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-full bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.01] hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading
                                        ? "Creating account..."
                                        : "Create Account (Last chance)"}
                                </button>

                            </form>

                            {/* LOGIN */}
                            <div className="mt-7 text-center text-sm text-muted-foreground">
                                Already a member?
                                <Link
                                    href="/"
                                    className="ml-1 font-semibold text-primary underline-offset-4 hover:underline"
                                >
                                    We knew you&apos;d come back. Log in
                                </Link>
                            </div>

                        </div>

                    </section>

                    {/* RIGHT DECORATION */}
                    <div className="hidden lg:flex lg:flex-col lg:gap-5">

                        {/* REJECTED MEMES */}
                        <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg backdrop-blur-xl">

                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold">
                                    👑 Top Memes We Rejected Today
                                </h3>

                                <span className="text-muted-foreground">
                                    →
                                </span>
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-3">

                                <div className="h-20 rounded-2xl bg-muted" />
                                <div className="h-20 rounded-2xl bg-muted" />
                                <div className="h-20 rounded-2xl bg-muted" />

                            </div>

                            <p className="mt-3 text-sm text-muted-foreground">
                                Rejected for &quot;too unfunny&quot;
                            </p>

                        </div>

                        {/* CONTRIBUTORS */}
                        <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg backdrop-blur-xl">

                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold">
                                    👥 Top Contributors to This Sarcasm Dump
                                </h3>

                                <span className="text-muted-foreground">
                                    →
                                </span>
                            </div>

                            <div className="mt-5 space-y-4">

                                {[
                                    ["H", "user1", "Meme Lord"],
                                    ["S", "SarcasticSteve", "Professional Cynic"],
                                    ["P", "Ironydiot", "Chaos Specialist"],
                                ].map(([avatar, username, role]) => (
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

                                        <button
                                            type="button"
                                            className="rounded-full border border-primary px-4 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
                                        >
                                            Follow
                                        </button>

                                    </div>
                                ))}

                            </div>

                        </div>

                        {/* GUEST */}
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