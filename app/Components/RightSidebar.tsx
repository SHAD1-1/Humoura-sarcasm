const RightSidebar = () => {
    return (
        <aside className="hidden w-80 px-6 py-6 lg:block">

            {/* Search */}
            <div className="rounded-full bg-white/10 px-5 py-3 text-sm text-white/50">
                Search Sarcasm..
            </div>


            {/* Trending */}
            <div className="mt-6 rounded-2xl border border-white/10 p-5">

                <h2 className="text-lg font-bold">
                    Trending
                </h2>


                <div className="mt-4 space-y-4">

                    <div>
                        <p className="font-semibold">
                            #ProgrammingMemes
                        </p>

                        <p className="text-sm text-white/40">
                            2.4K memes
                        </p>
                    </div>


                    <div>
                        <p className="font-semibold">
                            #CollegeLife
                        </p>

                        <p className="text-sm text-white/40">
                            1.8K memes
                        </p>
                    </div>


                    <div>
                        <p className="font-semibold">
                            #Gaming
                        </p>

                        <p className="text-sm text-white/40">
                            950 memes
                        </p>
                    </div>

                </div>

            </div>



            {/* Suggested Users */}
            <div className="mt-6 rounded-2xl border border-white/10 p-5">

                <h2 className="text-lg font-bold">
                    Who to follow
                </h2>


                <div className="mt-5 space-y-5">


                    <div className="flex items-center justify-between">

                        <div>
                            <p className="font-semibold">
                                MemeMaster
                            </p>

                            <p className="text-sm text-white/40">
                                @mememaster
                            </p>
                        </div>


                        <button className="rounded-full bg-white px-4 py-1 text-sm font-semibold text-black">
                            Follow
                        </button>

                    </div>




                    <div className="flex items-center justify-between">

                        <div>
                            <p className="font-semibold">
                                CodeMemes
                            </p>

                            <p className="text-sm text-white/40">
                                @codememes
                            </p>
                        </div>


                        <button className="rounded-full bg-white px-4 py-1 text-sm font-semibold text-black">
                            Follow
                        </button>

                    </div>


                </div>

            </div>


        </aside>
    );
};


export default RightSidebar;