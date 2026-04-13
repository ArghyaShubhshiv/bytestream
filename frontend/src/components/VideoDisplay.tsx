import { useEffect, useRef } from "react";

// 1. 💥 UPDATE INTERFACE: Add the codePane object
export interface Video {
  id: number;
  videoTitle: string;
  videoUrl: string | null;
  creator: { username: string };
  codePane: {
    problemTitle: string;
    problemDescription: string;
  };
}

interface VideoDisplayProps {
  videos: Video[];
  onVideoChange: (video: Video) => void; // 💥 NEW: Callback to tell App.tsx when we scroll
}

export default function VideoDisplay({ videos, onVideoChange }: VideoDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 2. 💥 THE TRIPWIRE: Intersection Observer
  useEffect(() => {
    const options = {
      root: containerRef.current,
      threshold: 0.6, // Triggers when 60% of the video is visible on screen
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Find the exact video ID that just snapped into view
          const activeId = Number(entry.target.getAttribute("data-video-id"));
          const activeVideo = videos.find((v) => v.id === activeId);
          if (activeVideo) {
            onVideoChange(activeVideo); // Send it up to App.tsx!
          }
        }
      });
    }, options);

    // Attach the tripwire to every video card
    const elements = document.querySelectorAll(".video-card");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect(); // Cleanup when component unmounts
  }, [videos, onVideoChange]);

  if (videos.length === 0) {
    return <div className="p-10 text-white text-center flex items-center justify-center h-full">No videos found.</div>;
  }

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
      {videos.map((video) => (
        <div 
          key={video.id} 
          data-video-id={video.id} // 💥 We use this to identify the card
          className="video-card h-full w-full snap-start relative bg-black group"
        >
          {/* The Video */}
          {video.videoUrl ? (
            <video src={video.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600">No Video File</div>
          )}

          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>

          {/* The Overlay Info */}
          <div className="absolute bottom-6 left-4 right-16 text-white drop-shadow-md z-10">
            <h3 className="m-0 mb-1 text-lg font-bold">@{video.creator.username}</h3>
            <p className="m-0 text-sm font-medium text-neutral-200">{video.videoTitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}