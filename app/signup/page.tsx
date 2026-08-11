"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();

        setLoading(true);
        setMessage("");

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setMessage(error.message);
        } else {
            setMessage(
                "Account created! Check your email to confirm your account."
            );
        }

        setLoading(false);
    }

    return (
        <main className="flex min-h-screen items-center justify-center">
            <form
                onSubmit={handleSignup}
                className="flex w-full max-w-sm flex-col gap-4 rounded-xl border p-6"
            >
                <h1 className="text-2xl font-bold">Create an account</h1>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-md border p-2"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-md border p-2"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                    {loading ? "Creating account..." : "Sign Up"}
                </button>

                {message && (
                    <p className="text-sm">
                        {message}
                    </p>
                )}
            </form>
        </main>
    );
}