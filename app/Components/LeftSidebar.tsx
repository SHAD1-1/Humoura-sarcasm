import Link from "next/link";
import { MdOutlineExplore } from "react-icons/md";
import { TbHomeStats } from "react-icons/tb";
import { RiNotificationSnoozeFill } from "react-icons/ri";
import { LuMessageSquareHeart } from "react-icons/lu";
import { BsBookmarkHeartFill } from "react-icons/bs";
import { RiUser5Line } from "react-icons/ri";
import { GiHappySkull } from "react-icons/gi";

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
    badge: 3,
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

const LeftSidebar = () => {
  return (
    <aside className="fixed flex h-screen w-64 flex-col border-r border-white/10 bg-black px-6 py-6">

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

              {item.badge && (
                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Create Meme Button Eitay */}
      <button className="mt-6 rounded-full bg-white py-3 font-semibold text-black transition hover:bg-gray-200">
        + Create Sarcasm
      </button>

      {/* User Profile  */}
      <div className="mt-auto rounded-xl p-3 transition hover:bg-white/10">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            S
          </div>

          <div>

            <p className="font-semibold">
              manush name
            </p>

            <p className="text-sm text-white/50">
              @manush ID
            </p>

          </div>

        </div>

      </div>

    </aside>
  );
};

export default LeftSidebar;