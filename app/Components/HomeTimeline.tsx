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
    image_url: string | null;
    author_id: string;
    created_at: string;
    profile: Profile | null;
};

type LikeInfo = {
    count: number;
    liked: boolean;
};

type SaveInfo = {
    saved: boolean;
};

type Reply = {
    id: string;
    text: string;
    user_id: string;
    meme_id: string;
    reply_id: string | null;
    created_at: string;
    profile: Profile | null;
};

const HomeTimeline = () => {
    const supabase = createClient();

    const [memes, setMemes] = useState<Meme[]>([]);
    const [likes, setLikes] = useState<Record<string, LikeInfo>>({});
    const [replies, setReplies] = useState<Record<string, Reply[]>>({});
    const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
    const [saved, setSaved] = useState<Record<string, SaveInfo>>({});

    const [openReplyBox, setOpenReplyBox] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==========================================
    // LOAD TIMELINE
    // ==========================================

    useEffect(() => {
        async function loadTimeline() {
            setLoading(true);
            setError("");

            // ========================================
            // GET LOGGED-IN USER
            // ========================================

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

            // ========================================
            // GET MEMES
            // ========================================

            const { data: memeData, error: memeError } = await supabase
                .from("memes")
                .select(
                    "id, content, image_url, author_id, created_at"
                )
                .order("created_at", {
                    ascending: false,
                });

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

            if (!memeData || memeData.length === 0) {
                setMemes([]);
                setLikes({});
                setReplies({});
                setReplyCounts({});
                setSaved({});
                setLoading(false);
                return;
            }

            // ========================================
            // GET PROFILES
            // ========================================

            const authorIds = [
                ...new Set(
                    memeData.map((meme) => meme.author_id)
                ),
            ];

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
                console.error("PROFILE ERROR:", profileError);

                setError(profileError.message);
                setLoading(false);
                return;
            }

            // ========================================
            // CONNECT MEMES WITH PROFILES
            // ========================================

            const posts: Meme[] = memeData.map((meme) => {
                const profile =
                    profileData?.find(
                        (profile) => profile.id === meme.author_id
                    ) || null;

                return {
                    id: meme.id,
                    content: meme.content,
                    image_url: meme.image_url,
                    author_id: meme.author_id,
                    created_at: meme.created_at,
                    profile,
                };
            });

            setMemes(posts);

            // ========================================
            // GET LIKES
            // ========================================

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

            // ========================================
            // GET SAVED MEMES
            // ========================================

            const {
                data: savedData,
                error: savedError,
            } = await supabase
                .from("saved_memes")
                .select("meme_id")
                .eq("user_id", user.id);

            if (savedError) {
                console.error("SAVED MEMES ERROR:", {
                    message: savedError.message,
                    details: savedError.details,
                    hint: savedError.hint,
                    code: savedError.code,
                });
            }

            // ========================================
            // BUILD LIKE + SAVE INFORMATION
            // ========================================

            const likeInfo: Record<string, LikeInfo> = {};
            const savedInfo: Record<string, SaveInfo> = {};

            posts.forEach((meme) => {
                const memeLikes =
                    likeData?.filter(
                        (like) => like.meme_id === meme.id
                    ) || [];

                likeInfo[meme.id] = {
                    count: memeLikes.length,
                    liked: memeLikes.some(
                        (like) => like.user_id === user.id
                    ),
                };

                savedInfo[meme.id] = {
                    saved:
                        savedData?.some(
                            (item) => item.meme_id === meme.id
                        ) ?? false,
                };
            });

            setLikes(likeInfo);
            setSaved(savedInfo);

            // ========================================
            // GET REPLIES
            // ========================================

            const memeIds = posts.map((meme) => meme.id);

            const {
                data: replyData,
                error: replyError,
            } = await supabase
                .from("replies")
                .select(
                    "id, text, user_id, meme_id, reply_id, created_at"
                )
                .in("meme_id", memeIds)
                .order("created_at", {
                    ascending: true,
                });

            if (replyError) {
                console.error("REPLY LOADING ERROR:", {
                    message: replyError.message,
                    details: replyError.details,
                    hint: replyError.hint,
                    code: replyError.code,
                });
            }

            if (replyData && replyData.length > 0) {
                // ========================================
                // GET REPLY USER IDs
                // ========================================

                const replyUserIds = [
                    ...new Set(
                        replyData.map((reply) => reply.user_id)
                    ),
                ];

                // ========================================
                // GET REPLY PROFILES
                // ========================================

                const {
                    data: replyProfiles,
                    error: replyProfileError,
                } = await supabase
                    .from("profiles")
                    .select(
                        "id, username, full_name, avatar_url"
                    )
                    .in("id", replyUserIds);

                if (replyProfileError) {
                    console.error(
                        "REPLY PROFILE ERROR:",
                        replyProfileError
                    );
                }

                // ========================================
                // FORMAT REPLIES
                // ========================================

                const formattedReplies: Reply[] =
                    replyData.map((reply) => ({
                        id: reply.id,
                        text: reply.text,
                        user_id: reply.user_id,
                        meme_id: reply.meme_id,
                        reply_id: reply.reply_id,
                        created_at: reply.created_at,

                        profile:
                            replyProfiles?.find(
                                (profile) =>
                                    profile.id === reply.user_id
                            ) || null,
                    }));

                // ========================================
                // GROUP REPLIES BY MEME
                // ========================================

                const groupedReplies: Record<string, Reply[]> = {};

                formattedReplies.forEach((reply) => {
                    if (!groupedReplies[reply.meme_id]) {
                        groupedReplies[reply.meme_id] = [];
                    }

                    groupedReplies[reply.meme_id].push(reply);
                });

                setReplies(groupedReplies);

                // ========================================
                // REPLY COUNTS
                // ========================================

                const counts: Record<string, number> = {};

                posts.forEach((meme) => {
                    counts[meme.id] =
                        groupedReplies[meme.id]?.length || 0;
                });

                setReplyCounts(counts);
            } else {
                const emptyCounts: Record<string, number> = {};

                posts.forEach((meme) => {
                    emptyCounts[meme.id] = 0;
                });

                setReplies({});
                setReplyCounts(emptyCounts);
            }

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
        } = await supabase.auth.getUser();

        if (!user) return;

        const currentLike = likes[memeId];

        if (!currentLike) return;

        const oldState = {
            ...currentLike,
        };

        // ========================================
        // OPTIMISTIC UPDATE
        // ========================================

        setLikes((previous) => ({
            ...previous,

            [memeId]: {
                count: currentLike.liked
                    ? currentLike.count - 1
                    : currentLike.count + 1,

                liked: !currentLike.liked,
            },
        }));

        // ========================================
        // UNLIKE
        // ========================================

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

                // Restore previous state
                setLikes((previous) => ({
                    ...previous,
                    [memeId]: oldState,
                }));
            }

            return;
        }

        // ========================================
        // LIKE
        // ========================================

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

            // Restore previous state
            setLikes((previous) => ({
                ...previous,
                [memeId]: oldState,
            }));
        }
    }

    // ==========================================
    // SAVE / UNSAVE
    // ==========================================

    async function handleSave(memeId: string) {
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            console.error("USER ERROR:", {
                message: userError.message,
                details: userError.details,
                hint: userError.hint,
                code: userError.code,
            });

            return;
        }

        if (!user) {
            console.error("No logged-in user.");
            return;
        }

        const currentSave = saved[memeId];

        if (!currentSave) {
            console.error(
                "No save state found for meme:",
                memeId
            );

            return;
        }

        // ========================================
        // UNSAVE
        // ========================================

        if (currentSave.saved) {
            const { error } = await supabase
                .from("saved_memes")
                .delete()
                .eq("meme_id", memeId)
                .eq("user_id", user.id);

            if (error) {
                console.error("UNSAVE ERROR:", {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });

                return;
            }

            setSaved((previous) => ({
                ...previous,
                [memeId]: {
                    saved: false,
                },
            }));

            return;
        }

        // ========================================
        // SAVE
        // ========================================

        const { error } = await supabase
            .from("saved_memes")
            .insert({
                meme_id: memeId,
                user_id: user.id,
            });

        if (error) {
            console.error("SAVE ERROR:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            });

            return;
        }

        setSaved((previous) => ({
            ...previous,
            [memeId]: {
                saved: true,
            },
        }));
    }

    // ==========================================
    // SUBMIT REPLY
    // ==========================================

    async function handleReply(memeId: string) {
        const text = replyText.trim();

        if (!text) return;

        setSubmittingReply(true);

        try {
            // ========================================
            // GET LOGGED-IN USER
            // ========================================

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                console.error(
                    "AUTH ERROR:",
                    userError.message
                );

                setSubmittingReply(false);
                return;
            }

            if (!user) {
                console.error("No logged-in user.");
                setSubmittingReply(false);
                return;
            }

            // ========================================
            // INSERT REPLY
            // ========================================

            const {
                error: insertError,
            } = await supabase
                .from("replies")
                .insert({
                    text: text,
                    user_id: user.id,
                    meme_id: memeId,
                    reply_id: null,
                });

            if (insertError) {
                console.error("REPLY INSERT ERROR:", {
                    message: insertError.message,
                    details: insertError.details,
                    hint: insertError.hint,
                    code: insertError.code,
                });

                setSubmittingReply(false);
                return;
            }

            // ========================================
            // GET USER PROFILE
            // ========================================

            const {
                data: profile,
                error: profileError,
            } = await supabase
                .from("profiles")
                .select(
                    "id, username, full_name, avatar_url"
                )
                .eq("id", user.id)
                .single();

            if (profileError) {
                console.error(
                    "PROFILE ERROR:",
                    profileError.message
                );
            }

            // ========================================
            // CREATE LOCAL REPLY
            // ========================================

            const newReply: Reply = {
                id: crypto.randomUUID(),
                text: text,
                user_id: user.id,
                meme_id: memeId,
                reply_id: null,
                created_at: new Date().toISOString(),
                profile: profile || null,
            };

            // ========================================
            // SHOW REPLY IMMEDIATELY
            // ========================================

            setReplies((previous) => ({
                ...previous,

                [memeId]: [
                    ...(previous[memeId] || []),
                    newReply,
                ],
            }));

            // ========================================
            // UPDATE REPLY COUNT
            // ========================================

            setReplyCounts((previous) => ({
                ...previous,

                [memeId]:
                    (previous[memeId] || 0) + 1,
            }));

            // ========================================
            // CLEAR INPUT
            // ========================================

            setReplyText("");
            setOpenReplyBox(null);

        } catch (error) {
            console.error(
                "UNEXPECTED REPLY ERROR:",
                error
            );
        }

        setSubmittingReply(false);
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
                const memeReplies =
                    replies[meme.id] || [];

                return (
                    <article
                        key={meme.id}
                        className="border-b border-white/10 px-6 py-5 transition hover:bg-white/[0.03]"
                    >
                        {/* USER */}

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

                            {/* USER INFO */}

                            <div className="min-w-0">
                                <div className="flex items-center gap-2">

                                    <p className="truncate font-semibold">
                                        {profile?.full_name ||
                                            "User"}
                                    </p>

                                    <p className="truncate text-sm text-white/40">
                                        @{profile?.username ||
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

                        {/* TEXT */}

                        {meme.content && (
                            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-6">
                                {meme.content}
                            </p>
                        )}

                        {/* MEME IMAGE */}

                        {meme.image_url && (
                            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                <img
                                    src={meme.image_url}
                                    alt="Meme"
                                    className="max-h-[600px] w-full object-contain"
                                />
                            </div>
                        )}

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
                                onClick={() => {
                                    setOpenReplyBox(
                                        openReplyBox === meme.id
                                            ? null
                                            : meme.id
                                    );

                                    setReplyText("");
                                }}
                                className="text-white/40 transition hover:text-white"
                            >
                                💬{" "}
                                {replyCounts[meme.id] || 0}
                            </button>

                            {/* SAVE */}

                            <button
                                type="button"
                                onClick={() =>
                                    handleSave(meme.id)
                                }
                                className={`transition ${saved[meme.id]?.saved
                                    ? "text-yellow-400"
                                    : "text-white/40 hover:text-yellow-400"
                                    }`}
                            >
                                {saved[meme.id]?.saved
                                    ? "🔖 Saved"
                                    : "🔖 Save"}
                            </button>

                        </div>

                        {/* REPLY INPUT */}

                        {openReplyBox === meme.id && (
                            <div className="mt-4 flex gap-3">

                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) =>
                                        setReplyText(
                                            e.target.value
                                        )
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" &&
                                            !e.shiftKey
                                        ) {
                                            e.preventDefault();
                                            handleReply(meme.id);
                                        }
                                    }}
                                    placeholder="Write a reply..."
                                    className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                                />

                                <button
                                    type="button"
                                    disabled={
                                        submittingReply ||
                                        !replyText.trim()
                                    }
                                    onClick={() =>
                                        handleReply(meme.id)
                                    }
                                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {submittingReply
                                        ? "..."
                                        : "Reply"}
                                </button>

                            </div>
                        )}

                        {/* REPLIES */}

                        {memeReplies.length > 0 && (
                            <div className="mt-4 space-y-3 border-l border-white/10 pl-4">

                                {memeReplies.map((reply) => (
                                    <div
                                        key={reply.id}
                                        className="rounded-xl bg-white/[0.03] p-3"
                                    >

                                        <div className="flex items-center gap-2">

                                            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/20 text-xs font-bold">
                                                {reply.profile?.avatar_url ? (
                                                    <img
                                                        src={
                                                            reply
                                                                .profile
                                                                .avatar_url
                                                        }
                                                        alt="Avatar"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    reply.profile
                                                        ?.full_name
                                                        ?.charAt(0)
                                                        .toUpperCase() ||
                                                    "U"
                                                )}
                                            </div>

                                            <p className="text-sm font-semibold">
                                                {reply.profile
                                                    ?.full_name ||
                                                    "User"}
                                            </p>

                                            <p className="text-xs text-white/30">
                                                @
                                                {reply.profile
                                                    ?.username ||
                                                    "username"}
                                            </p>

                                        </div>

                                        <p className="mt-2 text-sm text-white/80">
                                            {reply.text}
                                        </p>

                                        <p className="mt-1 text-xs text-white/30">
                                            {new Date(
                                                reply.created_at
                                            ).toLocaleString()}
                                        </p>

                                    </div>
                                ))}

                            </div>
                        )}

                    </article>
                );
            })}
        </div>
    );
};

export default HomeTimeline;