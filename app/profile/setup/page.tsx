"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileSetupPage() {
    const router = useRouter();
    const supabase = createClient();

    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setLoading(true);
        setMessage("");

        // Get the currently logged-in user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            setMessage("You must be logged in to create a profile.");
            setLoading(false);
            return;
        }

        // Save the profile
        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                username: username.trim(),
                full_name: fullName.trim(),
                bio: bio.trim(),
            });

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        // Profile saved successfully
        router.push("/");
        router.refresh();
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
            <form
                onSubmit={handleSubmit}
                className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-white/10 bg-white/5 p-6"
            >
                <div>
                    <h1 className="text-2xl font-bold">
                        Set up your profile
                    </h1>

                    <p className="mt-1 text-sm text-white/50">
                        Tell the Humoura community a little about yourself.
                    </p>
                </div>

                {/* Username */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                        Username
                    </label>

                    <input
                        type="text"
                        placeholder="shahab"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        minLength={3}
                        className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 outline-none"
                    />

                    <p className="text-xs text-white/40">
                        At least 3 characters
                    </p>
                </div>

                {/* Full name */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                        Full name
                    </label>

                    <input
                        type="text"
                        placeholder="Shahab"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 outline-none"
                    />
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                        Bio
                    </label>

                    <textarea
                        placeholder="Tell us something about yourself..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="resize-none rounded-lg border border-white/10 bg-white/10 px-3 py-2 outline-none"
                    />
                </div>

                {message && (
                    <p className="text-sm text-red-400">
                        {message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-white px-4 py-2 font-medium text-black disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Continue"}
                </button>
            </form>
        </main>
    );
}