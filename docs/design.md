# Design — Humoura

Design system extracted from the interactive prototype at
`design/Humoura App.dc.html` (open in a browser to click through all screens).
Colors are authored in `oklch()`. This is the visual source of truth until the
client provides updated brand assets.

## Brand

- Name: Humoura
- Tagline: "Where Humor Meets Connection"
- Tone: warm, positive, playful, community-focused (humor and kindness)

## Look and feel

Warm, soft, editorial. A single rounded "app canvas" floats on a peach-to-rose
gradient page. Generous rounding, soft shadows, pastel-tinted cards, near-black
warm buttons, and a coral accent. Emoji are used as nav/section icons.

## Colors

Neutrals / surfaces
- Page background (behind canvas): warm cream `#f4efe9`
- Page gradient: `linear-gradient(135deg, oklch(0.86 0.05 55), oklch(0.82 0.06 30) 45%, oklch(0.8 0.05 340))`
- App canvas: `#fdfbf9` (warm off-white)
- Avatar placeholder fill: `#e8ddd2`

Brand / interactive
- Primary (buttons, active nav, sent-message bubble): `oklch(0.22 0.02 40)` — near-black warm
- Accent (badges, links, toggles, active tab underline): `oklch(0.62 0.19 35)` — coral
  - Link default `oklch(0.6 0.15 35)`, hover `oklch(0.52 0.17 35)`
- Neutral chip / secondary button: `oklch(0.94 0.02 60)` with text `oklch(0.3 0.02 40)`

Text
- Primary / headings: `oklch(0.25 0.02 40)` (bold headings often `0.22`)
- Secondary / muted: `oklch(0.5 0.02 40)`
- Body copy: `oklch(0.3 0.02 40)`

Status
- Active / success: `oklch(0.55 0.14 145)` (green)
- Suspended / warning / flagged: `oklch(0.6 0.12 30)` / `oklch(0.4 0.12 30)`

Card tints (pastel, low chroma) and media accents cycle these hues:
- Blue `250`, orange `30`, yellow/amber `75`, pink/magenta `340`, green `145`, violet `320`
- e.g. blue post card `oklch(0.95 0.025 250)`, amber post card `oklch(0.96 0.03 75)`
- Avatar ring: `conic-gradient(from 90deg, oklch(0.7 0.18 30), oklch(0.75 0.15 90), oklch(0.68 0.16 340), oklch(0.7 0.18 30))`

Media placeholders in the prototype are 45° `repeating-linear-gradient` stripes;
in production these are real images/videos.

## Typography

- Prototype font: Arial / Helvetica, sans-serif. The Next.js app ships Geist /
  Geist Mono — use Geist Sans as the production sans equivalent.
- Scale (px): page/section title 24 (weight 800); card/section heading 15-16 (700);
  name label 14 (700); body 13-14 (line-height ~1.55); meta/caption 11-12 (muted).

## Layout

- Centered app canvas: fixed width `1180px`, padding `32px`, radius `28px`,
  shadow `0 30px 60px -20px rgba(60,30,10,0.25)`.
- Two-column shell: left sidebar `250px` + main content, gap `28px`.
- Feed uses a further split: main column `1fr` + right rail `250px`, gap `24px`.
- The prototype is fixed-width/desktop only; responsive behavior is not yet
  specified.

## Components

Sidebar nav
- Vertical list: Feed, Vines, Messages, Friends, Profile, Settings (Admin exists
  as a screen but is not linked in the default nav).
- Item: `padding:12px 16px`, radius `14px`, font 14. Active item = primary bg
  `oklch(0.22 0.02 40)` + white text + weight 700; inactive = text `oklch(0.3 0.02 40)`.
- Badges (unread/count): coral pill for alerts (`oklch(0.62 0.19 35)`, white text),
  neutral pill for counts (`oklch(0.92 0.02 60)`).
- Profile header at top: gradient avatar ring, name (700), @handle (muted).

Buttons
- Primary: bg `oklch(0.22 0.02 40)`, white text, weight 700, radius 10-12px,
  padding ~`8px 22px`. Used for Send, Follow, Edit Profile.
- Secondary: bg `oklch(0.94 0.02 60)`, dark text. Used for Message, filter chips.

Cards
- Post cards: tinted bg, radius `20px`, padding `20px 22px`, gap `14px`. Header
  (avatar 42px + name/time), body text, optional media grid, action row
  (`views`, `Like` in coral, `Comment`).
- Composer: cream bg with border, inline avatar + placeholder input
  ("Share something positive..."), attachment row + primary Send.
- Friend/list cards: white bg, `1px` border `oklch(0.9 0.02 60)`, radius `16px`.

Chips / pills / tabs
- Filter chips (Vines): active = primary pill, inactive = neutral pill, radius `20px`.
- Tabs (Feed sort, Friends followers/following): text row; active is weight 700
  with a `2px` coral underline.

Forms
- Toggle switch: track `42x24` radius 20; ON = coral track with white knob.
- Select-style control: neutral chip with a caret.
- Text inputs: white bg, `1px` border `oklch(0.9 0.02 60)`, radius `12px`, font 13.

Messages
- Two-pane: `220px` conversation list + thread pane, inside a bordered `520px`
  container radius `20px`.
- Bubbles: incoming = white with border, radius `16px 16px 16px 4px`; outgoing =
  primary dark bg, white text, radius `16px 16px 4px 16px`; `max-width:70%`.

Profile
- Gradient cover banner (150px, radius 20), avatar overlapping by `-44px` with a
  `4px #fdfbf9` border, stats row (Posts / Followers / Following), 3-col media grid.

Admin
- KPI stat cards (Total users, Posts today, Flagged content — flagged uses the
  warning tint), then a bordered user table (User / Joined / Status / Action)
  with Active/Suspended status dots and Suspend/Restore actions.

## Radii and spacing tokens (observed)

- Radii: `28` (canvas), `20` (cards/panels), `16`, `14` (nav/media), `12`/`10` (buttons/inputs), `20`+ (pills), `50%` (avatars).
- Gaps: `28` (shell), `24` (columns), `18-20` (stacked cards), `12-14` (within cards).

## Reference material

- Prototype: `design/Humoura App.dc.html` (static DesignCode `.dc.html` with a
  small state script for nav switching)
- Live demo: https://humoura.vercel.app/

## Notes

- The prototype is a design reference, not production code — rebuild these screens
  in the Next.js app using Tailwind, mapping the oklch values above to theme tokens.
- Update this file if the client provides an official brand kit (logo, final
  palette, typography); log the change in `docs/decisions.md`.
