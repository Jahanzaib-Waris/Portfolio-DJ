import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import { AuthProvider } from './auth/AuthProvider'
import PublicLayout from './components/PublicLayout'
import Home from './pages/Home'
import Blogs from './pages/Blogs'
import Projects from './pages/Projects'

// Split out on its own: it's the only public page that needs the Markdown
// renderer, which is a large dependency most visitors never reach.
const BlogDetail = lazy(() => import('./pages/BlogDetail'))

// The panel is only ever used by one person, but it's most of the bundle. Lazy
// loading keeps it out of the download for the visitors who will never see it;
// the public pages stay eagerly imported so they render without a second trip.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const RequireAuth = lazy(() => import('./components/admin/RequireAuth'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const BlogEditor = lazy(() => import('./pages/admin/BlogEditor'))
const BlogList = lazy(() => import('./pages/admin/BlogList'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const ProfileEditor = lazy(() => import('./pages/admin/ProfileEditor'))
const ProjectEditor = lazy(() => import('./pages/admin/ProjectEditor'))
const ProjectList = lazy(() => import('./pages/admin/ProjectList'))
const QuoteInbox = lazy(() => import('./pages/admin/QuoteInbox'))
const SkillsManager = lazy(() => import('./pages/admin/SkillsManager'))
const AccountSettings = lazy(() => import('./pages/admin/settings/AccountSettings'))
const BrandingSettings = lazy(() => import('./pages/admin/settings/BrandingSettings'))

function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-neon-blue" />
        <span className="system-heading">Loading...</span>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<AdminLoading />}>
        <Routes>
          {/* Public site */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:slug" element={<BlogDetail />} />
            <Route path="/projects" element={<Projects />} />
          </Route>

          {/* Login sits outside RequireAuth, or reaching it would be impossible. */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="blog" element={<BlogList />} />
              <Route path="blog/new" element={<BlogEditor />} />
              <Route path="blog/:slug/edit" element={<BlogEditor />} />
              <Route path="projects" element={<ProjectList />} />
              <Route path="projects/new" element={<ProjectEditor />} />
              <Route path="projects/:id/edit" element={<ProjectEditor />} />
              <Route path="skills" element={<SkillsManager />} />
              <Route path="profile" element={<ProfileEditor />} />
              <Route path="quotes" element={<QuoteInbox />} />
              <Route path="settings/account" element={<AccountSettings />} />
              <Route path="settings/branding" element={<BrandingSettings />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App
