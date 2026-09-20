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
            <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
                <Link
                    href="/login"
                    className="rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground"
                >
                    Log in
                </Link>
            </main>
        );
    }

    const {
        data: meme,
        error: memeError,
    } = await supabase
        .from("memes")
        .select(
            "id, content, image_url, author_id, created_at"
        )
        .eq("id", id)
        .single();

    if (memeError || !meme) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        Post not found
                    </h1>

                    <Link
                        href="/explore"
                        className="mt-4 inline-block text-muted-foreground hover:text-foreground"
                    >
                        ← Back to Explore
                    </Link>
                </div>
            </main>
        );
    }

    const [
        authorResult,
        likeCountResult,
        likedResult,
        savedResult,
        repliesResult,
    ] = await Promise.all([
        supabase
            .from("profiles")
            .select(
                "id, username, full_name, avatar_url"
            )
            .eq("id", meme.author_id)
            .single(),

        supabase
            .from("meme_likes")
            .select("id", {
                count: "exact",
                head: true,
            })
            .eq("meme_id", meme.id),

        supabase
            .from("meme_likes")
            .select("user_id")
            .eq("meme_id", meme.id)
            .eq("user_id", user.id)
            .maybeSingle(),

        supabase
            .from("saved_memes")
            .select("meme_id")
            .eq("user_id", user.id)
            .eq("meme_id", meme.id)
            .maybeSingle(),

        supabase
            .from("replies")
            .select(
                "id, text, user_id, meme_id, reply_id, created_at"
            )
            .eq("meme_id", meme.id)
            .order("created_at", {
                ascending: true,
            }),
    ]);

    const author = authorResult.data;

    const initialLikeCount =
        likeCountResult.count ?? 0;

    const initialLiked =
        !!likedResult.data;

    const initialSaved =
        !!savedResult.data;

    const replyData =
        repliesResult.data || [];

    const replyUserIds = [
        ...new Set(
            replyData.map(
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

    const profileMap = new Map(
        replyProfiles.map(
            (profile) => [
                profile.id,
                profile,
            ]
        )
    );

    const replies = replyData.map(
        (reply) => ({
            ...reply,
            profile:
                profileMap.get(
                    reply.user_id
                ) || null,
        })
    );

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-border">

                <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-4 py-4 backdrop-blur-xl sm:px-6">
                    <Link
                        href="/explore"
                        className="text-muted-foreground transition hover:text-foreground"
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