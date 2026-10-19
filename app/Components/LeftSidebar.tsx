import Link from "next/link";

import { MdOutlineExplore } from "react-icons/md";
import { TbHomeStats } from "react-icons/tb";
import { RiNotificationSnoozeFill } from "react-icons/ri";
import { LuMessageSquareHeart } from "react-icons/lu";
import { BsBookmarkHeartFill } from "react-icons/bs";
import { RiUser5Line } from "react-icons/ri";
import { GiHappySkull } from "react-icons/gi";

import { createClient } from "@/lib/supabase/server";

const NAVIGATION_ITEMS = [
  {
    title: "Home",
    href: "/",
    icon: TbHomeStats,
  },
  {
    title: "Explore",
    href: "/explore",
    icon: MdOutlineExplore,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: RiNotificationSnoozeFill,
  },
  {
    title: "Messages",
    href: "/messages",
    icon: LuMessageSquareHeart,
  },
  {
    title: "Saved",
    href: "/saved",
    icon: BsBookmarkHeartFill,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: RiUser5Line,
  },
];

const LeftSidebar = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    profile = profileData;
  }

  let unreadNotifications = 0;

  if (user) {
    const {
      count,
      error: notificationError,
    } = await supabase
      .from("notifications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("recipient_id", user.id)
      .eq("read", false);

    if (notificationError) {
      console.error(
        "NOTIFICATION COUNT ERROR:",
        notificationError
      );
    } else {
      unreadNotifications = count || 0;
    }
  }

  function renderMobileLink(
    item: (typeof NAVIGATION_ITEMS)[number]
  ) {
    const Icon = item.icon;
    const isActive = item.title === "Home";

    return (
      <Link
        key={item.title}
        href={item.href}
        title={item.title}
        aria-label={item.title}
        className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 text-[9px] font-medium transition ${isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
      >
        <span className="relative flex h-6 items-center justify-center">
          <Icon className="text-xl" />

          {item.title === "Notifications" &&
            unreadNotifications > 0 && (
              <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-bold text-primary-foreground">
                {unreadNotifications > 99
                  ? "99+"
                  : unreadNotifications}
              </span>
            )}
        </span>

        <span className="w-full truncate text-center">
          {item.title}
        </span>
      </Link>
    );
  }

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border bg-background/85 px-4 py-5 backdrop-blur-xl transition-colors duration-300 lg:flex">
        {/* LOGO */}
        <Link
          href="/"
          className="group mb-8 flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-accent"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:rotate-3">
            <GiHappySkull className="text-2xl" />
          </div>

          <div>
            <p className="text-xl font-bold tracking-tight text-foreground">
              Humoura
            </p>

            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Why so serious?
            </p>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="flex flex-col gap-1.5">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.title === "Home";

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium transition-all duration-200 ${isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                <Icon className="text-[22px] transition-transform duration-200 group-hover:scale-110" />

                <span>{item.title}</span>

                {item.title === "Notifications" &&
                  unreadNotifications > 0 && (
                    <span className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {unreadNotifications}
                    </span>
                  )}
              </Link>
            );
          })}
        </nav>

        {/* DESKTOP CREATE BUTTON */}
        <Link
          href="/create"
          className="group relative mt-7 block w-full overflow-hidden rounded-full p-[1.5px] shadow-lg shadow-primary/10 transition hover:shadow-primary/25"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-primary to-amber-400" />

          <span className="relative flex items-center justify-center gap-2 rounded-full bg-background px-5 py-3 font-bold text-foreground transition duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
            <span className="text-lg transition-transform duration-300 group-hover:rotate-12">
              +
            </span>
            Create Sarcasm
          </span>
        </Link>

        {/* DESKTOP USER PROFILE */}
        <Link
          href="/profile"
          className="group mt-auto rounded-2xl border border-border bg-card/60 p-3 transition hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold text-muted-foreground ring-2 ring-border">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                profile?.full_name
                  ?.charAt(0)
                  .toUpperCase() ||
                profile?.username
                  ?.charAt(0)
                  .toUpperCase() ||
                "U"
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {profile?.full_name || "User"}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {profile?.username
                  ? `@${profile.username}`
                  : "@username"}
              </p>
            </div>

            <span className="ml-auto text-muted-foreground transition group-hover:text-foreground">
              →
            </span>
          </div>
        </Link>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-7 items-center gap-0 border-t border-border bg-background/95 px-1 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden"
      >
        {NAVIGATION_ITEMS.slice(0, 2).map(renderMobileLink)}

        {/* MOBILE CREATE BUTTON */}
        <Link
          href="/create"
          title="Create Sarcasm"
          aria-label="Create Sarcasm"
          className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl bg-primary/10 px-0.5 py-1.5 text-[9px] font-bold text-primary transition hover:bg-primary/20"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xl leading-none text-primary-foreground">
            +
          </span>

          <span className="w-full truncate text-center">
            Create
          </span>
        </Link>

        {NAVIGATION_ITEMS.slice(2).map(renderMobileLink)}
      </nav>
    </>
  );
};

export default LeftSidebar;