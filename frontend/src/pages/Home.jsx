import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { getProjects, getSkills, resumeDownloadUrl } from '../api/client'
import useDocumentMeta from '../hooks/useDocumentMeta'
import StatusPanel from '../components/StatusPanel'
import SystemButton from '../components/SystemButton'
import { Skeleton, CardSkeleton } from '../components/Skeleton'

export default function Home() {
  const { profile, profileState, onRequestQuote } = useOutletContext()
  const [skills, setSkills] = useState([])
  const [skillsState, setSkillsState] = useState('loading')
  const [projects, setProjects] = useState([])
  const [projectsState, setProjectsState] = useState('loading')

  useDocumentMeta(
    profile?.name ? `${profile.name} — Portfolio` : 'Portfolio',
    profile?.tagline || profile?.bio || 'Full-stack developer portfolio — projects, blog, and how to get in touch.',
  )

  useEffect(() => {
    getSkills()
      .then((data) => {
        setSkills(data.results ?? data)
        setSkillsState('ready')
      })
      .catch(() => setSkillsState('error'))

    getProjects()
      .then((data) => {
        const all = data.results ?? data
        // Prefer projects explicitly marked featured; if none are, fall back
        // to the first two by display_order so the section isn't empty by default.
        const featured = all.filter((p) => p.is_featured)
        setProjects((featured.length > 0 ? featured : all).slice(0, 2))
        setProjectsState('ready')
      })
      .catch(() => setProjectsState('error'))
  }, [])

  return (
    <div className="space-y-24 pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto flex max-w-5xl flex-col-reverse items-center gap-12 px-6 pb-10 pt-16 sm:flex-row sm:pb-16 sm:pt-24">
          <div className="flex-1 space-y-5 text-center sm:text-left">
            {profileState === 'loading' && (
              <div className="space-y-4">
                <Skeleton className="mx-auto h-3 w-24 sm:mx-0" />
                <Skeleton className="mx-auto h-10 w-64 sm:mx-0" />
                <Skeleton className="mx-auto h-4 w-48 sm:mx-0" />
              </div>
            )}

            {profileState === 'empty' && (
              <p className="text-slate-400">
                Profile not configured yet. Add one in the Django admin to populate this section.
              </p>
            )}

            {profileState === 'ready' && profile && (
              <>
                <h1 className="text-4xl leading-tight text-white sm:text-5xl">
                  Hi, I&rsquo;m <span className="text-neon-blue">{profile.name}</span>
                </h1>
                {profile.tagline && <p className="text-lg text-neon-blue/90 sm:text-xl">{profile.tagline}</p>}
                {profile.bio && (
                  <p className="mx-auto max-w-lg leading-relaxed text-slate-300 sm:mx-0">{profile.bio}</p>
                )}

                <div className="flex flex-wrap justify-center gap-4 pt-2 sm:justify-start">
                  <SystemButton onClick={onRequestQuote} size="lg" variant="primary">
                    Let&rsquo;s Connect
                  </SystemButton>
                  {profile.resume && (
                    <SystemButton as="a" href={resumeDownloadUrl} size="lg">
                      Download Resume
                    </SystemButton>
                  )}
                </div>
              </>
            )}
          </div>

          {profile?.photo && (
            <div className="shrink-0">
              <img
                src={profile.photo}
                alt={profile.name}
                className="h-64 w-56 rounded-xl border border-panel-edge object-cover sm:h-80 sm:w-72"
              />
            </div>
          )}
        </div>
      </section>

      {/* Tech stack */}
      {skillsState !== 'error' && (skillsState === 'loading' || skills.length > 0) && (
        <section className="mx-auto max-w-5xl px-6">
          <p className="system-heading mb-8 text-center text-xs uppercase tracking-wide text-slate-400">
            Tech Stack
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {skillsState === 'loading'
              ? [1, 2, 3].map((i) => (
                  <StatusPanel key={i} glow={false}>
                    <Skeleton className="mb-2 h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </StatusPanel>
                ))
              : skills.map((skill) => (
                  <StatusPanel key={skill.id} className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-white">{skill.name}</h3>
                    {skill.description && <p className="mt-1 text-sm text-slate-300">{skill.description}</p>}
                  </StatusPanel>
                ))}
          </div>
        </section>
      )}

      {/* Featured work */}
      {projectsState !== 'error' && (projectsState === 'loading' || projects.length > 0) && (
        <section className="mx-auto max-w-5xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <p className="system-heading text-xs uppercase tracking-wide text-slate-400">Featured Work</p>
            <Link to="/projects" className="text-sm text-neon-blue hover:underline">
              View all projects &rarr;
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {projectsState === 'loading'
              ? [1, 2].map((i) => <CardSkeleton key={i} />)
              : projects.map((project) => (
                  <StatusPanel key={project.id} className="h-full overflow-hidden">
                    {project.thumbnail && (
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="-mx-6 -mt-6 mb-4 h-40 w-[calc(100%+3rem)] object-cover"
                      />
                    )}
                    <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                    {project.description && <p className="mt-2 text-sm text-slate-300">{project.description}</p>}

                    {project.tech_stack_list?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.tech_stack_list.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-neon-indigo/30 bg-neon-indigo/10 px-2.5 py-0.5 text-xs text-neon-blue"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </StatusPanel>
                ))}
          </div>
        </section>
      )}

      {/* Closing call to action */}
      <section className="mx-auto max-w-3xl px-6">
        <StatusPanel className="flex flex-col items-center gap-4 py-10 text-center">
          <h2 className="text-2xl text-white sm:text-3xl">
            Got a project in mind? <span className="text-neon-blue">Let&rsquo;s build it.</span>
          </h2>
          <p className="max-w-md text-slate-300">
            From idea to shipped product &mdash; reach out and let&rsquo;s talk about what you&rsquo;re building.
          </p>
          <SystemButton onClick={onRequestQuote} size="lg" variant="primary">
            Request a Quote
          </SystemButton>
        </StatusPanel>
      </section>
    </div>
  )
}
