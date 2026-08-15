"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
};

type Meme = {
    id: string;
    content: string | null;
    image_url: string | null;
    author_id: string;
    created_at: string;
    profile: Profile | null;
};

const ExplorePage = () => {
    const supabase = createClient();

    const [search, setSearch] = useState("");
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [memes, setMemes] = useState<Meme[]>([]);

    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");

    // ==========================================
    // LOAD RECENT CONTENT
    // ==========================================

    useEffect(() => {
        async function loadExplore() {
            setLoading(true);
            setError("");

            const { data: memeData, error: memeError } =
                await supabase
                    .from("memes")
                    .select(
                        "id, content, image_url, author_id, created_at"
                    )
                    .order("created_at", {
                        ascending: false,
                    })
                    .limit(20);

            if (memeError) {
                console.error(
                    "EXPLORE MEME ERROR:",
                    memeError
                );

                setError(memeError.message);
                setLoading(false);
                return;
            }

            if (!memeData || memeData.length === 0) {
                setMemes([]);
                setLoading(false);
                return;
            }

            const authorIds = [
                ...new Set(
                    memeData.map(
                        (meme) => meme.author_id
                    )
                ),
            ];

            const { data: profileData } =
                await supabase
                    .from("profiles")
                    .select(
                        "id, username, full_name, avatar_url"
                    )
                    .in("id", authorIds);

            const formattedMemes: Meme[] =
                memeData.map((meme) => ({
                    id: meme.id,
                    content: meme.content,
                    image_url: meme.image_url,
                    author_id: meme.author_id,
                    created_at: meme.created_at,
                    profile:
                        profileData?.find(
                            (profile) =>
                                profile.id ===
                                meme.author_id
                        ) || null,
                }));

            setMemes(formattedMemes);
            setLoading(false);
        }

        loadExplore();
    }, []);

    // ==========================================
    // SEARCH
    // ==========================================

    useEffect(() => {
        const query = search.trim();

        if (!query) {
            setProfiles([]);
            setSearching(false);
            return;
        }

        const timeout = setTimeout(
            async () => {
                setSearching(true);

                const searchTerm = `%${query}%`;

                // Search profiles
                const {
                    data: profileData,
                    error: profileError,
                } = await supabase
                    .from("profiles")
                    .select(
                        "id, username, full_name, avatar_url"
                    )
                    .or(
                        `username.ilike.${searchTerm},full_name.ilike.${searchTerm}`
                    )
                    .limit(10);

                if (profileError) {
                    console.error(
                        "PROFILE SEARCH ERROR:",
                        profileError
                    );
                }

                setProfiles(profileData || []);

                // Search memes
                const {
                    data: memeData,
                    error: memeError,
                } = await supabase
                    .from("memes")
                    .select(
                        "id, content, image_url, author_id, created_at"
                    )
                    .ilike(
                        "content",
                        searchTerm
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false,
                        }
                    )
                    .limit(20);

                if (memeError) {
                    console.error(
                        "MEME SEARCH ERROR:",
                        memeError
                    );
                }

                if (
                    memeData &&
                    memeData.length > 0
                ) {
                    const authorIds = [
                        ...new Set(
                            memeData.map(
                                (meme) =>
                                    meme.author_id
                            )
                        ),
                    ];

                    const {
                        data: authorProfiles,
                    } = await supabase
                        .from("profiles")
                        .select(
                            "id, username, full_name, avatar_url"
                        )
                        .in(
                            "id",
                            authorIds
                        );

                    const formattedMemes =
                        memeData.map(
                            (meme) => ({
                                id: meme.id,
                                content:
                                    meme.content,
                                image_url:
                                    meme.image_url,
                                author_id:
                                    meme.author_id,
                                created_at:
                                    meme.created_at,
                                profile:
                                    authorProfiles?.find(
                                        (profile) =>
                                            profile.id ===
                                            meme.author_id
                                    ) || null,
                            })
                        );

                    setMemes(
                        formattedMemes
                    );
                } else {
                    setMemes([]);
                }

                setSearching(false);
            },
            300
        );

        return () =>
            clearTimeout(timeout);
    }, [search]);

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <main className="min-h-screen bg-black text-white">
                <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">
                    <header className="border-b border-white/10 px-6 py-4">
                        <h1 className="text-xl font-bold">
                            Explore
                        </h1>
                    </header>

                    <div className="px-6 py-10 text-center text-white/50">
                        Loading Explore...
                    </div>
                </div>
            </main>
        );
    }

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">

                {/* HEADER */}

                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">
                    <h1 className="text-xl font-bold">
                        Explore
                    </h1>

                    {/* SEARCH */}

                    <div className="mt-4">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            placeholder="🔍 Search posts or users..."
                            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                        />
                    </div>
                </header>

                {/* SEARCH RESULTS */}

                {search.trim() ? (
                    <div>

                        {/* PEOPLE */}

                        <section>
                            <div className="border-b border-white/10 px-6 py-4">
                                <h2 className="font-semibold">
                                    People
                                </h2>
                            </div>

                            {profiles.length === 0 ? (
                                <div className="px-6 py-6 text-sm text-white/40">
                                    No users found.
                                </div>
                            ) : (
                                profiles.map(
                                    (profile) => (
                                        <Link
                                            key={
                                                profile.id
                                            }
                                            href={`/profile/${profile.username}`}
                                            className="flex items-center gap-3 border-b border-white/10 px-6 py-4 transition hover:bg-white/[0.03]"
                                        >
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 font-bold">
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
                                    )
                                )
                            )}
                        </section>

                        {/* POSTS */}

                        <section>
                            <div className="border-b border-white/10 px-6 py-4">
                                <h2 className="font-semibold">
                                    Posts
                                </h2>
                            </div>

                            {searching ? (
                                <div className="px-6 py-6 text-center text-sm text-white/40">
                                    Searching...
                                </div>
                            ) : memes.length === 0 ? (
                                <div className="px-6 py-6 text-sm text-white/40">
                                    No posts found.
                                </div>
                            ) : (
                                memes.map(
                                    (meme) => (
                                        <article
                                            key={
                                                meme.id
                                            }
                                            className="border-b border-white/10 px-6 py-5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-sm font-bold">
                                                    {meme
                                                        .profile
                                                        ?.avatar_url ? (
                                                        <img
                                                            src={
                                                                meme
                                                                    .profile
                                                                    .avatar_url
                                                            }
                                                            alt="Avatar"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        meme
                                                            .profile
                                                            ?.full_name
                                                            ?.charAt(
                                                                0
                                                            )
                                                            .toUpperCase() ||
                                                        "U"
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="font-semibold">
                                                        {meme
                                                            .profile
                                                            ?.full_name ||
                                                            "User"}
                                                    </p>

                                                    <p className="text-xs text-white/40">
                                                        @
                                                        {meme
                                                            .profile
                                                            ?.username ||
                                                            "username"}
                                                    </p>
                                                </div>
                                            </div>

                                            {meme.content && (
                                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                                                    {meme.content}
                                                </p>
                                            )}

                                            {meme.image_url && (
                                                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                                    <img
                                                        src={
                                                            meme.image_url
                                                        }
                                                        alt="Meme"
                                                        className="max-h-[500px] w-full object-contain"
                                                    />
                                                </div>
                                            )}

                                            <p className="mt-3 text-xs text-white/30">
                                                {new Date(
                                                    meme.created_at
                                                ).toLocaleString()}
                                            </p>
                                        </article>
                                    )
                                )
                            )}
                        </section>
                    </div>
                ) : (
                    /* ========================================
                       RECENT POSTS
                    ======================================== */

                    <section>
                        <div className="border-b border-white/10 px-6 py-4">
                            <h2 className="font-semibold">
                                Recent Posts
                            </h2>
                        </div>

                        {memes.length === 0 ? (
                            <div className="px-6 py-10 text-center text-white/40">
                                No posts yet.
                            </div>
                        ) : (
                            memes.map(
                                (meme) => (
                                    <article
                                        key={
                                            meme.id
                                        }
                                        className="border-b border-white/10 px-6 py-5"
                                    >
                                        <div className="flex items-center gap-3">

                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-sm font-bold">
                                                {meme.profile
                                                    ?.avatar_url ? (
                                                    <img
                                                        src={
                                                            meme.profile
                                                                .avatar_url
                                                        }
                                                        alt="Avatar"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    meme.profile
                                                        ?.full_name
                                                        ?.charAt(
                                                            0
                                                        )
                                                        .toUpperCase() ||
                                                    "U"
                                                )}
                                            </div>

                                            <div>
                                                <p className="font-semibold">
                                                    {meme.profile
                                                        ?.full_name ||
                                                        "User"}
                                                </p>

                                                <p className="text-xs text-white/40">
                                                    @
                                                    {meme.profile
                                                        ?.username ||
                                                        "username"}
                                                </p>
                                            </div>

                                        </div>

                                        {meme.content && (
                                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                                                {meme.content}
                                            </p>
                                        )}

                                        {meme.image_url && (
                                            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                                <img
                                                    src={
                                                        meme.image_url
                                                    }
                                                    alt="Meme"
                                                    className="max-h-[500px] w-full object-contain"
                                                />
                                            </div>
                                        )}

                                        <p className="mt-3 text-xs text-white/30">
                                            {new Date(
                                                meme.created_at
                                            ).toLocaleString()}
                                        </p>
                                    </article>
                                )
                            )
                        )}
                    </section>
                )}
            </div>
        </main>
    );
};

export default ExplorePage;