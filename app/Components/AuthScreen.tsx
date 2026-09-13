"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./ThemeToggle";

export default function AuthScreen() {
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    async function handleLogin(
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
                        "https://humoura.com/auth/callback",
                    shouldCreateUser: true,
                },
            });

        if (otpError) {
            setError(otpError.message);
            setLoading(false);
            return;
        }

        setMessage(
            "Check your email. Click the magic link to continue to Humoura."
        );

        setLoading(false);
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
                            One email.
                            <br />
                            That's it.
                        </h2>

                        <p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">
                            No passwords.
                            <br />
                            No complicated signup.
                            <br />
                            Just get in and enjoy the sarcasm.
                        </p>

                    </div>

                    {/* Login card */}
                    <section className="w-full">

                        <div className="rounded-[2rem] border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">

                            <div className="mb-8">

                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
                                    HUMOURA
                                </p>

                                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                                    Welcome to Humoura.
                                </h1>

                                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                                    Enter your email and we'll send you a magic link.
                                    New users can use the same button to join.
                                </p>

                            </div>

                            {/* Email */}
                            <form
                                onSubmit={handleLogin}
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
                                        : "Log in"}
                                </button>

                            </form>

                            <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
                                New to Humoura? No separate signup is needed.
                                Your account is created automatically the first time you use your email.
                            </p>

                        </div>

                    </section>

                    {/* Right */}
                    <div className="hidden space-y-5 lg:block">

                        <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg backdrop-blur-xl">

                            <h3 className="text-lg font-bold">
                                👀 Humoura rules
                            </h3>

                            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                                <p>• No passwords</p>
                                <p>• No separate signup</p>
                                <p>• One email for everything</p>
                                <p>• More sarcasm, less effort</p>
                            </div>

                        </div>

                        <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg backdrop-blur-xl">

                            <h3 className="text-lg font-bold">
                                😂 Welcome, stranger.
                            </h3>

                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                Stay for the memes.
                                Follow people you actually like.
                                Pretend the comments section is healthy.
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </main>
    );
}