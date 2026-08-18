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

    // Logged-out users should not see personalized
    // suggestions.
    if (!user) {
        return (
            <aside className="hidden w-80 px-6 py-6 lg:block">
                {/* Search */}
                <Link
                    href="/explore"
                    className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-3 transition hover:bg-white/15"
                >
                    <BsSearch className="text-white/50" />

                    <span className="text-sm text-white/50">
                        Search Humoura...
                    </span>
                </Link>
            </aside>
        );
    }

    // ==========================================
    // GET PEOPLE CURRENT USER ALREADY FOLLOWS
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
            (item) => item.following_id
        )
    );

    // ==========================================
    // GET PROFILES FOR WHO TO FOLLOW
    // ==========================================

    const {
        data: profileData,
        error: profileError,
    } = await supabase
        .from("profiles")
        .select(
            "id, username, full_name, avatar_url"
        )
        .neq("id", user.id)
        .limit(20);

    if (profileError) {
        console.error(
            "RIGHT SIDEBAR PROFILE ERROR:",
            profileError
        );
    }

    // Remove users already followed
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
        .limit(1000);

    if (todayMemeError) {
        console.error(
            "RIGHT SIDEBAR MEME ERROR:",
            todayMemeError
        );
    }

    const memeRows =
        (todayMemes ||
            []) as MemeAuthorRow[];

    // Count posts by author
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

    // Sort highest post count first
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
                ([authorId]) => authorId
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

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <aside className="hidden w-80 shrink-0 px-6 py-6 lg:block">

            {/* SEARCH */}

            <Link
                href="/explore"
                className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-3 transition hover:bg-white/15"
            >
                <BsSearch className="text-white/50" />

                <span className="text-sm text-white/50">
                    Search Humoura...
                </span>
            </Link>

            {/* TOP MEMERS */}

            <div className="mt-6 rounded-2xl border border-white/10 p-5">

                <h2 className="text-lg font-bold">
                    Top memers today
                </h2>

                {topProfiles.length === 0 ? (
                    <p className="mt-5 text-sm text-white/40">
                        No posts yet today.
                    </p>
                ) : (
                    <div className="mt-5 space-y-5">

                        {topAuthorIds.map(
                            (authorId) => {
                                const profile =
                                    topProfiles.find(
                                        (
                                            item
                                        ) =>
                                            item.id ===
                                            authorId
                                    );

                                if (!profile) {
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
                                        className="block transition hover:opacity-80"
                                    >

                                        <p className="font-semibold">
                                            @
                                            {profile.username ||
                                                "username"}
                                        </p>

                                        <p className="text-sm text-white/40">
                                            {postCount}{" "}
                                            {postCount ===
                                                1
                                                ? "post"
                                                : "posts"}
                                        </p>

                                    </Link>
                                );
                            }
                        )}

                    </div>
                )}

            </div>

            {/* WHO TO FOLLOW */}

            <div className="mt-6 rounded-2xl border border-white/10 p-5">

                <h2 className="text-lg font-bold">
                    Follow them if you know them
                </h2>

                {suggestedProfiles.length ===
                    0 ? (
                    <p className="mt-5 text-sm text-white/40">
                        You're all caught up.
                    </p>
                ) : (
                    <div className="mt-5 space-y-5">

                        {suggestedProfiles.map(
                            (profile) => (
                                <div
                                    key={
                                        profile.id
                                    }
                                    className="flex items-center justify-between gap-3"
                                >

                                    {/* USER */}

                                    <Link
                                        href={`/profile/${profile.id}`}
                                        className="flex min-w-0 items-center gap-3"
                                    >

                                        {/* AVATAR */}

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-sm font-bold">

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

                                    </Link>

                                    {/* FOLLOW BUTTON */}

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

            </div>

        </aside>
    );
};

export default RightSidebar;