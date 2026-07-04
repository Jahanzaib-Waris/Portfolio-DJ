import { useEffect, useState } from 'react'
import { getProjects } from '../api/client'
import StatusPanel from '../components/StatusPanel'

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
      <h1 className="system-heading glow-text mb-8 text-2xl font-bold text-neon-blue">Cleared Quests</h1>

      {loadState === 'loading' && <p className="text-slate-400">Loading quest log...</p>}
      {loadState === 'error' && <p className="text-status-red">Failed to load projects.</p>}
      {loadState === 'ready' && projects.length === 0 && (
        <p className="text-slate-400">No projects published yet.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((project) => (
          <StatusPanel key={project.id} className="h-full">
            {project.thumbnail && (
              <img src={project.thumbnail} alt={project.title} className="mb-4 h-40 w-full object-cover" />
            )}
            <h2 className="text-lg font-semibold text-white">{project.title}</h2>
            {project.description && <p className="mt-2 text-sm text-slate-300">{project.description}</p>}

            {project.tech_stack_list?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {project.tech_stack_list.map((tag) => (
                  <span
                    key={tag}
                    className="system-heading border border-neon-purple/50 px-2 py-0.5 text-[10px] text-neon-purple"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-4 text-sm">
              {project.repo_url && (
                <a href={project.repo_url} target="_blank" rel="noreferrer" className="text-neon-blue hover:glow-text">
                  Repo
                </a>
              )}
              {project.live_url && (
                <a href={project.live_url} target="_blank" rel="noreferrer" className="text-neon-blue hover:glow-text">
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
