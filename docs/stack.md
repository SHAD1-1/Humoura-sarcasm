# Stack — Humoura

Status: mostly TBD. Only what's confirmed by the live deployment is locked; everything else needs a decision (log each one in decisions.md when made).

## Confirmed
- **Hosting/deployment:** Vercel (live at humoura.vercel.app)

## To Be Decided
- Frontend framework (Vercel deployment implies Next.js/React as likely default — confirm before locking)
- Backend / API layer
- Database (needs to support: users, posts, comments, likes, follows, messages, video attachments, notifications, settings)
- Real-time layer (for live like/comment counts and instant messaging)
- Auth provider
- Media/video storage (uploads for posts, profile pictures, DM video sharing)
- Positivity filter implementation (in-house rules vs. third-party moderation API)
- Admin panel access control

## Notes
- Do not assume libraries/services beyond what's confirmed above — update this file the moment a decision is locked, and record the reasoning in decisions.md.
