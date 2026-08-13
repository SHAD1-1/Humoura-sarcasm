import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
};

type Notification = {
    id: string;
    type: "like" | "reply" | "follow" | "mention";
    read: boolean;
    created_at: string;
    meme_id: string | null;
    reply_id: string | null;
    actor_id: string;
};

export default async function NotificationDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const supabase = await createClient();

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
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

    // Get notification belonging to this user
    const { data: notification, error: notificationError } =
        await supabase
            .from("notifications")
            .select(
                "id, type, read, created_at, meme_id, reply_id, actor_id"
            )
            .eq("id", id)
            .eq("recipient_id", user.id)
            .single();

    if (notificationError || !notification) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        Notification not found
                    </h1>

                    <Link
                        href="/notifications"
                        className="mt-4 inline-block text-white/60 hover:text-white"
                    >
                        ← Back to notifications
                    </Link>
                </div>
            </main>
        );
    }

    // Mark notification as read
    if (!notification.read) {
        const { error: readError } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notification.id)
            .eq("recipient_id", user.id);

        if (readError) {
            console.error("MARK READ ERROR:", readError);
        }
    }

    // Notification without a post
    if (!notification.meme_id) {
        return (
            <main className="min-h-screen bg-black text-white">
                <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">
                    <header className="border-b border-white/10 px-6 py-4">
                        <Link
                            href="/notifications"
                            className="text-white/60 hover:text-white"
                        >
                            ← Notifications
                        </Link>

                        <h1 className="mt-3 text-xl font-bold">
                            Notification
                        </h1>
                    </header>

                    <div className="px-6 py-10">
                        This notification is not connected to a post.
                    </div>
                </div>
            </main>
        );
    }

    // Get the exact post that was liked/replied to
    const { data: meme, error: memeError } = await supabase
        .from("memes")
        .select(
            "id, content, image_url, author_id, created_at"
        )
        .eq("id", notification.meme_id)
        .single();

    if (memeError || !meme) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        Post not found
                    </h1>

                    <p className="mt-2 text-white/50">
                        The post may have been deleted.
                    </p>

                    <Link
                        href="/notifications"
                        className="mt-4 inline-block text-white/60 hover:text-white"
                    >
                        ← Back to notifications
                    </Link>
                </div>
            </main>
        );
    }

    // Get the post author's profile
    const { data: author } = await supabase
        .from("profiles")
        .select(
            "id, username, full_name, avatar_url"
        )
        .eq("id", meme.author_id)
        .single();

    // Get actor profile
    const { data: actor } = await supabase
        .from("profiles")
        .select(
            "id, username, full_name, avatar_url"
        )
        .eq("id", notification.actor_id)
        .single();

    let actionText = "interacted with this post.";

    if (notification.type === "like") {
        actionText = "liked this post.";
    }

    if (notification.type === "reply") {
        actionText = "replied to this post.";
    }

    // Page
    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">

                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">
                    <Link
                        href="/notifications"
                        className="text-white/60 hover:text-white"
                    >
                        ← Notifications
                    </Link>

                    <h1 className="mt-3 text-xl font-bold">
                        Post
                    </h1>
                </header>

                {/* Notification context */}
                <div className="border-b border-white/10 px-6 py-4 text-sm text-white/60">
                    <span className="font-semibold text-white">
                        {actor?.full_name || "Someone"}
                    </span>{" "}
                    {actionText}
                </div>

                {/* Exact Post */}
                <article className="px-6 py-6">

                    {/* Author */}
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

                    {/* Text */}
                    {meme.content && (
                        <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7">
                            {meme.content}
                        </p>
                    )}

                    {/* Image */}
                    {meme.image_url && (
                        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                            <img
                                src={meme.image_url}
                                alt="Meme"
                                className="max-h-[650px] w-full object-contain"
                            />
                        </div>
                    )}

                </article>
            </div>
        </main>
    );
}