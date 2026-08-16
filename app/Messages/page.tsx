import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
};

type Message = {
    id: string;
    sender_id: string;
    recipient_id: string;
    text: string;
    created_at: string;
    read: boolean;
};

export default async function MessagesPage() {
    const supabase = await createClient();

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

    // Get messages involving this user
    const {
        data: messageData,
        error: messageError,
    } = await supabase
        .from("messages")
        .select(
            "id, sender_id, recipient_id, text, created_at, read"
        )
        .or(
            `sender_id.eq.${user.id},recipient_id.eq.${user.id}`
        )
        .order("created_at", {
            ascending: false,
        });

    if (messageError) {
        console.error(
            "INBOX MESSAGE ERROR:",
            {
                message: messageError.message,
                details: messageError.details,
                hint: messageError.hint,
                code: messageError.code,
            }
        );
    }

    const messages: Message[] =
        messageData || [];

    // Find the other user in every message
    const otherUserIds = [
        ...new Set(
            messages.map((message) =>
                message.sender_id === user.id
                    ? message.recipient_id
                    : message.sender_id
            )
        ),
    ];

    let profiles: Profile[] = [];

    if (otherUserIds.length > 0) {
        const {
            data: profileData,
            error: profileError,
        } = await supabase
            .from("profiles")
            .select(
                "id, username, full_name, avatar_url"
            )
            .in("id", otherUserIds);

        if (profileError) {
            console.error(
                "INBOX PROFILE ERROR:",
                profileError
            );
        }

        profiles =
            profileData || [];
    }

    // Build one row per conversation
    const conversations = new Map<
        string,
        {
            otherUser: Profile | null;
            lastMessage: Message;
            unread: boolean;
        }
    >();

    for (const message of messages) {
        const otherUserId =
            message.sender_id === user.id
                ? message.recipient_id
                : message.sender_id;

        if (!conversations.has(otherUserId)) {
            const otherUser =
                profiles.find(
                    (profile) =>
                        profile.id ===
                        otherUserId
                ) || null;

            conversations.set(
                otherUserId,
                {
                    otherUser,
                    lastMessage: message,
                    unread:
                        message.recipient_id ===
                        user.id &&
                        !message.read,
                }
            );
        }
    }

    const conversationList =
        Array.from(
            conversations.entries()
        ).map(
            ([
                otherUserId,
                conversation,
            ]) => ({
                otherUserId,
                ...conversation,
            })
        );

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">

                {/* HEADER */}

                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">
                    <h1 className="text-xl font-bold">
                        Messages
                    </h1>
                </header>

                {/* INBOX */}

                {conversationList.length ===
                    0 ? (
                    <div className="px-6 py-12 text-center text-white/40">

                        <p className="text-lg">
                            No messages yet.
                        </p>

                        <p className="mt-2 text-sm">
                            Start a conversation
                            with someone.
                        </p>

                    </div>
                ) : (
                    <div>
                        {conversationList.map(
                            (
                                conversation
                            ) => {
                                const profile =
                                    conversation.otherUser;

                                return (
                                    <Link
                                        key={
                                            conversation.otherUserId
                                        }
                                        href={`/messages/${conversation.otherUserId}`}
                                        className="flex items-center gap-3 border-b border-white/10 px-6 py-4 transition hover:bg-white/[0.03]"
                                    >

                                        {/* AVATAR */}

                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 font-bold">

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

                                        {/* USER + MESSAGE */}

                                        <div className="min-w-0 flex-1">

                                            <div className="flex items-center justify-between gap-3">

                                                <p className="truncate font-semibold">
                                                    {profile?.full_name ||
                                                        "User"}
                                                </p>

                                                <p className="shrink-0 text-xs text-white/30">
                                                    {new Date(
                                                        conversation
                                                            .lastMessage
                                                            .created_at
                                                    ).toLocaleDateString()}
                                                </p>

                                            </div>

                                            <p className="truncate text-sm text-white/40">
                                                @
                                                {profile?.username ||
                                                    "username"}
                                            </p>

                                            <p
                                                className={`mt-1 truncate text-sm ${conversation.unread
                                                        ? "font-semibold text-white"
                                                        : "text-white/40"
                                                    }`}
                                            >
                                                {conversation
                                                    .lastMessage
                                                    .sender_id ===
                                                    user.id
                                                    ? "You: "
                                                    : ""}
                                                {
                                                    conversation
                                                        .lastMessage
                                                        .text
                                                }
                                            </p>

                                        </div>

                                        {/* UNREAD */}

                                        {conversation.unread && (
                                            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
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