import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NotificationPost from "@/app/Components/NotificationPost";

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    bio: string | null;
    avatar_url: string | null;
};

type Reply = {
    id: string;
    text: string;
    user_id: string;
    meme_id: string;
    reply_id: string | null;
    created_at: string;
    profile: {
        id: string;
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
};

export default async function PublicProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;

    const supabase = await createClient();

    // ========================================
    // GET LOGGED-IN USER
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
    // GET PROFILE
    // ========================================

    const {
        data: profile,
        error: profileError,
    } = await supabase
        .from("profiles")
        .select(
            "id, username, full_name, bio, avatar_url"
        )
        .eq("username", username)
        .single();

    if (profileError || !profile) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        User not found
                    </h1>

                    <p className="mt-2 text-white/50">
                        This profile doesn't exist.
                    </p>

                    <Link
                        href="/explore"
                        className="mt-5 inline-block rounded-full bg-white px-5 py-2 font-semibold text-black"
                    >
                        Back to Explore
                    </Link>
                </div>
            </main>
        );
    }

    // ========================================
    // GET USER'S POSTS
    // ========================================

    const {
        data: memeData,
        error: memeError,
    } = await supabase
        .from("memes")
        .select(
            "id, content, image_url, author_id, created_at"
        )
        .eq("author_id", profile.id)
        .order("created_at", {
            ascending: false,
        });

    if (memeError) {
        console.error(
            "PROFILE MEMES ERROR:",
            memeError
        );
    }

    const memes = memeData || [];

    // ========================================
    // GET ALL POST IDS
    // ========================================

    const memeIds = memes.map(
        (meme) => meme.id
    );

    // ========================================
    // GET ALL LIKES
    // ========================================

    let likeData: {
        meme_id: string;
        user_id: string;
    }[] = [];

    if (memeIds.length > 0) {
        const { data, error } =
            await supabase
                .from("meme_likes")
                .select(
                    "meme_id, user_id"
                )
                .in(
                    "meme_id",
                    memeIds
                );

        if (error) {
            console.error(
                "PROFILE LIKE ERROR:",
                error
            );
        }

        likeData = data || [];
    }

    // ========================================
    // GET SAVED POSTS
    // ========================================

    let savedData: {
        meme_id: string;
    }[] = [];

    if (memeIds.length > 0) {
        const { data, error } =
            await supabase
                .from("saved_memes")
                .select("meme_id")
                .eq(
                    "user_id",
                    user.id
                )
                .in(
                    "meme_id",
                    memeIds
                );

        if (error) {
            console.error(
                "PROFILE SAVED ERROR:",
                error
            );
        }

        savedData = data || [];
    }

    // ========================================
    // GET ALL REPLIES
    // ========================================

    let replyData: {
        id: string;
        text: string;
        user_id: string;
        meme_id: string;
        reply_id: string | null;
        created_at: string;
    }[] = [];

    if (memeIds.length > 0) {
        const { data, error } =
            await supabase
                .from("replies")
                .select(
                    "id, text, user_id, meme_id, reply_id, created_at"
                )
                .in(
                    "meme_id",
                    memeIds
                )
                .order(
                    "created_at",
                    {
                        ascending: true,
                    }
                );

        if (error) {
            console.error(
                "PROFILE REPLIES ERROR:",
                error
            );
        }

        replyData = data || [];
    }

    // ========================================
    // GET REPLY USERS
    // ========================================

    const replyUserIds = [
        ...new Set(
            replyData.map(
                (reply) =>
                    reply.user_id
            )
        ),
    ];

    let replyProfiles: {
        id: string;
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
    }[] = [];

    if (replyUserIds.length > 0) {
        const {
            data,
            error,
        } = await supabase
            .from("profiles")
            .select(
                "id, username, full_name, avatar_url"
            )
            .in(
                "id",
                replyUserIds
            );

        if (error) {
            console.error(
                "PROFILE REPLY PROFILE ERROR:",
                error
            );
        }

        replyProfiles = data || [];
    }

    // ========================================
    // GROUP REPLIES BY MEME
    // ========================================

    const repliesByMeme: Record<
        string,
        Reply[]
    > = {};

    replyData.forEach((reply) => {
        const formattedReply: Reply =
        {
            id: reply.id,
            text: reply.text,
            user_id:
                reply.user_id,
            meme_id:
                reply.meme_id,
            reply_id:
                reply.reply_id,
            created_at:
                reply.created_at,
            profile:
                replyProfiles.find(
                    (profile) =>
                        profile.id ===
                        reply.user_id
                ) || null,
        };

        if (
            !repliesByMeme[
            reply.meme_id
            ]
        ) {
            repliesByMeme[
                reply.meme_id
            ] = [];
        }

        repliesByMeme[
            reply.meme_id
        ].push(formattedReply);
    });

    // ========================================
    // PAGE
    // ========================================

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">

                {/* HEADER */}

                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">

                    <Link
                        href="/explore"
                        className="text-white/50 transition hover:text-white"
                    >
                        ← Explore
                    </Link>

                    <h1 className="mt-3 text-xl font-bold">
                        Profile
                    </h1>

                </header>

                {/* PROFILE */}

                <section className="border-b border-white/10 px-6 py-8">

                    {/* AVATAR */}

                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/20 text-3xl font-bold">

                        {profile.avatar_url ? (
                            <img
                                src={
                                    profile.avatar_url
                                }
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            profile.full_name
                                ?.charAt(
                                    0
                                )
                                .toUpperCase() ||
                            profile.username
                                ?.charAt(
                                    0
                                )
                                .toUpperCase() ||
                            "U"
                        )}

                    </div>

                    {/* NAME */}

                    <div className="mt-5">

                        <h2 className="text-2xl font-bold">
                            {profile.full_name ||
                                "User"}
                        </h2>

                        <p className="text-white/50">
                            @{profile.username ||
                                "username"}
                        </p>

                    </div>

                    {/* BIO */}

                    {profile.bio && (
                        <p className="mt-4 whitespace-pre-wrap text-white/80">
                            {profile.bio}
                        </p>
                    )}

                    {/* POST COUNT */}

                    <p className="mt-4 text-sm text-white/40">
                        {memes.length}{" "}
                        {memes.length ===
                            1
                            ? "post"
                            : "posts"}
                    </p>

                </section>

                {/* POSTS */}

                <div>

                    <div className="border-b border-white/10 px-6 py-4">
                        <h2 className="font-semibold">
                            Posts
                        </h2>
                    </div>

                    {memes.length ===
                        0 ? (
                        <div className="px-6 py-12 text-center text-white/40">
                            No posts yet.
                        </div>
                    ) : (
                        memes.map(
                            (meme) => {
                                const memeLikes =
                                    likeData.filter(
                                        (like) =>
                                            like.meme_id ===
                                            meme.id
                                    );

                                const initialLikeCount =
                                    memeLikes.length;

                                const initialLiked =
                                    memeLikes.some(
                                        (like) =>
                                            like.user_id ===
                                            user.id
                                    );

                                const initialSaved =
                                    savedData.some(
                                        (item) =>
                                            item.meme_id ===
                                            meme.id
                                    );

                                return (
                                    <NotificationPost
                                        key={
                                            meme.id
                                        }
                                        meme={meme}
                                        author={
                                            profile
                                        }
                                        initialLikeCount={
                                            initialLikeCount
                                        }
                                        initialLiked={
                                            initialLiked
                                        }
                                        initialSaved={
                                            initialSaved
                                        }
                                        initialReplies={
                                            repliesByMeme[
                                            meme.id
                                            ] || []
                                        }
                                    />
                                );
                            }
                        )
                    )}

                </div>

            </div>
        </main>
    );
}