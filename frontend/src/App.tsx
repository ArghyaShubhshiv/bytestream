import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  Link,
} from '@tanstack/react-router'
import { useEffect, useState, createContext, useContext } from 'react'
import { api } from '../lib/api'
import VideoDisplay, { type Video } from './components/VideoDisplay'
import CodePane from './components/CodePane'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'

// ─── Auth Context ────────────────────────────────────────────────────────────

interface AuthUser {
  id: number
  username: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('bytestream_user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('bytestream_token')
  )

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('bytestream_token', newToken)
    localStorage.setItem('bytestream_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('bytestream_token')
    localStorage.removeItem('bytestream_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Video Feed Page ─────────────────────────────────────────────────────────

function VideoPage() {
  const { user, logout } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await api.get('/videos/feed')
        if (Array.isArray(response.data)) {
          setVideos(response.data)
          if (response.data.length > 0) setActiveVideo(response.data[0])
        } else {
          setVideos([])
        }
      } catch (err) {
        console.error(err)
        setVideos([])
      } finally {
        setLoading(false)
      }
    }
    fetchFeed()
  }, [])

  if (loading)
    return (
      <h2 className="p-8 text-2xl font-bold text-white bg-neutral-950 h-screen flex items-center">
        Loading the ByteStream... 🌊
      </h2>
    )

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans bg-neutral-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black border-b border-neutral-800 shrink-0">
        <Link to="/" className="text-white font-bold font-heading text-lg">
          Byte<span className="text-primary">Stream</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-neutral-400 text-sm">@{user.username}</span>
              <button
                onClick={logout}
                className="text-sm px-3 py-1 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="text-sm px-3 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
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
              videoId={activeVideo.id}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] text-[#d4d4d4]">
              No coding problem attached to this video.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────

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

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: AuthPage,
})

const routeTree = rootRoute.addChildren([landingRoute, videoRoute, authRoute])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// ─── Root App ─────────────────────────────────────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
