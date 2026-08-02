import { Route, Routes } from 'react-router-dom'

import { AuthProvider } from './auth/AuthProvider'
import PublicLayout from './components/PublicLayout'
import AdminLayout from './components/admin/AdminLayout'
import RequireAuth from './components/admin/RequireAuth'
import Home from './pages/Home'
import Blogs from './pages/Blogs'
import BlogDetail from './pages/BlogDetail'
import Projects from './pages/Projects'
import AdminLogin from './pages/admin/AdminLogin'
import BlogEditor from './pages/admin/BlogEditor'
import BlogList from './pages/admin/BlogList'
import Dashboard from './pages/admin/Dashboard'

function App() {
  return (
    <AuthProvider>
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
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
