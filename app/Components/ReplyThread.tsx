"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
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

type ReplyLikeInfo = {
    count: number;
    liked: boolean;
};

type ReplyThreadProps = {
    memeId: string;
    memeAuthorId: string;
    replies: Reply[];
    onReplyAdded?: (
        reply: Reply
    ) => void;
    onReplyDeleted?: (
        replyId: string
    ) => void;
};

export default function ReplyThread({
    memeId,
    memeAuthorId,
    replies,
    onReplyAdded,
    onReplyDeleted,
}: ReplyThreadProps) {
    const supabase = createClient();

    const [
        currentUserId,
        setCurrentUserId,
    ] = useState<string | null>(null);

    const [
        replyLikes,
        setReplyLikes,
    ] = useState<
        Record<string, ReplyLikeInfo>
    >({});

    const [
        replyingTo,
        setReplyingTo,
    ] = useState<string | null>(
        null
    );

    const [
        replyText,
        setReplyText,
    ] = useState("");

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        deletingReplyId,
        setDeletingReplyId,
    ] = useState<string | null>(
        null
    );

    // ==========================================
    // GET CURRENT USER
    // ==========================================

    useEffect(() => {
        async function loadCurrentUser() {
            const {
                data: { user },
            } =
                await supabase.auth.getUser();

            setCurrentUserId(
                user?.id || null
            );
        }

        loadCurrentUser();
    }, []);

    // ==========================================
    // LOAD COMMENT LIKES
    // ==========================================

    useEffect(() => {
        async function loadReplyLikes() {
            if (
                replies.length === 0
            ) {
                setReplyLikes({});
                return;
            }

            const {
                data: { user },
            } =
                await supabase.auth.getUser();

            if (!user) return;

            const replyIds =
                replies.map(
                    (reply) =>
                        reply.id
                );

            const {
                data,
                error,
            } = await supabase
                .from("reply_likes")
                .select(
                    "reply_id, user_id"
                )
                .in(
                    "reply_id",
                    replyIds
                );

            if (error) {
                console.error(
                    "REPLY LIKES ERROR:",
                    error
                );
                return;
            }

            const info: Record<
                string,
                ReplyLikeInfo
            > = {};

            replies.forEach(
                (reply) => {
                    const likesForReply =
                        data?.filter(
                            (like) =>
                                like.reply_id ===
                                reply.id
                        ) || [];

                    info[reply.id] = {
                        count:
                            likesForReply.length,

                        liked:
                            likesForReply.some(
                                (like) =>
                                    like.user_id ===
                                    user.id
                            ),
                    };
                }
            );

            setReplyLikes(info);
        }

        loadReplyLikes();
    }, [replies]);

    // ==========================================
    // LIKE / UNLIKE COMMENT
    // ==========================================

    async function handleReplyLike(
        reply: Reply
    ) {
        const {
            data: { user },
        } =
            await supabase.auth.getUser();

        if (!user) return;

        const current =
            replyLikes[reply.id] || {
                count: 0,
                liked: false,
            };

        const oldState = {
            ...current,
        };

        setReplyLikes(
            (previous) => ({
                ...previous,

                [reply.id]: {
                    count:
                        current.liked
                            ? current.count -
                            1
                            : current.count +
                            1,

                    liked:
                        !current.liked,
                },
            })
        );

        // ========================================
        // UNLIKE
        // ========================================

        if (current.liked) {
            const {
                error,
            } = await supabase
                .from("reply_likes")
                .delete()
                .eq(
                    "reply_id",
                    reply.id
                )
                .eq(
                    "user_id",
                    user.id
                );

            if (error) {
                console.error(
                    "REPLY UNLIKE ERROR:",
                    error
                );

                setReplyLikes(
                    (previous) => ({
                        ...previous,
                        [reply.id]:
                            oldState,
                    })
                );

                return;
            }

            if (
                reply.user_id !==
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
                        .delete()
                        .eq(
                            "recipient_id",
                            reply.user_id
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
                            reply.meme_id
                        )
                        .eq(
                            "reply_id",
                            reply.id
                        );

                if (
                    notificationError
                ) {
                    console.error(
                        "REPLY LIKE NOTIFICATION DELETE ERROR:",
                        notificationError
                    );
                }
            }

            return;
        }

        // ========================================
        // LIKE
        // ========================================

        const {
            error,
        } = await supabase
            .from("reply_likes")
            .insert({
                reply_id:
                    reply.id,
                user_id:
                    user.id,
            });

        if (error) {
            console.error(
                "REPLY LIKE ERROR:",
                error
            );

            setReplyLikes(
                (previous) => ({
                    ...previous,
                    [reply.id]:
                        oldState,
                })
            );

            return;
        }

        if (
            reply.user_id !==
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
                            reply.user_id,

                        actor_id:
                            user.id,

                        type: "like",

                        meme_id:
                            reply.meme_id,

                        reply_id:
                            reply.id,
                    });

            if (
                notificationError
            ) {
                console.error(
                    "REPLY LIKE NOTIFICATION ERROR:",
                    notificationError
                );
            }
        }
    }

    // ==========================================
    // DELETE COMMENT / REPLY
    // ==========================================

    async function handleDeleteReply(
        reply: Reply
    ) {
        const {
            data: { user },
        } =
            await supabase.auth.getUser();

        if (!user) return;

        // Only the author can delete it
        if (
            reply.user_id !==
            user.id
        ) {
            console.error(
                "DELETE REPLY BLOCKED: not the author"
            );
            return;
        }

        const confirmed =
            window.confirm(
                "Delete this comment? This cannot be undone."
            );

        if (!confirmed) return;

        setDeletingReplyId(
            reply.id
        );

        try {
            const {
                error,
            } = await supabase
                .from("replies")
                .delete()
                .eq(
                    "id",
                    reply.id
                )
                .eq(
                    "user_id",
                    user.id
                );

            if (error) {
                console.error(
                    "DELETE REPLY ERROR:",
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

            // Remove it immediately from the parent's state
            onReplyDeleted?.(
                reply.id
            );

            // Close reply box if it was open
            if (
                replyingTo ===
                reply.id
            ) {
                setReplyingTo(
                    null
                );
                setReplyText("");
            }
        } finally {
            setDeletingReplyId(
                null
            );
        }
    }

    // ==========================================
    // REPLY TO COMMENT
    // ==========================================

    async function handleReply(
        parentReplyId: string | null
    ) {
        const text =
            replyText.trim();

        if (
            !text ||
            submitting
        ) {
            return;
        }

        const {
            data: { user },
        } =
            await supabase.auth.getUser();

        if (!user) return;

        setSubmitting(true);

        try {
            const {
                data:
                insertedReply,
                error,
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
                            parentReplyId,
                    })
                    .select(
                        "id, text, user_id, meme_id, reply_id, created_at"
                    )
                    .single();

            if (
                error ||
                !insertedReply
            ) {
                console.error(
                    "REPLY INSERT ERROR:",
                    error
                );

                return;
            }

            const {
                data: profile,
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

            const newReply: Reply =
            {
                ...insertedReply,
                profile:
                    profile ||
                    null,
            };

            onReplyAdded?.(
                newReply
            );

            // ======================================
            // WHO GETS NOTIFIED?
            // ======================================

            let recipientId =
                memeAuthorId;

            if (
                parentReplyId
            ) {
                const parentReply =
                    replies.find(
                        (reply) =>
                            reply.id ===
                            parentReplyId
                    );

                if (
                    parentReply
                ) {
                    recipientId =
                        parentReply.user_id;
                }
            }

            if (
                recipientId !==
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
                                recipientId,

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
                        "REPLY NOTIFICATION ERROR:",
                        notificationError
                    );
                }
            }

            setReplyText("");
            setReplyingTo(
                null
            );
        } finally {
            setSubmitting(
                false
            );
        }
    }

    // ==========================================
    // RENDER THREAD
    // ==========================================

    function renderReplies(
        parentId: string | null,
        depth = 0
    ): React.ReactNode {
        const children =
            replies.filter(
                (reply) =>
                    reply.reply_id ===
                    parentId
            );

        return children.map(
            (reply) => {
                const like =
                    replyLikes[
                    reply.id
                    ] || {
                        count: 0,
                        liked: false,
                    };

                const isOwner =
                    currentUserId ===
                    reply.user_id;

                const isDeleting =
                    deletingReplyId ===
                    reply.id;

                return (
                    <div
                        key={
                            reply.id
                        }
                        className={
                            depth > 0
                                ? "ml-6"
                                : ""
                        }
                    >
                        <div
                            className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${isDeleting
                                    ? "opacity-50"
                                    : ""
                                }`}
                        >

                            {/* AUTHOR */}

                            <div className="flex items-center gap-3">

                                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-xs font-bold">

                                    {reply
                                        .profile
                                        ?.avatar_url ? (
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
                                        reply
                                            .profile
                                            ?.full_name
                                            ?.charAt(
                                                0
                                            )
                                            .toUpperCase() ||
                                        reply
                                            .profile
                                            ?.username
                                            ?.charAt(
                                                0
                                            )
                                            .toUpperCase() ||
                                        "U"
                                    )}

                                </div>

                                <div className="min-w-0">

                                    <p className="truncate text-sm font-semibold">
                                        {reply
                                            .profile
                                            ?.full_name ||
                                            "User"}
                                    </p>

                                    <p className="truncate text-xs text-white/40">
                                        @
                                        {reply
                                            .profile
                                            ?.username ||
                                            "username"}
                                    </p>

                                </div>

                            </div>

                            {/* TEXT */}

                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/80">
                                {reply.text}
                            </p>

                            {/* TIME */}

                            <p className="mt-2 text-xs text-white/30">
                                {new Date(
                                    reply.created_at
                                ).toLocaleString()}
                            </p>

                            {/* COMMENT ACTIONS */}

                            <div className="mt-3 flex items-center gap-3 text-xs">

                                {/* LIKE */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleReplyLike(
                                            reply
                                        )
                                    }
                                    disabled={
                                        isDeleting
                                    }
                                    className={`rounded-full px-3 py-1.5 transition ${like.liked
                                            ? "bg-red-500/10 text-red-400"
                                            : "text-white/40 hover:bg-white/5 hover:text-red-400"
                                        }`}
                                >
                                    {like.liked
                                        ? "❤️"
                                        : "♡"}{" "}
                                    {
                                        like.count
                                    }
                                </button>

                                {/* REPLY */}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setReplyingTo(
                                            reply.id
                                        );
                                        setReplyText(
                                            ""
                                        );
                                    }}
                                    disabled={
                                        isDeleting
                                    }
                                    className="rounded-full px-3 py-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
                                >
                                    ↩ Reply
                                </button>

                                {/* DELETE */}

                                {isOwner && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDeleteReply(
                                                reply
                                            )
                                        }
                                        disabled={
                                            isDeleting
                                        }
                                        className="rounded-full px-3 py-1.5 text-white/40 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting
                                            ? "Deleting..."
                                            : "Delete"}
                                    </button>
                                )}

                            </div>

                            {/* INLINE REPLY BOX */}

                            {replyingTo ===
                                reply.id && (
                                    <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">

                                        <div className="mb-2 flex items-center justify-between">

                                            <span className="text-xs text-white/40">
                                                Replying to{" "}
                                                {reply
                                                    .profile
                                                    ?.full_name ||
                                                    "this user"}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setReplyingTo(
                                                        null
                                                    );
                                                    setReplyText(
                                                        ""
                                                    );
                                                }}
                                                className="text-xs text-white/40 hover:text-white"
                                            >
                                                Cancel
                                            </button>

                                        </div>

                                        <div className="flex gap-3">

                                            <input
                                                type="text"
                                                value={
                                                    replyText
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setReplyText(
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

                                                        handleReply(
                                                            reply.id
                                                        );
                                                    }
                                                }}
                                                placeholder="Write your reply..."
                                                disabled={
                                                    submitting
                                                }
                                                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/30"
                                            />

                                            <button
                                                type="button"
                                                disabled={
                                                    submitting ||
                                                    !replyText.trim()
                                                }
                                                onClick={() =>
                                                    handleReply(
                                                        reply.id
                                                    )
                                                }
                                                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                                            >
                                                {submitting
                                                    ? "..."
                                                    : "Reply"}
                                            </button>

                                        </div>

                                    </div>
                                )}

                            {/* CHILD REPLIES */}

                            <div className="mt-3 space-y-3">
                                {renderReplies(
                                    reply.id,
                                    depth +
                                    1
                                )}
                            </div>

                        </div>
                    </div>
                );
            }
        );
    }

    return (
        <div className="mt-4 space-y-3 border-l border-white/10 pl-4">
            {renderReplies(
                null,
                0
            )}
        </div>
    );
}