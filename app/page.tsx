import LeftSidebar from "./Components/LeftSidebar";
import RightSidebar from "./Components/RightSidebar";
import HomeTimeline from "./Components/HomeTimeline";
import AuthScreen from "./Components/AuthScreen";
import { createClient } from "@/lib/supabase/server";

function Home() {
  return (
    <div className="min-h-screen bg-black text-white">

      <div className="mx-auto flex min-h-screen max-w-7xl">

        {/* LEFT SIDEBAR */}

        <aside className="hidden lg:block">
          <LeftSidebar />
        </aside>

        {/* MAIN CONTENT */}

        <main className="min-h-screen w-full border-x border-white/10 lg:ml-64 lg:max-w-2xl">

          {/* HEADER */}

          <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 px-4 py-4 backdrop-blur-xl sm:px-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/30">
                  Humoura
                </p>

                <h1 className="text-xl font-bold">
                  Home
                </h1>
              </div>

              {/* Mobile create button */}

              <a
                href="/create"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200 lg:hidden"
              >
                + Post
              </a>

            </div>

          </header>

          {/* TIMELINE */}

          <HomeTimeline />

        </main>

        {/* RIGHT SIDEBAR */}

        <RightSidebar />

      </div>

      {/* MOBILE NAV */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 px-2 py-2 backdrop-blur-xl lg:hidden">

        <div className="mx-auto flex max-w-md items-center justify-around">

          <a
            href="/"
            className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-white"
          >
            <span className="text-lg">
              🏠
            </span>
            Home
          </a>

          <a
            href="/explore"
            className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-white/50 transition hover:text-white"
          >
            <span className="text-lg">
              🔍
            </span>
            Explore
          </a>

          <a
            href="/notifications"
            className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-white/50 transition hover:text-white"
          >
            <span className="text-lg">
              🔔
            </span>
            Alerts
          </a>

          <a
            href="/messages"
            className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-white/50 transition hover:text-white"
          >
            <span className="text-lg">
              💬
            </span>
            Messages
          </a>

          <a
            href="/profile"
            className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-white/50 transition hover:text-white"
          >
            <span className="text-lg">
              👤
            </span>
            Profile
          </a>

        </div>

      </nav>

    </div>
  );
}

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AuthScreen />;
  }

  return <Home />;
}