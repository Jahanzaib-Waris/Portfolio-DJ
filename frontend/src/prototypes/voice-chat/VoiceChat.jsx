import { useCallback, useEffect, useRef, useState } from 'react'
import { AppScreen, KButton, KChip, KawaiiFace } from '../kawaii'
import usePrefersReducedMotion from '../usePrefersReducedMotion'
import { PERSONAS, SUGGESTIONS, reply } from '../ai-chat/assistantBrain'

const STATUS_TEXT = {
  idle: 'Tap the microphone and speak',
  listening: 'Listening...',
  thinking: 'Thinking...',
  speaking: 'Speaking...',
}

const speechText = (text) => text.replace(/•/g, '').replace(/\n+/g, '. ')

export default function VoiceChat() {
  const reduced = usePrefersReducedMotion()
  const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [status, setStatus] = useState('idle')
  const [personaId, setPersonaId] = useState('nova')
  const [speakReplies, setSpeakReplies] = useState(true)
  const [log, setLog] = useState([])
  const [interim, setInterim] = useState('')
  const [notice, setNotice] = useState('')
  const [typed, setTyped] = useState('')
  const recognition = useRef(null)
  const timer = useRef(null)
  const personaRef = useRef(personaId)
  const speakRef = useRef(speakReplies)
  const logEnd = useRef(null)

  useEffect(() => {
    personaRef.current = personaId
    speakRef.current = speakReplies
  }, [personaId, speakReplies])

  useEffect(() => {
    const el = logEnd.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log, interim])

  const stopAll = useCallback(() => {
    clearTimeout(timer.current)
    try {
      recognition.current?.abort()
    } catch {
      // already stopped
    }
    if (canSpeak) window.speechSynthesis.cancel()
  }, [canSpeak])

  useEffect(() => stopAll, [stopAll])

  const respond = useCallback(
    (text) => {
      const question = text.trim()
      if (!question) {
        setStatus('idle')
        return
      }
      setLog((l) => [...l, { role: 'user', text: question }])
      setStatus('thinking')
      timer.current = setTimeout(
        () => {
          const answer = reply(personaRef.current, question)
          setLog((l) => [...l, { role: 'bot', text: answer.text }])
          if (speakRef.current && canSpeak) {
            const utterance = new SpeechSynthesisUtterance(speechText(answer.text))
            utterance.lang = 'en-US'
            utterance.onend = () => setStatus('idle')
            utterance.onerror = () => setStatus('idle')
            setStatus('speaking')
            window.speechSynthesis.cancel()
            window.speechSynthesis.speak(utterance)
          } else {
            setStatus('idle')
          }
        },
        reduced ? 0 : 600,
      )
    },
    [canSpeak, reduced],
  )

  const listen = () => {
    setNotice('')
    if (status === 'listening') {
      recognition.current?.stop()
      return
    }
    stopAll()
    if (!SR) {
      setNotice('Your browser does not support speech recognition. Type your question below instead.')
      return
    }
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.continuous = false
    let finalText = ''
    rec.onresult = (e) => {
      let interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const piece = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += piece
        else interimText += piece
      }
      setInterim(interimText)
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setNotice('The microphone is blocked. Allow it in your browser, or type your question below.')
      } else if (e.error === 'no-speech') {
        setNotice("I didn't hear anything. Try again, a little closer to the microphone.")
      } else if (e.error !== 'aborted') {
        setNotice('Speech recognition had a problem. You can type your question instead.')
      }
    }
    rec.onend = () => {
      setInterim('')
      if (finalText.trim()) respond(finalText)
      else setStatus((s) => (s === 'listening' ? 'idle' : s))
    }
    recognition.current = rec
    try {
      rec.start()
      setStatus('listening')
    } catch {
      setNotice('Could not start the microphone. You can type your question instead.')
    }
  }

  const persona = PERSONAS.find((p) => p.id === personaId)
  const orbTone = status === 'listening' ? 'from-[#9ED8FF] to-[#B39DFF]' : status === 'speaking' ? 'from-[#FF8FB8] to-[#FFAB7A]' : 'from-[#FFC9A6] to-[#FFAB7A]'

  return (
    <AppScreen accent="peach" scroll={false} title="Chat with me" subtitle={`${persona.name} · ${persona.role}`}>
      <div className="flex h-full min-h-0 flex-col @2xl:flex-row">
        <div className="flex shrink-0 flex-col items-center px-5 pb-3 @2xl:w-[26rem] @2xl:justify-center @2xl:pb-6">
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Choose a voice persona">
            {PERSONAS.map((p) => (
              <KChip key={p.id} active={p.id === personaId} onClick={() => setPersonaId(p.id)}>
                {p.name}
              </KChip>
            ))}
          </div>

          <div className="relative mt-4 flex h-36 w-36 items-center justify-center @2xl:mt-8 @2xl:h-48 @2xl:w-48">
            {!reduced && (status === 'listening' || status === 'speaking') && (
              <>
                <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${orbTone} opacity-40 animate-ping`} />
                <span className={`absolute inset-3 rounded-full bg-gradient-to-br ${orbTone} opacity-40 animate-pulse`} />
              </>
            )}
            <button
              type="button"
              onClick={listen}
              aria-pressed={status === 'listening'}
              aria-label={status === 'listening' ? 'Stop listening' : 'Start speaking'}
              className={`relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br ${orbTone} text-kw-ink shadow-[0_14px_0_-4px_rgba(255,171,122,0.35),0_22px_30px_-14px_rgba(74,59,92,0.4)] transition-transform hover:scale-105 active:scale-95 @2xl:h-36 @2xl:w-36`}
            >
              {status === 'thinking' ? (
                <span className="flex gap-1.5" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`h-2.5 w-2.5 rounded-full bg-kw-ink ${reduced ? '' : 'animate-bounce'}`} style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </span>
              ) : status === 'speaking' ? (
                <KawaiiFace seed={personaId === 'nova' ? 0 : personaId === 'atlas' ? 1 : 2} className="h-20 w-20 @2xl:h-24 @2xl:w-24" />
              ) : (
                <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4a3 3 0 013 3v4a3 3 0 11-6 0V7a3 3 0 013-3zM6 11a6 6 0 0012 0M12 17v3" />
                </svg>
              )}
            </button>
          </div>

          <p className="mt-1 text-sm font-black text-kw-ink" role="status" aria-live="polite">
            {STATUS_TEXT[status]}
          </p>
          {interim && <p className="mt-1 text-sm font-semibold italic text-kw-muted">{interim}</p>}
          {notice && <p className="mt-2 max-w-xs text-center text-xs font-bold text-[#B3542A]">{notice}</p>}
          {status === 'speaking' && (
            <KButton
              variant="plain"
              onClick={() => {
                window.speechSynthesis.cancel()
                setStatus('idle')
              }}
              className="mt-2 !px-3 !py-1.5 !text-xs"
            >
              Stop speaking
            </KButton>
          )}
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col px-5 pb-3 @2xl:border-l-2 @2xl:border-kw-line @2xl:pt-1">
          <div ref={logEnd} className="kw-scroll min-h-0 flex-1 space-y-2 overflow-y-auto rounded-3xl border-2 border-kw-line bg-white p-3" role="log" aria-label="Transcript">
            {log.length === 0 && <p className="text-sm font-semibold text-kw-muted">Say or type something like &ldquo;Where is my order?&rdquo; or &ldquo;How much does it cost?&rdquo;</p>}
            {log.map((l, i) => (
              <p key={i} className={`whitespace-pre-line text-sm font-semibold ${l.role === 'user' ? 'text-right text-(--kw-accent-ink)' : 'text-kw-ink'}`}>
                <span className="mr-1 text-[11px] font-black uppercase tracking-wide text-kw-muted">{l.role === 'user' ? 'You' : persona.name}</span>
                <br />
                {l.text}
              </p>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              const text = typed
              setTyped('')
              stopAll()
              respond(text)
            }}
            className="mt-3 flex shrink-0 gap-2"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              maxLength={200}
              placeholder="Or type your question..."
              aria-label="Type your question"
              className="min-w-0 flex-1 rounded-2xl border-2 border-kw-line bg-white px-4 py-2.5 text-sm font-semibold text-kw-ink placeholder:text-kw-muted/70 outline-none focus:border-(--kw-accent)"
            />
            <KButton type="submit" disabled={!typed.trim()}>
              Ask
            </KButton>
          </form>

          <div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.slice(0, 3).map((s) => (
                <button key={s} type="button" onClick={() => respond(s)} className="rounded-full border-2 border-kw-line bg-white px-2.5 py-1 text-[11px] font-bold text-kw-muted hover:border-(--kw-accent)">
                  {s}
                </button>
              ))}
            </div>
            {canSpeak && (
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-kw-ink">
                <input type="checkbox" checked={speakReplies} onChange={(e) => setSpeakReplies(e.target.checked)} className="h-4 w-4 accent-[#FFAB7A]" />
                Speak replies
              </label>
            )}
          </div>

          <details className="mt-2 shrink-0 rounded-2xl bg-(--kw-accent-soft) px-3 py-2 text-xs font-semibold text-kw-ink">
            <summary className="cursor-pointer font-black text-(--kw-accent-ink)">About your voice</summary>
            <p className="mt-1 leading-relaxed">
              This demo uses your browser&rsquo;s own speech tools. Some browsers (for example Chrome) send the audio to their provider to turn it into text. This website does not receive or store your voice, and the microphone only starts when you press the button.
            </p>
          </details>
        </div>
      </div>
    </AppScreen>
  )
}
