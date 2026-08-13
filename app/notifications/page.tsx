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
    actor: Profile | null;
};

export default async function NotificationsPage() {
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
    // GET NOTIFICATIONS
    // ========================================

    const {
        data: notificationData,
        error: notificationError,
    } = await supabase
        .from("notifications")
        .select(
            "id, type, read, created_at, meme_id, reply_id, actor_id"
        )
        .eq("recipient_id", user.id)
        .order("created_at", {
            ascending: false,
        });

    if (notificationError) {
        return (
            <main className="min-h-screen bg-black px-6 py-10 text-red-400">
                {notificationError.message}
            </main>
        );
    }

    // ========================================
    // GET ACTOR PROFILES
    // ========================================

    const actorIds = [
        ...new Set(
            (notificationData || []).map(
                (notification) => notification.actor_id
            )
        ),
    ];

    let actorProfiles: Profile[] = [];

    if (actorIds.length > 0) {
        const {
            data: profiles,
            error: profileError,
        } = await supabase
            .from("profiles")
            .select(
                "id, username, full_name, avatar_url"
            )
            .in("id", actorIds);

        if (profileError) {
            return (
                <main className="min-h-screen bg-black px-6 py-10 text-red-400">
                    {profileError.message}
                </main>
            );
        }

        actorProfiles = profiles || [];
    }

    // ========================================
    // COMBINE NOTIFICATIONS + PROFILES
    // ========================================

    const notifications: Notification[] = (
        notificationData || []
    ).map((notification) => ({
        id: notification.id,
        type: notification.type,
        read: notification.read,
        created_at: notification.created_at,
        meme_id: notification.meme_id,
        reply_id: notification.reply_id,
        actor_id: notification.actor_id,

        actor:
            actorProfiles.find(
                (profile) =>
                    profile.id === notification.actor_id
            ) || null,
    }));

    // ========================================
    // PAGE
    // ========================================

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">

                {/* HEADER */}

                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">
                    <h1 className="text-xl font-bold">
                        Notifications
                    </h1>
                </header>

                {/* EMPTY STATE */}

                {notifications.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <h2 className="text-xl font-semibold">
                            No notifications
                        </h2>

                        <p className="mt-2 text-white/50">
                            You're all caught up.
                        </p>
                    </div>
                ) : (
                    <div>
                        {notifications.map(
                            (notification) => {
                                const actor =
                                    notification.actor;

                                let message =
                                    "interacted with your post.";

                                if (
                                    notification.type ===
                                    "like"
                                ) {
                                    message =
                                        "liked your post.";
                                }

                                if (
                                    notification.type ===
                                    "reply"
                                ) {
                                    message =
                                        "replied to your post.";
                                }

                                if (
                                    notification.type ===
                                    "follow"
                                ) {
                                    message =
                                        "followed you.";
                                }

                                if (
                                    notification.type ===
                                    "mention"
                                ) {
                                    message =
                                        "mentioned you.";
                                }

                                return (<Link
                                    key={notification.id}
                                    href={
                                        notification.meme_id
                                            ? `/notifications/${notification.id}`
                                            : "/notifications"
                                    }
                                    className={`flex gap-3 border-b border-white/10 px-6 py-5 transition hover:bg-white/[0.03] ${!notification.read
                                            ? "bg-white/[0.03]"
                                            : ""
                                        }`}
                                >
                                    {/* AVATAR */}

                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 font-bold">
                                        {actor?.avatar_url ? (
                                            <img
                                                src={actor.avatar_url}
                                                alt="Avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            actor?.full_name
                                                ?.charAt(0)
                                                .toUpperCase() ||
                                            actor?.username
                                                ?.charAt(0)
                                                .toUpperCase() ||
                                            "U"
                                        )}
                                    </div>

                                    {/* CONTENT */}

                                    <div className="min-w-0">
                                        <p className="text-sm leading-6">
                                            <span className="font-semibold">
                                                {actor?.full_name || "Someone"}
                                            </span>{" "}
                                            <span className="text-white/70">
                                                {message}
                                            </span>
                                        </p>

                                        <p className="mt-1 text-xs text-white/30">
                                            {new Date(
                                                notification.created_at
                                            ).toLocaleString()}
                                        </p>
                                    </div>

                                    {!notification.read && (
                                        <div className="ml-auto mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                                    )}
                                </Link>
                                );
                            }
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}