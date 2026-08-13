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
    icon: TbHomeStats,
  },
  {
    title: "Explore",
    icon: MdOutlineExplore,
  },
  {
    title: "Notifications",
    icon: RiNotificationSnoozeFill,
  },
  {
    title: "Messages",
    icon: LuMessageSquareHeart,
  },
  {
    title: "Saved",
    icon: BsBookmarkHeartFill,
  },
  {
    title: "Profile",
    icon: RiUser5Line,
  },
];

const LeftSidebar = async () => {
  const supabase = await createClient();

  // Get currently logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's profile
  let profile = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", user.id)
      .single();

    profile = data;
  }

  // Get unread notification count
  let unreadNotifications = 0;

  if (user) {
    const { count, error: notificationError } = await supabase
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

  return (
    <aside className="fixed flex h-screen w-64 flex-col py-6">

      {/* Logo */}
      <Link
        href="/"
        className="mb-8 flex items-center gap-3"
      >
        <GiHappySkull className="text-3xl" />

        <span className="text-2xl font-bold">
          Humoura
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={
                item.title === "Home"
                  ? "/"
                  : `/${item.title.toLowerCase()}`
              }
              className={`flex items-center gap-4 rounded-xl px-4 py-3 text-lg transition duration-200 ${item.title === "Home"
                ? "bg-white text-black"
                : "hover:bg-white/10"
                }`}
            >
              <Icon className="text-2xl" />

              <span>{item.title}</span>

              {/* Dynamic notification badge */}
              {item.title === "Notifications" &&
                unreadNotifications > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    {unreadNotifications}
                  </span>
                )}
            </Link>
          );
        })}
      </nav>

      {/* Create Meme Button */}
      <Link
        href="/create"
        className="mt-6 block rounded-full bg-white py-3 text-center font-semibold text-black transition hover:bg-gray-200"
      >
        + Create Sarcasm
      </Link>

      {/* User Profile */}
      <div className="mt-auto rounded-xl p-3 transition hover:bg-white/10">
        <div className="flex items-center gap-3">

          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-semibold">
                {profile?.full_name?.charAt(0).toUpperCase() ||
                  profile?.username?.charAt(0).toUpperCase() ||
                  "U"}
              </span>
            )}
          </div>

          {/* Name + username */}
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {profile?.full_name || "User"}
            </p>

            <p className="truncate text-sm text-white/50">
              {profile?.username
                ? `@${profile.username}`
                : "@username"}
            </p>
          </div>

        </div>
      </div>

    </aside>
  );
};

export default LeftSidebar;