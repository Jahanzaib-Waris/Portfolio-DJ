import { useMemo, useState } from 'react'
import { Avatar, Chip, DemoShell } from '../ui'
import { CONNECT_OPTIONS, GOAL_OPTIONS, INTERESTS, NEARBY_LABELS, SOCIAL_LABELS, TIME_LABELS, profiles } from './data'
import { isStepValid, rankProfiles } from './scoring'

const STEPS = 6
const initialAnswers = { interests: [], social: 3, connect: null, goal: null, time: 3, nearby: 2 }

function Ring({ value }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0" role="img" aria-label={`${value} percent match`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#232848" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#7C6CFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff">
        {value}%
      </text>
    </svg>
  )
}

function Breakdown({ parts }) {
  return (
    <ul className="mt-3 space-y-2">
      {parts.map((p) => (
        <li key={p.key} className="text-xs">
          <div className="flex justify-between gap-2 text-[#C9CEEA]">
            <span>{p.label}</span>
            <span className="shrink-0 font-semibold text-white">
              {p.points.toFixed(0)} / {p.max.toFixed(0)}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel-edge">
            <div className="h-full rounded-full bg-gradient-to-r from-neon-indigo to-neon-blue" style={{ width: `${(p.points / p.max) * 100}%` }} />
          </div>
          <p className="mt-0.5 text-[#A1A7CA]">{p.note}</p>
        </li>
      ))}
    </ul>
  )
}

function Slider({ id, label, value, onChange, min, max, labels }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-white">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={labels[value - min]}
        className="mt-4 w-full accent-[#6D5AF6]"
      />
      <div className="mt-1 flex justify-between text-xs text-[#A1A7CA]">
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
      <p className="mt-3 text-center text-lg font-bold text-white">{labels[value - min]}</p>
    </div>
  )
}

function Choice({ legend, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-white">{legend}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
              value === o.id ? 'border-neon-indigo bg-neon-indigo/15 text-white' : 'border-panel-edge bg-abyss/50 text-[#C9CEEA] hover:border-slate-400'
            }`}
          >
            <input type="radio" name={legend} checked={value === o.id} onChange={() => onChange(o.id)} className="accent-[#6D5AF6]" />
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
    <DemoShell title="Find your people" onReset={reset}>
      {!finished ? (
        <div className="mx-auto max-w-xl">
          <div className="mb-5">
            <div className="flex justify-between text-xs text-[#A1A7CA]">
              <span>
                Question {step + 1} of {STEPS}
              </span>
              <span>About 1 minute</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-edge" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
              <div className="h-full rounded-full bg-gradient-to-r from-neon-indigo to-neon-blue transition-all" style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
            </div>
          </div>

          <div className="min-h-[15rem]">
            {step === 0 && (
              <fieldset>
                <legend className="text-sm font-semibold text-white">What are you into? Pick up to four.</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {INTERESTS.map((i) => (
                    <Chip key={i} active={answers.interests.includes(i)} onClick={() => toggleInterest(i)} className="!px-4 !py-2 !text-sm">
                      {i}
                    </Chip>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[#A1A7CA]">{answers.interests.length} of 4 chosen{answers.interests.length === 4 ? ' (tap one to swap)' : ''}</p>
              </fieldset>
            )}
            {step === 1 && <Slider id="social" label="How social is your ideal week?" value={answers.social} onChange={(v) => set({ social: v })} min={1} max={5} labels={SOCIAL_LABELS} />}
            {step === 2 && <Choice legend="How do you like to connect?" options={CONNECT_OPTIONS} value={answers.connect} onChange={(v) => set({ connect: v })} />}
            {step === 3 && <Choice legend="What are you looking for?" options={GOAL_OPTIONS} value={answers.goal} onChange={(v) => set({ goal: v })} />}
            {step === 4 && <Slider id="time" label="How much time could you give each week?" value={answers.time} onChange={(v) => set({ time: v })} min={1} max={5} labels={TIME_LABELS} />}
            {step === 5 && <Slider id="nearby" label="How much does it matter that they are nearby?" value={answers.nearby} onChange={(v) => set({ nearby: v })} min={0} max={3} labels={NEARBY_LABELS} />}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-lg border border-panel-edge px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-400 disabled:opacity-40"
            >
              Back
            </button>
            {!valid && <p className="text-xs text-amber-300">{step === 0 ? 'Pick at least one interest.' : 'Choose an option to continue.'}</p>}
            <button
              type="button"
              disabled={!valid}
              onClick={() => (step === STEPS - 1 ? setFinished(true) : setStep((s) => s + 1))}
              className="system-button system-button-primary px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {step === STEPS - 1 ? 'See my matches' : 'Next'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">Your best matches</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFinished(false)
                  setStep(0)
                }}
                className="rounded-lg border border-panel-edge px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-400"
              >
                Change my answers
              </button>
              <button type="button" onClick={reset} className="rounded-lg border border-panel-edge px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-400">
                Start over
              </button>
            </div>
          </div>

          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {ranked.slice(0, 3).map((r, i) => (
              <li key={r.profile.id} className="rounded-xl border border-panel-edge bg-abyss/50 p-4">
                <div className="flex items-center gap-3">
                  <Ring value={r.total} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neon-blue">#{i + 1} match</p>
                    <p className="truncate font-semibold text-white">{r.profile.name}</p>
                    <p className="text-xs text-[#A1A7CA]">
                      {r.profile.kind === 'group' ? 'Group' : 'Person'} &middot; {r.profile.distanceKm} km
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-200">{r.profile.blurb}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.reasons.map((reason) => (
                    <Chip key={reason}>{reason}</Chip>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-panel-edge pt-4 text-xs text-[#C9CEEA]">
            <div className="flex gap-1.5" role="group" aria-label="Filter by type">
              {['All', 'person', 'group'].map((k) => (
                <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
                  {k === 'All' ? 'Everyone' : k === 'person' ? 'People' : 'Groups'}
                </Chip>
              ))}
            </div>
            <label className="flex items-center gap-2">
              Minimum match
              <input type="range" min="0" max="90" step="5" value={minMatch} onChange={(e) => setMinMatch(Number(e.target.value))} className="w-28 accent-[#6D5AF6]" />
              <span className="w-9 font-semibold text-white">{minMatch}%</span>
            </label>
            <label className="flex items-center gap-2">
              Sort
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-md border border-panel-edge bg-abyss px-2 py-1 text-xs text-slate-100">
                <option value="match">Best match</option>
                <option value="nearest">Nearest</option>
              </select>
            </label>
          </div>

          <p className="mt-3 text-xs text-[#A1A7CA]" role="status">
            Showing {results.length} of {ranked.length}
          </p>
          {results.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-panel-edge p-6 text-center text-sm text-[#A1A7CA]">No results at this minimum. Lower the match slider.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {results.map((r) => {
                const expanded = open === r.profile.id
                return (
                  <li key={r.profile.id} className="rounded-xl border border-panel-edge bg-abyss/40">
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : r.profile.id)}
                      aria-expanded={expanded}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <Avatar name={r.profile.name} index={r.profile.id} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">{r.profile.name}</span>
                        <span className="block truncate text-xs text-[#A1A7CA]">
                          {r.profile.kind === 'group' ? 'Group' : 'Person'} &middot; {r.profile.distanceKm} km &middot; {r.profile.blurb}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-base font-bold text-white">{r.total}%</span>
                        <span className="block text-[11px] text-neon-blue">{expanded ? 'Hide why' : 'Why?'}</span>
                      </span>
                    </button>
                    {expanded && (
                      <div className="border-t border-panel-edge px-4 pb-4">
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
    </DemoShell>
  )
}
