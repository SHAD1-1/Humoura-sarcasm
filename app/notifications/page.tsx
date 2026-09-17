import Link from "next/link";
import {
    BsArrowLeft,
    BsBell,
    BsHeartFill,
    BsChatHeart,
    BsPersonPlusFill,
    BsAt,
} from "react-icons/bs";
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

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
                <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-xl">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
                        <BsBell className="text-2xl" />
                    </div>

                    <h1 className="mt-5 text-2xl font-black">
                        Login to see notifications
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Your likes, replies, mentions and
                        future follow requests will appear here.
                    </p>

                    <Link
                        href="/login"
                        className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
                    >
                        Log in
                    </Link>

                </div>
            </main>
        );
    }

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
            <main className="min-h-screen bg-background px-6 py-10 text-red-500">
                {notificationError.message}
            </main>
        );
    }

    const actorIds = [
        ...new Set(
            (notificationData || []).map(
                (notification) =>
                    notification.actor_id
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
                <main className="min-h-screen bg-background px-6 py-10 text-red-500">
                    {profileError.message}
                </main>
            );
        }

        actorProfiles = profiles || [];
    }

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
                    profile.id ===
                    notification.actor_id
            ) || null,
    }));

    function notificationIcon(
        type: Notification["type"]
    ) {
        if (type === "like") {
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                    <BsHeartFill />
                </div>
            );
        }

        if (type === "reply") {
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BsChatHeart />
                </div>
            );
        }

        if (type === "follow") {
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                    <BsPersonPlusFill />
                </div>
            );
        }

        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                <BsAt />
            </div>
        );
    }

    function messageFor(
        type: Notification["type"]
    ) {
        if (type === "like") {
            return "liked your post.";
        }

        if (type === "reply") {
            return "replied to your post.";
        }

        if (type === "follow") {
            return "followed you.";
        }

        return "mentioned you.";
    }

    function avatar(actor: Profile | null) {
        if (actor?.avatar_url) {
            return (
                <img
                    src={actor.avatar_url}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                />
            );
        }

        return (
            actor?.full_name
                ?.charAt(0)
                .toUpperCase() ||
            actor?.username
                ?.charAt(0)
                .toUpperCase() ||
            "U"
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-border">

                <header className="sticky top-0 z-40 border-b border-border bg-background/85 px-5 py-4 backdrop-blur-xl">

                    <div className="flex items-center gap-3">

                        <Link
                            href="/"
                            className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                        >
                            <BsArrowLeft />
                        </Link>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <BsBell />
                        </div>

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                                HUMOURA
                            </p>

                            <h1 className="text-xl font-bold">
                                Notifications
                            </h1>
                        </div>

                    </div>

                </header>

                {notifications.length === 0 ? (
                    <div className="px-6 py-20 text-center">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary">
                            <BsBell className="text-2xl" />
                        </div>

                        <h2 className="mt-5 text-xl font-black">
                            Nothing yet
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            You're all caught up.
                        </p>

                    </div>
                ) : (
                    <div>

                        {notifications.map(
                            (notification) => {
                                const actor =
                                    notification.actor;

                                const content = (
                                    <div
                                        className={`flex gap-4 px-5 py-5 transition hover:bg-accent/40 ${!notification.read
                                                ? "bg-primary/[0.04]"
                                                : ""
                                            }`}
                                    >

                                        {notificationIcon(
                                            notification.type
                                        )}

                                        <div className="flex h-full w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold text-muted-foreground ring-1 ring-border">
                                            {avatar(actor)}
                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <p className="text-sm leading-6">
                                                <span className="font-bold">
                                                    {actor?.full_name ||
                                                        "Someone"}
                                                </span>{" "}
                                                <span className="text-muted-foreground">
                                                    {messageFor(
                                                        notification.type
                                                    )}
                                                </span>
                                            </p>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {new Date(
                                                    notification.created_at
                                                ).toLocaleString()}
                                            </p>

                                        </div>

                                        {!notification.read && (
                                            <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                                        )}

                                    </div>
                                );

                                if (
                                    notification.meme_id
                                ) {
                                    return (
                                        <Link
                                            key={
                                                notification.id
                                            }
                                            href={`/notifications/${notification.id}`}
                                            className="block border-b border-border"
                                        >
                                            {content}
                                        </Link>
                                    );
                                }

                                return (
                                    <div
                                        key={
                                            notification.id
                                        }
                                        className="border-b border-border"
                                    >
                                        {content}
                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </div>
        </main>
    );
}