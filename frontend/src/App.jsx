import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import RequestQuoteModal from './components/RequestQuoteModal'
import Home from './pages/Home'
import Blogs from './pages/Blogs'
import BlogDetail from './pages/BlogDetail'
import Projects from './pages/Projects'

function App() {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar onRequestQuote={() => setQuoteModalOpen(true)} />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home onRequestQuote={() => setQuoteModalOpen(true)} />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/projects" element={<Projects />} />
        </Routes>
      </main>

      <RequestQuoteModal open={quoteModalOpen} onClose={() => setQuoteModalOpen(false)} />
    </div>
  )
}

export default App
