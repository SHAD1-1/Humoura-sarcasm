"use client";

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

    const [openReplyBox, setOpenReplyBox] =
        useState<string | null>(null);
    const [replyText, setReplyText] =
        useState("");
    const [submittingReply, setSubmittingReply] =
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

            // GET USER
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                console.error(
                    "USER ERROR:",
                    userError
                );
                setError(userError.message);
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
                });

            if (memeError) {
                console.error(
                    "MEME ERROR:",
                    memeError
                );
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
                    memeData.map(
                        (meme) => meme.author_id
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
                .in("id", authorIds);

            if (profileError) {
                console.error(
                    "PROFILE ERROR:",
                    profileError
                );
                setError(profileError.message);
                setLoading(false);
                return;
            }

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

            setMemes(posts);

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
                .select("meme_id")
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

            posts.forEach((meme) => {
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
            });

            setLikes(likeInfo);
            setSaved(savedInfo);

            // ========================================
            // GET REPLIES
            // ========================================

            const memeIds =
                posts.map(
                    (meme) => meme.id
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
                    data: replyProfiles,
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

                if (replyProfileError) {
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
                                    (profile) =>
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
                        ].push(reply);
                    }
                );

                setReplies(
                    groupedReplies
                );

                const counts: Record<
                    string,
                    number
                > = {};

                posts.forEach((meme) => {
                    counts[meme.id] =
                        groupedReplies[
                            meme.id
                        ]?.length || 0;
                });

                setReplyCounts(counts);
            } else {
                const emptyCounts: Record<
                    string,
                    number
                > = {};

                posts.forEach((meme) => {
                    emptyCounts[meme.id] = 0;
                });

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
    // LIKE / UNLIKE POST
    // ==========================================

    async function handleLike(
        memeId: string
    ) {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const currentLike =
            likes[memeId];

        if (!currentLike) return;

        const meme = memes.find(
            (item) => item.id === memeId
        );

        if (!meme) return;

        const oldState = {
            ...currentLike,
        };

        // Optimistic update
        setLikes((previous) => ({
            ...previous,

            [memeId]: {
                count:
                    currentLike.liked
                        ? currentLike.count - 1
                        : currentLike.count + 1,

                liked:
                    !currentLike.liked,
            },
        }));

        // UNLIKE
        if (currentLike.liked) {
            const { error } =
                await supabase
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
        const { error } =
            await supabase
                .from(
                    "meme_likes"
                )
                .insert({
                    meme_id: memeId,
                    user_id: user.id,
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

        // Notification
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
        if (currentSave.saved) {
            const { error } =
                await supabase
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
        const { error } =
            await supabase
                .from(
                    "saved_memes"
                )
                .insert({
                    meme_id: memeId,
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
                const profile =
                    meme.profile;

                const likeInfo =
                    likes[meme.id];

                const memeReplies =
                    replies[meme.id] ||
                    [];

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
                                    className="max-h-[600px] w-full object-contain"
                                />
                            </div>
                        )}

                        {/* POST ACTIONS */}

                        <div className="mt-4 flex items-center gap-8 text-sm">

                            {/* LIKE */}

                            <button
                                type="button"
                                onClick={() =>
                                    handleLike(
                                        meme.id
                                    )
                                }
                                className={`transition ${likeInfo?.liked
                                    ? "text-red-400"
                                    : "text-white/40 hover:text-red-400"
                                    }`}
                            >
                                {likeInfo?.liked
                                    ? "❤️"
                                    : "♡"}{" "}
                                {likeInfo?.count ||
                                    0}
                            </button>

                            {/* REPLY */}
                            <span className="text-white/40">
                                💬 {replyCounts[meme.id] || 0}
                            </span>

                            {/* SAVE */}

                            <button
                                type="button"
                                onClick={() =>
                                    handleSave(
                                        meme.id
                                    )
                                }
                                className={`transition ${saved[
                                    meme.id
                                ]?.saved
                                    ? "text-yellow-400"
                                    : "text-white/40 hover:text-yellow-400"
                                    }`}
                            >
                                {saved[
                                    meme.id
                                ]?.saved
                                    ? "🔖 Saved"
                                    : "🔖 Save"}
                            </button>

                        </div>

                        {/* TOP LEVEL REPLY BOX */}

                        {/* COMMENTS + NESTED REPLIES */}

                        <ReplyThread
                            memeId={meme.id}
                            memeAuthorId={
                                meme.author_id
                            }
                            replies={
                                memeReplies
                            }
                            onReplyAdded={(
                                newReply
                            ) => {
                                setReplies(
                                    (
                                        previous
                                    ) => ({
                                        ...previous,
                                        [meme.id]: [
                                            ...(previous[
                                                meme.id
                                            ] || []),
                                            newReply,
                                        ],
                                    })
                                );

                                setReplyCounts(
                                    (
                                        previous
                                    ) => ({
                                        ...previous,
                                        [meme.id]:
                                            (
                                                previous[
                                                meme.id
                                                ] ||
                                                0
                                            ) + 1,
                                    })
                                );
                            }}
                        />

                    </article>
                );
            })}
        </div>
    );
};

export default HomeTimeline;