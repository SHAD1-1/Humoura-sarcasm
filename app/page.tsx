import LeftSidebar from "./Components/LeftSidebar";
import RightSidebar from "./Components/RightSidebar";
import HomeTimeline from "./Components/HomeTimeline";


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
              Jhakanaka Home
            </h1>

          </header>




          {/* Timeline */}
          <HomeTimeline />


        </main>





        {/* RIGHT SIDEBAR */}
        <RightSidebar />


      </div>


    </div>

  );
};


export default Home;