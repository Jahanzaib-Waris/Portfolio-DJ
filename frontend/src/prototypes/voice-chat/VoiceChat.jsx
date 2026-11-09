import { useCallback, useEffect, useRef, useState } from 'react'
import { Chip, DemoShell } from '../ui'
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

  const orbTone =
    status === 'listening' ? 'from-[#38BDF8] to-[#7C6CFF]' : status === 'speaking' ? 'from-[#F472B6] to-[#7C6CFF]' : 'from-[#7C6CFF] to-[#4C3FD0]'

  return (
    <DemoShell
      title="Voice assistant"
      onReset={() => {
        stopAll()
        setLog([])
        setInterim('')
        setNotice('')
        setStatus('idle')
      }}
    >
      <div className="mx-auto max-w-md">
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Choose a voice persona">
          {PERSONAS.map((p) => (
            <Chip key={p.id} active={p.id === personaId} onClick={() => setPersonaId(p.id)}>
              {p.name}
            </Chip>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center">
          <div className="relative flex h-40 w-40 items-center justify-center">
            {!reduced && (status === 'listening' || status === 'speaking') && (
              <>
                <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${orbTone} opacity-30 animate-ping`} />
                <span className={`absolute inset-3 rounded-full bg-gradient-to-br ${orbTone} opacity-30 animate-pulse`} />
              </>
            )}
            <button
              type="button"
              onClick={listen}
              aria-pressed={status === 'listening'}
              aria-label={status === 'listening' ? 'Stop listening' : 'Start speaking'}
              className={`relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br ${orbTone} text-white shadow-[0_20px_50px_-15px_rgba(124,108,255,0.8)] transition-transform hover:scale-105 focus-visible:outline-offset-4`}
            >
              {status === 'thinking' ? (
                <span className="flex gap-1.5" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`h-2 w-2 rounded-full bg-white ${reduced ? '' : 'animate-bounce'}`} style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </span>
              ) : (
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4a3 3 0 013 3v4a3 3 0 11-6 0V7a3 3 0 013-3zM6 11a6 6 0 0012 0M12 17v3" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-2 text-sm font-medium text-white" role="status" aria-live="polite">
            {STATUS_TEXT[status]}
          </p>
          {interim && <p className="mt-1 text-sm italic text-[#A1A7CA]">{interim}</p>}
          {notice && <p className="mt-2 max-w-sm text-center text-sm text-amber-300">{notice}</p>}
          {status === 'speaking' && (
            <button
              type="button"
              onClick={() => {
                window.speechSynthesis.cancel()
                setStatus('idle')
              }}
              className="mt-3 rounded-lg border border-panel-edge px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-400"
            >
              Stop speaking
            </button>
          )}
        </div>

        <div ref={logEnd} className="mt-5 h-48 space-y-2 overflow-y-auto rounded-xl border border-panel-edge bg-abyss/60 p-3" role="log" aria-label="Transcript">
          {log.length === 0 && <p className="text-sm text-[#A1A7CA]">The conversation appears here. Try &ldquo;Where is my order?&rdquo; or &ldquo;How much does it cost?&rdquo;</p>}
          {log.map((l, i) => (
            <p key={i} className={`whitespace-pre-line text-sm ${l.role === 'user' ? 'text-right text-neon-blue' : 'text-slate-100'}`}>
              <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-[#A1A7CA]">{l.role === 'user' ? 'You' : PERSONAS.find((p) => p.id === personaId).name}</span>
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
          className="mt-3 flex gap-2"
        >
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            maxLength={200}
            placeholder="Or type your question..."
            aria-label="Type your question"
            className="min-w-0 flex-1 rounded-lg border border-panel-edge bg-abyss/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-neon-blue"
          />
          <button type="submit" disabled={!typed.trim()} className="system-button system-button-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
            Ask
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.slice(0, 3).map((s) => (
              <button key={s} type="button" onClick={() => respond(s)} className="rounded-full border border-panel-edge px-2.5 py-1 text-xs text-[#C9CEEA] hover:border-neon-indigo hover:text-white">
                {s}
              </button>
            ))}
          </div>
          {canSpeak && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-200">
              <input type="checkbox" checked={speakReplies} onChange={(e) => setSpeakReplies(e.target.checked)} className="h-3.5 w-3.5 accent-[#6D5AF6]" />
              Speak replies
            </label>
          )}
        </div>

        <p className="mt-4 rounded-lg border border-panel-edge bg-abyss/40 p-3 text-xs leading-relaxed text-[#A1A7CA]">
          <strong className="text-slate-200">About your voice:</strong> this demo uses your browser&rsquo;s own speech tools. Some browsers (for example Chrome) send the audio to
          their provider to turn it into text. This website does not receive or store your voice, and the microphone only starts when you press the button.
        </p>
      </div>
    </DemoShell>
  )
}
