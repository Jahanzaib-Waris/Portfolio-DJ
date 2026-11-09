import { useCallback, useEffect, useRef, useState } from 'react'
import { AppScreen, KButton, KChip, KawaiiFace } from '../kawaii'
import usePrefersReducedMotion from '../usePrefersReducedMotion'
import { COMPANY, PERSONAS, SUGGESTIONS, reply } from './assistantBrain'

let nextId = 1
const msg = (role, text, extra = {}) => ({ id: nextId++, role, text, ...extra })
const faceSeed = (id) => PERSONAS.findIndex((p) => p.id === id) // cat, bear, bunny

export default function AiChat() {
  const reduced = usePrefersReducedMotion()
  const [personaId, setPersonaId] = useState('nova')
  const [messages, setMessages] = useState(() => [msg('bot', reply('nova', 'hello').text)])
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const [lastQuestion, setLastQuestion] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const timers = useRef([])
  const scroller = useRef(null)

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  // Keep the newest message in view inside the chat box only (never scroll the page).
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, typing])

  const persona = PERSONAS.find((p) => p.id === personaId)

  const start = useCallback((id) => {
    clearTimers()
    setPersonaId(id)
    setMessages([msg('bot', reply(id, 'hello').text)])
    setTyping(false)
    setLastQuestion('')
    setInput('')
  }, [])

  const send = (text) => {
    const question = text.trim()
    if (!question || typing) return
    setMessages((m) => [...m, msg('user', question)])
    setLastQuestion(question)
    setInput('')
    setTyping(true)

    const answer = reply(personaId, question)
    const words = answer.text.split(/(\s+)/)
    const botId = nextId++
    timers.current.push(
      setTimeout(
        () => {
          setTyping(false)
          if (reduced) {
            setMessages((m) => [...m, { id: botId, role: 'bot', text: answer.text, handoff: answer.handoff, refused: answer.refused }])
            return
          }
          setMessages((m) => [...m, { id: botId, role: 'bot', text: '', handoff: false, refused: answer.refused }])
          let shown = 0
          const tick = () => {
            shown += 2
            const partial = words.slice(0, shown).join('')
            const finished = shown >= words.length
            setMessages((m) => m.map((x) => (x.id === botId ? { ...x, text: partial, handoff: finished && answer.handoff } : x)))
            if (!finished) timers.current.push(setTimeout(tick, 35))
          }
          tick()
        },
        reduced ? 0 : 650,
      ),
    )
  }

  const connectHuman = (id) => {
    setMessages((m) => [
      ...m.map((x) => (x.id === id ? { ...x, handoff: false } : x)),
      msg('system', 'A teammate has been notified and will reply here. Typical response: under 10 minutes. (Demo only: no one is actually notified.)'),
    ])
  }

  const panel = (
    <div className="space-y-4">
      <div className="rounded-3xl border-2 border-kw-line bg-white p-4">
        <p className="text-sm font-black text-kw-ink">Rules for {persona.name}</p>
        <ul className="mt-2 space-y-2 text-sm font-semibold text-kw-muted">
          {persona.rules.map((r) => (
            <li key={r} className="flex gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-(--kw-accent-ink)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12l4 4 10-10" />
              </svg>
              {r}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs font-semibold leading-relaxed text-kw-muted">
        Replies are scripted for this demo. A real build gives a language model these same rules as instructions, plus your documents.
      </p>
      {lastQuestion && (
        <details className="rounded-3xl border-2 border-kw-line bg-white p-4" open>
          <summary className="cursor-pointer text-sm font-black text-kw-ink">Same question, three voices</summary>
          <p className="mt-1 text-xs font-bold text-kw-muted">&ldquo;{lastQuestion}&rdquo;</p>
          <div className="mt-3 space-y-3">
            {PERSONAS.map((p) => (
              <div key={p.id} className="rounded-2xl bg-(--kw-accent-soft) p-3">
                <p className="text-xs font-black text-(--kw-accent-ink)">{p.name}</p>
                <p className="mt-1 whitespace-pre-line text-sm font-semibold text-kw-ink">{reply(p.id, lastQuestion).text}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )

  return (
    <AppScreen
      accent="lavender"
      scroll={false}
      title={persona.name}
      subtitle={`${persona.role} · ${COMPANY} (fictional)`}
      action={
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          className="rounded-full border-2 border-kw-line bg-white px-3 py-1 text-xs font-black text-(--kw-accent-ink) @2xl:hidden"
        >
          {panelOpen ? 'Back to chat' : 'Rules'}
        </button>
      }
    >
      <div className="flex h-full min-h-0 @2xl:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="kw-scroll flex shrink-0 gap-2 overflow-x-auto px-5 pb-3" role="group" aria-label="Choose an assistant persona">
            {PERSONAS.map((p) => (
              <KChip key={p.id} active={p.id === personaId} onClick={() => start(p.id)} className="shrink-0">
                {p.name}
              </KChip>
            ))}
          </div>

          <div ref={scroller} className="kw-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-3" role="log" aria-live="polite" aria-label="Conversation">
            {messages.map((m) =>
              m.role === 'system' ? (
                <p key={m.id} className="mx-auto max-w-sm rounded-2xl bg-(--kw-accent-soft) px-3 py-2 text-center text-xs font-bold text-(--kw-accent-ink)">
                  {m.text}
                </p>
              ) : (
                <div key={m.id} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'bot' && <KawaiiFace seed={faceSeed(personaId)} className="h-8 w-8" />}
                  <div className="max-w-[82%]">
                    <div
                      className={`whitespace-pre-line rounded-3xl px-4 py-2.5 text-sm font-semibold leading-relaxed ${
                        m.role === 'user' ? 'rounded-br-lg bg-(--kw-accent) text-kw-ink' : 'rounded-bl-lg border-2 border-kw-line bg-white text-kw-ink'
                      }`}
                    >
                      {m.text}
                    </div>
                    {m.refused && m.text && <p className="mt-1 text-[11px] font-bold text-kw-muted">Guardrail: off-topic question politely declined.</p>}
                    {m.handoff && (
                      <KButton variant="soft" onClick={() => connectHuman(m.id)} className="mt-2 !px-3 !py-1.5 !text-xs">
                        Connect me to a person
                      </KButton>
                    )}
                  </div>
                </div>
              ),
            )}
            {typing && (
              <div className="flex items-end gap-2" aria-label={`${persona.name} is typing`}>
                <KawaiiFace seed={faceSeed(personaId)} className="h-8 w-8" />
                <div className="flex items-center gap-1 rounded-3xl rounded-bl-lg border-2 border-kw-line bg-white px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`h-2 w-2 rounded-full bg-(--kw-accent) ${reduced ? '' : 'animate-bounce'}`} style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="kw-scroll flex shrink-0 gap-2 overflow-x-auto px-5 pb-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={typing}
                className="shrink-0 rounded-full border-2 border-kw-line bg-white px-3 py-1 text-xs font-bold text-kw-muted transition-colors hover:border-(--kw-accent) disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex shrink-0 gap-2 px-5 pb-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={200}
              placeholder={`Message ${persona.name}...`}
              aria-label="Your message"
              className="min-w-0 flex-1 rounded-2xl border-2 border-kw-line bg-white px-4 py-2.5 text-sm font-semibold text-kw-ink placeholder:text-kw-muted/70 outline-none focus:border-(--kw-accent)"
            />
            <KButton type="submit" disabled={!input.trim() || typing}>
              Send
            </KButton>
          </form>
        </div>

        <aside
          className={`kw-scroll z-20 overflow-y-auto bg-kw-bg p-5 ${
            panelOpen ? 'absolute inset-0' : 'hidden'
          } @2xl:static @2xl:block @2xl:w-80 @2xl:shrink-0 @2xl:border-l-2 @2xl:border-kw-line`}
        >
          {panel}
        </aside>
      </div>
    </AppScreen>
  )
}
