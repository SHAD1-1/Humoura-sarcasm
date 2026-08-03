import LeftSidebar from "./Components/LeftSidebar";

const Home = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex max-w-7xl">

        {/* LEFT SIDEBAR */}
        <LeftSidebar />

        {/* MAIN CONTENT */}
        <main className="ml-64 min-h-screen w-full max-w-2xl border-r border-white/10">

          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">
            <h1 className="text-xl font-bold">
              Home
            </h1>
          </header>

          {/* Timeline */}
          <section className="p-6">
            <div className="rounded-2xl border border-white/10 p-6">

              <h2 className="text-lg font-semibold">
                Home timeline
              </h2>

              <p className="mt-2 text-sm text-white/50">
                Your memes will appear here.
              </p>

            </div>
          </section>

        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden w-80 px-6 py-6 lg:block">

          {/* Search */}
          <div className="rounded-full bg-white/10 px-5 py-3 text-sm text-white/50">
            Search Humoura
          </div>

          {/* Trending */}
          <div className="mt-6 rounded-2xl border border-white/10 p-5">

            <h2 className="text-lg font-bold">
              Trending
            </h2>

            <p className="mt-4 text-sm text-white/50">
              Trending memes will appear here.
            </p>

          </div>

        </aside>

      </div>
    </div>
  );
};

export default Home;