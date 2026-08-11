"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CreateSarcasmPage() {
    const supabase = createClient();
    const router = useRouter();

    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!content.trim()) {
            setMessage("Please write something first.");
            return;
        }

        setLoading(true);
        setMessage("");

        // Get currently logged-in user
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setMessage("You must be logged in to post.");
            setLoading(false);
            return;
        }

        // Create the meme
        const { error } = await supabase
            .from("memes")
            .insert({
                author_id: user.id,
                content: content.trim(),
            });

        if (error) {
            console.error(error);
            setMessage(error.message);
            setLoading(false);
            return;
        }

        // Go back to home after successful post
        router.push("/");
        router.refresh();
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto w-full max-w-2xl border-x border-white/10">

                {/* Header */}
                <header className="border-b border-white/10 px-6 py-4">
                    <h1 className="text-xl font-bold">
                        Create Sarcasm
                    </h1>
                </header>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="p-6"
                >
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind? 👀"
                        maxLength={500}
                        rows={6}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-white outline-none placeholder:text-white/40 focus:border-white/30"
                    />

                    {/* Bottom section */}
                    <div className="mt-3 flex items-center justify-between">

                        <span className="text-sm text-white/40">
                            {content.length}/500
                        </span>

                        <button
                            type="submit"
                            disabled={loading || !content.trim()}
                            className="rounded-full bg-white px-6 py-2 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {loading ? "Posting..." : "Post"}
                        </button>

                    </div>

                    {message && (
                        <p className="mt-4 text-sm text-red-400">
                            {message}
                        </p>
                    )}
                </form>

            </div>
        </main>
    );
}