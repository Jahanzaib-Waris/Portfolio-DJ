import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import RequestQuoteModal from './components/RequestQuoteModal'
import Home from './pages/Home'
import Blogs from './pages/Blogs'
import BlogDetail from './pages/BlogDetail'
import Projects from './pages/Projects'
import { getProfile } from './api/client'

function App() {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileState, setProfileState] = useState('loading')

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data)
        setProfileState('ready')
        if (data?.name) document.title = `${data.name} — Portfolio`
      })
      .catch(() => setProfileState('empty'))
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar profile={profile} onRequestQuote={() => setQuoteModalOpen(true)} />

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <Home profile={profile} profileState={profileState} onRequestQuote={() => setQuoteModalOpen(true)} />
            }
          />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/projects" element={<Projects />} />
        </Routes>
      </main>

      <Footer profile={profile} />

      <RequestQuoteModal open={quoteModalOpen} onClose={() => setQuoteModalOpen(false)} />
    </div>
  )
}

export default App
