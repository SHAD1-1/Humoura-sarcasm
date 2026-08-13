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
            liked ? likeCount - 1 : likeCount + 1
        );

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

            if (meme.author_id !== user.id) {
                await supabase
                    .from("notifications")
                    .delete()
                    .eq("recipient_id", meme.author_id)
                    .eq("actor_id", user.id)
                    .eq("type", "like")
                    .eq("meme_id", meme.id);
            }

            return;
        }

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

        if (meme.author_id !== user.id) {
            const { error: notificationError } =
                await supabase
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

    async function handleSave() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        if (saved) {
            const { error } = await supabase
                .from("saved_memes")
                .delete()
                .eq("meme_id", meme.id)
                .eq("user_id", user.id);

            if (error) {
                console.error("UNSAVE ERROR:", error);
                return;
            }

            setSaved(false);
            return;
        }

        const { error } = await supabase
            .from("saved_memes")
            .insert({
                meme_id: meme.id,
                user_id: user.id,
            });

        if (error) {
            console.error("SAVE ERROR:", error);
            return;
        }

        setSaved(true);
    }

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
                .select("id, text, user_id, meme_id, reply_id, created_at")
                .single();

            if (replyError || !insertedReply) {
                console.error(
                    "REPLY ERROR:",
                    replyError
                );
                return;
            }

            const { data: profile } =
                await supabase
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

            setReplies((previous) => [
                ...previous,
                newReply,
            ]);

            // Notification recipient
            let recipientId = meme.author_id;

            if (parentReplyId) {
                const parentReply =
                    replies.find(
                        (reply) =>
                            reply.id === parentReplyId
                    );

                if (parentReply) {
                    recipientId = parentReply.user_id;
                }
            }

            // Don't notify yourself
            if (recipientId !== user.id) {
                const { error: notificationError } =
                    await supabase
                        .from("notifications")
                        .insert({
                            recipient_id: recipientId,
                            actor_id: user.id,
                            type: "reply",
                            meme_id: meme.id,
                            reply_id: insertedReply.id,
                        });

                if (notificationError) {
                    console.error(
                        "REPLY NOTIFICATION ERROR:",
                        notificationError
                    );
                }
            }

            setReplyText("");
            setReplyingTo(null);
        } finally {
            setSubmittingReply(false);
        }
    }

    return (
        <article className="border-b border-white/10">

            {/* POST */}

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
                            {author?.full_name || "User"}
                        </p>

                        <p className="truncate text-sm text-white/40">
                            @{author?.username || "username"}
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

                    <button
                        type="button"
                        onClick={handleLike}
                        className={`transition ${liked
                                ? "text-red-400"
                                : "text-white/40 hover:text-red-400"
                            }`}
                    >
                        {liked ? "❤️" : "♡"} {likeCount}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                        }}
                        className="text-white/40 transition hover:text-white"
                    >
                        💬 Reply
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        className={`transition ${saved
                                ? "text-yellow-400"
                                : "text-white/40 hover:text-yellow-400"
                            }`}
                    >
                        {saved ? "🔖 Saved" : "🔖 Save"}
                    </button>

                </div>

                {/* REPLY BOX */}

                <div className="mt-5 flex gap-3">

                    <input
                        type="text"
                        value={replyText}
                        onChange={(e) =>
                            setReplyText(e.target.value)
                        }
                        placeholder={
                            replyingTo
                                ? "Reply to this reply..."
                                : "Write a reply..."
                        }
                        className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/30"
                    />

                    <button
                        type="button"
                        disabled={
                            submittingReply ||
                            !replyText.trim()
                        }
                        onClick={() =>
                            handleReply(replyingTo)
                        }
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                    >
                        {submittingReply
                            ? "..."
                            : "Reply"}
                    </button>

                </div>
            </div>

            {/* REFERENCED REPLY */}

            {referencedReply && (
                <div className="border-y border-white/10 bg-white/[0.02] px-6 py-5">

                    <p className="mb-3 text-sm font-semibold text-white/50">
                        Reply that triggered this notification
                    </p>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">

                        <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
                                {referencedReplyAuthor?.avatar_url ? (
                                    <img
                                        src={
                                            referencedReplyAuthor.avatar_url
                                        }
                                        alt="Avatar"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    referencedReplyAuthor?.full_name
                                        ?.charAt(0)
                                        .toUpperCase() ||
                                    "U"
                                )}
                            </div>

                            <div>
                                <p className="font-semibold">
                                    {referencedReplyAuthor?.full_name ||
                                        "User"}
                                </p>

                                <p className="text-xs text-white/40">
                                    @
                                    {referencedReplyAuthor?.username ||
                                        "username"}
                                </p>
                            </div>

                        </div>

                        <p className="mt-3 text-white/80">
                            {referencedReply.text}
                        </p>

                        {/* REPLY TO REPLY */}

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

                    </div>

                </div>
            )}

            {/* OTHER REPLIES */}

            {replies.length > 0 && (
                <div className="space-y-3 px-6 py-5">

                    {replies.map((reply) => (
                        <div
                            key={reply.id}
                            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                        >

                            <div className="flex items-center gap-3">

                                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-xs font-bold">
                                    {reply.profile?.avatar_url ? (
                                        <img
                                            src={reply.profile.avatar_url}
                                            alt="Avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        reply.profile?.full_name
                                            ?.charAt(0)
                                            .toUpperCase() ||
                                        "U"
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm font-semibold">
                                        {reply.profile?.full_name ||
                                            "User"}
                                    </p>

                                    <p className="text-xs text-white/40">
                                        @
                                        {reply.profile?.username ||
                                            "username"}
                                    </p>
                                </div>

                            </div>

                            <p className="mt-3 text-sm text-white/80">
                                {reply.text}
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setReplyingTo(reply.id);
                                    setReplyText("");
                                }}
                                className="mt-2 text-xs text-white/40 hover:text-white"
                            >
                                ↩ Reply
                            </button>

                        </div>
                    ))}

                </div>
            )}

        </article>
    );
}