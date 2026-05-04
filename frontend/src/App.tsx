import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router'
import { AuthProvider } from './auth'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import CreatorUploadPage from './pages/CreatorUploadPage'
import FeedPage from './pages/FeedPage'
import VideoDetailPage from './pages/VideoDetailPage'
import SubmissionHistoryPage from './pages/SubmissionHistoryPage'
import UserProfilePage from './pages/UserProfilePage'

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
