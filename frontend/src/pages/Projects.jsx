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
    live_url: 'https://github.com/Jahanzaib-Waris',
  },
  {
    id: 'p2',
    title: 'AI English Learning Platform',
    description: 'Conversational English practice with OpenAI speech-to-text, real-time grammar feedback, and vocabulary drills.',
    tech_stack_list: ['Flutter', 'OpenAI API', 'Whisper', 'Firebase'],
    live_url: 'https://github.com/Jahanzaib-Waris',
  },
  {
    id: 'p3',
    title: 'Car Marketplace & Auctions',
    description: 'Swipe-based car discovery, bidding auctions, verified dealer listings, and instant in-app chat.',
    tech_stack_list: ['FlutterFlow', 'Firebase', 'Cloud Functions', 'RevenueCat'],
    live_url: 'https://github.com/Jahanzaib-Waris',
  },
  {
    id: 'p4',
    title: 'Fitness & Workout Tracker',
    description: 'Cross-platform mobile training app with offline caching, custom charts, and Apple Health integration.',
    tech_stack_list: ['FlutterFlow', 'Dart', 'HealthKit', 'REST APIs'],
    live_url: 'https://github.com/Jahanzaib-Waris',
  },
]

export default function Projects() {
  useDocumentMeta('Projects — FlowBase', "A showcase of production FlutterFlow and Flutter applications I've designed, built, and shipped.")

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
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <p className="fb-kicker mb-3">MY WORK</p>
        <h1 className="text-4xl text-white sm:text-5xl tracking-tight font-extrabold">Projects</h1>
        <p className="mt-4 max-w-lg fb-lead">A collection of production FlutterFlow and Flutter apps built for clients worldwide.</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {loadState === 'loading' && projects.length === 0 && [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}

        {displayList.map((project) => (
          <div key={project.id} className="fb-card">
            {project.thumbnail && (
              <img
                src={project.thumbnail}
                alt={project.title}
                className="-mx-7 -mt-7 mb-2 h-48 w-[calc(100%+3.5rem)] object-cover rounded-t-[16px] border-b border-panel-edge"
              />
            )}
            <h2 className="text-xl font-bold text-white mt-1">{project.title}</h2>
            {project.description && <p className="text-sm text-[#A1A7CA]">{project.description}</p>}

            {project.tech_stack_list?.length > 0 && (
              <div className="mt-auto pt-4 flex flex-wrap gap-2">
                {project.tech_stack_list.map((tag) => (
                  <span key={tag} className="fb-chip">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4 text-sm">
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
                  View details &rarr;
                </SystemButton>
              )}
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
    </div>
  )
}
