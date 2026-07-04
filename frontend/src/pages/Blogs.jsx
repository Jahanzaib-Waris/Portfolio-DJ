import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBlogPosts } from '../api/client'
import StatusPanel from '../components/StatusPanel'

export default function Blogs() {
  const [posts, setPosts] = useState([])
  const [loadState, setLoadState] = useState('loading')

  useEffect(() => {
    getBlogPosts()
      .then((data) => {
        setPosts(data.results ?? data)
        setLoadState('ready')
      })
      .catch(() => setLoadState('error'))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="system-heading glow-text mb-8 text-2xl font-bold text-neon-blue">Blog Log</h1>

      {loadState === 'loading' && <p className="text-slate-400">Loading entries...</p>}
      {loadState === 'error' && <p className="text-status-red">Failed to load blog posts.</p>}
      {loadState === 'ready' && posts.length === 0 && (
        <p className="text-slate-400">No blog posts published yet.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <Link key={post.id} to={`/blogs/${post.slug}`}>
            <StatusPanel className="h-full transition-transform hover:-translate-y-1">
              {post.cover_image && (
                <img src={post.cover_image} alt={post.title} className="mb-4 h-40 w-full object-cover" />
              )}
              <p className="system-heading text-xs text-neon-purple">{post.published_date}</p>
              <h2 className="mt-1 text-lg font-semibold text-white">{post.title}</h2>
              {post.excerpt && <p className="mt-2 text-sm text-slate-300">{post.excerpt}</p>}
            </StatusPanel>
          </Link>
        ))}
      </div>
    </div>
  )
}
