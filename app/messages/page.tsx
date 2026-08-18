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

type Conversation = {
    userId: string;
    profile: Profile | null;
    lastMessage: Message | null;
    unread: boolean;
};

export default async function MessagesPage() {
    const supabase = await createClient();

    // ========================================
    // CURRENT USER
    // ========================================

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
                        href="/"
                        className="mt-4 inline-block rounded-full bg-white px-5 py-2 font-semibold text-black"
                    >
                        Go to Home
                    </Link>
                </div>
            </main>
        );
    }

    // ========================================
    // GET PEOPLE I FOLLOW
    // ========================================

    const {
        data: followData,
        error: followError,
    } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

    if (followError) {
        console.error("FOLLOWING USERS ERROR:", {
            message: followError.message,
            details: followError.details,
            hint: followError.hint,
            code: followError.code,
        });
    }

    const followedUserIds =
        (followData || []).map(
            (follow) => follow.following_id
        );

    // ========================================
    // GET FOLLOWED USER PROFILES
    // ========================================

    let followedProfiles: Profile[] = [];

    if (followedUserIds.length > 0) {
        const {
            data: profileData,
            error: profileError,
        } = await supabase
            .from("profiles")
            .select(
                "id, username, full_name, avatar_url"
            )
            .in("id", followedUserIds);

        if (profileError) {
            console.error("FOLLOWED PROFILE ERROR:", {
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint,
                code: profileError.code,
            });
        }

        followedProfiles = profileData || [];
    }

    // ========================================
    // GET EXISTING MESSAGES
    // ========================================

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
        console.error("INBOX MESSAGE ERROR:", {
            message: messageError.message,
            details: messageError.details,
            hint: messageError.hint,
            code: messageError.code,
        });
    }

    const messages: Message[] = messageData || [];

    // ========================================
    // GET USERS FROM EXISTING CONVERSATIONS
    // ========================================

    const conversationUserIds = [
        ...new Set(
            messages.map((message) =>
                message.sender_id === user.id
                    ? message.recipient_id
                    : message.sender_id
            )
        ),
    ];

    let conversationProfiles: Profile[] = [];

    if (conversationUserIds.length > 0) {
        const {
            data: profileData,
            error: profileError,
        } = await supabase
            .from("profiles")
            .select(
                "id, username, full_name, avatar_url"
            )
            .in("id", conversationUserIds);

        if (profileError) {
            console.error(
                "CONVERSATION PROFILE ERROR:",
                {
                    message: profileError.message,
                    details: profileError.details,
                    hint: profileError.hint,
                    code: profileError.code,
                }
            );
        }

        conversationProfiles = profileData || [];
    }

    // ========================================
    // BUILD CONVERSATION MAP
    // ========================================

    const conversationMap = new Map<
        string,
        Conversation
    >();

    /*
     * Messages are ordered newest first.
     *
     * Therefore:
     * - The first message we see for a user
     *   is their latest message.
     * - We still continue through older messages
     *   to find any unread incoming messages.
     */

    for (const message of messages) {
        const otherUserId =
            message.sender_id === user.id
                ? message.recipient_id
                : message.sender_id;

        const existingConversation =
            conversationMap.get(otherUserId);

        // ----------------------------------------
        // FIRST MESSAGE FOR THIS CONVERSATION
        // ----------------------------------------

        if (!existingConversation) {
            const profile =
                conversationProfiles.find(
                    (item) =>
                        item.id === otherUserId
                ) || null;

            conversationMap.set(otherUserId, {
                userId: otherUserId,
                profile,
                lastMessage: message,
                unread:
                    message.recipient_id === user.id &&
                    !message.read,
            });

            continue;
        }

        // ----------------------------------------
        // CHECK OLDER MESSAGES FOR UNREAD STATUS
        // ----------------------------------------

        if (
            message.recipient_id === user.id &&
            !message.read
        ) {
            existingConversation.unread = true;
        }
    }

    // ========================================
    // ADD PEOPLE I FOLLOW
    // ========================================
    //
    // If someone you follow has never been
    // messaged, add them with no last message.

    for (const profile of followedProfiles) {
        if (!conversationMap.has(profile.id)) {
            conversationMap.set(profile.id, {
                userId: profile.id,
                profile,
                lastMessage: null,
                unread: false,
            });
        }
    }

    // ========================================
    // FINAL LIST
    // ========================================

    const conversationList =
        Array.from(conversationMap.values());

    // ========================================
    // SORT CONVERSATIONS
    // ========================================
    //
    // Active conversations first.
    // Most recent message first.
    // People with no messages are sorted by name.

    conversationList.sort((a, b) => {
        if (
            a.lastMessage &&
            b.lastMessage
        ) {
            return (
                new Date(
                    b.lastMessage.created_at
                ).getTime() -
                new Date(
                    a.lastMessage.created_at
                ).getTime()
            );
        }

        if (
            a.lastMessage &&
            !b.lastMessage
        ) {
            return -1;
        }

        if (
            !a.lastMessage &&
            b.lastMessage
        ) {
            return 1;
        }

        const nameA =
            a.profile?.full_name ||
            a.profile?.username ||
            "";

        const nameB =
            b.profile?.full_name ||
            b.profile?.username ||
            "";

        return nameA.localeCompare(nameB);
    });

    // ========================================
    // UI
    // ========================================

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">

                {/* HEADER */}

                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">
                    <div className="flex items-center gap-4">

                        <Link
                            href="/"
                            className="text-white/50 transition hover:text-white"
                        >
                            ← Home
                        </Link>

                        <h1 className="text-xl font-bold">
                            Messages
                        </h1>

                    </div>
                </header>

                {/* EMPTY STATE */}

                {conversationList.length === 0 ? (
                    <div className="px-6 py-16 text-center">

                        <p className="text-lg font-semibold">
                            No people to message yet.
                        </p>

                        <p className="mt-2 text-sm text-white/40">
                            Follow someone to start a
                            conversation.
                        </p>

                        <Link
                            href="/explore"
                            className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
                        >
                            Explore people
                        </Link>

                    </div>
                ) : (
                    <div>

                        {conversationList.map(
                            (conversation) => {
                                const profile =
                                    conversation.profile;

                                return (
                                    <Link
                                        key={
                                            conversation.userId
                                        }
                                        href={`/messages/${conversation.userId}`}
                                        className="flex items-center gap-3 border-b border-white/10 px-6 py-4 transition hover:bg-white/[0.03]"
                                    >

                                        {/* AVATAR */}

                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 font-bold">

                                            {profile?.avatar_url ? (
                                                <img
                                                    src={
                                                        profile.avatar_url
                                                    }
                                                    alt={
                                                        profile.full_name ||
                                                        "Avatar"
                                                    }
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                profile?.full_name
                                                    ?.charAt(0)
                                                    .toUpperCase() ||
                                                profile?.username
                                                    ?.charAt(0)
                                                    .toUpperCase() ||
                                                "U"
                                            )}

                                        </div>

                                        {/* CONTENT */}

                                        <div className="min-w-0 flex-1">

                                            <div className="flex items-center justify-between gap-3">

                                                <p className="truncate font-semibold">
                                                    {profile?.full_name ||
                                                        "User"}
                                                </p>

                                                {conversation.lastMessage && (
                                                    <p className="shrink-0 text-xs text-white/30">
                                                        {new Date(
                                                            conversation
                                                                .lastMessage
                                                                .created_at
                                                        ).toLocaleDateString()}
                                                    </p>
                                                )}

                                            </div>

                                            <p className="truncate text-sm text-white/40">
                                                @
                                                {profile?.username ||
                                                    "username"}
                                            </p>

                                            {conversation.lastMessage ? (
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
                                            ) : (
                                                <p className="mt-1 text-sm text-white/30">
                                                    Start a
                                                    conversation
                                                </p>
                                            )}

                                        </div>

                                        {/* UNREAD INDICATOR */}

                                        {conversation.unread && (
                                            <div
                                                className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"
                                                title="Unread message"
                                            />
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