"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
};

type Meme = {
    id: string;
    content: string;
    author_id: string;
    created_at: string;
    profile: Profile | null;
};

type LikeInfo = {
    count: number;
    liked: boolean;
};

const HomeTimeline = () => {
    const supabase = createClient();

    const [memes, setMemes] = useState<Meme[]>([]);
    const [likes, setLikes] = useState<Record<string, LikeInfo>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==========================================
    // LOAD TIMELINE
    // ==========================================

    useEffect(() => {
        async function loadTimeline() {
            setLoading(true);
            setError("");

            // ----------------------------------------
            // 1. Get logged-in user
            // ----------------------------------------

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                console.error("USER ERROR:", userError);
                setError(userError.message);
                setLoading(false);
                return;
            }

            if (!user) {
                setError("Please log in to view posts.");
                setLoading(false);
                return;
            }

            // ----------------------------------------
            // 2. Get memes
            // ----------------------------------------

            const {
                data: memeData,
                error: memeError,
            } = await supabase
                .from("memes")
                .select("id, content, author_id, created_at")
                .order("created_at", { ascending: false });

            if (memeError) {
                console.error("MEME ERROR:", {
                    message: memeError.message,
                    details: memeError.details,
                    hint: memeError.hint,
                    code: memeError.code,
                });

                setError(memeError.message);
                setLoading(false);
                return;
            }

            // ----------------------------------------
            // No posts
            // ----------------------------------------

            if (!memeData || memeData.length === 0) {
                setMemes([]);
                setLikes({});
                setLoading(false);
                return;
            }

            // ----------------------------------------
            // 3. Get author IDs
            // ----------------------------------------

            const authorIds = [
                ...new Set(
                    memeData.map((meme) => meme.author_id)
                ),
            ];

            // ----------------------------------------
            // 4. Get profiles
            // ----------------------------------------

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
                console.error("PROFILE ERROR:", {
                    message: profileError.message,
                    details: profileError.details,
                    hint: profileError.hint,
                    code: profileError.code,
                });

                setError(profileError.message);
                setLoading(false);
                return;
            }

            // ----------------------------------------
            // 5. Connect memes with profiles
            // ----------------------------------------

            const posts: Meme[] = memeData.map((meme) => {
                const profile =
                    profileData?.find(
                        (profile) =>
                            profile.id === meme.author_id
                    ) || null;

                return {
                    id: meme.id,
                    content: meme.content,
                    author_id: meme.author_id,
                    created_at: meme.created_at,
                    profile,
                };
            });

            setMemes(posts);

            // ----------------------------------------
            // 6. Get likes
            // ----------------------------------------

            const {
                data: likeData,
                error: likeError,
            } = await supabase
                .from("meme_likes")
                .select("meme_id, user_id");

            if (likeError) {
                console.error("LIKE LOADING ERROR:", {
                    message: likeError.message,
                    details: likeError.details,
                    hint: likeError.hint,
                    code: likeError.code,
                });
            }

            // ----------------------------------------
            // 7. Calculate likes
            // ----------------------------------------

            const likeInfo: Record<string, LikeInfo> = {};

            posts.forEach((meme) => {
                const memeLikes =
                    likeData?.filter(
                        (like) =>
                            like.meme_id === meme.id
                    ) || [];

                likeInfo[meme.id] = {
                    count: memeLikes.length,

                    liked: memeLikes.some(
                        (like) =>
                            like.user_id === user.id
                    ),
                };
            });

            setLikes(likeInfo);
            setLoading(false);
        }

        loadTimeline();
    }, []);

    // ==========================================
    // LIKE / UNLIKE
    // ==========================================

    async function handleLike(memeId: string) {
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            console.error("USER ERROR:", userError);
            return;
        }

        if (!user) {
            console.error("No logged-in user.");
            return;
        }

        const currentLike = likes[memeId];

        if (!currentLike) {
            return;
        }

        // Save old state
        const oldState = {
            ...currentLike,
        };

        // ----------------------------------------
        // Optimistic update
        // ----------------------------------------

        setLikes((previous) => ({
            ...previous,

            [memeId]: {
                count: currentLike.liked
                    ? currentLike.count - 1
                    : currentLike.count + 1,

                liked: !currentLike.liked,
            },
        }));

        // ----------------------------------------
        // UNLIKE
        // ----------------------------------------

        if (currentLike.liked) {
            const { error } = await supabase
                .from("meme_likes")
                .delete()
                .eq("meme_id", memeId)
                .eq("user_id", user.id);

            if (error) {
                console.error("UNLIKE ERROR:", {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });

                // Restore old state
                setLikes((previous) => ({
                    ...previous,
                    [memeId]: oldState,
                }));
            }

            return;
        }

        // ----------------------------------------
        // LIKE
        // ----------------------------------------

        const { error } = await supabase
            .from("meme_likes")
            .insert({
                meme_id: memeId,
                user_id: user.id,
            });

        if (error) {
            console.error("LIKE ERROR:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            });

            // Restore old state
            setLikes((previous) => ({
                ...previous,
                [memeId]: oldState,
            }));
        }
    }

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="px-6 py-10 text-center text-white/50">
                Loading posts...
            </div>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================

    if (error) {
        return (
            <div className="px-6 py-10 text-center text-red-400">
                {error}
            </div>
        );
    }

    // ==========================================
    // NO POSTS
    // ==========================================

    if (memes.length === 0) {
        return (
            <div className="px-6 py-10 text-center text-white/50">
                No posts yet. Be the first to post! 👀
            </div>
        );
    }

    // ==========================================
    // TIMELINE
    // ==========================================

    return (
        <div>
            {memes.map((meme) => {
                const profile = meme.profile;
                const likeInfo = likes[meme.id];

                return (
                    <article
                        key={meme.id}
                        className="border-b border-white/10 px-6 py-5 transition hover:bg-white/[0.03]"
                    >
                        {/* USER INFORMATION */}

                        <div className="flex items-center gap-3">

                            {/* AVATAR */}

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 font-bold">
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
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

                            {/* NAME */}

                            <div className="min-w-0">
                                <div className="flex items-center gap-2">

                                    <p className="truncate font-semibold">
                                        {profile?.full_name || "User"}
                                    </p>

                                    <p className="truncate text-sm text-white/40">
                                        @{profile?.username || "username"}
                                    </p>

                                </div>

                                {/* TIME */}

                                <p className="text-xs text-white/30">
                                    {new Date(
                                        meme.created_at
                                    ).toLocaleString()}
                                </p>
                            </div>

                        </div>

                        {/* POST CONTENT */}

                        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-6">
                            {meme.content}
                        </p>

                        {/* ACTIONS */}

                        <div className="mt-4 flex items-center gap-8 text-sm">

                            {/* LIKE */}

                            <button
                                type="button"
                                onClick={() =>
                                    handleLike(meme.id)
                                }
                                className={`transition ${likeInfo?.liked
                                        ? "text-red-400"
                                        : "text-white/40 hover:text-red-400"
                                    }`}
                            >
                                {likeInfo?.liked
                                    ? "❤️"
                                    : "♡"}{" "}
                                {likeInfo?.count || 0}
                            </button>

                            {/* REPLY */}

                            <button
                                type="button"
                                className="text-white/40 transition hover:text-white"
                            >
                                💬 Reply
                            </button>

                            {/* SAVE */}

                            <button
                                type="button"
                                className="text-white/40 transition hover:text-white"
                            >
                                🔖 Save
                            </button>

                        </div>

                    </article>
                );
            })}
        </div>
    );
};

export default HomeTimeline;