import { useEffect, useState } from 'react'
import { Link, useOutletContext, useNavigate } from 'react-router-dom'
import { getProjects, getSkills, resumeDownloadUrl } from '../api/client'
import useDocumentMeta from '../hooks/useDocumentMeta'
import SystemButton from '../components/SystemButton'
import { Skeleton, CardSkeleton } from '../components/Skeleton'

export default function Home() {
  const { profile, profileState, onRequestQuote } = useOutletContext()
  const [skills, setSkills] = useState([])
  const [skillsState, setSkillsState] = useState('loading')
  const [projects, setProjects] = useState([])
  const [projectsState, setProjectsState] = useState('loading')
  const navigate = useNavigate()

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
        const featured = all.filter((p) => p.is_featured)
        setProjects((featured.length > 0 ? featured : all).slice(0, 2))
        setProjectsState('ready')
      })
      .catch(() => setProjectsState('error'))
  }, [])

  return (
    <div className="space-y-32 pb-32">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 sm:pt-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 sm:flex-row">
          <div className="flex-1 space-y-6 text-center sm:text-left">
            {profileState === 'loading' && (
              <div className="space-y-4">
                <Skeleton className="mx-auto h-3 w-24 sm:mx-0" />
                <Skeleton className="mx-auto h-12 w-64 sm:mx-0" />
                <Skeleton className="mx-auto h-4 w-48 sm:mx-0" />
              </div>
            )}

            {profileState === 'empty' && (
              <p className="text-[#A1A7CA]">
                Profile not configured yet. Add one in the Django admin to populate this section.
              </p>
            )}

            {profileState === 'ready' && profile && (
              <>
                <span className="eyebrow">Full-stack developer</span>
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
                  Hi, I&rsquo;m {profile.name.split(' ')[0]}. I build apps <span className="fb-grad-text">that deliver.</span>
                </h1>
                
                <p className="fb-lead mx-auto max-w-lg sm:mx-0">
                  {profile.bio || profile.tagline}
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2 sm:justify-start">
                  <SystemButton onClick={onRequestQuote} size="lg" variant="primary">
                    Let&rsquo;s Connect
                  </SystemButton>
                  <SystemButton as={Link} to="/projects" size="lg" variant="outline">
                    View Projects &rarr;
                  </SystemButton>
                </div>
                <p className="text-xs text-[#A1A7CA] font-mono-ui mt-4">
                  Currently building with Python, React & Tailwind
                </p>
              </>
            )}
          </div>

          <div className="hidden flex-1 shrink-0 sm:block">
            <figure className="fb-window" aria-label="Example Django REST Framework serializer">
              <div className="fb-window__bar"><span></span><span></span><span></span><em>serializers.py</em></div>
              <pre><code>
                <span className="c"># Portfolio API serializer</span>{"\n"}
                <span className="k">from</span> rest_framework <span className="k">import</span> serializers{"\n"}
                <span className="k">from</span> .models <span className="k">import</span> <span className="t">Project</span>{"\n"}
                {"\n"}
                <span className="k">class</span> <span className="t">ProjectSerializer</span>(serializers.<span className="t">ModelSerializer</span>):{"\n"}
                {"    "}<span className="k">class</span> <span className="t">Meta</span>:{"\n"}
                {"        "}model = <span className="t">Project</span>{"\n"}
                {"        "}fields = [<span className="s">'title'</span>, <span className="s">'stack'</span>, <span className="s">'live_url'</span>]
              </code></pre>
              <figcaption className="fb-window__foot"><span className="fb-status"></span>Django REST Framework</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      {skillsState !== 'error' && (skillsState === 'loading' || skills.length > 0) && (
        <section className="mx-auto max-w-6xl px-6">
          <p className="fb-kicker mb-8">Stack I Work With</p>
          <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {skillsState === 'loading'
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} className="system-panel p-6">
                    <Skeleton className="mb-2 h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              : skills.map((skill) => (
                  <div key={skill.id} className="system-panel system-panel-glow flex flex-col p-6 text-left">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-void border border-panel-edge">
                      <div className="h-5 w-5 bg-neon-indigo/50 rounded-full blur-[2px]" />
                    </div>
                    <h3 className="text-base font-semibold text-white">{skill.name}</h3>
                    {skill.description && <p className="mt-2 text-sm text-[#A1A7CA]">{skill.description}</p>}
                  </div>
                ))}
          </div>
        </section>
      )}

      {/* Featured work */}
      {projectsState !== 'error' && (projectsState === 'loading' || projects.length > 0) && (
        <section className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="fb-kicker mb-3">Featured Work</p>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Projects I&rsquo;ve shipped.</h2>
            </div>
            <Link to="/projects" className="hidden text-sm text-[#38BDF8] hover:text-white transition-colors sm:block">
              View all projects &rarr;
            </Link>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            {projectsState === 'loading'
              ? [1, 2].map((i) => <CardSkeleton key={i} />)
              : projects.map((project) => (
                  <div key={project.id} className="system-panel system-panel-glow flex h-full flex-col overflow-hidden p-6 transition-transform hover:-translate-y-1 cursor-pointer" onClick={() => navigate('/projects')}>
                    {project.thumbnail && (
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="-mx-6 -mt-6 mb-4 h-48 w-[calc(100%+3rem)] object-cover border-b border-panel-edge"
                      />
                    )}
                    <h3 className="text-xl font-bold text-white mt-2">{project.title}</h3>
                    {project.description && <p className="mt-2 text-sm text-[#A1A7CA]">{project.description}</p>}

                    {project.tech_stack_list?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.tech_stack_list.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="fb-chip"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
          </div>
          <div className="mt-6 sm:hidden">
            <Link to="/projects" className="text-sm text-[#38BDF8] hover:text-white transition-colors">
              View all projects &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* Closing call to action */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="fb-cta">
          <p className="fb-kicker mb-3 text-center">Ready to start?</p>
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl text-center">
            Got a project in mind?
          </h2>
          <p className="mt-4 text-center fb-lead mx-auto max-w-lg">
            From idea to shipped product &mdash; reach out and let&rsquo;s talk about what you&rsquo;re building.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <SystemButton onClick={onRequestQuote} size="lg" variant="primary">
              Request a Quote
            </SystemButton>
            <SystemButton as="a" href={resumeDownloadUrl} size="lg" variant="outline">
              Download Resume
            </SystemButton>
          </div>
        </div>
      </section>
    </div>
  )
}
