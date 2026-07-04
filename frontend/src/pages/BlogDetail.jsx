import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBlogPost } from '../api/client'
import StatusPanel from '../components/StatusPanel'
import { Skeleton } from '../components/Skeleton'

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
      <Link
        to="/blogs"
        className="system-heading mb-6 inline-flex items-center gap-1 text-xs text-neon-blue hover:glow-text"
      >
        &larr; Back to Blog
      </Link>

      {loadState === 'loading' && (
        <StatusPanel glow={false}>
          <Skeleton className="mb-6 h-52 w-full" />
          <Skeleton className="mb-3 h-3 w-24" />
          <Skeleton className="mb-6 h-7 w-2/3" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </StatusPanel>
      )}

      {loadState === 'error' && <p className="text-status-red">Blog post not found.</p>}

      {loadState === 'ready' && post && (
        <StatusPanel className="overflow-hidden">
          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={post.title}
              className="-mx-6 -mt-6 mb-6 h-64 w-[calc(100%+3rem)] object-cover"
            />
          )}
          <div className="flex items-center gap-2 text-xs text-neon-indigo">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-indigo" />
            <span className="system-heading">{post.published_date}</span>
          </div>
          <h1 className="glow-text mt-2 text-2xl font-bold text-white sm:text-3xl">{post.title}</h1>
          <div className="mt-6 whitespace-pre-wrap leading-relaxed text-slate-300">{post.content}</div>
        </StatusPanel>
      )}
    </div>
  )
}
