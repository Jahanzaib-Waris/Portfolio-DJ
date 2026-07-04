import { useEffect, useState } from 'react'
import { getProjects } from '../api/client'
import StatusPanel from '../components/StatusPanel'
import { CardSkeleton } from '../components/Skeleton'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loadState, setLoadState] = useState('loading')

  useEffect(() => {
    getProjects()
      .then((data) => {
        setProjects(data.results ?? data)
        setLoadState('ready')
      })
      .catch(() => setLoadState('error'))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="eyebrow system-heading text-xs text-neon-indigo">// Selected Work</p>
      <h1 className="mt-3 text-3xl text-white sm:text-4xl">Projects</h1>
      <p className="mt-2 max-w-lg text-slate-400">A few things I&rsquo;ve designed, built, and shipped.</p>

      {loadState === 'error' && (
        <p className="mt-8 text-status-red">Failed to load projects. Try refreshing the page.</p>
      )}
      {loadState === 'ready' && projects.length === 0 && (
        <p className="mt-8 text-slate-400">No projects published yet &mdash; check back soon.</p>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {loadState === 'loading' && [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}

        {projects.map((project) => (
          <StatusPanel key={project.id} className="flex h-full flex-col overflow-hidden">
            {project.thumbnail && (
              <img
                src={project.thumbnail}
                alt={project.title}
                className="-mx-6 -mt-6 mb-4 h-40 w-[calc(100%+3rem)] object-cover"
              />
            )}
            <h2 className="text-lg font-semibold text-white">{project.title}</h2>
            {project.description && <p className="mt-2 text-sm text-slate-300">{project.description}</p>}

            {project.tech_stack_list?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {project.tech_stack_list.map((tag) => (
                  <span
                    key={tag}
                    className="border border-neon-indigo/50 px-2 py-0.5 text-[10px] text-neon-indigo"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex gap-3 pt-4 text-sm">
              {project.repo_url && (
                <a
                  href={project.repo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-panel-edge px-3 py-1.5 text-slate-200 transition-colors hover:border-neon-blue/60 hover:text-neon-blue"
                >
                  Repo
                </a>
              )}
              {project.live_url && (
                <a
                  href={project.live_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-neon-blue/50 px-3 py-1.5 text-neon-blue transition-colors hover:bg-neon-blue/10"
                >
                  Live Demo
                </a>
              )}
            </div>
          </StatusPanel>
        ))}
      </div>
    </div>
  )
}
