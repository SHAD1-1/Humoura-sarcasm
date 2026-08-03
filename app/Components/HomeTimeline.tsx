const HomeTimeline = () => {
    return (
        <main className="flex min-h-screen w-full flex-col border-l border-r border-white/10">





            {/* Create Meme */}
            <div className="flex gap-3 border-b border-white/10 p-6">

                {/* Avatar */}
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                    😎
                </div>


                <div className="flex-1">

                    <textarea
                        placeholder="What's your meme today?"
                        className="h-24 w-full resize-none bg-transparent text-lg outline-none placeholder:text-white/40"
                    />

                    <div className="mt-4 flex justify-end">

                        <button className="rounded-full bg-white px-6 py-2 font-semibold text-black">
                            Post Meme
                        </button>

                    </div>

                </div>

            </div>



            {/* Feed */}

            <div>

                {Array.from({ length: 10 }).map((_, i) => (

                    <article
                        key={i}
                        className="border-b border-white/10 p-6"
                    >

                        {/* User */}
                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
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


                        {/* Caption */}
                        <p className="mt-4">
                            This is my meme caption 😂
                        </p>


                        {/* Image */}
                        <div className="mt-4 flex h-80 items-center justify-center rounded-xl bg-white/10">

                            Meme Image

                        </div>


                        {/* Actions */}
                        <div className="mt-4 flex justify-between text-white/60">

                            <button>❤️ Like</button>

                            <button>💬 Comment</button>

                            <button>🔖 Save</button>

                            <button>↗ Share</button>

                        </div>

                    </article>

                ))}

            </div>

        </main>
    );
};

export default HomeTimeline;