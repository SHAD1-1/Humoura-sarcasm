"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
};

type Meme = {
    id: string;
    content: string | null;
    image_url: string | null;
    author_id: string;
    created_at: string;
    profile: Profile | null;
};

type SavedMeme = {
    meme_id: string;
    created_at: string;
    meme: Meme;
};

export default function SavedPage() {
    const supabase = createClient();
    const router = useRouter();

    const [savedMemes, setSavedMemes] = useState<SavedMeme[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        async function loadSavedMemes() {
            setLoading(true);
            setError("");

            // Get logged-in user
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                setError(userError.message);
                setLoading(false);
                return;
            }

            if (!user) {
                setError("Please log in to view your saved posts.");
                setLoading(false);
                return;
            }

            // Get saved rows
            const {
                data: savedData,
                error: savedError,
            } = await supabase
                .from("saved_memes")
                .select("meme_id, created_at")
                .eq("user_id", user.id)
                .order("created_at", {
                    ascending: false,
                });

            if (savedError) {
                setError(savedError.message);
                setLoading(false);
                return;
            }

            if (!savedData || savedData.length === 0) {
                setSavedMemes([]);
                setLoading(false);
                return;
            }

            // Get meme IDs
            const memeIds = savedData.map(
                (item) => item.meme_id
            );

            // Get memes
            const {
                data: memeData,
                error: memeError,
            } = await supabase
                .from("memes")
                .select(
                    "id, content, image_url, author_id, created_at"
                )
                .in("id", memeIds);

            if (memeError) {
                setError(memeError.message);
                setLoading(false);
                return;
            }

            // Get author IDs
            const authorIds = [
                ...new Set(
                    (memeData || []).map(
                        (meme) => meme.author_id
                    )
                ),
            ];

            // Get profiles
            const {
                data: profileData,
                error: profileError,
            } = await supabase
                .from("profiles")
                .select(
                    "id, username, full_name, avatar_url"
                )
                .in("id", authorIds);

            if (profileError) {
                setError(profileError.message);
                setLoading(false);
                return;
            }

            // Combine data
            const combined: SavedMeme[] = savedData
                .map((savedItem) => {
                    const meme = memeData?.find(
                        (item) =>
                            item.id === savedItem.meme_id
                    );

                    if (!meme) {
                        return null;
                    }

                    const profile =
                        profileData?.find(
                            (profile) =>
                                profile.id === meme.author_id
                        ) || null;

                    return {
                        meme_id: savedItem.meme_id,
                        created_at: savedItem.created_at,
                        meme: {
                            id: meme.id,
                            content: meme.content,
                            image_url: meme.image_url,
                            author_id: meme.author_id,
                            created_at: meme.created_at,
                            profile,
                        },
                    };
                })
                .filter(
                    (item): item is SavedMeme =>
                        item !== null
                );

            setSavedMemes(combined);
            setLoading(false);
        }

        loadSavedMemes();
    }, []);

    async function handleUnsave(memeId: string) {
        setRemovingId(memeId);

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            setError(
                userError?.message ||
                "Please log in to unsave this post."
            );
            setRemovingId(null);
            return;
        }

        const { error } = await supabase
            .from("saved_memes")
            .delete()
            .eq("meme_id", memeId)
            .eq("user_id", user.id);

        if (error) {
            setError(error.message);
            setRemovingId(null);
            return;
        }

        // Remove from UI immediately
        setSavedMemes((previous) =>
            previous.filter(
                (item) => item.meme_id !== memeId
            )
        );

        setRemovingId(null);

        router.refresh();
    }

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <main className="min-h-screen bg-black text-white">
                <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">
                    <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">
                        <h1 className="text-xl font-bold">
                            Saved
                        </h1>
                    </header>

                    <div className="px-6 py-16 text-center text-white/50">
                        Loading saved posts...
                    </div>
                </div>
            </main>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================

    if (error) {
        return (
            <main className="min-h-screen bg-black text-white">
                <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">
                    <header className="border-b border-white/10 px-6 py-4">
                        <h1 className="text-xl font-bold">
                            Saved
                        </h1>
                    </header>

                    <div className="px-6 py-10 text-center text-red-400">
                        {error}
                    </div>
                </div>
            </main>
        );
    }

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">

                {/* HEADER */}

                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">
                    <h1 className="text-xl font-bold">
                        Saved
                    </h1>
                </header>

                {/* EMPTY STATE */}

                {savedMemes.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <h2 className="text-xl font-semibold">
                            No saved posts yet
                        </h2>

                        <p className="mt-2 text-white/50">
                            Posts you save will appear here.
                        </p>
                    </div>
                ) : (
                    <div>
                        {savedMemes.map((savedItem) => {
                            const meme = savedItem.meme;
                            const profile = meme.profile;

                            return (
                                <article
                                    key={savedItem.meme_id}
                                    className="border-b border-white/10 px-6 py-5 transition hover:bg-white/[0.03]"
                                >
                                    {/* USER */}

                                    <div className="flex items-center gap-3">

                                        {/* AVATAR */}

                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 font-bold">
                                            {profile?.avatar_url ? (
                                                <img
                                                    src={
                                                        profile.avatar_url
                                                    }
                                                    alt="Avatar"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                profile?.full_name
                                                    ?.charAt(0)
                                                    .toUpperCase() ||
                                                profile?.username
                                                    ?.charAt(0)
                                                    .toUpperCase() ||
                                                "U"
                                            )}
                                        </div>

                                        {/* USER INFO */}

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate font-semibold">
                                                    {profile?.full_name ||
                                                        "User"}
                                                </p>

                                                <p className="truncate text-sm text-white/40">
                                                    @
                                                    {profile?.username ||
                                                        "username"}
                                                </p>
                                            </div>

                                            <p className="text-xs text-white/30">
                                                {new Date(
                                                    meme.created_at
                                                ).toLocaleString()}
                                            </p>
                                        </div>

                                    </div>

                                    {/* CONTENT */}

                                    {meme.content && (
                                        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-6">
                                            {meme.content}
                                        </p>
                                    )}

                                    {/* IMAGE */}

                                    {meme.image_url && (
                                        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                            <img
                                                src={
                                                    meme.image_url
                                                }
                                                alt="Saved meme"
                                                className="max-h-[600px] w-full object-contain"
                                            />
                                        </div>
                                    )}

                                    {/* BOTTOM */}

                                    <div className="mt-4 flex items-center justify-between">

                                        <p className="text-xs text-white/30">
                                            Saved{" "}
                                            {new Date(
                                                savedItem.created_at
                                            ).toLocaleString()}
                                        </p>

                                        {/* UNSAVE */}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleUnsave(
                                                    savedItem.meme_id
                                                )
                                            }
                                            disabled={
                                                removingId ===
                                                savedItem.meme_id
                                            }
                                            className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-white/60 transition hover:border-red-400/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {removingId ===
                                                savedItem.meme_id
                                                ? "Removing..."
                                                : "🔖 Unsave"}
                                        </button>

                                    </div>

                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}