import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router'
import { useState, createContext, useContext } from 'react'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import CreatorUploadPage from './pages/CreatorUploadPage'
import FeedPage from './pages/FeedPage'
import VideoDetailPage from './pages/VideoDetailPage'
import SubmissionHistoryPage from './pages/SubmissionHistoryPage'
import UserProfilePage from './pages/UserProfilePage'

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

// ─── Router ───────────────────────────────────────────────────────────────────

function NotFoundComponent() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
        <a href="/" className="bg-primary px-6 py-2 rounded-lg text-primary-foreground hover:bg-primary/90">
          Go Home
        </a>
      </div>
    </div>
  )
}

const rootRoute = createRootRoute({
  notFoundComponent: NotFoundComponent,
})

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
})

const videoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/feed',
  component: FeedPage,
})

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: AuthPage,
})

const createRoute_route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: CreatorUploadPage,
})

const videoDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/video/$videoId',
  component: VideoDetailPage,
})

const submissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/submissions',
  component: SubmissionHistoryPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$username',
  component: UserProfilePage,
})

const routeTree = rootRoute.addChildren([
  landingRoute,
  videoRoute,
  authRoute,
  createRoute_route,
  videoDetailRoute,
  submissionsRoute,
  profileRoute,
])

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
