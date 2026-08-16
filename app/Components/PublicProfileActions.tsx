"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PublicProfileActionsProps = {
    profileId: string;
    currentUserId: string;
    initialFollowerCount: number;
    initialFollowingCount: number;
    initialFollowing: boolean;
};

export default function PublicProfileActions({
    profileId,
    currentUserId,
    initialFollowerCount,
    initialFollowingCount,
    initialFollowing,
}: PublicProfileActionsProps) {
    const supabase = createClient();

    const [following, setFollowing] =
        useState(initialFollowing);

    const [followerCount, setFollowerCount] =
        useState(initialFollowerCount);

    const [loading, setLoading] =
        useState(false);

    const isOwnProfile =
        profileId === currentUserId;

    async function handleFollow() {
        if (loading || isOwnProfile) {
            return;
        }

        setLoading(true);

        try {
            // ========================================
            // UNFOLLOW
            // ========================================

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
                            profileId
                        );

                if (error) {
                    console.error(
                        "UNFOLLOW ERROR:",
                        {
                            message:
                                error.message,
                            details:
                                error.details,
                            hint:
                                error.hint,
                            code:
                                error.code,
                        }
                    );

                    return;
                }

                setFollowing(false);

                setFollowerCount(
                    (count) =>
                        Math.max(
                            0,
                            count - 1
                        )
                );

                // Remove follow notification
                const {
                    error:
                    notificationDeleteError,
                } = await supabase
                    .from(
                        "notifications"
                    )
                    .delete()
                    .eq(
                        "recipient_id",
                        profileId
                    )
                    .eq(
                        "actor_id",
                        currentUserId
                    )
                    .eq(
                        "type",
                        "follow"
                    );

                if (
                    notificationDeleteError
                ) {
                    console.error(
                        "FOLLOW NOTIFICATION DELETE ERROR:",
                        notificationDeleteError
                    );
                }

                return;
            }

            // ========================================
            // FOLLOW
            // ========================================

            const { error } =
                await supabase
                    .from("follows")
                    .insert({
                        follower_id:
                            currentUserId,
                        following_id:
                            profileId,
                    });

            if (error) {
                console.error(
                    "FOLLOW ERROR:",
                    {
                        message:
                            error.message,
                        details:
                            error.details,
                        hint:
                            error.hint,
                        code:
                            error.code,
                    }
                );

                return;
            }

            setFollowing(true);

            setFollowerCount(
                (count) => count + 1
            );

            // ========================================
            // FOLLOW NOTIFICATION
            // ========================================

            const {
                error:
                notificationError,
            } = await supabase
                .from(
                    "notifications"
                )
                .insert({
                    recipient_id:
                        profileId,
                    actor_id:
                        currentUserId,
                    type: "follow",
                    meme_id: null,
                    reply_id: null,
                });

            if (
                notificationError
            ) {
                console.error(
                    "FOLLOW NOTIFICATION ERROR:",
                    {
                        message:
                            notificationError.message,
                        details:
                            notificationError.details,
                        hint:
                            notificationError.hint,
                        code:
                            notificationError.code,
                    }
                );
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-6">

            {/* FOLLOW BUTTON */}

            {!isOwnProfile && (
                <button
                    type="button"
                    onClick={handleFollow}
                    disabled={loading}
                    className={`rounded-full px-6 py-2 font-semibold transition ${following
                            ? "border border-white/20 text-white hover:bg-white/10"
                            : "bg-white text-black hover:bg-gray-200"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                    {loading
                        ? "..."
                        : following
                            ? "Following"
                            : "Follow"}
                </button>
            )}

            {/* COUNTS */}

            <div className="mt-5 flex items-center gap-6 text-sm text-white/50">

                <span>
                    <strong className="text-white">
                        {followerCount}
                    </strong>{" "}
                    {followerCount ===
                        1
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