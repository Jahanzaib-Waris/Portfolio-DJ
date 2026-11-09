import { useMemo, useState } from 'react'
import { AppScreen, KButton, KChip, KawaiiFace, Sparkle } from '../kawaii'
import { CONNECT_OPTIONS, GOAL_OPTIONS, INTERESTS, NEARBY_LABELS, SOCIAL_LABELS, TIME_LABELS, profiles } from './data'
import { isStepValid, rankProfiles } from './scoring'

const STEPS = 6
const initialAnswers = { interests: [], social: 3, connect: null, goal: null, time: 3, nearby: 2 }
const QUESTION_TITLES = ['What are you into?', 'How social is your ideal week?', 'How do you like to connect?', 'What are you looking for?', 'How much time can you give?', 'How much does distance matter?']

function Ring({ value }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0" role="img" aria-label={`${value} percent match`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#F3E4F2" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="#FFC93D" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="900" fill="#4A3B5C">
        {value}%
      </text>
    </svg>
  )
}

function Breakdown({ parts }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {parts.map((p) => (
        <li key={p.key} className="text-xs font-bold">
          <div className="flex justify-between gap-2 text-kw-ink">
            <span>{p.label}</span>
            <span className="shrink-0">
              {p.points.toFixed(0)} / {p.max.toFixed(0)}
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-kw-line">
            <div className="h-full rounded-full bg-(--kw-accent)" style={{ width: `${(p.points / p.max) * 100}%` }} />
          </div>
          <p className="mt-0.5 font-semibold text-kw-muted">{p.note}</p>
        </li>
      ))}
    </ul>
  )
}

function Slider({ id, value, onChange, min, max, labels }) {
  return (
    <div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={QUESTION_TITLES[Number(id.replace('q', ''))]}
        aria-valuetext={labels[value - min]}
        className="mt-6 w-full accent-[#FFC93D]"
      />
      <div className="mt-1 flex justify-between text-xs font-bold text-kw-muted">
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
      <p className="mt-4 text-center text-xl font-black text-kw-ink">{labels[value - min]}</p>
    </div>
  )
}

function Choice({ legend, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="mt-2 grid gap-2.5 @md:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.id}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-extrabold transition-colors ${
              value === o.id ? 'border-(--kw-accent) bg-(--kw-accent-soft) text-kw-ink' : 'border-kw-line bg-white text-kw-muted hover:border-(--kw-accent)'
            }`}
          >
            <input type="radio" name={legend} checked={value === o.id} onChange={() => onChange(o.id)} className="h-4 w-4 accent-[#FFC93D]" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function SurveyMatch() {
  const [answers, setAnswers] = useState(initialAnswers)
  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)
  const [kind, setKind] = useState('All')
  const [minMatch, setMinMatch] = useState(0)
  const [sortBy, setSortBy] = useState('match')
  const [open, setOpen] = useState(null)

  const set = (patch) => setAnswers((a) => ({ ...a, ...patch }))
  const toggleInterest = (name) =>
    setAnswers((a) => {
      if (a.interests.includes(name)) return { ...a, interests: a.interests.filter((i) => i !== name) }
      if (a.interests.length >= 4) return a
      return { ...a, interests: [...a.interests, name] }
    })

  const ranked = useMemo(() => (finished ? rankProfiles(answers, profiles) : []), [finished, answers])
  const results = useMemo(() => {
    const list = ranked.filter((r) => (kind === 'All' || r.profile.kind === kind) && r.total >= minMatch)
    return sortBy === 'nearest' ? [...list].sort((a, b) => a.profile.distanceKm - b.profile.distanceKm) : list
  }, [ranked, kind, minMatch, sortBy])

  const reset = () => {
    setAnswers(initialAnswers)
    setStep(0)
    setFinished(false)
    setKind('All')
    setMinMatch(0)
    setSortBy('match')
    setOpen(null)
  }

  const valid = isStepValid(step, answers)

  return (
    <AppScreen
      accent="lemon"
      title={finished ? 'Your matches' : 'Find your people'}
      subtitle={finished ? `${ranked.length} people and groups scored` : `Question ${step + 1} of ${STEPS}`}
      action={
        finished ? (
          <KButton variant="plain" onClick={reset} className="!px-3 !py-1.5 !text-xs">
            Start over
          </KButton>
        ) : (
          <div className="flex gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1} aria-label="Survey progress">
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} className={`h-2.5 w-2.5 rounded-full ${i <= step ? 'bg-(--kw-accent)' : 'bg-kw-line'}`} />
            ))}
          </div>
        )
      }
    >
      {!finished ? (
        <div className="mx-auto max-w-xl px-5 pb-5">
          <div className="rounded-3xl border-2 border-kw-line bg-white p-5 shadow-[0_10px_0_-4px_var(--kw-accent-soft)]">
            <h3 className="flex items-center gap-2 text-lg font-black text-kw-ink">
              {QUESTION_TITLES[step]}
              <Sparkle className="h-3.5 w-3.5 text-(--kw-accent)" />
            </h3>
            {step === 0 && (
              <fieldset className="mt-3">
                <legend className="sr-only">Pick up to four interests</legend>
                <p className="text-xs font-bold text-kw-muted">Pick up to four.</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {INTERESTS.map((i) => (
                    <KChip key={i} active={answers.interests.includes(i)} onClick={() => toggleInterest(i)} className="!px-4 !py-2 !text-sm">
                      {i}
                    </KChip>
                  ))}
                </div>
                <p className="mt-3 text-xs font-bold text-kw-muted">
                  {answers.interests.length} of 4 chosen{answers.interests.length === 4 ? ' (tap one to swap)' : ''}
                </p>
              </fieldset>
            )}
            {step === 1 && <Slider id="q1" value={answers.social} onChange={(v) => set({ social: v })} min={1} max={5} labels={SOCIAL_LABELS} />}
            {step === 2 && <Choice legend="How do you like to connect?" options={CONNECT_OPTIONS} value={answers.connect} onChange={(v) => set({ connect: v })} />}
            {step === 3 && <Choice legend="What are you looking for?" options={GOAL_OPTIONS} value={answers.goal} onChange={(v) => set({ goal: v })} />}
            {step === 4 && <Slider id="q4" value={answers.time} onChange={(v) => set({ time: v })} min={1} max={5} labels={TIME_LABELS} />}
            {step === 5 && <Slider id="q5" value={answers.nearby} onChange={(v) => set({ nearby: v })} min={0} max={3} labels={NEARBY_LABELS} />}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <KButton variant="plain" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              Back
            </KButton>
            {!valid && <p className="text-xs font-bold text-[#B3542A]">{step === 0 ? 'Pick at least one interest.' : 'Choose an option to continue.'}</p>}
            <KButton disabled={!valid} onClick={() => (step === STEPS - 1 ? setFinished(true) : setStep((s) => s + 1))}>
              {step === STEPS - 1 ? 'See my matches' : 'Next'}
            </KButton>
          </div>
        </div>
      ) : (
        <div className="px-5 pb-6">
          <ol className="grid gap-3 @2xl:grid-cols-3">
            {ranked.slice(0, 3).map((r, i) => (
              <li key={r.profile.id} className="rounded-3xl border-2 border-kw-line bg-white p-4 shadow-[0_8px_0_-4px_var(--kw-accent-soft)]">
                <div className="flex items-center gap-3">
                  <Ring value={r.total} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-(--kw-accent-ink)">#{i + 1} match</p>
                    <p className="truncate font-black text-kw-ink">{r.profile.name}</p>
                    <p className="text-xs font-bold text-kw-muted">
                      {r.profile.kind === 'group' ? 'Group' : 'Person'} &middot; {r.profile.distanceKm} km
                    </p>
                  </div>
                  <KawaiiFace seed={r.profile.id} className="h-12 w-12" />
                </div>
                <p className="mt-2 text-sm font-semibold text-kw-ink">{r.profile.blurb}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.reasons.map((reason) => (
                    <KChip key={reason} small active>
                      {reason}
                    </KChip>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t-2 border-kw-line pt-4 text-xs font-extrabold text-kw-muted">
            <div className="flex gap-1.5" role="group" aria-label="Filter by type">
              {['All', 'person', 'group'].map((k) => (
                <KChip key={k} small active={kind === k} onClick={() => setKind(k)}>
                  {k === 'All' ? 'Everyone' : k === 'person' ? 'People' : 'Groups'}
                </KChip>
              ))}
            </div>
            <label className="flex items-center gap-2">
              Minimum match
              <input type="range" min="0" max="90" step="5" value={minMatch} onChange={(e) => setMinMatch(Number(e.target.value))} className="w-24 accent-[#FFC93D]" />
              <span className="w-9 text-kw-ink">{minMatch}%</span>
            </label>
            <label className="flex items-center gap-2">
              Sort
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border-2 border-kw-line bg-white px-2 py-1 text-xs font-bold text-kw-ink">
                <option value="match">Best match</option>
                <option value="nearest">Nearest</option>
              </select>
            </label>
          </div>

          <p className="mt-3 text-xs font-bold text-kw-muted" role="status">
            Showing {results.length} of {ranked.length}
          </p>
          {results.length === 0 ? (
            <p className="mt-3 rounded-3xl border-2 border-dashed border-kw-line p-6 text-center text-sm font-bold text-kw-muted">No results at this minimum. Lower the match slider.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {results.map((r) => {
                const expanded = open === r.profile.id
                return (
                  <li key={r.profile.id} className="rounded-3xl border-2 border-kw-line bg-white">
                    <button type="button" onClick={() => setOpen(expanded ? null : r.profile.id)} aria-expanded={expanded} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                      <KawaiiFace seed={r.profile.id} className="h-11 w-11" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-kw-ink">{r.profile.name}</span>
                        <span className="block truncate text-xs font-semibold text-kw-muted">
                          {r.profile.kind === 'group' ? 'Group' : 'Person'} &middot; {r.profile.distanceKm} km &middot; {r.profile.blurb}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-base font-black text-kw-ink">{r.total}%</span>
                        <span className="block text-[11px] font-black text-(--kw-accent-ink)">{expanded ? 'Hide why' : 'Why?'}</span>
                      </span>
                    </button>
                    {expanded && (
                      <div className="border-t-2 border-kw-line px-4 pb-4">
                        <Breakdown parts={r.parts} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </AppScreen>
  )
}
