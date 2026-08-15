import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NotificationPost from "@/app/Components/NotificationPost";

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
};

export default async function MemePage({
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
                    className="rounded-full bg-white px-5 py-2 font-semibold text-black"
                >
                    Log in
                </Link>
            </main>
        );
    }

    // Get post
    const { data: meme, error: memeError } =
        await supabase
            .from("memes")
            .select(
                "id, content, image_url, author_id, created_at"
            )
            .eq("id", id)
            .single();

    if (memeError || !meme) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        Post not found
                    </h1>

                    <Link
                        href="/explore"
                        className="mt-4 inline-block text-white/50 hover:text-white"
                    >
                        ← Back to Explore
                    </Link>
                </div>
            </main>
        );
    }

    // Get author
    const { data: author } = await supabase
        .from("profiles")
        .select(
            "id, username, full_name, avatar_url"
        )
        .eq("id", meme.author_id)
        .single();

    // Get likes
    const { data: likeData } = await supabase
        .from("meme_likes")
        .select("user_id")
        .eq("meme_id", meme.id);

    const initialLikeCount =
        likeData?.length || 0;

    const initialLiked =
        likeData?.some(
            (like) =>
                like.user_id === user.id
        ) || false;

    // Get save state
    const { data: savedRow } =
        await supabase
            .from("saved_memes")
            .select("meme_id")
            .eq("user_id", user.id)
            .eq("meme_id", meme.id)
            .maybeSingle();

    const initialSaved = !!savedRow;

    // Get replies
    const { data: replyData } =
        await supabase
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

    let replyProfiles: Profile[] = [];

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
        (replyData || []).map(
            (reply) => ({
                ...reply,
                profile:
                    replyProfiles.find(
                        (profile) =>
                            profile.id ===
                            reply.user_id
                    ) || null,
            })
        );

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">

                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">
                    <Link
                        href="/explore"
                        className="text-white/50 transition hover:text-white"
                    >
                        ← Explore
                    </Link>

                    <h1 className="mt-3 text-xl font-bold">
                        Post
                    </h1>
                </header>

                <NotificationPost
                    meme={meme}
                    author={author}
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
                        replies
                    }
                />
            </div>
        </main>
    );
}