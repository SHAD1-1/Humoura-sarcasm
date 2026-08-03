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
  },
  {
    title: "Messages",
    icon: LuMessageSquareHeart,
  },
  {
    title: "Bookmarks",
    icon: BsBookmarkHeartFill,
  },
  {
    title: "Profile",
    icon: RiUser5Line,
  },
];

const LeftSidebar = () => {
  return (
    <aside className="fixed h-screen w-64 border-r border-white/10 px-4 py-6">
      {/* Logo */}
      <Link
        href="/"
        className="mb-8 flex items-center gap-3 px-3"
      >
        <GiHappySkull className="text-3xl" />

        <span className="text-xl font-bold">
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
              href={`/${item.title.toLowerCase()}`}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-lg transition duration-200 hover:bg-white/10"
            >
              <Icon className="text-2xl" />

              <span>
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default LeftSidebar;
