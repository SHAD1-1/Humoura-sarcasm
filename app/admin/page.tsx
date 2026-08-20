import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
    created_at: string;
};

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
};

export default async function AdminPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        Log in required
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

    const {
        data: adminUser,
    } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq(
            "user_id",
            user.id
        )
        .maybeSingle();

    if (!adminUser) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        Access denied
                    </h1>

                    <p className="mt-2 text-white/40">
                        You are not a Humoura administrator.
                    </p>

                    <Link
                        href="/"
                        className="mt-5 inline-block text-white/50 hover:text-white"
                    >
                        ← Home
                    </Link>
                </div>
            </main>
        );
    }

    // ========================================
    // POSTS
    // ========================================

    const {
        data: memes,
        error: memeError,
    } = await supabase
        .from("memes")
        .select(
            "id, content, image_url, author_id, created_at"
        )
        .order(
            "created_at",
            {
                ascending: false,
            }
        )
        .limit(50);

    if (memeError) {
        console.error(
            "ADMIN MEME ERROR:",
            memeError
        );
    }

    // ========================================
    // COMMENTS
    // ========================================

    const {
        data: replies,
        error: replyError,
    } = await supabase
        .from("replies")
        .select(
            "id, text, user_id, meme_id, created_at"
        )
        .order(
            "created_at",
            {
                ascending: false,
            }
        )
        .limit(100);

    if (replyError) {
        console.error(
            "ADMIN REPLY ERROR:",
            replyError
        );
    }

    const memeList: Meme[] =
        memes || [];

    const replyList: Reply[] =
        replies || [];

    // ========================================
    // PROFILES
    // ========================================

    const profileIds = [
        ...new Set([
            ...memeList.map(
                (meme) =>
                    meme.author_id
            ),
            ...replyList.map(
                (reply) =>
                    reply.user_id
            ),
        ]),
    ];

    let profiles: Profile[] = [];

    if (
        profileIds.length > 0
    ) {
        const {
            data,
        } = await supabase
            .from("profiles")
            .select(
                "id, username, full_name"
            )
            .in(
                "id",
                profileIds
            );

        profiles =
            data || [];
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">

                {/* HEADER */}

                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-red-400">
                            Humoura
                        </p>

                        <h1 className="text-3xl font-bold">
                            Admin moderation
                        </h1>
                    </div>

                    <Link
                        href="/"
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
                    >
                        ← Home
                    </Link>
                </header>

                {/* POSTS */}

                <section className="rounded-2xl border border-white/10">
                    <div className="border-b border-white/10 px-5 py-4">
                        <h2 className="font-semibold">
                            Posts
                        </h2>
                    </div>

                    {memeList.length === 0 ? (
                        <p className="px-5 py-8 text-white/40">
                            No posts.
                        </p>
                    ) : (
                        memeList.map(
                            (meme) => {
                                const author =
                                    profiles.find(
                                        (
                                            profile
                                        ) =>
                                            profile.id ===
                                            meme.author_id
                                    );

                                return (
                                    <div
                                        key={
                                            meme.id
                                        }
                                        className="border-b border-white/10 px-5 py-5 last:border-b-0"
                                    >
                                        <div className="flex items-start justify-between gap-4">

                                            <div className="min-w-0">
                                                <p className="font-semibold">
                                                    {author?.full_name ||
                                                        "User"}
                                                </p>

                                                <p className="text-xs text-white/30">
                                                    @
                                                    {author?.username ||
                                                        "username"}
                                                </p>

                                                {meme.content && (
                                                    <p className="mt-3 whitespace-pre-wrap text-white/80">
                                                        {meme.content}
                                                    </p>
                                                )}

                                                <p className="mt-2 text-xs text-white/30">
                                                    {new Date(
                                                        meme.created_at
                                                    ).toLocaleString()}
                                                </p>
                                            </div>

                                            <form
                                                action={async () => {
                                                    "use server";

                                                    const serverSupabase =
                                                        await createClient();

                                                    await serverSupabase
                                                        .from(
                                                            "memes"
                                                        )
                                                        .delete()
                                                        .eq(
                                                            "id",
                                                            meme.id
                                                        );
                                                }}
                                            >
                                                <button
                                                    type="submit"
                                                    className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                                                >
                                                    Delete
                                                </button>
                                            </form>

                                        </div>
                                    </div>
                                );
                            }
                        )
                    )}
                </section>

                {/* COMMENTS */}

                <section className="mt-8 rounded-2xl border border-white/10">
                    <div className="border-b border-white/10 px-5 py-4">
                        <h2 className="font-semibold">
                            Comments
                        </h2>
                    </div>

                    {replyList.length === 0 ? (
                        <p className="px-5 py-8 text-white/40">
                            No comments.
                        </p>
                    ) : (
                        replyList.map(
                            (reply) => {
                                const author =
                                    profiles.find(
                                        (
                                            profile
                                        ) =>
                                            profile.id ===
                                            reply.user_id
                                    );

                                return (
                                    <div
                                        key={
                                            reply.id
                                        }
                                        className="border-b border-white/10 px-5 py-5 last:border-b-0"
                                    >
                                        <div className="flex items-start justify-between gap-4">

                                            <div className="min-w-0">
                                                <p className="font-semibold">
                                                    {author?.full_name ||
                                                        "User"}
                                                </p>

                                                <p className="text-xs text-white/30">
                                                    @
                                                    {author?.username ||
                                                        "username"}
                                                </p>

                                                <p className="mt-3 whitespace-pre-wrap text-white/80">
                                                    {reply.text}
                                                </p>

                                                <p className="mt-2 text-xs text-white/30">
                                                    {new Date(
                                                        reply.created_at
                                                    ).toLocaleString()}
                                                </p>
                                            </div>

                                            <form
                                                action={async () => {
                                                    "use server";

                                                    const serverSupabase =
                                                        await createClient();

                                                    await serverSupabase
                                                        .from(
                                                            "replies"
                                                        )
                                                        .delete()
                                                        .eq(
                                                            "id",
                                                            reply.id
                                                        );
                                                }}
                                            >
                                                <button
                                                    type="submit"
                                                    className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                                                >
                                                    Delete
                                                </button>
                                            </form>

                                        </div>
                                    </div>
                                );
                            }
                        )
                    )}
                </section>

            </div>
        </main>
    );
}