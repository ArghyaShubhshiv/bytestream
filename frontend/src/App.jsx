import { useState, useEffect } from 'react'
import axios from 'axios'; // 1. Import axios
import './App.css'

function App() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    axios.get("http://localhost:3000/api/videos")
    .then(response => {
      setVideos(response.data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error fetching data: ", err);
      setLoading(false);
    })
  }, [])

  if (loading) return <h2>Loading ByteStream feed...</h2>

  return (
    <>
      <div>
        <h1>ByteStream</h1>
        {
          videos.map(video => (
            <div key={video.id}>
              {video.title}
              <p>By: @{video.creator}</p>
            </div>
          ))
        }
      </div>
    </>
  )
}

export default App
