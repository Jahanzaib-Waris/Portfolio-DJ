import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjects, getSkills, resumeDownloadUrl } from '../api/client'
import StatusPanel from '../components/StatusPanel'
import SystemButton from '../components/SystemButton'
import { Skeleton, CardSkeleton } from '../components/Skeleton'

export default function Home({ profile, profileState, onRequestQuote }) {
  const [skills, setSkills] = useState([])
  const [skillsState, setSkillsState] = useState('loading')
  const [projects, setProjects] = useState([])
  const [projectsState, setProjectsState] = useState('loading')

  useEffect(() => {
    getSkills()
      .then((data) => {
        setSkills(data.results ?? data)
        setSkillsState('ready')
      })
      .catch(() => setSkillsState('error'))

    getProjects()
      .then((data) => {
        setProjects((data.results ?? data).slice(0, 2))
        setProjectsState('ready')
      })
      .catch(() => setProjectsState('error'))
  }, [])

  return (
    <div className="space-y-24 pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-neon-blue/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-neon-indigo/20 blur-3xl" />

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
                <p className="eyebrow system-heading text-xs text-neon-indigo">// Status Window</p>
                <h1 className="text-4xl leading-tight text-white sm:text-5xl">
                  Hi, I&rsquo;m <span className="glow-text text-neon-blue">{profile.name}</span>
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
            <div className="relative shrink-0">
              {/* ambient glow behind the frame */}
              <div className="absolute inset-0 scale-110 rounded-[2rem] bg-gradient-to-br from-neon-blue/30 via-neon-indigo/20 to-transparent blur-3xl" />

              {/* gradient-ring frame */}
              <div className="relative rounded-[1.75rem] bg-gradient-to-br from-neon-blue via-neon-indigo to-neon-deep p-[3px] shadow-[0_0_40px_rgba(63,208,255,0.35)]">
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="h-64 w-56 rounded-[1.6rem] object-cover sm:h-96 sm:w-80"
                />
              </div>

              {/* HUD corner brackets */}
              <span className="pointer-events-none absolute -left-3 -top-3 h-8 w-8 border-l-2 border-t-2 border-neon-blue" />
              <span className="pointer-events-none absolute -right-3 -top-3 h-8 w-8 border-r-2 border-t-2 border-neon-blue" />
              <span className="pointer-events-none absolute -bottom-3 -left-3 h-8 w-8 border-b-2 border-l-2 border-neon-blue" />
              <span className="pointer-events-none absolute -bottom-3 -right-3 h-8 w-8 border-b-2 border-r-2 border-neon-blue" />

              {/* floating status badge */}
              <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-panel-edge bg-void/90 px-4 py-1.5 text-xs text-slate-200 shadow-lg backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-green" />
                <span className="system-heading">System Online</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tech stack */}
      {skillsState !== 'error' && (skillsState === 'loading' || skills.length > 0) && (
        <section className="mx-auto max-w-5xl px-6">
          <p className="eyebrow eyebrow-center system-heading mb-8 text-center text-xs text-neon-indigo">
            // Tech Stack
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
            <p className="eyebrow system-heading text-xs text-neon-indigo">// Featured Work</p>
            <Link to="/projects" className="text-sm text-neon-blue hover:glow-text">
              View all projects &rarr;
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {projectsState === 'loading'
              ? [1, 2].map((i) => <CardSkeleton key={i} />)
              : projects.map((project) => (
                  <StatusPanel
                    key={project.id}
                    className="h-full overflow-hidden transition-transform hover:-translate-y-1"
                  >
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
                            className="border border-neon-indigo/50 px-2 py-0.5 text-[10px] text-neon-indigo"
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
