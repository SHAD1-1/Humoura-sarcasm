import Link from "next/link";
import { BsSearch } from "react-icons/bs";
import { createClient } from "@/lib/supabase/server";
import FollowButton from "./FollowButton";

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
};

type MemeAuthorRow = {
    author_id: string;
};

const RightSidebar = async () => {
    const supabase = await createClient();

    // ==========================================
    // CURRENT USER
    // ==========================================

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // ==========================================
    // LOGGED OUT
    // ==========================================

    if (!user) {
        return (
            <aside className="hidden w-80 shrink-0 px-6 py-6 lg:block">
                <Link
                    href="/explore"
                    className="flex items-center gap-3 rounded-full border border-border bg-card/80 px-5 py-3 text-muted-foreground backdrop-blur-xl transition hover:bg-accent hover:text-foreground"
                >
                    <BsSearch className="text-lg" />

                    <span className="text-sm">
                        Search Humoura...
                    </span>
                </Link>
            </aside>
        );
    }

    // ==========================================
    // FOLLOWING
    // ==========================================

    const {
        data: followData,
        error: followError,
    } = await supabase
        .from("follows")
        .select("following_id")
        .eq(
            "follower_id",
            user.id
        );

    if (followError) {
        console.error(
            "RIGHT SIDEBAR FOLLOW ERROR:",
            followError
        );
    }

    const followedIds = new Set(
        (followData || []).map(
            (item) =>
                item.following_id
        )
    );

    // ==========================================
    // SUGGESTIONS
    // ==========================================

    const {
        data: profileData,
        error: profileError,
    } = await supabase
        .from("profiles")
        .select(
            "id, username, full_name, avatar_url"
        )
        .neq(
            "id",
            user.id
        )
        .limit(12);

    if (profileError) {
        console.error(
            "RIGHT SIDEBAR PROFILE ERROR:",
            profileError
        );
    }

    const suggestedProfiles: Profile[] =
        (profileData || [])
            .filter(
                (profile) =>
                    !followedIds.has(
                        profile.id
                    )
            )
            .slice(0, 3);

    // ==========================================
    // TOP MEMERS TODAY
    // ==========================================

    const now = new Date();

    const startOfToday = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        )
    ).toISOString();

    const {
        data: todayMemes,
        error: todayMemeError,
    } = await supabase
        .from("memes")
        .select("author_id")
        .gte(
            "created_at",
            startOfToday
        )
        .limit(100);

    if (todayMemeError) {
        console.error(
            "RIGHT SIDEBAR MEME ERROR:",
            todayMemeError
        );
    }

    const memeRows =
        (todayMemes || []) as MemeAuthorRow[];

    const authorCounts =
        new Map<string, number>();

    for (const meme of memeRows) {
        authorCounts.set(
            meme.author_id,
            (authorCounts.get(
                meme.author_id
            ) || 0) + 1
        );
    }

    const topAuthorIds =
        Array.from(
            authorCounts.entries()
        )
            .sort(
                ([, countA], [, countB]) =>
                    countB - countA
            )
            .slice(0, 5)
            .map(
                ([authorId]) =>
                    authorId
            );

    let topProfiles: Profile[] = [];

    if (
        topAuthorIds.length > 0
    ) {
        const {
            data: topProfileData,
            error: topProfileError,
        } = await supabase
            .from("profiles")
            .select(
                "id, username, full_name, avatar_url"
            )
            .in(
                "id",
                topAuthorIds
            );

        if (topProfileError) {
            console.error(
                "TOP MEMER PROFILE ERROR:",
                topProfileError
            );
        }

        topProfiles =
            topProfileData || [];
    }

    return (<aside className="hidden w-80 shrink-0 px-5 py-6 lg:block">

        {/* ======================================
                SEARCH
            ====================================== */}

        <Link
            href="/explore"
            className="flex items-center gap-3 rounded-full border border-border bg-card/80 px-5 py-3 text-muted-foreground shadow-sm backdrop-blur-xl transition hover:bg-accent hover:text-foreground"
        >
            <BsSearch className="text-lg" />

            <span className="text-sm">
                Search Humoura...
            </span>
        </Link>

        {/* ======================================
                TOP MEMERS
            ====================================== */}

        <section className="glass-card mt-5 overflow-hidden rounded-3xl p-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">
                        👑
                    </span>

                    <h2 className="text-lg font-bold text-card-foreground">
                        Top memers today
                    </h2>
                </div>

                <span className="text-sm font-medium text-primary">
                    Today
                </span>
            </div>

            {topProfiles.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">
                    No posts yet today.
                </p>
            ) : (
                <div className="mt-5 divide-y divide-border">
                    {topAuthorIds.map(
                        (
                            authorId,
                            index
                        ) => {
                            const profile =
                                topProfiles.find(
                                    (
                                        item
                                    ) =>
                                        item.id ===
                                        authorId
                                );

                            if (
                                !profile
                            ) {
                                return null;
                            }

                            const postCount =
                                authorCounts.get(
                                    authorId
                                ) || 0;

                            return (
                                <Link
                                    key={
                                        authorId
                                    }
                                    href={`/profile/${authorId}`}
                                    className="flex items-center gap-3 py-4 first:pt-0 last:pb-0 transition hover:bg-accent/40"
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                                        {index +
                                            1}
                                    </span>

                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold text-muted-foreground">
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

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-card-foreground">
                                            {profile.full_name ||
                                                "User"}
                                        </p>

                                        <p className="truncate text-xs text-muted-foreground">
                                            @
                                            {profile.username ||
                                                "username"}
                                        </p>
                                    </div>

                                    <span className="shrink-0 text-xs font-medium text-primary">
                                        {postCount}
                                    </span>
                                </Link>
                            );
                        }
                    )}
                </div>
            )}
        </section>

        {/* ======================================
                FOLLOW SUGGESTIONS
            ====================================== */}

        <section className="glass-card mt-5 overflow-hidden rounded-3xl p-5">

            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">
                        👥
                    </span>

                    <h2 className="text-lg font-bold leading-tight text-card-foreground">
                        Follow them if you know them
                    </h2>
                </div>

                <Link
                    href="/explore"
                    className="shrink-0 text-sm font-medium text-primary hover:underline"
                >
                    View all
                </Link>
            </div>

            {suggestedProfiles.length ===
                0 ? (
                <p className="mt-6 text-sm text-muted-foreground">
                    You're all caught up.
                </p>
            ) : (
                <div className="mt-5 space-y-4">

                    {suggestedProfiles.map(
                        (profile) => (
                            <div
                                key={
                                    profile.id
                                }
                                className="flex items-center gap-3"
                            >

                                {/* USER */}

                                <Link
                                    href={`/profile/${profile.id}`}
                                    className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1 transition hover:bg-accent"
                                >
                                    {/* AVATAR */}

                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold text-muted-foreground">
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

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-card-foreground">
                                            {profile.full_name ||
                                                "User"}
                                        </p>

                                        <p className="truncate text-xs text-muted-foreground">
                                            @
                                            {profile.username ||
                                                "username"}
                                        </p>
                                    </div>
                                </Link>

                                {/* FOLLOW */}

                                <FollowButton
                                    targetUserId={
                                        profile.id
                                    }
                                />

                            </div>
                        )
                    )}

                </div>
            )}

        </section>

    </aside>
    );
};

export default RightSidebar;