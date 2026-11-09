import { useCallback, useEffect, useRef, useState } from 'react'
import { Chip, DemoShell } from '../ui'
import usePrefersReducedMotion from '../usePrefersReducedMotion'
import { COMPANY, PERSONAS, SUGGESTIONS, reply } from './assistantBrain'

let nextId = 1
const msg = (role, text, extra = {}) => ({ id: nextId++, role, text, ...extra })

export default function AiChat() {
  const reduced = usePrefersReducedMotion()
  const [personaId, setPersonaId] = useState('nova')
  const [messages, setMessages] = useState(() => [msg('bot', reply('nova', 'hello').text)])
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const [lastQuestion, setLastQuestion] = useState('')
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
    const begin = reduced ? 0 : 650
    timers.current.push(
      setTimeout(() => {
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
      }, begin),
    )
  }

  const connectHuman = (id) => {
    setMessages((m) => [
      ...m.map((x) => (x.id === id ? { ...x, handoff: false } : x)),
      msg('system', 'A teammate has been notified and will reply here. Typical response time: under 10 minutes. (Demo only: no one is actually notified.)'),
    ])
  }

  return (
    <DemoShell title={`Support assistant for ${COMPANY} (fictional)`} onReset={() => start(personaId)}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an assistant persona">
            {PERSONAS.map((p) => (
              <Chip key={p.id} active={p.id === personaId} onClick={() => start(p.id)}>
                {p.name} &middot; {p.role}
              </Chip>
            ))}
          </div>

          <div
            ref={scroller}
            className="mt-3 h-[22rem] space-y-3 overflow-y-auto rounded-xl border border-panel-edge bg-abyss/60 p-3 sm:p-4"
            role="log"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.map((m) =>
              m.role === 'system' ? (
                <p key={m.id} className="mx-auto max-w-sm rounded-lg border border-panel-edge px-3 py-2 text-center text-xs text-[#A1A7CA]">
                  {m.text}
                </p>
              ) : (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    <div
                      className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === 'user' ? 'rounded-br-md bg-neon-deep text-white' : 'rounded-bl-md border border-panel-edge bg-panel text-slate-100'
                      }`}
                    >
                      {m.text}
                    </div>
                    {m.refused && m.text && <p className="mt-1 text-[11px] text-[#A1A7CA]">Guardrail: off-topic question politely declined.</p>}
                    {m.handoff && (
                      <button
                        type="button"
                        onClick={() => connectHuman(m.id)}
                        className="mt-2 rounded-lg border border-neon-blue/50 bg-neon-blue/10 px-3 py-1.5 text-xs font-semibold text-neon-blue hover:bg-neon-blue/20"
                      >
                        Connect me to a person
                      </button>
                    )}
                  </div>
                </div>
              ),
            )}
            {typing && (
              <div className="flex" aria-label={`${persona.name} is typing`}>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-panel-edge bg-panel px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full bg-[#A1A7CA] ${reduced ? '' : 'animate-bounce'}`}
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={typing}
                className="rounded-full border border-panel-edge bg-abyss/60 px-3 py-1 text-xs text-[#C9CEEA] transition-colors hover:border-neon-indigo hover:text-white disabled:opacity-50"
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
            className="mt-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={200}
              placeholder={`Message ${persona.name}...`}
              aria-label="Your message"
              className="min-w-0 flex-1 rounded-lg border border-panel-edge bg-abyss/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-neon-blue"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="system-button system-button-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>

        <aside className="space-y-4 text-sm">
          <div className="rounded-xl border border-panel-edge bg-abyss/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#A1A7CA]">Rules for {persona.name}</p>
            <ul className="mt-2 space-y-2 text-[#C9CEEA]">
              {persona.rules.map((r) => (
                <li key={r} className="flex gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12l4 4 10-10" />
                  </svg>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs leading-relaxed text-[#A1A7CA]">
            Replies are scripted for this demo. A real build gives a language model these same rules as instructions, plus your documents.
          </p>
        </aside>
      </div>

      {lastQuestion && (
        <details className="mt-5 rounded-xl border border-panel-edge bg-abyss/40 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-white">Compare: how each persona answers &ldquo;{lastQuestion}&rdquo;</summary>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {PERSONAS.map((p) => (
              <div key={p.id} className="rounded-lg border border-panel-edge bg-panel p-3">
                <p className="text-xs font-semibold text-neon-blue">{p.name}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-200">{reply(p.id, lastQuestion).text}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </DemoShell>
  )
}
