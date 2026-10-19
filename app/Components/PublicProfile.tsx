"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    bio: string | null;
    avatar_url: string | null;
};

type PublicProfileProps = {
    profile: Profile;
    currentUserId: string;
    initialFollowerCount: number;
    initialFollowingCount: number;
    initialFollowing: boolean;
};

export default function PublicProfile({
    profile,
    currentUserId,
    initialFollowerCount,
    initialFollowingCount,
    initialFollowing,
}: PublicProfileProps) {
    const supabase = createClient();

    const [following, setFollowing] =
        useState(initialFollowing);

    const [followerCount, setFollowerCount] =
        useState(initialFollowerCount);

    const [loading, setLoading] =
        useState(false);

    const isOwnProfile =
        currentUserId === profile.id;

    async function handleFollow() {
        if (loading || isOwnProfile) {
            return;
        }

        setLoading(true);

        try {
            // UNFOLLOW
            if (following) {
                const { error } =
                    await supabase
                        .from("follows")
                        .delete()
                        .eq(
                            "follower_id",
                            currentUserId
                        )
                        .eq(
                            "following_id",
                            profile.id
                        );

                if (error) {
                    console.error(
                        "UNFOLLOW ERROR:",
                        error
                    );
                    return;
                }

                setFollowing(false);

                setFollowerCount(
                    (count) =>
                        Math.max(0, count - 1)
                );

                await supabase
                    .from("notifications")
                    .delete()
                    .eq(
                        "recipient_id",
                        profile.id
                    )
                    .eq(
                        "actor_id",
                        currentUserId
                    )
                    .eq(
                        "type",
                        "follow"
                    );

                return;
            }

            // FOLLOW
            const { error } =
                await supabase
                    .from("follows")
                    .insert({
                        follower_id:
                            currentUserId,
                        following_id:
                            profile.id,
                    });

            if (error) {
                console.error(
                    "FOLLOW ERROR:",
                    error
                );
                return;
            }

            setFollowing(true);

            setFollowerCount(
                (count) => count + 1
            );

            // FOLLOW NOTIFICATION
            const {
                error: notificationError,
            } = await supabase
                .from("notifications")
                .insert({
                    recipient_id:
                        profile.id,
                    actor_id:
                        currentUserId,
                    type: "follow",
                    meme_id: null,
                    reply_id: null,
                });

            if (notificationError) {
                console.error(
                    "FOLLOW NOTIFICATION ERROR:",
                    notificationError
                );
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-6">

            {!isOwnProfile && (
                <button
                    type="button"
                    onClick={handleFollow}
                    disabled={loading}
                    className={`rounded-full px-6 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        following
                            ? "border border-white/20 text-white hover:bg-white/10"
                            : "bg-white text-black hover:bg-gray-200"
                    }`}
                >
                    {loading
                        ? "..."
                        : following
                            ? "Following"
                            : "Follow"}
                </button>
            )}

            <div className="mt-5 flex items-center gap-6 text-sm text-white/50">

                <span>
                    <strong className="text-white">
                        {followerCount}
                    </strong>{" "}
                    {followerCount === 1
                        ? "follower"
                        : "followers"}
                </span>

                <span>
                    <strong className="text-white">
                        {initialFollowingCount}
                    </strong>{" "}
                    following
                </span>

            </div>
        </div>
    );
}