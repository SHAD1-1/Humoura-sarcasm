import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NotificationPost from "@/app/Components/NotificationPost";

export default async function NotificationDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <Link
                    href="/login"
                    className="rounded-full bg-white px-5 py-2 text-black"
                >
                    Log in
                </Link>
            </main>
        );
    }

    const { data: notification } = await supabase
        .from("notifications")
        .select(
            "id, type, read, created_at, meme_id, reply_id, actor_id"
        )
        .eq("id", id)
        .eq("recipient_id", user.id)
        .single();

    if (!notification) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-xl font-bold">
                        Notification not found
                    </h1>

                    <Link
                        href="/notifications"
                        className="mt-4 inline-block text-white/50"
                    >
                        ← Notifications
                    </Link>
                </div>
            </main>
        );
    }

    if (!notification.read) {
        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notification.id)
            .eq("recipient_id", user.id);
    }

    if (!notification.meme_id) {
        return (
            <main className="min-h-screen bg-black text-white">
                <div className="mx-auto max-w-2xl px-6 py-8">
                    No post is attached to this notification.
                </div>
            </main>
        );
    }

    const { data: meme } = await supabase
        .from("memes")
        .select(
            "id, content, image_url, author_id, created_at"
        )
        .eq("id", notification.meme_id)
        .single();

    if (!meme) {
        return (
            <main className="min-h-screen bg-black text-white">
                <div className="mx-auto max-w-2xl px-6 py-8">
                    Post not found.
                </div>
            </main>
        );
    }

    const { data: author } = await supabase
        .from("profiles")
        .select(
            "id, username, full_name, avatar_url"
        )
        .eq("id", meme.author_id)
        .single();

    const { data: likes } = await supabase
        .from("meme_likes")
        .select("user_id")
        .eq("meme_id", meme.id);

    const initialLikeCount = likes?.length || 0;

    const initialLiked =
        likes?.some(
            (like) => like.user_id === user.id
        ) || false;

    const { data: savedRow } = await supabase
        .from("saved_memes")
        .select("meme_id")
        .eq("user_id", user.id)
        .eq("meme_id", meme.id)
        .maybeSingle();

    const initialSaved = !!savedRow;

    const { data: replyData } = await supabase
        .from("replies")
        .select(
            "id, text, user_id, meme_id, reply_id, created_at"
        )
        .eq("meme_id", meme.id)
        .order("created_at", {
            ascending: true,
        });

    const replyUserIds = [
        ...new Set(
            (replyData || []).map(
                (reply) => reply.user_id
            )
        ),
    ];

    let replyProfiles: any[] = [];

    if (replyUserIds.length > 0) {
        const { data } = await supabase
            .from("profiles")
            .select(
                "id, username, full_name, avatar_url"
            )
            .in("id", replyUserIds);

        replyProfiles = data || [];
    }

    const replies =
        (replyData || []).map((reply) => ({
            ...reply,
            profile:
                replyProfiles.find(
                    (profile) =>
                        profile.id === reply.user_id
                ) || null,
        }));

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
                        profile.id === referencedReply.user_id
                ) || null;
        }
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto w-full max-w-2xl border-x border-white/10">

                <header className="border-b border-white/10 px-6 py-4">
                    <Link
                        href="/notifications"
                        className="text-white/50 hover:text-white"
                    >
                        ← Notifications
                    </Link>

                    <h1 className="mt-3 text-xl font-bold">
                        Post
                    </h1>
                </header>

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