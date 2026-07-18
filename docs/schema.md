# Schema — Humoura

Status: draft, derived from PRD features. Confirm field-level details and finalize DB choice (see stack.md) before implementing.

## Entities

**User**
- id, username, email, password_hash
- profile_picture_url, bio
- is_private (profile visibility)
- created_at

**Follow**
- id, follower_id → User, following_id → User
- created_at
- Access rule: messaging eligibility depends on this relationship (see prd.md open question on mutual vs. one-directional)

**Post**
- id, author_id → User, media_url (image/video), caption
- moderation_status (pending/approved/rejected — from positivity filter)
- created_at
- Access rule: visible in feed only to followers of author; visibility also gated by author's is_private and post-level visibility setting

**Comment**
- id, post_id → Post, author_id → User, body
- moderation_status
- created_at
- Access rule: same visibility as parent post

**Like**
- id, post_id → Post, user_id → User, created_at
- Unique constraint on (post_id, user_id) to prevent duplicate likes

**Message**
- id, thread_id, sender_id → User, recipient_id → User
- body, video_url (nullable)
- created_at, read_at
- Access rule: only permitted between users meeting follow eligibility rule (see prd.md); enforce at write-time, not just UI

**MessageThread**
- id, participant_ids (2 users), created_at

**NotificationPreference**
- id, user_id → User, likes_enabled, comments_enabled, follows_enabled, messages_enabled

**AdminAction** (audit log)
- id, admin_id → User, target_user_id → User, action_type, created_at

## Access Rules Summary
- Posts/comments: visibility filtered by author privacy + follow relationship
- Messaging: write blocked unless follow-eligibility rule is met (decide + log in decisions.md)
- Admin endpoints: restricted to users with admin role
- All moderated content (posts/comments) must pass positivity filter before becoming visible to others

## Open Questions
- Single admin role or tiered permissions?
- Does unfollowing close an existing message thread, or leave it read-only?
- Is a private profile's follower/following list visible to non-followers?
