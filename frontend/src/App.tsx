import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import VideoDisplay, { type Video } from "./components/VideoDisplay";
import CodePane from "./components/CodePane";
import LandingPage from "./pages/LandingPage";

// Video Page Component
function VideoPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await api.get("/videos/feed");
        if (Array.isArray(response.data)) {
          setVideos(response.data);
          if (response.data.length > 0) setActiveVideo(response.data[0]);
        } else {
          setVideos([]);
        }
      } catch (err) {
        console.error(err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  if (loading) return <h2 className="p-8 text-2xl font-bold text-white bg-neutral-950 h-screen">Loading the ByteStream... 🌊</h2>;

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-neutral-950">
      <div className="w-[40%] h-full border-r border-neutral-800 bg-black">
        <VideoDisplay
          videos={videos}
          onVideoChange={(video) => setActiveVideo(video)}
        />
      </div>
      <div className="w-[60%] h-full shadow-2xl z-20">
        {activeVideo && activeVideo.codePane ? (
          <CodePane
            problemTitle={activeVideo.codePane.problemTitle}
            problemDescription={activeVideo.codePane.problemDescription}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] text-[#d4d4d4]">
            No coding problem attached to this video.
          </div>
        )}
      </div>
    </div>
  );
}

// Router setup
const rootRoute = createRootRoute()

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
})

const videoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/feed',
  component: VideoPage,
})

const routeTree = rootRoute.addChildren([landingRoute, videoRoute])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  return <RouterProvider router={router} />
}

export default App;