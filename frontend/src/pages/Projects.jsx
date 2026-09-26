import { getProjects } from '../api/client'
import SystemButton from '../components/SystemButton'
import { CardSkeleton } from '../components/Skeleton'
import useDocumentMeta from '../hooks/useDocumentMeta'
import usePaginatedList from '../hooks/usePaginatedList'

export default function Projects() {
  useDocumentMeta('Projects — Portfolio', "A few things I've designed, built, and shipped.")

  const {
    items: projects,
    loadState,
    hasMore,
    loadingMore,
    moreFailed,
    loadMore,
  } = usePaginatedList(getProjects)

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="fb-kicker mb-3">MY WORK</p>
      <h1 className="text-4xl text-white sm:text-5xl tracking-tight font-bold">Projects</h1>
      <p className="mt-4 max-w-lg fb-lead">A few things I&rsquo;ve designed, built, and shipped.</p>

      {loadState === 'error' && (
        <p className="mt-8 text-status-red">Failed to load projects. Try refreshing the page.</p>
      )}
      {loadState === 'ready' && projects.length === 0 && (
        <p className="mt-8 text-slate-400">No projects published yet &mdash; check back soon.</p>
      )}

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {loadState === 'loading' && [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}

        {projects.map((project) => (
          <div key={project.id} className="system-panel system-panel-glow flex h-full flex-col overflow-hidden p-6 transition-transform hover:-translate-y-1">
            {project.thumbnail && (
              <img
                src={project.thumbnail}
                alt={project.title}
                className="-mx-6 -mt-6 mb-4 h-48 w-[calc(100%+3rem)] object-cover border-b border-panel-edge"
              />
            )}
            <h2 className="text-lg font-semibold text-white mt-2">{project.title}</h2>
            {project.description && <p className="mt-2 text-sm text-[#A1A7CA]">{project.description}</p>}

            {project.tech_stack_list?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tech_stack_list.map((tag) => (
                  <span
                    key={tag}
                    className="fb-chip"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex gap-3 pt-6 text-sm">
              {project.repo_url && (
                <SystemButton
                  as="a"
                  href={project.repo_url}
                  target="_blank"
                  rel="noreferrer"
                  variant="outline"
                  size="sm"
                >
                  Repo
                </SystemButton>
              )}
              {project.live_url && (
                <SystemButton
                  as="a"
                  href={project.live_url}
                  target="_blank"
                  rel="noreferrer"
                  variant="primary"
                  size="sm"
                >
                  Live Demo
                </SystemButton>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <SystemButton onClick={loadMore} variant="outline" disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more projects'}
          </SystemButton>
          {moreFailed && <p className="text-sm text-status-red">Couldn&rsquo;t load more. Try again.</p>}
        </div>
      )}
    </div>
  )
}
