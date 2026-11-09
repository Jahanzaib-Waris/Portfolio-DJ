import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import useDocumentMeta from '../hooks/useDocumentMeta'
import { prototypeCategories, prototypes } from '../prototypes/registry'
import { Chip, ProtoIcon } from '../prototypes/ui'
import SystemButton from '../components/SystemButton'

export default function Prototypes() {
  useDocumentMeta({
    title: 'Interactive App Prototypes — Try a Feature Before You Build It | Jerry Dev Studio',
    description:
      'Try working prototypes of common mobile app features: swipe cards, AI chat, voice assistants, maps with custom pins, and survey-based recommendations. Made-up data, nothing stored.',
    canonicalPath: '/prototypes',
    keywords: 'app feature prototypes, swipe cards demo, AI chatbot demo, voice assistant demo, map pins demo, recommendation engine demo, Flutter prototypes',
  })

  const { onRequestQuoteWith } = useOutletContext() || {}
  const [category, setCategory] = useState('All')
  const shown = prototypes.filter((p) => category === 'All' || p.category === category)

  return (
    <div>
      <section className="fb-hero relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
          <div className="max-w-3xl">
            <p className="fb-kicker">Feature Lab</p>
            <h1 className="fb-hero__title mt-2 text-3xl font-extrabold leading-[1.05] tracking-[-0.045em] text-[#ECEEFB] sm:text-5xl break-words">
              Try the feature <span className="fb-grad-text">before you build it.</span>
            </h1>
            <p className="fb-lead mt-4 text-sm text-[#A1A7CA] sm:text-base">
              Most projects start with &ldquo;can you build something like this?&rdquo; Here are working prototypes of the features clients ask about most.
              Play with them, and if one is close to what you have in mind, tell me what to change.
            </p>
            <p className="mt-4 text-sm text-[#A1A7CA]">
              Everything runs in your browser with made-up data. Nothing you do here is sent to or stored by this site.
            </p>
          </div>
        </div>
      </section>

      <section className="fb-section fb-section--tight">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter prototypes by category">
            {prototypeCategories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <li key={p.slug}>
                <Link to={`/prototypes/${p.slug}`} className="fb-card group transition-transform hover:-translate-y-1">
                  <span className="fb-icon" aria-hidden="true">
                    <ProtoIcon slug={p.slug} />
                  </span>
                  <span className="text-xs font-medium text-[#A1A7CA]">{p.category}</span>
                  <h2 className="text-lg font-bold text-white">{p.title}</h2>
                  <p className="text-sm text-[#C9CEEA]">{p.tagline}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                    {p.tags.map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                  </div>
                  <span className="mt-2 text-sm font-semibold text-neon-blue group-hover:underline">Try it &rarr;</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-2xl border border-panel-edge bg-panel/60 p-6 text-center sm:p-10">
            <h2 className="system-heading text-2xl text-white">Have a different feature in mind?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[#C9CEEA]">
              These are a starting point. Describe what you need and I will tell you how I would build it, and what it takes.
            </p>
            <div className="mt-5">
              <SystemButton
                variant="primary"
                size="lg"
                onClick={() => onRequestQuoteWith?.({ details: 'I have a feature in mind that is not in your prototypes: ' })}
              >
                Describe your feature
              </SystemButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
