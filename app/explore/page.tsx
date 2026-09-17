"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    BsSearch,
    BsPeople,
    BsFilePost,
    BsArrowLeft,
    BsClockHistory,
} from "react-icons/bs";
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

    useEffect(() => {
        async function loadExplore() {
            setLoading(true);
            setError("");

            const {
                data: memeData,
                error: memeError,
            } = await supabase
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

            const {
                data: profileData,
                error: profileError,
            } = await supabase
                .from("profiles")
                .select(
                    "id, username, full_name, avatar_url"
                )
                .in("id", authorIds);

            if (profileError) {
                console.error(
                    "EXPLORE PROFILE ERROR:",
                    profileError
                );
            }

            setMemes(
                memeData.map((meme) => ({
                    ...meme,
                    profile:
                        profileData?.find(
                            (profile) =>
                                profile.id ===
                                meme.author_id
                        ) || null,
                }))
            );

            setLoading(false);
        }

        loadExplore();
    }, []);

    useEffect(() => {
        const query = search.trim();

        if (!query) {
            setProfiles([]);
            setSearching(false);
            return;
        }

        const timeout = setTimeout(async () => {
            setSearching(true);

            const searchTerm = `%${query}%`;

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
                setProfiles([]);
            } else {
                setProfiles(profileData || []);
            }

            const {
                data: memeData,
                error: memeError,
            } = await supabase
                .from("memes")
                .select(
                    "id, content, image_url, author_id, created_at"
                )
                .ilike("content", searchTerm)
                .order("created_at", {
                    ascending: false,
                })
                .limit(20);

            if (memeError) {
                console.error(
                    "MEME SEARCH ERROR:",
                    memeError
                );
                setMemes([]);
                setSearching(false);
                return;
            }

            if (!memeData || memeData.length === 0) {
                setMemes([]);
                setSearching(false);
                return;
            }

            const authorIds = [
                ...new Set(
                    memeData.map(
                        (meme) => meme.author_id
                    )
                ),
            ];

            const {
                data: authorProfiles,
                error: authorProfileError,
            } = await supabase
                .from("profiles")
                .select(
                    "id, username, full_name, avatar_url"
                )
                .in("id", authorIds);

            if (authorProfileError) {
                console.error(
                    "AUTHOR PROFILE SEARCH ERROR:",
                    authorProfileError
                );
            }

            setMemes(
                memeData.map((meme) => ({
                    ...meme,
                    profile:
                        authorProfiles?.find(
                            (profile) =>
                                profile.id ===
                                meme.author_id
                        ) || null,
                }))
            );

            setSearching(false);
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    function avatar(profile: Profile | null) {
        if (profile?.avatar_url) {
            return (
                <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                />
            );
        }

        return (
            profile?.full_name?.charAt(0).toUpperCase() ||
            profile?.username?.charAt(0).toUpperCase() ||
            "U"
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-background text-foreground">
                <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-border">
                    <header className="sticky top-0 z-40 border-b border-border bg-background/85 px-5 py-4 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                            >
                                <BsArrowLeft />
                            </Link>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                                    HUMOURA
                                </p>
                                <h1 className="text-xl font-bold">
                                    Explore
                                </h1>
                            </div>
                        </div>
                    </header>

                    <div className="px-6 py-16 text-center text-muted-foreground">
                        Loading Explore...
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-background text-foreground">
                <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-border">
                    <header className="sticky top-0 z-40 border-b border-border bg-background/85 px-5 py-4 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                            >
                                <BsArrowLeft />
                            </Link>

                            <h1 className="text-xl font-bold">
                                Explore
                            </h1>
                        </div>
                    </header>

                    <div className="px-6 py-12 text-center text-red-500">
                        {error}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-border">

                <header className="sticky top-0 z-40 border-b border-border bg-background/85 px-5 py-4 backdrop-blur-xl">

                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                        >
                            <BsArrowLeft />
                        </Link>

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                                HUMOURA
                            </p>
                            <h1 className="text-xl font-bold">
                                Explore
                            </h1>
                        </div>
                    </div>

                    <div className="relative mt-4">
                        <BsSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search people or sarcasms..."
                            className="w-full rounded-full border border-border bg-muted/60 py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                        />
                    </div>

                </header>

                {search.trim() ? (
                    <div>

                        <section className="border-b border-border">

                            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                                <BsPeople className="text-primary" />
                                <h2 className="font-bold">
                                    People
                                </h2>
                            </div>

                            {profiles.length === 0 ? (
                                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                                    No users found.
                                </div>
                            ) : (
                                profiles.map((profile) => (
                                    <Link
                                        key={profile.id}
                                        href={`/profile/${profile.id}`}
                                        className="flex items-center gap-3 border-b border-border px-5 py-4 transition hover:bg-accent/50"
                                    >
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold text-muted-foreground ring-1 ring-border">
                                            {avatar(profile)}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">
                                                {profile.full_name ||
                                                    "User"}
                                            </p>

                                            <p className="truncate text-sm text-muted-foreground">
                                                @
                                                {profile.username ||
                                                    "username"}
                                            </p>
                                        </div>
                                    </Link>
                                ))
                            )}

                        </section>

                        <section>

                            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                                <BsFilePost className="text-primary" />
                                <h2 className="font-bold">
                                    Posts
                                </h2>
                            </div>

                            {searching ? (
                                <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                                    Searching...
                                </div>
                            ) : memes.length === 0 ? (
                                <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                                    No posts found.
                                </div>
                            ) : (
                                memes.map((meme) => (
                                    <Link
                                        key={meme.id}
                                        href={`/memes/${meme.id}`}
                                        className="block border-b border-border px-5 py-5 transition hover:bg-accent/40"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold text-muted-foreground">
                                                {avatar(
                                                    meme.profile
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold">
                                                    {meme.profile
                                                        ?.full_name ||
                                                        "User"}
                                                </p>

                                                <p className="truncate text-xs text-muted-foreground">
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
                                            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-muted/40">
                                                <img
                                                    src={meme.image_url}
                                                    alt="Meme"
                                                    className="max-h-[500px] w-full object-contain"
                                                />
                                            </div>
                                        )}

                                        <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                                            <BsClockHistory />
                                            {new Date(
                                                meme.created_at
                                            ).toLocaleString()}
                                        </p>
                                    </Link>
                                ))
                            )}

                        </section>

                    </div>
                ) : (
                    <section>

                        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                            <BsClockHistory className="text-primary" />
                            <h2 className="font-bold">
                                Recent Posts
                            </h2>
                        </div>

                        {memes.length === 0 ? (
                            <div className="px-5 py-16 text-center text-muted-foreground">
                                No posts yet.
                            </div>
                        ) : (
                            memes.map((meme) => (
                                <Link
                                    key={meme.id}
                                    href={`/memes/${meme.id}`}
                                    className="block border-b border-border px-5 py-5 transition hover:bg-accent/40"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold text-muted-foreground">
                                            {avatar(
                                                meme.profile
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">
                                                {meme.profile
                                                    ?.full_name ||
                                                    "User"}
                                            </p>

                                            <p className="truncate text-xs text-muted-foreground">
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
                                        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-muted/40">
                                            <img
                                                src={meme.image_url}
                                                alt="Meme"
                                                className="max-h-[500px] w-full object-contain"
                                            />
                                        </div>
                                    )}

                                    <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                                        <BsClockHistory />
                                        {new Date(
                                            meme.created_at
                                        ).toLocaleString()}
                                    </p>
                                </Link>
                            ))
                        )}

                    </section>
                )}

            </div>
        </main>
    );
};

export default ExplorePage;