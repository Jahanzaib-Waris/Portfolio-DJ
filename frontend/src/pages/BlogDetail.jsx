import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBlogPost } from '../api/client'
import StatusPanel from '../components/StatusPanel'

export default function BlogDetail() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loadState, setLoadState] = useState('loading')

  useEffect(() => {
    setLoadState('loading')
    getBlogPost(slug)
      .then((data) => {
        setPost(data)
        setLoadState('ready')
      })
      .catch(() => setLoadState('error'))
  }, [slug])

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link to="/blogs" className="system-heading mb-6 inline-block text-xs text-neon-blue hover:glow-text">
        &larr; Back to Blog Log
      </Link>

      {loadState === 'loading' && <p className="text-slate-400">Loading entry...</p>}
      {loadState === 'error' && <p className="text-status-red">Blog post not found.</p>}

      {loadState === 'ready' && post && (
        <StatusPanel>
          {post.cover_image && (
            <img src={post.cover_image} alt={post.title} className="mb-6 max-h-80 w-full object-cover" />
          )}
          <p className="system-heading text-xs text-neon-purple">{post.published_date}</p>
          <h1 className="glow-text mt-1 text-2xl font-bold text-white">{post.title}</h1>
          <div className="mt-6 whitespace-pre-wrap leading-relaxed text-slate-300">{post.content}</div>
        </StatusPanel>
      )}
    </div>
  )
}
