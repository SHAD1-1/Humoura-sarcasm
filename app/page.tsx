import AuthScreen from "./Components/AuthScreen";
import HomeTimeline from "./Components/HomeTimeline";
import LeftSidebar from "./Components/LeftSidebar";
import RightSidebar from "./Components/RightSidebar";
import ThemeToggle from "./Components/ThemeToggle";
import { createClient } from "@/lib/supabase/server";

function Home() {
    return (
        <div className="humoura-glow min-h-screen bg-background text-foreground transition-colors duration-300">

            <div className="mx-auto flex min-h-screen max-w-7xl">

                {/* LEFT SIDEBAR */}

                <aside className="hidden lg:block">
                    <LeftSidebar />
                </aside>

                {/* MAIN */}

                <main className="min-h-screen w-full border-x border-border lg:ml-64 lg:max-w-2xl">

                    {/* HEADER */}

                    <header className="sticky top-0 z-40 border-b border-border bg-background/85 px-4 py-4 backdrop-blur-xl sm:px-6">

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
                                    Humoura
                                </p>

                                <h1 className="mt-1 text-xl font-bold tracking-tight">
                                    Home
                                </h1>
                            </div>

                            <div className="ml-auto">
                                <ThemeToggle />
                            </div>

                            <a
                                href="/create"
                                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 sm:hidden"
                            >
                                + Post
                            </a>
                        </div>

                    </header>

                    <HomeTimeline />

                </main>

                {/* RIGHT SIDEBAR */}

                <RightSidebar />

            </div>

            {/* MOBILE NAVIGATION */}

            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl lg:hidden">

                <div className="mx-auto flex max-w-md items-center justify-around">

                    <a
                        href="/"
                        className="flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-foreground"
                    >
                        <span className="text-lg">
                            ⌂
                        </span>
                        Home
                    </a>

                    <a
                        href="/explore"
                        className="flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
                    >
                        <span className="text-lg">
                            ⌕
                        </span>
                        Explore
                    </a>

                    <a
                        href="/notifications"
                        className="flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
                    >
                        <span className="text-lg">
                            ◉
                        </span>
                        Alerts
                    </a>

                    <a
                        href="/messages"
                        className="flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
                    >
                        <span className="text-lg">
                            ✉
                        </span>
                        Messages
                    </a>

                    <a
                        href="/profile"
                        className="flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
                    >
                        <span className="text-lg">
                            ○
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