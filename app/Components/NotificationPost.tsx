"use client";

import { useState } from "react";
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

type NotificationPostProps = {
    meme: Meme;
    author: Profile | null;

    referencedReply?: Reply | null;
    referencedReplyAuthor?: Profile | null;

    initialLikeCount: number;
    initialLiked: boolean;

    initialSaved: boolean;

    initialReplies: Reply[];
};

export default function NotificationPost({
    meme,
    author,
    referencedReply = null,
    referencedReplyAuthor = null,
    initialLikeCount,
    initialLiked,
    initialSaved,
    initialReplies,
}: NotificationPostProps) {
    const supabase = createClient();

    const [likeCount, setLikeCount] =
        useState(initialLikeCount);

    const [liked, setLiked] =
        useState(initialLiked);

    const [saved, setSaved] =
        useState(initialSaved);

    const [replies, setReplies] =
        useState<Reply[]>(initialReplies);

    const [replyText, setReplyText] =
        useState("");

    const [replyingTo, setReplyingTo] =
        useState<string | null>(null);

    const [submittingReply, setSubmittingReply] =
        useState(false);

    // ==========================================
    // LIKE / UNLIKE
    // ==========================================

    async function handleLike() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const oldLiked = liked;
        const oldCount = likeCount;

        // Optimistic update
        setLiked(!liked);
        setLikeCount(
            liked
                ? likeCount - 1
                : likeCount + 1
        );

        // UNLIKE
        if (liked) {
            const { error } = await supabase
                .from("meme_likes")
                .delete()
                .eq("meme_id", meme.id)
                .eq("user_id", user.id);

            if (error) {
                console.error("UNLIKE ERROR:", error);

                setLiked(oldLiked);
                setLikeCount(oldCount);

                return;
            }

            // Remove like notification
            if (meme.author_id !== user.id) {
                const {
                    error: notificationError,
                } = await supabase
                    .from("notifications")
                    .delete()
                    .eq(
                        "recipient_id",
                        meme.author_id
                    )
                    .eq(
                        "actor_id",
                        user.id
                    )
                    .eq("type", "like")
                    .eq("meme_id", meme.id);

                if (notificationError) {
                    console.error(
                        "LIKE NOTIFICATION DELETE ERROR:",
                        notificationError
                    );
                }
            }

            return;
        }

        // LIKE
        const { error } = await supabase
            .from("meme_likes")
            .insert({
                meme_id: meme.id,
                user_id: user.id,
            });

        if (error) {
            console.error("LIKE ERROR:", error);

            setLiked(oldLiked);
            setLikeCount(oldCount);

            return;
        }

        // Create notification
        if (meme.author_id !== user.id) {
            const {
                error: notificationError,
            } = await supabase
                .from("notifications")
                .insert({
                    recipient_id: meme.author_id,
                    actor_id: user.id,
                    type: "like",
                    meme_id: meme.id,
                    reply_id: null,
                });

            if (notificationError) {
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

    async function handleSave() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // UNSAVE
        if (saved) {
            const { error } = await supabase
                .from("saved_memes")
                .delete()
                .eq("meme_id", meme.id)
                .eq("user_id", user.id);

            if (error) {
                console.error(
                    "UNSAVE ERROR:",
                    error
                );

                return;
            }

            setSaved(false);

            return;
        }

        // SAVE
        const { error } = await supabase
            .from("saved_memes")
            .insert({
                meme_id: meme.id,
                user_id: user.id,
            });

        if (error) {
            console.error(
                "SAVE ERROR:",
                error
            );

            return;
        }

        setSaved(true);
    }

    // ==========================================
    // SUBMIT REPLY
    // ==========================================

    async function handleReply(
        parentReplyId: string | null = null
    ) {
        const text = replyText.trim();

        if (!text || submittingReply) return;

        setSubmittingReply(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            // Insert reply
            const {
                data: insertedReply,
                error: replyError,
            } = await supabase
                .from("replies")
                .insert({
                    text,
                    user_id: user.id,
                    meme_id: meme.id,
                    reply_id: parentReplyId,
                })
                .select(
                    "id, text, user_id, meme_id, reply_id, created_at"
                )
                .single();

            if (replyError || !insertedReply) {
                console.error(
                    "REPLY ERROR:",
                    replyError
                );

                return;
            }

            // Get current user's profile
            const {
                data: profile,
            } = await supabase
                .from("profiles")
                .select(
                    "id, username, full_name, avatar_url"
                )
                .eq("id", user.id)
                .single();

            const newReply: Reply = {
                ...insertedReply,
                profile: profile || null,
            };

            // Add to state
            setReplies((previous) => [
                ...previous,
                newReply,
            ]);

            // ======================================
            // FIND NOTIFICATION RECIPIENT
            // ======================================

            let recipientId = meme.author_id;

            if (parentReplyId) {
                const parentReply =
                    replies.find(
                        (reply) =>
                            reply.id ===
                            parentReplyId
                    );

                if (parentReply) {
                    recipientId =
                        parentReply.user_id;
                }
            }

            // Don't notify yourself
            if (recipientId !== user.id) {
                const {
                    error: notificationError,
                } = await supabase
                    .from("notifications")
                    .insert({
                        recipient_id: recipientId,
                        actor_id: user.id,
                        type: "reply",
                        meme_id: meme.id,
                        reply_id:
                            insertedReply.id,
                    });

                if (notificationError) {
                    console.error(
                        "REPLY NOTIFICATION ERROR:",
                        notificationError
                    );
                }
            }

            // Clear input
            setReplyText("");
            setReplyingTo(null);
        } catch (error) {
            console.error(
                "UNEXPECTED REPLY ERROR:",
                error
            );
        } finally {
            setSubmittingReply(false);
        }
    }

    // ==========================================
    // RENDER REPLY TREE
    // ==========================================

    function renderReplies(
        parentId: string | null = null,
        depth = 0
    ): React.ReactNode {
        const children = replies.filter(
            (reply) =>
                reply.reply_id === parentId
        );

        if (children.length === 0) {
            return null;
        }

        return children.map((reply) => (
            <div
                key={reply.id}
                className="space-y-3"
            >
                <div
                    className={`rounded-2xl border border-white/10 bg-white/[0.02] p-4 ${depth > 0
                        ? "ml-6"
                        : ""
                        }`}
                >
                    {/* REPLY AUTHOR */}

                    <div className="flex items-center gap-3">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-xs font-bold">
                            {reply.profile
                                ?.avatar_url ? (
                                <img
                                    src={
                                        reply.profile
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
                                reply.profile
                                    ?.username
                                    ?.charAt(0)
                                    .toUpperCase() ||
                                "U"
                            )}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                                {reply.profile
                                    ?.full_name ||
                                    "User"}
                            </p>

                            <p className="truncate text-xs text-white/40">
                                @
                                {reply.profile
                                    ?.username ||
                                    "username"}
                            </p>
                        </div>

                    </div>

                    {/* REPLY TEXT */}

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/80">
                        {reply.text}
                    </p>

                    {/* REPLY TIME */}

                    <p className="mt-2 text-xs text-white/30">
                        {new Date(
                            reply.created_at
                        ).toLocaleString()}
                    </p>

                    {/* REPLY BUTTON */}

                    <button
                        type="button"
                        onClick={() => {
                            setReplyingTo(
                                reply.id
                            );
                            setReplyText("");
                        }}
                        className="mt-3 text-xs text-white/40 transition hover:text-white"
                    >
                        ↩ Reply
                    </button>

                    {/* INLINE REPLY BOX */}

                    {replyingTo ===
                        reply.id && (
                            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">

                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs text-white/40">
                                        Replying to{" "}
                                        {reply.profile
                                            ?.full_name ||
                                            "this user"}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReplyingTo(
                                                null
                                            );
                                            setReplyText("");
                                        }}
                                        className="text-xs text-white/40 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                <div className="flex gap-3">

                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) =>
                                            setReplyText(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Write your reply..."
                                        className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                                    />

                                    <button
                                        type="button"
                                        disabled={
                                            submittingReply ||
                                            !replyText.trim()
                                        }
                                        onClick={() =>
                                            handleReply(
                                                reply.id
                                            )
                                        }
                                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {submittingReply
                                            ? "..."
                                            : "Reply"}
                                    </button>

                                </div>

                            </div>
                        )}

                    {/* NESTED REPLIES */}

                    {renderReplies(
                        reply.id,
                        depth + 1
                    )}

                </div>
            </div>
        ));
    }

    return (
        <article className="border-b border-white/10">

            {/* ==========================================
                ORIGINAL POST
            ========================================== */}

            <div className="px-6 py-6">

                {/* AUTHOR */}

                <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 font-bold">
                        {author?.avatar_url ? (
                            <img
                                src={author.avatar_url}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            author?.full_name
                                ?.charAt(0)
                                .toUpperCase() ||
                            author?.username
                                ?.charAt(0)
                                .toUpperCase() ||
                            "U"
                        )}
                    </div>

                    <div className="min-w-0">

                        <p className="truncate font-semibold">
                            {author?.full_name ||
                                "User"}
                        </p>

                        <p className="truncate text-sm text-white/40">
                            @{author?.username ||
                                "username"}
                        </p>

                        <p className="text-xs text-white/30">
                            {new Date(
                                meme.created_at
                            ).toLocaleString()}
                        </p>

                    </div>

                </div>

                {/* CONTENT */}

                {meme.content && (
                    <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7">
                        {meme.content}
                    </p>
                )}

                {/* IMAGE */}

                {meme.image_url && (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <img
                            src={meme.image_url}
                            alt="Meme"
                            className="max-h-[650px] w-full object-contain"
                        />
                    </div>
                )}

                {/* ACTIONS */}

                <div className="mt-5 flex items-center gap-8 text-sm">

                    {/* LIKE */}

                    <button
                        type="button"
                        onClick={
                            handleLike
                        }
                        className={`transition ${liked
                            ? "text-red-400"
                            : "text-white/40 hover:text-red-400"
                            }`}
                    >
                        {liked
                            ? "❤️"
                            : "♡"}{" "}
                        {likeCount}
                    </button>

                    {/* REPLY */}

                    <button
                        type="button"
                        onClick={() => {
                            setReplyingTo(
                                null
                            );
                            setReplyText("");
                        }}
                        className="text-white/40 transition hover:text-white"
                    >
                        💬 Reply
                    </button>

                    {/* SAVE */}

                    <button
                        type="button"
                        onClick={
                            handleSave
                        }
                        className={`transition ${saved
                            ? "text-yellow-400"
                            : "text-white/40 hover:text-yellow-400"
                            }`}
                    >
                        {saved
                            ? "🔖 Saved"
                            : "🔖 Save"}
                    </button>

                </div>

                {/* TOP-LEVEL REPLY BOX */}

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-3">

                    <div className="mb-2 text-xs text-white/40">
                        Reply to this post
                    </div>

                    <div className="flex gap-3">

                        <input
                            type="text"
                            value={
                                replyingTo ===
                                    null
                                    ? replyText
                                    : ""
                            }
                            onChange={(e) =>
                                setReplyText(
                                    e.target.value
                                )
                            }
                            placeholder="Write a reply..."
                            className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                        />

                        <button
                            type="button"
                            disabled={
                                submittingReply ||
                                !replyText.trim() ||
                                replyingTo !==
                                null
                            }
                            onClick={() =>
                                handleReply(
                                    null
                                )
                            }
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {submittingReply
                                ? "..."
                                : "Reply"}
                        </button>

                    </div>

                </div>

            </div>

            {/* ==========================================
                REFERENCED REPLY
            ========================================== */}

            {referencedReply && (
                <div className="border-y border-white/10 bg-white/[0.02] px-6 py-5">

                    <p className="mb-3 text-sm font-semibold text-white/50">
                        Reply that triggered this notification
                    </p>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">

                        {/* AUTHOR */}

                        <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
                                {referencedReplyAuthor
                                    ?.avatar_url ? (
                                    <img
                                        src={
                                            referencedReplyAuthor.avatar_url
                                        }
                                        alt="Avatar"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    referencedReplyAuthor
                                        ?.full_name
                                        ?.charAt(0)
                                        .toUpperCase() ||
                                    referencedReplyAuthor
                                        ?.username
                                        ?.charAt(0)
                                        .toUpperCase() ||
                                    "U"
                                )}
                            </div>

                            <div className="min-w-0">

                                <p className="truncate font-semibold">
                                    {referencedReplyAuthor
                                        ?.full_name ||
                                        "User"}
                                </p>

                                <p className="truncate text-xs text-white/40">
                                    @
                                    {referencedReplyAuthor
                                        ?.username ||
                                        "username"}
                                </p>

                            </div>

                        </div>

                        {/* REPLY TEXT */}

                        <p className="mt-3 whitespace-pre-wrap text-white/80">
                            {referencedReply.text}
                        </p>

                        {/* TIME */}

                        <p className="mt-2 text-xs text-white/30">
                            {new Date(
                                referencedReply.created_at
                            ).toLocaleString()}
                        </p>

                        {/* REPLY BUTTON */}

                        <button
                            type="button"
                            onClick={() => {
                                setReplyingTo(
                                    referencedReply.id
                                );
                                setReplyText("");
                            }}
                            className="mt-3 text-sm text-white/40 transition hover:text-white"
                        >
                            ↩ Reply
                        </button>

                        {/* REPLY BOX UNDER COMMENT */}

                        {replyingTo ===
                            referencedReply.id && (
                                <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">

                                    <div className="mb-2 flex items-center justify-between">

                                        <span className="text-xs text-white/40">
                                            Replying to{" "}
                                            {referencedReplyAuthor
                                                ?.full_name ||
                                                "this user"}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReplyingTo(
                                                    null
                                                );
                                                setReplyText("");
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
                                            onChange={(e) =>
                                                setReplyText(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Write your reply..."
                                            className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                                        />

                                        <button
                                            type="button"
                                            disabled={
                                                submittingReply ||
                                                !replyText.trim()
                                            }
                                            onClick={() =>
                                                handleReply(
                                                    referencedReply.id
                                                )
                                            }
                                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {submittingReply
                                                ? "..."
                                                : "Reply"}
                                        </button>

                                    </div>

                                </div>
                            )}

                    </div>

                </div>
            )}

            {/* ==========================================
                ALL REPLIES
            ========================================== */}

            {replies.length > 0 && (
                <div className="space-y-3 px-6 py-5">

                    {renderReplies(
                        null,
                        0
                    )}

                </div>
            )}

        </article>
    );
}