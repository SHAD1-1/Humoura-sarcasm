import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ChatWindow from "@/app/Components/ChatWindow";

export default async function ConversationPage({
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
                    href="/"
                    className="rounded-full bg-white px-5 py-2 font-semibold text-black"
                >
                    Go to Home
                </Link>
            </main>
        );
    }

    if (id === user.id) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        You cannot message yourself
                    </h1>

                    <Link
                        href="/messages"
                        className="mt-4 inline-block text-white/50 hover:text-white"
                    >
                        ← Messages
                    </Link>
                </div>
            </main>
        );
    }

    // ========================================
    // GET RECIPIENT
    // ========================================

    const {
        data: profile,
        error: profileError,
    } = await supabase
        .from("profiles")
        .select(
            "id, username, full_name, avatar_url"
        )
        .eq("id", id)
        .maybeSingle();

    if (profileError) {
        console.error(
            "CHAT PROFILE ERROR:",
            {
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint,
                code: profileError.code,
            }
        );
    }

    if (!profile) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        User not found
                    </h1>

                    <Link
                        href="/messages"
                        className="mt-4 inline-block text-white/50 hover:text-white"
                    >
                        ← Messages
                    </Link>
                </div>
            </main>
        );
    }

    // ========================================
    // GET CONVERSATION
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
            `and(sender_id.eq.${user.id},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${user.id})`
        )
        .order("created_at", {
            ascending: true,
        });

    if (messageError) {
        console.error(
            "CHAT MESSAGE ERROR:",
            {
                message: messageError.message,
                details: messageError.details,
                hint: messageError.hint,
                code: messageError.code,
            }
        );
    }

    const messages = messageData || [];

    // ========================================
    // MARK UNREAD MESSAGES AS READ
    // ========================================

    const unreadIds = messages
        .filter(
            (message) =>
                message.recipient_id === user.id &&
                !message.read
        )
        .map(
            (message) => message.id
        );

    if (unreadIds.length > 0) {
        const {
            error: readError,
        } = await supabase
            .from("messages")
            .update({
                read: true,
            })
            .in("id", unreadIds)
            .eq(
                "recipient_id",
                user.id
            );

        if (readError) {
            console.error(
                "MARK READ ERROR:",
                readError
            );
        }
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col border-x border-white/10">

                {/* HEADER */}

                <header className="sticky top-0 z-20 border-b border-white/10 bg-black/90 px-4 py-4 backdrop-blur-md sm:px-6">

                    <div className="flex items-center gap-4">

                        <Link
                            href="/"
                            className="text-white/50 transition hover:text-white"
                        >
                            ← Home
                        </Link>

                        <Link
                            href="/messages"
                            className="text-white/50 transition hover:text-white"
                        >
                            Messages
                        </Link>

                    </div>

                    <div className="mt-4 flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 font-bold">
                            {profile.avatar_url ? (
                                <img
                                    src={
                                        profile.avatar_url
                                    }
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                profile.full_name
                                    ?.charAt(0)
                                    .toUpperCase() ||
                                profile.username
                                    ?.charAt(0)
                                    .toUpperCase() ||
                                "U"
                            )}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate font-semibold">
                                {profile.full_name ||
                                    "User"}
                            </p>

                            <p className="truncate text-sm text-white/40">
                                @
                                {profile.username ||
                                    "username"}
                            </p>
                        </div>

                    </div>

                </header>

                {/* CHAT */}

                <ChatWindow
                    currentUserId={user.id}
                    recipientId={profile.id}
                    recipientName={
                        profile.full_name ||
                        profile.username ||
                        "User"
                    }
                    initialMessages={messages}
                />

            </div>
        </main>
    );
}