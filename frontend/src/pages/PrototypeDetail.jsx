import { Component, Suspense, lazy } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import useDocumentMeta from '../hooks/useDocumentMeta'
import { getPrototype, prototypes } from '../prototypes/registry'
import DemoStage from '../prototypes/device/DemoStage'
import { Chip, ProtoIcon } from '../prototypes/ui'
import SystemButton from '../components/SystemButton'
import NotFound from './NotFound'

// One lazy component per prototype, created once so re-renders don't reload it.
const demoCache = {}
const demoFor = (p) => (demoCache[p.slug] ||= lazy(p.load))

// A crash inside a demo should not blank the whole page.
class DemoBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="rounded-2xl border border-panel-edge bg-panel/70 p-8 text-center">
        <p className="font-semibold text-white">This demo couldn&rsquo;t load.</p>
        <p className="mt-1 text-sm text-[#A1A7CA]">Try reloading the page. If it keeps happening, let me know.</p>
      </div>
    )
  }
}

export default function PrototypeDetail() {
  const { slug } = useParams()
  const prototype = getPrototype(slug)
  const { onRequestQuoteWith } = useOutletContext() || {}

  useDocumentMeta({
    title: prototype ? `${prototype.title} Prototype — Try It Live | Jerry Dev Studio` : 'Prototype not found — Jerry Dev Studio',
    description: prototype ? prototype.summary : 'This prototype does not exist.',
    canonicalPath: `/prototypes/${slug}`,
  })

  if (!prototype) return <NotFound />

  const Demo = demoFor(prototype)
  const index = prototypes.findIndex((p) => p.slug === slug)
  const prev = prototypes[index - 1]
  const next = prototypes[index + 1]

  const ask = () =>
    onRequestQuoteWith?.({
      details: `I tried the "${prototype.title}" prototype on your site and I'd like something similar: ${prototype.quoteNote}.\n\nWhat I'd change or add: `,
    })

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 sm:pt-6">
      <div className="grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-6">
      <header className="lg:col-start-1 lg:row-start-1">
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-xs font-medium text-[#A1A7CA]">
          <Link to="/prototypes" className="hover:text-white">
            Prototypes
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-200">{prototype.title}</span>
        </nav>
        <div className="flex items-center gap-3">
          <span className="fb-icon" aria-hidden="true" style={{ color: prototype.colour, background: `${prototype.colour}26`, borderColor: `${prototype.colour}66` }}>
            <ProtoIcon slug={prototype.slug} />
          </span>
          <span className="text-sm font-medium text-[#A1A7CA]">{prototype.category}</span>
        </div>
        <h1 className="system-heading mt-3 text-3xl text-white">{prototype.title}</h1>
        <p className="fb-lead mt-3 text-sm text-[#A1A7CA] sm:text-base">{prototype.summary}</p>
      </header>
      <div className="min-w-0 lg:sticky lg:top-[68px] lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start">
        <DemoBoundary key={slug}>
          <DemoStage url={prototype.url}>
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm font-bold text-kw-muted">Loading the demo...</div>}>
              <Demo />
            </Suspense>
          </DemoStage>
        </DemoBoundary>
        <p className="mt-4 text-center text-xs text-[#A1A7CA]">A working demo with made-up data. Nothing you do here is stored.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:col-start-1 lg:row-start-2 lg:grid-cols-1">
        <div className="rounded-2xl border border-panel-edge bg-panel/70 p-5">
          <h2 className="text-sm font-bold text-white">What this demo shows</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#C9CEEA]">
            {prototype.shows.map((s) => (
              <li key={s} className="flex gap-2">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l4 4 10-10" />
                </svg>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-panel-edge bg-panel/70 p-5">
          <h2 className="text-sm font-bold text-white">What a real build adds</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#C9CEEA] marker:text-[#6D5AF6]">
            {prototype.production.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[#A1A7CA]">
            Typical stack: <span className="text-slate-200">{prototype.stack}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-neon-indigo/50 bg-neon-indigo/10 p-5">
          <h2 className="text-sm font-bold text-white">Is this close to what you need?</h2>
          <p className="mt-1 text-sm text-[#C9CEEA]">Tell me what is different and I will reply within a day.</p>
          <SystemButton variant="primary" className="mt-4 w-full" onClick={ask}>
            Ask about this feature
          </SystemButton>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {prototype.tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </div>
      </div>

      </div>

      <nav aria-label="More prototypes" className="mt-12 grid gap-3 border-t border-panel-edge pt-6 sm:grid-cols-2">
        {prev ? (
          <Link to={`/prototypes/${prev.slug}`} className="rounded-xl border border-panel-edge p-3 transition-colors hover:border-neon-indigo">
            <span className="text-xs text-[#A1A7CA]">Previous</span>
            <span className="block text-sm font-semibold text-white">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/prototypes/${next.slug}`} className="rounded-xl border border-panel-edge p-3 transition-colors hover:border-neon-indigo sm:text-right">
            <span className="text-xs text-[#A1A7CA]">Next</span>
            <span className="block text-sm font-semibold text-white">{next.title}</span>
          </Link>
        )}
      </nav>
    </div>
  )
}
