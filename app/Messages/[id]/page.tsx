import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
                    href="/login"
                    className="rounded-full bg-white px-5 py-2 text-black"
                >
                    Log in
                </Link>
            </main>
        );
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select(
            "id, username, full_name, avatar_url"
        )
        .eq("id", id)
        .maybeSingle();

    if (!profile) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        User not found
                    </h1>

                    <Link
                        href="/messages"
                        className="mt-4 inline-block text-white/50"
                    >
                        ← Messages
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto min-h-screen w-full max-w-2xl border-x border-white/10">

                <header className="border-b border-white/10 px-6 py-4">
                    <Link
                        href="/messages"
                        className="text-white/50 hover:text-white"
                    >
                        ← Messages
                    </Link>

                    <div className="mt-4 flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/20 font-bold">
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

                        <div>
                            <p className="font-semibold">
                                {profile.full_name ||
                                    "User"}
                            </p>

                            <p className="text-sm text-white/40">
                                @
                                {profile.username ||
                                    "username"}
                            </p>
                        </div>

                    </div>
                </header>

                <div className="flex min-h-[70vh] items-center justify-center px-6 text-center text-white/40">
                    Conversation with{" "}
                    {profile.full_name ||
                        profile.username ||
                        "User"}
                </div>

            </div>
        </main>
    );
}