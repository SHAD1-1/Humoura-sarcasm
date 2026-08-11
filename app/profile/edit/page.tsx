"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditProfilePage() {
    const router = useRouter();
    const supabase = createClient();

    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");

    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function loadProfile() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("username, full_name, bio, avatar_url")
                .eq("id", user.id)
                .single();

            if (error) {
                setMessage(error.message);
            } else if (profile) {
                setUsername(profile.username || "");
                setFullName(profile.full_name || "");
                setBio(profile.bio || "");
                setAvatarUrl(profile.avatar_url || "");
            }

            setLoading(false);
        }

        loadProfile();
    }, [router]);

    async function handleSave(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setSaving(true);
        setMessage("");

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setMessage("You must be logged in.");
            setSaving(false);
            return;
        }

        let newAvatarUrl = avatarUrl;

        // Upload avatar if a new image was selected
        if (avatarFile) {
            const fileExtension = avatarFile.name.split(".").pop();
            const filePath = `${user.id}/avatar.${fileExtension}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, avatarFile, {
                    upsert: true,
                });

            if (uploadError) {
                setMessage(uploadError.message);
                setSaving(false);
                return;
            }

            const { data } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            newAvatarUrl = data.publicUrl;
        }

        // Update profile
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                username: username.trim(),
                full_name: fullName.trim(),
                bio: bio.trim(),
                avatar_url: newAvatarUrl,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (updateError) {
            setMessage(updateError.message);
            setSaving(false);
            return;
        }

        router.push("/profile");
        router.refresh();
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <p>Loading profile...</p>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
            <form
                onSubmit={handleSave}
                className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-white/10 bg-white/5 p-6"
            >
                <div>
                    <h1 className="text-2xl font-bold">
                        Edit Profile
                    </h1>

                    <p className="mt-1 text-sm text-white/50">
                        Update your Humoura profile.
                    </p>
                </div>

                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/20 text-2xl font-bold">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            username.charAt(0).toUpperCase() || "U"
                        )}
                    </div>

                    <label className="cursor-pointer rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
                        Change profile picture

                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                                setAvatarFile(e.target.files?.[0] || null);
                            }}
                        />
                    </label>

                    {avatarFile && (
                        <p className="text-xs text-white/50">
                            Selected: {avatarFile.name}
                        </p>
                    )}
                </div>

                {/* Username */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                        Username
                    </label>

                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        minLength={3}
                        className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 outline-none"
                    />
                </div>

                {/* Full Name */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                        Full name
                    </label>

                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 outline-none"
                    />
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                        Bio
                    </label>

                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="resize-none rounded-lg border border-white/10 bg-white/10 px-3 py-2 outline-none"
                    />
                </div>

                {message && (
                    <p className="text-sm text-red-400">
                        {message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-white px-4 py-2 font-semibold text-black disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save changes"}
                </button>
            </form>
        </main>
    );
}