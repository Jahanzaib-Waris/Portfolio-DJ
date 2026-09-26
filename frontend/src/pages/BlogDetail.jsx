import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBlogPost } from '../api/client'
import RichTextContent from '../components/RichTextContent'
import StatusPanel from '../components/StatusPanel'
import { Skeleton } from '../components/Skeleton'
import useDocumentMeta from '../hooks/useDocumentMeta'

export default function BlogDetail() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loadState, setLoadState] = useState('loading')

  useDocumentMeta(post ? `${post.title} — Blog` : undefined, post?.excerpt)

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
        className="mb-8 inline-flex items-center gap-2 text-sm text-[#38BDF8] hover:text-white transition-colors"
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
        <article className="overflow-hidden">
          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={post.title}
              className="mb-8 h-auto w-full object-cover rounded-[24px] border border-panel-edge"
            />
          )}
          <div className="mb-4 text-xs">
            <span className="fb-kicker">{post.published_date}</span>
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">{post.title}</h1>
          <div className="mt-10 border-t border-panel-edge pt-10">
            <RichTextContent className="markdown-body">
              {post.content}
            </RichTextContent>
          </div>
        </article>
      )}
    </div>
  )
}
