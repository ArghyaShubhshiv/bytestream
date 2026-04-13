import { useEffect, useState } from "react";
import { api } from "../lib/api";
import VideoDisplay, { type Video } from "./components/VideoDisplay";
import CodePane from "./components/CodePane";

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 💥 NEW: State to track which video the user is currently watching
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await api.get("/videos/feed");
        if (Array.isArray(response.data)) {
          setVideos(response.data);
          // Set the very first video as active immediately on load
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
        {/* Pass the videos AND the callback function */}
        <VideoDisplay 
          videos={videos} 
          onVideoChange={(video) => setActiveVideo(video)} 
        />
      </div>

      <div className="w-[60%] h-full shadow-2xl z-20">
        {/* 💥 Dynamically pass the active video's data to the CodePane! */}
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

export default App;