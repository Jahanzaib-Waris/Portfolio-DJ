import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBlogPosts } from '../api/client'
import StatusPanel from '../components/StatusPanel'
import { CardSkeleton } from '../components/Skeleton'

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
      <p className="eyebrow system-heading text-xs text-neon-indigo">// Field Notes</p>
      <h1 className="mt-3 text-3xl text-white sm:text-4xl">Blog</h1>
      <p className="mt-2 max-w-lg text-slate-400">Write-ups on what I&rsquo;m building, breaking, and learning.</p>

      {loadState === 'error' && (
        <p className="mt-8 text-status-red">Failed to load blog posts. Try refreshing the page.</p>
      )}
      {loadState === 'ready' && posts.length === 0 && (
        <p className="mt-8 text-slate-400">No blog posts published yet &mdash; check back soon.</p>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {loadState === 'loading' && [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}

        {posts.map((post) => (
          <Link key={post.id} to={`/blogs/${post.slug}`}>
            <StatusPanel className="group h-full overflow-hidden transition-transform hover:-translate-y-1">
              {post.cover_image && (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="-mx-6 -mt-6 mb-4 h-40 w-[calc(100%+3rem)] object-cover"
                />
              )}
              <div className="flex items-center gap-2 text-xs text-neon-indigo">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-indigo" />
                <span className="system-heading">{post.published_date}</span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white group-hover:text-neon-blue">{post.title}</h2>
              {post.excerpt && <p className="mt-2 text-sm text-slate-300">{post.excerpt}</p>}
            </StatusPanel>
          </Link>
        ))}
      </div>
    </div>
  )
}
