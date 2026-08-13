import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NotificationPost from "@/app/Components/NotificationPost";

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
};

export default async function NotificationDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const supabase = await createClient();

    // ========================================
    // GET CURRENT USER
    // ========================================

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        You are not logged in
                    </h1>

                    <Link
                        href="/login"
                        className="mt-4 inline-block rounded-full bg-white px-5 py-2 font-semibold text-black"
                    >
                        Log in
                    </Link>
                </div>
            </main>
        );
    }

    // ========================================
    // GET NOTIFICATION
    // ========================================

    const {
        data: notification,
        error: notificationError,
    } = await supabase
        .from("notifications")
        .select(
            "id, type, read, created_at, meme_id, reply_id, actor_id"
        )
        .eq("id", id)
        .eq("recipient_id", user.id)
        .single();

    if (notificationError || !notification) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        Notification not found
                    </h1>

                    <Link
                        href="/notifications"
                        className="mt-4 inline-block text-white/50 hover:text-white"
                    >
                        ← Back to notifications
                    </Link>
                </div>
            </main>
        );
    }

    // ========================================
    // MARK AS READ
    // ========================================

    if (!notification.read) {
        const { error: readError } = await supabase
            .from("notifications")
            .update({
                read: true,
            })
            .eq("id", notification.id)
            .eq("recipient_id", user.id);

        if (readError) {
            console.error(
                "MARK READ ERROR:",
                readError
            );
        }
    }

    // ========================================
    // MUST HAVE A MEME
    // ========================================

    if (!notification.meme_id) {
        return (
            <main className="min-h-screen bg-black text-white">
                <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">

                    <header className="border-b border-white/10 px-6 py-4">
                        <Link
                            href="/notifications"
                            className="text-white/50 hover:text-white"
                        >
                            ← Notifications
                        </Link>

                        <h1 className="mt-3 text-xl font-bold">
                            Notification
                        </h1>
                    </header>

                    <div className="px-6 py-10 text-center text-white/50">
                        This notification is not connected to a post.
                    </div>

                </div>
            </main>
        );
    }

    // ========================================
    // GET MEME
    // ========================================

    const {
        data: meme,
        error: memeError,
    } = await supabase
        .from("memes")
        .select(
            "id, content, image_url, author_id, created_at"
        )
        .eq("id", notification.meme_id)
        .single();

    if (memeError || !meme) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        Post not found
                    </h1>

                    <p className="mt-2 text-white/50">
                        This post may have been deleted.
                    </p>

                    <Link
                        href="/notifications"
                        className="mt-4 inline-block text-white/50 hover:text-white"
                    >
                        ← Back to notifications
                    </Link>
                </div>
            </main>
        );
    }

    // ========================================
    // GET POST AUTHOR
    // ========================================

    const {
        data: author,
    } = await supabase
        .from("profiles")
        .select(
            "id, username, full_name, avatar_url"
        )
        .eq("id", meme.author_id)
        .single();

    // ========================================
    // GET LIKES
    // ========================================

    const {
        data: likeData,
        error: likeError,
    } = await supabase
        .from("meme_likes")
        .select("user_id")
        .eq("meme_id", meme.id);

    if (likeError) {
        console.error(
            "NOTIFICATION LIKE FETCH ERROR:",
            likeError
        );
    }

    const initialLikeCount =
        likeData?.length || 0;

    const initialLiked =
        likeData?.some(
            (like) => like.user_id === user.id
        ) || false;

    // ========================================
    // GET SAVE STATUS
    // ========================================

    const {
        data: savedRow,
        error: savedError,
    } = await supabase
        .from("saved_memes")
        .select("meme_id")
        .eq("user_id", user.id)
        .eq("meme_id", meme.id)
        .maybeSingle();

    if (savedError) {
        console.error(
            "NOTIFICATION SAVE FETCH ERROR:",
            savedError
        );
    }

    const initialSaved = !!savedRow;

    // ========================================
    // GET ALL REPLIES
    // ========================================

    const {
        data: replyData,
        error: replyError,
    } = await supabase
        .from("replies")
        .select(
            "id, text, user_id, meme_id, reply_id, created_at"
        )
        .eq("meme_id", meme.id)
        .order("created_at", {
            ascending: true,
        });

    if (replyError) {
        console.error(
            "NOTIFICATION REPLY FETCH ERROR:",
            replyError
        );
    }

    // ========================================
    // GET REPLY PROFILES
    // ========================================

    const replyUserIds = [
        ...new Set(
            (replyData || []).map(
                (reply) => reply.user_id
            )
        ),
    ];

    let replyProfiles: Profile[] = [];

    if (replyUserIds.length > 0) {
        const {
            data: profiles,
            error: replyProfileError,
        } = await supabase
            .from("profiles")
            .select(
                "id, username, full_name, avatar_url"
            )
            .in("id", replyUserIds);

        if (replyProfileError) {
            console.error(
                "NOTIFICATION REPLY PROFILE ERROR:",
                replyProfileError
            );
        }

        replyProfiles = profiles || [];
    }

    // ========================================
    // FORMAT REPLIES
    // ========================================

    const replies =
        (replyData || []).map((reply) => ({
            ...reply,

            profile:
                replyProfiles.find(
                    (profile) =>
                        profile.id === reply.user_id
                ) || null,
        }));

    // ========================================
    // GET REFERENCED REPLY
    // ========================================

    let referencedReply = null;
    let referencedReplyAuthor = null;

    if (notification.reply_id) {
        referencedReply =
            replies.find(
                (reply) =>
                    reply.id === notification.reply_id
            ) || null;

        if (referencedReply) {
            referencedReplyAuthor =
                replyProfiles.find(
                    (profile) =>
                        profile.id ===
                        referencedReply.user_id
                ) || null;
        }
    }

    // ========================================
    // PAGE
    // ========================================

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">

                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">

                    <Link
                        href="/notifications"
                        className="text-white/50 transition hover:text-white"
                    >
                        ← Notifications
                    </Link>

                    <h1 className="mt-3 text-xl font-bold">
                        Post
                    </h1>

                </header>

                {/* NOTIFICATION CONTEXT */}

                <div className="border-b border-white/10 px-6 py-4 text-sm text-white/60">

                    {notification.type === "like" && (
                        <span>
                            Someone liked this post.
                        </span>
                    )}

                    {notification.type === "reply" && (
                        <span>
                            Someone replied to this post.
                        </span>
                    )}

                    {notification.type === "follow" && (
                        <span>
                            Someone followed you.
                        </span>
                    )}

                    {notification.type === "mention" && (
                        <span>
                            Someone mentioned you.
                        </span>
                    )}

                </div>

                {/* INTERACTIVE POST */}

                <NotificationPost
                    meme={meme}
                    author={author}
                    referencedReply={referencedReply}
                    referencedReplyAuthor={
                        referencedReplyAuthor
                    }
                    initialLikeCount={
                        initialLikeCount
                    }
                    initialLiked={initialLiked}
                    initialSaved={initialSaved}
                    initialReplies={replies}
                />

            </div>
        </main>
    );
}