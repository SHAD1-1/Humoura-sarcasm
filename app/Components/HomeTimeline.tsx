"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ReplyThread from "./ReplyThread";

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

export type Reply = {
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

    const [likes, setLikes] =
        useState<Record<string, LikeInfo>>({});

    const [replies, setReplies] =
        useState<Record<string, Reply[]>>({});

    const [replyCounts, setReplyCounts] =
        useState<Record<string, number>>({});

    const [saved, setSaved] =
        useState<Record<string, SaveInfo>>({});

    const [currentUserId, setCurrentUserId] =
        useState<string | null>(null);

    const [openCommentBox, setOpenCommentBox] =
        useState<string | null>(null);

    const [commentText, setCommentText] =
        useState("");

    const [submittingComment, setSubmittingComment] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    // ==========================================
    // LOAD TIMELINE
    // ==========================================

    useEffect(() => {
        async function loadTimeline() {
            setLoading(true);
            setError("");

            // ========================================
            // GET CURRENT USER
            // ========================================

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                console.error(
                    "USER ERROR:",
                    userError
                );

                setError(
                    userError.message
                );

                setLoading(false);
                return;
            }

            if (!user) {
                setError(
                    "Please log in to view posts."
                );

                setLoading(false);
                return;
            }

            setCurrentUserId(user.id);

            // ========================================
            // GET MEMES
            // ========================================

            const {
                data: memeData,
                error: memeError,
            } = await supabase
                .from("memes")
                .select(
                    "id, content, image_url, author_id, created_at"
                )
                .order("created_at", {
                    ascending: false,
                })
                .limit(50);

            if (memeError) {
                console.error(
                    "MEME ERROR:",
                    memeError
                );

                setError(
                    memeError.message
                );

                setLoading(false);
                return;
            }

            if (
                !memeData ||
                memeData.length === 0
            ) {
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
                    memeData.map(
                        (meme) =>
                            meme.author_id
                    )
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
                .in(
                    "id",
                    authorIds
                );

            if (profileError) {
                console.error(
                    "PROFILE ERROR:",
                    profileError
                );

                setError(
                    profileError.message
                );

                setLoading(false);
                return;
            }

            // ========================================
            // BUILD POSTS
            // ========================================

            const posts: Meme[] =
                memeData.map((meme) => {
                    const profile =
                        profileData?.find(
                            (profile) =>
                                profile.id ===
                                meme.author_id
                        ) || null;

                    return {
                        id: meme.id,
                        content: meme.content,
                        image_url:
                            meme.image_url,
                        author_id:
                            meme.author_id,
                        created_at:
                            meme.created_at,
                        profile,
                    };
                });

            // ========================================
            // SHUFFLE FEED
            // ========================================

            const shuffledPosts = [
                ...posts,
            ];

            for (
                let i =
                    shuffledPosts.length -
                    1;
                i > 0;
                i--
            ) {
                const j = Math.floor(
                    Math.random() *
                    (i + 1)
                );

                [
                    shuffledPosts[i],
                    shuffledPosts[j],
                ] = [
                        shuffledPosts[j],
                        shuffledPosts[i],
                    ];
            }

            setMemes(
                shuffledPosts
            );

            // ========================================
            // GET LIKES
            // ========================================

            const {
                data: likeData,
                error: likeError,
            } = await supabase
                .from("meme_likes")
                .select(
                    "meme_id, user_id"
                );

            if (likeError) {
                console.error(
                    "LIKE LOADING ERROR:",
                    likeError
                );
            }

            // ========================================
            // GET SAVED MEMES
            // ========================================

            const {
                data: savedData,
                error: savedError,
            } = await supabase
                .from("saved_memes")
                .select(
                    "meme_id"
                )
                .eq(
                    "user_id",
                    user.id
                );

            if (savedError) {
                console.error(
                    "SAVED MEMES ERROR:",
                    savedError
                );
            }

            const likeInfo: Record<
                string,
                LikeInfo
            > = {};

            const savedInfo: Record<
                string,
                SaveInfo
            > = {};

            shuffledPosts.forEach(
                (meme) => {
                    const memeLikes =
                        likeData?.filter(
                            (like) =>
                                like.meme_id ===
                                meme.id
                        ) || [];

                    likeInfo[meme.id] = {
                        count:
                            memeLikes.length,

                        liked:
                            memeLikes.some(
                                (like) =>
                                    like.user_id ===
                                    user.id
                            ),
                    };

                    savedInfo[meme.id] = {
                        saved:
                            savedData?.some(
                                (item) =>
                                    item.meme_id ===
                                    meme.id
                            ) ?? false,
                    };
                }
            );

            setLikes(
                likeInfo
            );

            setSaved(
                savedInfo
            );

            // ========================================
            // GET REPLIES / COMMENTS
            // ========================================

            const memeIds =
                shuffledPosts.map(
                    (meme) =>
                        meme.id
                );

            const {
                data: replyData,
                error: replyError,
            } = await supabase
                .from("replies")
                .select(
                    "id, text, user_id, meme_id, reply_id, created_at"
                )
                .in(
                    "meme_id",
                    memeIds
                )
                .order(
                    "created_at",
                    {
                        ascending: true,
                    }
                );

            if (replyError) {
                console.error(
                    "REPLY LOADING ERROR:",
                    replyError
                );
            }

            if (
                replyData &&
                replyData.length > 0
            ) {
                const replyUserIds = [
                    ...new Set(
                        replyData.map(
                            (reply) =>
                                reply.user_id
                        )
                    ),
                ];

                const {
                    data:
                    replyProfiles,
                    error:
                    replyProfileError,
                } = await supabase
                    .from("profiles")
                    .select(
                        "id, username, full_name, avatar_url"
                    )
                    .in(
                        "id",
                        replyUserIds
                    );

                if (
                    replyProfileError
                ) {
                    console.error(
                        "REPLY PROFILE ERROR:",
                        replyProfileError
                    );
                }

                const formattedReplies: Reply[] =
                    replyData.map(
                        (reply) => ({
                            id: reply.id,
                            text: reply.text,
                            user_id:
                                reply.user_id,
                            meme_id:
                                reply.meme_id,
                            reply_id:
                                reply.reply_id,
                            created_at:
                                reply.created_at,
                            profile:
                                replyProfiles?.find(
                                    (
                                        profile
                                    ) =>
                                        profile.id ===
                                        reply.user_id
                                ) || null,
                        })
                    );

                const groupedReplies: Record<
                    string,
                    Reply[]
                > = {};

                formattedReplies.forEach(
                    (reply) => {
                        if (
                            !groupedReplies[
                            reply.meme_id
                            ]
                        ) {
                            groupedReplies[
                                reply.meme_id
                            ] = [];
                        }

                        groupedReplies[
                            reply.meme_id
                        ].push(
                            reply
                        );
                    }
                );

                setReplies(
                    groupedReplies
                );

                const counts: Record<
                    string,
                    number
                > = {};

                shuffledPosts.forEach(
                    (meme) => {
                        counts[meme.id] =
                            groupedReplies[
                                meme.id
                            ]?.length ||
                            0;
                    }
                );

                setReplyCounts(
                    counts
                );
            } else {
                const emptyCounts: Record<
                    string,
                    number
                > = {};

                shuffledPosts.forEach(
                    (meme) => {
                        emptyCounts[
                            meme.id
                        ] = 0;
                    }
                );

                setReplies({});

                setReplyCounts(
                    emptyCounts
                );
            }

            setLoading(false);
        }

        loadTimeline();
    }, []);

    // ==========================================
    // LIKE / UNLIKE
    // ==========================================

    async function handleLike(
        memeId: string
    ) {
        const {
            data: { user },
        } =
            await supabase.auth.getUser();

        if (!user) return;

        const currentLike =
            likes[memeId];

        if (!currentLike) return;

        const meme = memes.find(
            (item) =>
                item.id === memeId
        );

        if (!meme) return;

        const oldState = {
            ...currentLike,
        };

        setLikes(
            (previous) => ({
                ...previous,

                [memeId]: {
                    count:
                        currentLike.liked
                            ? currentLike.count -
                            1
                            : currentLike.count +
                            1,

                    liked:
                        !currentLike.liked,
                },
            })
        );

        // UNLIKE

        if (
            currentLike.liked
        ) {
            const {
                error,
            } = await supabase
                .from("meme_likes")
                .delete()
                .eq(
                    "meme_id",
                    memeId
                )
                .eq(
                    "user_id",
                    user.id
                );

            if (error) {
                console.error(
                    "UNLIKE ERROR:",
                    error
                );

                setLikes(
                    (previous) => ({
                        ...previous,
                        [memeId]:
                            oldState,
                    })
                );

                return;
            }

            if (
                meme.author_id !==
                user.id
            ) {
                await supabase
                    .from(
                        "notifications"
                    )
                    .delete()
                    .eq(
                        "recipient_id",
                        meme.author_id
                    )
                    .eq(
                        "actor_id",
                        user.id
                    )
                    .eq(
                        "type",
                        "like"
                    )
                    .eq(
                        "meme_id",
                        memeId
                    );
            }

            return;
        }

        // LIKE

        const {
            error,
        } = await supabase
            .from("meme_likes")
            .insert({
                meme_id:
                    memeId,
                user_id:
                    user.id,
            });

        if (error) {
            console.error(
                "LIKE ERROR:",
                error
            );

            setLikes(
                (previous) => ({
                    ...previous,
                    [memeId]:
                        oldState,
                })
            );

            return;
        }

        // LIKE NOTIFICATION

        if (
            meme.author_id !==
            user.id
        ) {
            const {
                error:
                notificationError,
            } =
                await supabase
                    .from(
                        "notifications"
                    )
                    .insert({
                        recipient_id:
                            meme.author_id,

                        actor_id:
                            user.id,

                        type: "like",

                        meme_id:
                            memeId,

                        reply_id:
                            null,
                    });

            if (
                notificationError
            ) {
                console.error(
                    "LIKE NOTIFICATION ERROR:",
                    notificationError
                );
            }
        }
    }

    // ==========================================
    // SAVE / UNSAVE
    // ==========================================

    async function handleSave(
        memeId: string
    ) {
        const {
            data: { user },
        } =
            await supabase.auth.getUser();

        if (!user) return;

        const currentSave =
            saved[memeId];

        if (!currentSave) return;

        // UNSAVE

        if (
            currentSave.saved
        ) {
            const {
                error,
            } = await supabase
                .from(
                    "saved_memes"
                )
                .delete()
                .eq(
                    "meme_id",
                    memeId
                )
                .eq(
                    "user_id",
                    user.id
                );

            if (error) {
                console.error(
                    "UNSAVE ERROR:",
                    error
                );

                return;
            }

            setSaved(
                (previous) => ({
                    ...previous,

                    [memeId]: {
                        saved: false,
                    },
                })
            );

            return;
        }

        // SAVE

        const {
            error,
        } = await supabase
            .from(
                "saved_memes"
            )
            .insert({
                meme_id:
                    memeId,
                user_id:
                    user.id,
            });

        if (error) {
            console.error(
                "SAVE ERROR:",
                error
            );

            return;
        }

        setSaved(
            (previous) => ({
                ...previous,

                [memeId]: {
                    saved: true,
                },
            })
        );
    }

    // ==========================================
    // DELETE POST
    // ==========================================

    async function handleDeletePost(
        memeId: string
    ) {
        const {
            data: { user },
        } =
            await supabase.auth.getUser();

        if (!user) return;

        const meme =
            memes.find(
                (item) =>
                    item.id ===
                    memeId
            );

        if (!meme) return;

        if (
            meme.author_id !==
            user.id
        ) {
            console.error(
                "DELETE POST BLOCKED: not the author"
            );
            return;
        }

        const confirmed =
            window.confirm(
                "Delete this post? This cannot be undone."
            );

        if (!confirmed) return;

        const {
            error,
        } = await supabase
            .from("memes")
            .delete()
            .eq(
                "id",
                memeId
            )
            .eq(
                "author_id",
                user.id
            );

        if (error) {
            console.error(
                "DELETE POST ERROR:",
                {
                    message:
                        error.message,
                    details:
                        error.details,
                    hint:
                        error.hint,
                    code:
                        error.code,
                }
            );

            return;
        }

        setMemes(
            (previous) =>
                previous.filter(
                    (meme) =>
                        meme.id !==
                        memeId
                )
        );

        setLikes(
            (previous) => {
                const next = {
                    ...previous,
                };

                delete next[
                    memeId
                ];

                return next;
            }
        );

        setReplies(
            (previous) => {
                const next = {
                    ...previous,
                };

                delete next[
                    memeId
                ];

                return next;
            }
        );

        setReplyCounts(
            (previous) => {
                const next = {
                    ...previous,
                };

                delete next[
                    memeId
                ];

                return next;
            }
        );

        setSaved(
            (previous) => {
                const next = {
                    ...previous,
                };

                delete next[
                    memeId
                ];

                return next;
            }
        );

        if (
            openCommentBox ===
            memeId
        ) {
            setOpenCommentBox(
                null
            );
            setCommentText("");
        }
    }

    // ==========================================
    // ADD TOP-LEVEL COMMENT
    // ==========================================

    async function handleComment(
        memeId: string
    ) {
        const text =
            commentText.trim();

        if (!text) return;

        setSubmittingComment(true);

        try {
            const {
                data: { user },
                error: userError,
            } =
                await supabase.auth.getUser();

            if (userError) {
                console.error(
                    "COMMENT USER ERROR:",
                    userError
                );

                return;
            }

            if (!user) return;

            const meme = memes.find(
                (item) =>
                    item.id ===
                    memeId
            );

            if (!meme) return;

            const {
                data:
                insertedReply,
                error:
                insertError,
            } =
                await supabase
                    .from("replies")
                    .insert({
                        text,
                        user_id:
                            user.id,
                        meme_id:
                            memeId,
                        reply_id:
                            null,
                    })
                    .select(
                        "id, text, user_id, meme_id, reply_id, created_at"
                    )
                    .single();

            if (
                insertError
            ) {
                console.error(
                    "COMMENT INSERT ERROR:",
                    {
                        message:
                            insertError.message,
                        details:
                            insertError.details,
                        hint:
                            insertError.hint,
                        code:
                            insertError.code,
                    }
                );

                return;
            }

            const {
                data: profile,
                error: profileError,
            } =
                await supabase
                    .from("profiles")
                    .select(
                        "id, username, full_name, avatar_url"
                    )
                    .eq(
                        "id",
                        user.id
                    )
                    .single();

            if (profileError) {
                console.error(
                    "COMMENT PROFILE ERROR:",
                    profileError
                );
            }

            if (
                !insertedReply
            ) {
                return;
            }

            const newReply: Reply =
            {
                id:
                    insertedReply.id,

                text:
                    insertedReply.text,

                user_id:
                    insertedReply.user_id,

                meme_id:
                    insertedReply.meme_id,

                reply_id:
                    insertedReply.reply_id,

                created_at:
                    insertedReply.created_at,

                profile:
                    profile ||
                    null,
            };

            setReplies(
                (previous) => ({
                    ...previous,

                    [memeId]: [
                        ...(previous[
                            memeId
                        ] || []),
                        newReply,
                    ],
                })
            );

            setReplyCounts(
                (previous) => ({
                    ...previous,

                    [memeId]:
                        (previous[
                            memeId
                        ] || 0) + 1,
                })
            );

            if (
                meme.author_id !==
                user.id
            ) {
                const {
                    error:
                    notificationError,
                } =
                    await supabase
                        .from(
                            "notifications"
                        )
                        .insert({
                            recipient_id:
                                meme.author_id,

                            actor_id:
                                user.id,

                            type: "reply",

                            meme_id:
                                memeId,

                            reply_id:
                                insertedReply.id,
                        });

                if (
                    notificationError
                ) {
                    console.error(
                        "COMMENT NOTIFICATION ERROR:",
                        notificationError
                    );
                }
            }

            setCommentText("");

            setOpenCommentBox(
                null
            );
        } catch (error) {
            console.error(
                "UNEXPECTED COMMENT ERROR:",
                error
            );
        } finally {
            setSubmittingComment(
                false
            );
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

    if (
        memes.length ===
        0
    ) {
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
        <div className="pb-24 lg:pb-0">
            {memes.map(
                (meme) => {
                    const profile =
                        meme.profile;

                    const likeInfo =
                        likes[meme.id];

                    const memeReplies =
                        replies[
                        meme.id
                        ] || [];

                    const isOwner =
                        currentUserId ===
                        meme.author_id;

                    return (
                        <article
                            key={
                                meme.id
                            }
                            className="border-b border-white/10 bg-white/[0.01] px-4 py-5 transition duration-200 hover:bg-red-950/[0.08] sm:px-6"
                        >

                            {/* HEADER */}

                            <div className="flex items-start gap-3">

                                <Link
                                    href={`/profile/${meme.author_id}`}
                                    className="flex w-fit items-center gap-3 rounded-2xl px-1 py-1 transition hover:bg-white/[0.04]"
                                >

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
                                                ?.charAt(
                                                    0
                                                )
                                                .toUpperCase() ||
                                            profile?.username
                                                ?.charAt(
                                                    0
                                                )
                                                .toUpperCase() ||
                                            "U"
                                        )}

                                    </div>

                                    {/* USER */}

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

                                </Link>

                                {/* OWNER DELETE */}

                                {isOwner && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDeletePost(
                                                meme.id
                                            )
                                        }
                                        className="ml-auto rounded-full px-3 py-1.5 text-xs font-medium text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
                                    >
                                        Delete
                                    </button>
                                )}

                            </div>

                            {/* TEXT */}

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
                                        alt="Meme"
                                        className="max-h-[600px] w-full rounded-xl object-contain sm:rounded-2xl"
                                    />
                                </div>
                            )}

                            {/* ACTIONS */}

                            <div className="mt-4 flex items-center gap-2 text-sm sm:gap-8">

                                {/* LIKE */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleLike(
                                            meme.id
                                        )
                                    }
                                    className={`rounded-full px-3 py-2 transition ${likeInfo?.liked
                                        ? "bg-red-500/10 text-red-400"
                                        : "text-white/40 hover:bg-white/5 hover:text-red-400"
                                        }`}
                                >
                                    {likeInfo?.liked
                                        ? "❤️"
                                        : "♡"}{" "}
                                    {likeInfo?.count ||
                                        0}
                                </button>

                                {/* COMMENT */}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpenCommentBox(
                                            openCommentBox ===
                                                meme.id
                                                ? null
                                                : meme.id
                                        );

                                        setCommentText(
                                            ""
                                        );
                                    }}
                                    className={`rounded-full px-3 py-2 transition ${openCommentBox ===
                                        meme.id
                                        ? "bg-white/10 text-white"
                                        : "text-white/40 hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    💬{" "}
                                    {replyCounts[
                                        meme.id
                                    ] || 0}
                                </button>

                                {/* SAVE */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleSave(
                                            meme.id
                                        )
                                    }
                                    className={`rounded-full px-3 py-2 transition ${saved[
                                        meme.id
                                    ]?.saved
                                        ? "bg-yellow-400/10 text-yellow-400"
                                        : "text-white/40 hover:bg-white/5 hover:text-yellow-400"
                                        }`}
                                >
                                    {saved[
                                        meme.id
                                    ]?.saved
                                        ? "🔖 Saved"
                                        : "🔖 Save"}
                                </button>

                            </div>

                            {/* COMMENT BOX */}

                            {openCommentBox ===
                                meme.id && (
                                    <div className="mt-4 flex gap-3">

                                        <input
                                            type="text"
                                            value={
                                                commentText
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setCommentText(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            onKeyDown={(
                                                e
                                            ) => {
                                                if (
                                                    e.key ===
                                                    "Enter" &&
                                                    !e.shiftKey
                                                ) {
                                                    e.preventDefault();

                                                    handleComment(
                                                        meme.id
                                                    );
                                                }
                                            }}
                                            placeholder="Write a comment..."
                                            className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                                        />

                                        <button
                                            type="button"
                                            disabled={
                                                submittingComment ||
                                                !commentText.trim()
                                            }
                                            onClick={() =>
                                                handleComment(
                                                    meme.id
                                                )
                                            }
                                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {submittingComment
                                                ? "..."
                                                : "Comment"}
                                        </button>

                                    </div>
                                )}

                            {/* COMMENTS */}

                            <ReplyThread
                                memeId={meme.id}
                                memeAuthorId={meme.author_id}
                                replies={memeReplies}

                                onReplyAdded={(newReply) => {
                                    setReplies((previous) => ({
                                        ...previous,

                                        [meme.id]: [
                                            ...(previous[meme.id] || []),
                                            newReply,
                                        ],
                                    }));

                                    setReplyCounts((previous) => ({
                                        ...previous,

                                        [meme.id]:
                                            (previous[meme.id] || 0) + 1,
                                    }));
                                }}

                                onReplyDeleted={(replyId) => {
                                    setReplies((previous) => ({
                                        ...previous,

                                        [meme.id]: (
                                            previous[meme.id] || []
                                        ).filter(
                                            (reply) =>
                                                reply.id !==
                                                replyId
                                        ),
                                    }));

                                    setReplyCounts((previous) => ({
                                        ...previous,

                                        [meme.id]: Math.max(
                                            0,
                                            (previous[meme.id] || 0) - 1
                                        ),
                                    }));
                                }}
                            />

                        </article>
                    );
                }
            )}
        </div>
    );
};

export default HomeTimeline;