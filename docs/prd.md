# PRD — Humoura

Tagline: "Where Humor Meets Connection"

## 1. Feed
**Flow:** user opens feed → sees posts from followed connections, newest first → can like/comment inline.
**Edge cases:** empty feed (no connections yet) → prompt to follow people; deleted/removed post still referenced in someone's comment thread; blocked/removed user's posts must disappear from feed.

## 2. Vines (grid browsing)
**Flow:** user opens Vines → grid of uplifting/humorous content → tap to open in detail view.
**Edge cases:** empty state if no content yet; mixed media (image/video) grid rendering; infinite scroll/pagination.

## 3. Likes & Comments
**Flow:** user likes/comments on a post → count updates in real time for all viewers.
**Edge cases:** rapid double-tap like (idempotency), comment on deleted post, offensive comment caught by positivity filter, comment thread depth limit.

## 4. Positivity Filter
**Flow:** post/comment submitted → checked against positivity/content rules → rejected or flagged if it fails.
**Edge cases:** false positives (need appeal/edit path), borderline sarcasm/humor vs. negativity, filter failure/timeout (fail open vs. fail closed — needs decision, log in decisions.md).

## 5. Direct Messaging
**Flow:** user can only message accounts they follow AND who follow back (or per decided rule — clarify in decisions.md) → opens thread → sends text/video.
**Edge cases:** unfollow mid-conversation (does thread stay open, read-only?), blocked user attempting to message, video upload size/format limits.

## 6. Profiles
**Flow:** user edits profile picture + bio → visible per privacy settings; follows/unfollows other users; views own stats (posts/followers/following).
**Edge cases:** empty bio/no profile picture default state, follow request vs. instant follow (public vs. private profile), follower count for private profiles.

## 7. Settings & Privacy
**Flow:** user adjusts visibility, messaging permissions, post visibility, notification preferences, password.
**Edge cases:** changing profile to private with existing followers/messages already sent, notification opt-out edge cases, password change requiring re-auth.

## 8. Admin Panel
**Flow:** admin logs in → views user list, user stats, platform health.
**Edge cases:** admin permission levels (single admin role vs. tiered — clarify), audit trail for admin actions on user accounts (suspend/delete).

## Open Questions (need client answers — log resolution in decisions.md)
- Exact positivity filter rules/thresholds and fail behavior
- Messaging eligibility: mutual follow required, or one-directional follow enough?
- Admin role granularity
- Content retention/deletion policy
