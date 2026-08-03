const HomeTimeline = () => {
    return (
        <section>

            <div className="border-b border-white/10 p-6">

                <textarea
                    placeholder="Share your meme idea..."
                    className="h-24 w-full resize-none bg-transparent text-lg outline-none placeholder:text-white/40"
                />

                <div className="mt-4 flex justify-end">

                    <button className="rounded-full bg-white px-6 py-2 font-semibold text-black">
                        Post
                    </button>

                </div>

            </div>



            <article className="border-b border-white/10 p-6">


                <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                        😎
                    </div>


                    <div>

                        <p className="font-semibold">
                            Shadwan
                        </p>


                        <p className="text-sm text-white/40">
                            @shadwan
                        </p>

                    </div>

                </div>



                <p className="mt-4">
                    When your code works on the first try 😂
                </p>



                <div className="mt-4 flex h-72 items-center justify-center rounded-xl bg-white/10">

                    <p className="text-white/40">
                        Meme Image
                    </p>

                </div>



                <div className="mt-4 flex gap-8 text-white/60">

                    <button>
                        ❤️ Like
                    </button>


                    <button>
                        💬 Comment
                    </button>


                    <button>
                        🔖 Save
                    </button>

                </div>


            </article>


        </section>
    );
};


export default HomeTimeline;