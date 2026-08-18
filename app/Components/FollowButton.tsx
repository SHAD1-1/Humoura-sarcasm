"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FollowButtonProps = {
    targetUserId: string;
};

export default function FollowButton({
    targetUserId,
}: FollowButtonProps) {
    const supabase = createClient();

    const [following, setFollowing] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [checking, setChecking] =
        useState(true);

    useEffect(() => {
        async function checkFollowing() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setChecking(false);
                return;
            }

            const {
                data,
                error,
            } = await supabase
                .from("follows")
                .select("follower_id")
                .eq(
                    "follower_id",
                    user.id
                )
                .eq(
                    "following_id",
                    targetUserId
                )
                .maybeSingle();

            if (error) {
                console.error(
                    "CHECK FOLLOW ERROR:",
                    error
                );
            }

            setFollowing(!!data);
            setChecking(false);
        }

        checkFollowing();
    }, [targetUserId]);

    async function handleFollow() {
        if (
            loading ||
            checking
        ) {
            return;
        }

        setLoading(true);

        try {
            const {
                data: { user },
                error: userError,
            } =
                await supabase.auth.getUser();

            if (userError) {
                console.error(
                    "FOLLOW USER ERROR:",
                    userError
                );
                return;
            }

            if (!user) {
                return;
            }

            if (
                user.id ===
                targetUserId
            ) {
                return;
            }

            // ========================================
            // UNFOLLOW
            // ========================================

            if (following) {
                const {
                    error,
                } = await supabase
                    .from("follows")
                    .delete()
                    .eq(
                        "follower_id",
                        user.id
                    )
                    .eq(
                        "following_id",
                        targetUserId
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

                // Remove old follow notification
                const {
                    error:
                    notificationDeleteError,
                } =
                    await supabase
                        .from(
                            "notifications"
                        )
                        .delete()
                        .eq(
                            "recipient_id",
                            targetUserId
                        )
                        .eq(
                            "actor_id",
                            user.id
                        )
                        .eq(
                            "type",
                            "follow"
                        );

                if (
                    notificationDeleteError
                ) {
                    console.error(
                        "DELETE FOLLOW NOTIFICATION ERROR:",
                        notificationDeleteError
                    );
                }

                return;
            }

            // ========================================
            // FOLLOW
            // ========================================

            const {
                error,
            } = await supabase
                .from("follows")
                .insert({
                    follower_id:
                        user.id,
                    following_id:
                        targetUserId,
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

            // ========================================
            // NOTIFICATION
            // ========================================

            const {
                error:
                notificationError,
            } =
                await supabase
                    .from(
                        "notifications"
                    )
                    .insert({
                        recipient_id:
                            targetUserId,
                        actor_id:
                            user.id,
                        type: "follow",
                        meme_id: null,
                        reply_id: null,
                    });

            if (
                notificationError
            ) {
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
        <button
            type="button"
            onClick={
                handleFollow
            }
            disabled={
                loading ||
                checking
            }
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${following
                    ? "border border-white/20 text-white hover:bg-white/10"
                    : "bg-white text-black hover:bg-gray-200"
                } disabled:cursor-not-allowed disabled:opacity-50`}
        >
            {checking
                ? "..."
                : loading
                    ? "..."
                    : following
                        ? "Following"
                        : "Follow"}
        </button>
    );
}