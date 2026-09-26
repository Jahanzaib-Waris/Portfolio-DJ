import { useEffect, useRef, useState } from 'react'
import { Link, useOutletContext, useNavigate } from 'react-router-dom'
import { getProjects, getSkills } from '../api/client'
import useDocumentMeta from '../hooks/useDocumentMeta'
import SystemButton from '../components/SystemButton'

const fallbackServices = [
  {
    title: 'Build a new app',
    description: 'MVPs and full apps in FlutterFlow, from first screen to App Store and Google Play.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 2 7l10 5 10-5-10-5z" />
        <path d="m2 17 10 5 10-5" />
        <path d="m2 12 10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'Fix a broken app',
    description: 'Build failures, layout overflows, slow screens and bugs that only show up on a real device.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    title: 'Add integrations',
    description: 'Connect your existing app to APIs, payments, maps, push notifications and AI services.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 17H7A5 5 0 0 1 7 7h2" />
        <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    title: 'Write custom code',
    description: 'Custom widgets, actions and functions in Dart for everything FlutterFlow cannot do out of the box.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
]

const processSteps = [
  {
    num: 'Step 01',
    title: 'Requirements',
    text: 'We talk through your idea or problem, your users and your deadline. I review your FlutterFlow project or designs if you have them.',
    deliverable: 'a written scope of what is in and out',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    num: 'Step 02',
    title: 'Plan & quote',
    text: 'I break the work into milestones with a timeline and a clear quote, so you know the cost before anything starts.',
    deliverable: 'milestones, timeline and price',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" />
        <path d="M9 3v15M15 6v15" />
      </svg>
    ),
  },
  {
    num: 'Step 03',
    title: 'Development',
    text: 'I build in your FlutterFlow project, adding custom code and integrations where needed, and share progress as each milestone lands.',
    deliverable: 'progress updates and test builds',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    num: 'Step 04',
    title: 'Feedback',
    text: 'You test on real devices and tell me what works and what does not. Nothing counts as done until you have tried it.',
    deliverable: 'a shared list of fixes and changes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    ),
  },
  {
    num: 'Step 05',
    title: 'Improve & launch',
    text: 'I apply your feedback, polish performance and edge cases, then help you publish to the App Store and Google Play.',
    deliverable: 'a live app and handover notes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    ),
  },
]

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

const stackList = [
  'FlutterFlow',
  'Flutter',
  'Dart',
  'Firebase',
  'Supabase',
  'REST APIs',
  'OpenAI API',
  'RevenueCat',
  'Python',
  'Django',
]

export default function Home() {
  const { profile, onRequestQuote } = useOutletContext()
  const [skills, setSkills] = useState([])
  const [projects, setProjects] = useState([])
  const navigate = useNavigate()

  const flowRef = useRef(null)

  useDocumentMeta(
    profile?.name ? `${profile.name} — FlutterFlow & Flutter Developer` : 'Jahanzaib Waris — FlutterFlow & Flutter Developer',
    profile?.tagline || 'Practical FlutterFlow fixes, custom Dart code and hands-on help building production mobile apps.',
  )

  useEffect(() => {
    const el = flowRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    getSkills()
      .then((data) => {
        const res = data.results ?? data
        if (Array.isArray(res) && res.length > 0) setSkills(res)
      })
      .catch(() => {})

    getProjects()
      .then((data) => {
        const all = data.results ?? data
        if (Array.isArray(all) && all.length > 0) {
          const featured = all.filter((p) => p.is_featured)
          setProjects((featured.length > 0 ? featured : all).slice(0, 4))
        }
      })
      .catch(() => {})
  }, [])

  const displayProjects = projects.length > 0 ? projects : fallbackProjects

  return (
    <div className="space-y-0">
      {/* 1. Hero */}
      <section className="fb-hero relative overflow-hidden">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 lg:flex-row">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div>
              <span className="eyebrow">FlutterFlow &amp; Flutter developer</span>
            </div>

            <h1 className="fb-hero__title text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] text-[#ECEEFB] sm:text-5xl lg:text-[3.8rem]">
              Ship FlutterFlow apps{' '}
              <span className="fb-grad-text">that actually work.</span>
            </h1>

            <p className="fb-lead mx-auto max-w-xl text-[#A1A7CA] lg:mx-0">
              {profile?.bio ||
                'Practical fixes for real FlutterFlow problems, custom Dart code you can paste straight into your project, and hands-on help when you need an app built, rescued or connected.'}
            </p>

            <div className="fb-hero-actions flex flex-col sm:flex-row justify-center gap-4 pt-2 lg:justify-start">
              <SystemButton onClick={onRequestQuote} size="lg" variant="primary">
                Get help with your app
              </SystemButton>
              <SystemButton as={Link} to="/blogs" size="lg" variant="outline">
                Browse the fixes &rarr;
              </SystemButton>
            </div>

            <p className="fb-stack-note text-xs text-[#A1A7CA] font-mono-ui pt-2">
              Custom code &middot; Firebase &middot; Supabase &middot; APIs
            </p>
          </div>

          <div className="w-full flex-1 lg:max-w-[480px]">
            <figure className="fb-window" aria-label="Example FlutterFlow custom function written in Dart">
              <div className="fb-window__bar">
                <span></span>
                <span></span>
                <span></span>
                <em>time_ago.dart</em>
              </div>
              <pre>
                <code>
                  <span className="c">// Custom Function: &quot;time ago&quot; label</span>{'\n'}
                  <span className="t">String</span> <span className="f">timeAgo</span>(<span className="t">DateTime</span> date) &#123;{'\n'}
                  {'  '}<span className="k">final</span> d = <span className="t">DateTime</span>.<span className="f">now</span>().<span className="f">difference</span>(date);{'\n'}
                  {'  '}<span className="k">if</span> (d.inMinutes &lt; <span className="n">1</span>) <span className="k">return</span> <span className="s">&apos;just now&apos;</span>;{'\n'}
                  {'  '}<span className="k">if</span> (d.inHours &lt; <span className="n">1</span>) <span className="k">return</span> <span className="s">&apos;$&#123;d.inMinutes&#125;m ago&apos;</span>;{'\n'}
                  {'  '}<span className="k">if</span> (d.inDays &lt; <span className="n">1</span>) <span className="k">return</span> <span className="s">&apos;$&#123;d.inHours&#125;h ago&apos;</span>;{'\n'}
                  {'  '}<span className="k">return</span> <span className="s">&apos;$&#123;d.inDays&#125;d ago&apos;</span>;{'\n'}
                  &#125;
                </code>
              </pre>
              <figcaption className="fb-window__foot">
                <span className="fb-status"></span>
                Paste into Custom Code &rarr; Functions
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* 2. Services Overview (Tinted section) */}
      <section id="services" className="fb-section fb-section--alt">
        <div className="mx-auto max-w-6xl px-6">
          <div className="fb-section__head max-w-2xl">
            <p className="fb-kicker">What I do</p>
            <h2 className="fb-section__title">Build it, fix it, or wire it up.</h2>
            <p className="fb-lead">
              Whether you are starting from a blank canvas or stuck on an app that will not build, I can take it from here.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {fallbackServices.map((service) => (
              <div key={service.title} className="fb-card">
                <span className="fb-icon" aria-hidden="true">
                  {service.icon}
                </span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. About Section */}
      <section id="about" className="fb-section">
        <div className="mx-auto max-w-6xl px-6">
          <div className="fb-about__grid">
            <div className="fb-about__intro">
              <p className="fb-kicker">About</p>
              <h2 className="fb-section__title">
                Hi, I&rsquo;m {profile?.name || 'Jahanzaib'}. I build and fix FlutterFlow apps.
              </h2>
              <p>
                I&rsquo;m a mobile app developer based in Sialkot, Pakistan, with 2 years of experience shipping cross-platform apps in FlutterFlow and Flutter. The apps I work on are live on the Google Play Store and the Apple App Store.
              </p>
              <p>
                Most of my work is the part of FlutterFlow that goes beyond drag and drop: custom Dart code, Firebase and Supabase backends, RevenueCat subscriptions, and OpenAI features like chatbots, speech-to-text and AI image moderation.
              </p>
              <p>
                Recent builds include a property management app, an AI-powered English learning platform and a swipe-based car marketplace. This portfolio is where I write up the problems I solve along the way, so you can fix yours faster.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <SystemButton onClick={onRequestQuote} size="lg" variant="primary">
                  Work with me
                </SystemButton>
                {profile?.linkedin_url ? (
                  <SystemButton as="a" href={profile.linkedin_url} target="_blank" rel="noreferrer" size="lg" variant="outline">
                    LinkedIn &nearr;
                  </SystemButton>
                ) : (
                  <SystemButton as="a" href="https://www.linkedin.com/in/jahanzaib-waris/" target="_blank" rel="noreferrer" size="lg" variant="outline">
                    LinkedIn &nearr;
                  </SystemButton>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="fb-stats">
                <div className="fb-stat">
                  <p className="fb-stat__value">2+ years</p>
                  <p className="fb-stat__label">Building production apps with FlutterFlow and Flutter</p>
                </div>
                <div className="fb-stat">
                  <p className="fb-stat__value">iOS + Android</p>
                  <p className="fb-stat__label">Apps released on the App Store and Google Play</p>
                </div>
                <div className="fb-stat">
                  <p className="fb-stat__value">AI features</p>
                  <p className="fb-stat__label">OpenAI chatbots, speech and moderation in real apps</p>
                </div>
                <div className="fb-stat">
                  <p className="fb-stat__value">BS SE</p>
                  <p className="fb-stat__label">Software Engineering degree</p>
                </div>
              </div>

              <div>
                <p className="fb-kicker mb-3">Stack I work with</p>
                <ul className="fb-stack">
                  {(skills.length > 0 ? skills.map((s) => s.name) : stackList).map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. My Process (Tinted section with 5 steps and connector) */}
      <section id="process" className="fb-section fb-section--alt">
        <div className="mx-auto max-w-6xl px-6">
          <div className="fb-section__head max-w-2xl">
            <p className="fb-kicker">My process</p>
            <h2 className="fb-section__title">A clear process, from first message to launch.</h2>
            <p className="fb-lead">
              Every project follows the same five steps, so you always know what is happening, what comes next and what you will receive.
            </p>
          </div>

          <div ref={flowRef} className="fb-flow">
            <div className="fb-flow__steps">
              {processSteps.map((step) => (
                <div key={step.num} className="fb-flow__step">
                  <span className="fb-flow__node" aria-hidden="true">
                    {step.icon}
                  </span>
                  <p className="fb-flow__num">{step.num}</p>
                  <h3 className="fb-flow__title">{step.title}</h3>
                  <p className="fb-flow__text">{step.text}</p>
                  <p className="fb-flow__deliverable">
                    <strong>You get:</strong> {step.deliverable}
                  </p>
                </div>
              ))}
            </div>

            <div className="fb-flow__loop hidden lg:block" aria-hidden="true">
              <svg className="fb-flow__loop-svg" viewBox="0 0 1000 96" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <marker id="fb-loop-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M0 0 L10 5 L0 10 z" fill="#7C6CFF" />
                  </marker>
                </defs>
                <path
                  className="fb-flow__loop-path"
                  d="M838 4 C 838 80, 431 80, 431 10"
                  fill="none"
                  stroke="#7C6CFF"
                  strokeWidth="2"
                  strokeDasharray="6 7"
                  strokeLinecap="round"
                  markerEnd="url(#fb-loop-arrow)"
                />
              </svg>
              <span className="fb-flow__loop-label">Build &rarr; feedback &rarr; improve repeats for every milestone</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Work */}
      <section className="fb-section">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="fb-kicker mb-3">Featured Work</p>
              <h2 className="fb-section__title">Recent builds &amp; solutions.</h2>
            </div>
            <Link to="/projects" className="hidden text-sm text-[#38BDF8] hover:text-white transition-colors sm:block">
              View all projects &rarr;
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {displayProjects.map((project) => (
              <div
                key={project.id}
                className="fb-card cursor-pointer"
                onClick={() => navigate('/projects')}
              >
                {project.thumbnail && (
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    loading="lazy"
                    decoding="async"
                    className="-mx-7 -mt-7 mb-2 h-48 w-[calc(100%+3.5rem)] object-cover rounded-t-[16px] border-b border-panel-edge"
                  />
                )}
                <h3 className="text-xl font-bold text-white mt-1">{project.title}</h3>
                {project.description && <p className="text-sm text-[#A1A7CA]">{project.description}</p>}

                {project.tech_stack_list?.length > 0 && (
                  <div className="mt-auto pt-3 flex flex-wrap gap-2">
                    {project.tech_stack_list.map((tag) => (
                      <span key={tag} className="fb-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 sm:hidden">
            <Link to="/projects" className="text-sm text-[#38BDF8] hover:text-white transition-colors">
              View all projects &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Closing Call to Action */}
      <section className="fb-section fb-section--tight">
        <div className="mx-auto max-w-6xl px-6">
          <div className="fb-cta">
            <p className="fb-kicker mb-3 text-center">Stuck on something?</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl text-center">
              Have a FlutterFlow app that needs work?
            </h2>
            <p className="mt-4 text-center fb-lead mx-auto max-w-xl">
              A new build, a bug you cannot crack, or an integration your app is missing. Tell me about it and I will tell you how I would tackle it.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <SystemButton onClick={onRequestQuote} size="lg" variant="primary">
                Start a project
              </SystemButton>
              <SystemButton as={Link} to="/blogs" size="lg" variant="outline">
                Browse the fixes &rarr;
              </SystemButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
