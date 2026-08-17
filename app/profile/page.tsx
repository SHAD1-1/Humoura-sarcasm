import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
export default async function ProfilePage() {
    const supabase = await createClient();

    // Get logged-in user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // If nobody is logged in
    if (!user) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        You are not logged in
                    </h1>

                    <Link
                        href="/login"
                        className="mt-4 inline-block rounded-lg bg-white px-5 py-2 text-black"
                    >
                        Log in
                    </Link>
                </div>
            </main>
        );
    }

    // Get profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name, bio, avatar_url")
        .eq("id", user.id)
        .single();

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto w-full max-w-2xl border-x border-white/10">

                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-white/50 transition hover:text-white"
                        >
                            ← Home
                        </Link>

                        <h1 className="text-xl font-bold">
                            Profile
                        </h1>
                    </div>
                </header>
                {/* Profile */}
                <section className="px-6 py-8">

                    {/* Avatar */}
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/20 text-3xl font-bold">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            profile?.full_name?.charAt(0).toUpperCase() ||
                            profile?.username?.charAt(0).toUpperCase() ||
                            "U"
                        )}
                    </div>

                    {/* Name */}
                    <div className="mt-5">
                        <h2 className="text-2xl font-bold">
                            {profile?.full_name || "User"}
                        </h2>

                        <p className="text-white/50">
                            @{profile?.username || "username"}
                        </p>
                    </div>

                    {/* Bio */}
                    {profile?.bio && (
                        <p className="mt-4 text-white/80">
                            {profile.bio}
                        </p>
                    )}

                    {/* Email */}
                    <p className="mt-3 text-sm text-white/40">
                        {user.email}
                    </p>

                    {/* Edit Profile */}
                    <Link
                        href="/profile/edit"
                        className="mt-6 inline-block rounded-full border border-white/20 px-5 py-2 font-semibold transition hover:bg-white/10"
                    >
                        Edit Profile
                    </Link>

                </section>
            </div>
        </main>
    );
}