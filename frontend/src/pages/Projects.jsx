import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getProjects } from '../api/client'
import SystemButton from '../components/SystemButton'
import { CardSkeleton } from '../components/Skeleton'
import useDocumentMeta from '../hooks/useDocumentMeta'
import usePaginatedList from '../hooks/usePaginatedList'

const fallbackProjects = [
  {
    id: 'p1',
    title: 'Property Management App',
    description: 'Tenant & landlord mobile portal with rent payments, maintenance tracking, and real-time messaging.',
    tech_stack_list: ['FlutterFlow', 'Supabase', 'Stripe', 'Dart'],
  },
  {
    id: 'p2',
    title: 'AI English Learning Platform',
    description: 'Conversational English practice with OpenAI speech-to-text, real-time grammar feedback, and vocabulary drills.',
    tech_stack_list: ['Flutter', 'OpenAI API', 'Whisper', 'Firebase'],
  },
  {
    id: 'p3',
    title: 'Car Marketplace & Auctions',
    description: 'Swipe-based car discovery, bidding auctions, verified dealer listings, and instant in-app chat.',
    tech_stack_list: ['FlutterFlow', 'Firebase', 'Cloud Functions', 'RevenueCat'],
  },
  {
    id: 'p4',
    title: 'Fitness & Workout Tracker',
    description: 'Cross-platform mobile training app with offline caching, custom charts, and Apple Health integration.',
    tech_stack_list: ['FlutterFlow', 'Dart', 'HealthKit', 'REST APIs'],
  },
]

export default function Projects() {
  const projectsSchema = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Client Projects & Mobile Case Studies — Jerry Dev Studio',
        url: 'https://jerry-dev-studio.web.app/projects',
        description: 'Explore production FlutterFlow and Flutter mobile applications engineered, deployed, and scaled for clients worldwide.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://jerry-dev-studio.web.app/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Projects',
            item: 'https://jerry-dev-studio.web.app/projects',
          },
        ],
      },
    ],
    [],
  )

  useDocumentMeta({
    title: 'Client Projects & App Showcase — Jerry Dev Studio',
    description: 'Explore production FlutterFlow and Flutter mobile applications built and shipped for clients worldwide.',
    canonicalPath: '/projects',
    keywords: 'FlutterFlow portfolio, Flutter client apps, mobile app case studies, Supabase mobile apps, production Flutter apps',
    schema: projectsSchema,
  })

  const { onRequestQuote } = useOutletContext() || {}
  const [selectedProject, setSelectedProject] = useState(null)

  const {
    items: projects,
    loadState,
    hasMore,
    loadingMore,
    moreFailed,
    loadMore,
  } = usePaginatedList(getProjects)

  const displayList = projects.length > 0 ? projects : (loadState !== 'loading' ? fallbackProjects : [])

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
      <div className="max-w-2xl">
        <p className="fb-kicker mb-3">STUDIO PORTFOLIO</p>
        <h1 className="text-3xl text-white sm:text-5xl tracking-tight font-extrabold">Projects</h1>
        <p className="mt-3 sm:mt-4 max-w-lg fb-lead">
          A showcase of production FlutterFlow and Flutter mobile applications built and shipped for clients worldwide.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {loadState === 'loading' && projects.length === 0 && [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}

        {displayList.map((project) => (
          <div key={project.id} className="fb-card group flex flex-col justify-between">
            <div>
              {project.thumbnail && (
                <img
                  src={project.thumbnail}
                  alt={project.title}
                  loading="lazy"
                  decoding="async"
                  className="-mx-7 -mt-7 mb-2 h-48 w-[calc(100%+3.5rem)] object-cover rounded-t-[16px] border-b border-panel-edge cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                />
              )}
              <h2
                onClick={() => setSelectedProject(project)}
                className="text-xl font-bold text-white mt-1 hover:text-neon-blue transition-colors cursor-pointer"
              >
                {project.title}
              </h2>
              {project.description && <p className="text-sm text-[#A1A7CA] mt-1">{project.description}</p>}
            </div>

            <div className="mt-6">
              {project.tech_stack_list?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {project.tech_stack_list.map((tag) => (
                    <span key={tag} className="fb-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 text-sm flex-wrap items-center">
                <SystemButton
                  onClick={() => setSelectedProject(project)}
                  variant="primary"
                  size="sm"
                >
                  Case study &rarr;
                </SystemButton>
                {project.live_url && (
                  <SystemButton
                    as="a"
                    href={project.live_url}
                    target="_blank"
                    rel="noreferrer"
                    variant="outline"
                    size="sm"
                  >
                    Live Demo ↗
                  </SystemButton>
                )}
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <SystemButton onClick={loadMore} variant="outline" disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more projects'}
          </SystemButton>
          {moreFailed && <p className="text-sm text-status-red">Couldn&rsquo;t load more. Try again.</p>}
        </div>
      )}

      {/* Case Study Detail Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2.5 sm:p-6 backdrop-blur-sm"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="system-panel w-full max-w-2xl max-h-[94vh] overflow-y-auto p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5 sm:mb-6">
              <div>
                <p className="fb-kicker mb-1">Project Case Study</p>
                <h2 className="system-heading text-xl sm:text-2xl text-white">{selectedProject.title}</h2>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-panel-edge text-slate-400 hover:text-white hover:border-neon-indigo transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                &#x2715;
              </button>
            </div>

            {selectedProject.thumbnail && (
              <img
                src={selectedProject.thumbnail}
                alt={selectedProject.title}
                className="w-full h-40 sm:h-56 object-cover rounded-xl border border-panel-edge mb-6"
              />
            )}

            <div className="space-y-5 text-sm text-[#ECEEFB]">
              <div>
                <h3 className="text-xs uppercase tracking-wider font-mono-ui text-[#A1A7CA] mb-1 font-semibold">
                  Overview &amp; Scope
                </h3>
                <p className="leading-relaxed text-[#A1A7CA]">
                  {selectedProject.description || 'Production mobile application engineered by Jerry Dev Studio.'}
                </p>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-wider font-mono-ui text-[#A1A7CA] mb-2 font-semibold">
                  Tech Stack &amp; Architecture
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tech_stack_list?.map((tag) => (
                    <span key={tag} className="fb-chip bg-neon-blue/10 border-neon-blue/30 text-neon-blue">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-panel-edge/80 bg-abyss/60 p-4">
                <h3 className="text-xs uppercase tracking-wider font-mono-ui text-neon-blue mb-1 font-semibold">
                  Key Deliverables
                </h3>
                <ul className="space-y-1.5 text-xs text-[#A1A7CA]">
                  <li>• Custom Dart actions &amp; state management architecture</li>
                  <li>• Scalable backend integration with real-time sync</li>
                  <li>• Native iOS &amp; Android App Store compliance</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-panel-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-2">
                {selectedProject.live_url && (
                  <SystemButton as="a" href={selectedProject.live_url} target="_blank" rel="noreferrer" variant="outline" size="sm" className="flex-1 sm:flex-initial text-center">
                    Open App ↗
                  </SystemButton>
                )}
                {selectedProject.repo_url && (
                  <SystemButton as="a" href={selectedProject.repo_url} target="_blank" rel="noreferrer" variant="outline" size="sm" className="flex-1 sm:flex-initial text-center">
                    Source Repo
                  </SystemButton>
                )}
              </div>
              <SystemButton
                onClick={() => {
                  setSelectedProject(null)
                  if (onRequestQuote) onRequestQuote()
                }}
                variant="primary"
                size="sm"
                className="w-full sm:w-auto text-center"
              >
                Build a similar app &rarr;
              </SystemButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
