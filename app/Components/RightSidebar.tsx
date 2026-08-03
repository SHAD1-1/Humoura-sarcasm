import { BsSearch } from "react-icons/bs";

const RightSidebar = () => {
    return (
        <aside className="hidden w-80 px-6 py-6 lg:block">

            {/* Search */}
            <div className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-3">
                <BsSearch className="text-white/50" />
                <input
                    type="text"
                    placeholder="Search Humoura..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/50"
                />
            </div>

            {/* Trending */}
            <div className="mt-6 rounded-2xl border border-white/10 p-5">

                <h2 className="text-lg font-bold">
                    What's happening
                </h2>

                <div className="mt-5 space-y-5">

                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="cursor-pointer transition hover:text-white"
                        >
                            <p className="font-semibold">
                                #Trending{i + 1}
                            </p>

                            <p className="text-sm text-white/40">
                                {35 + i}.4K memes
                            </p>
                        </div>
                    ))}

                </div>

            </div>

            {/* Who to Follow */}
            <div className="mt-6 rounded-2xl border border-white/10 p-5">

                <h2 className="text-lg font-bold">
                    Who to follow
                </h2>

                <div className="mt-5 space-y-5">

                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between"
                        >

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                                    👤
                                </div>

                                <div>

                                    <p className="font-semibold">
                                        User {i + 1}
                                    </p>

                                    <p className="text-sm text-white/40">
                                        @user{i + 1}
                                    </p>

                                </div>

                            </div>

                            <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-gray-200">
                                Follow
                            </button>

                        </div>
                    ))}

                </div>

            </div>

        </aside>
    );
};

export default RightSidebar;