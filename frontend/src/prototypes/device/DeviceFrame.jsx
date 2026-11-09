import { useEffect, useRef, useState } from 'react'
import { DEVICES, DeviceContext } from './deviceContext'

const BEZEL = { mobile: 13, tablet: 20, web: 0 }
const WEB_CHROME = 46
const MIN_HEIGHT_SCALE = 0.5

// Small decorative status-bar icons (static; this is a mockup).
function StatusIcons({ dark }) {
  const c = dark ? '#fff' : '#4A3B5C'
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      <svg width="17" height="11" viewBox="0 0 17 11" fill={c}>
        <rect x="0" y="7" width="3" height="4" rx="1" />
        <rect x="4.5" y="5" width="3" height="6" rx="1" />
        <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
        <rect x="13.5" y="0" width="3" height="11" rx="1" />
      </svg>
      <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round">
        <path d="M1 4a9 9 0 0113 0M3.3 6.3a5.6 5.6 0 018.4 0M5.7 8.6a2.3 2.3 0 013.6 0" />
      </svg>
      <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
        <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke={c} opacity="0.5" />
        <rect x="2" y="2" width="16" height="8" rx="2" fill={c} />
        <rect x="22.5" y="4" width="2" height="4" rx="1" fill={c} opacity="0.5" />
      </svg>
    </span>
  )
}

function Screen({ device, url, children }) {
  const { width, height } = DEVICES[device]
  return (
    <div className="kw-app @container relative flex flex-col overflow-hidden" style={{ width, height, containerType: 'inline-size' }}>
      {device !== 'web' && (
        <div className="relative z-10 flex h-11 shrink-0 items-center justify-between px-7 text-[13px] font-semibold">
          <span>9:41</span>
          {device === 'mobile' && <span className="absolute left-1/2 top-2.5 h-[26px] w-[96px] -translate-x-1/2 rounded-full bg-[#14121c]" aria-hidden="true" />}
          <StatusIcons />
        </div>
      )}
      <div className="relative min-h-0 flex-1">
        {children}
      </div>
      {device !== 'web' && (
        <div className="flex h-6 shrink-0 items-center justify-center" aria-hidden="true">
          <span className="h-1 w-32 rounded-full bg-kw-ink/70" />
        </div>
      )}
      {device === 'web' && url ? <span className="sr-only">{url}</span> : null}
    </div>
  )
}

/**
 * Draws the demo inside a phone, tablet or browser-window mockup. The frame keeps its natural
 * pixel size (so the app inside lays out as it would on that device) and is scaled down with a
 * transform when the page is narrower or shorter than the device. On real phones (narrow viewports) it drops the mockup
 * and the demo simply fills a rounded screen.
 */
export default function DeviceFrame({ device, url = 'app.example.com', maxHeight = Infinity, children }) {
  const wrapRef = useRef(null)
  const [avail, setAvail] = useState(900)
  const [phone, setPhone] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const mq = window.matchMedia ? window.matchMedia('(max-width: 640px)') : null
    const measure = () => {
      setAvail(el.getBoundingClientRect().width || 900)
      setPhone(Boolean(mq?.matches))
    }
    measure()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(el)
    mq?.addEventListener('change', measure)
    return () => {
      observer?.disconnect()
      mq?.removeEventListener('change', measure)
    }
  }, [])

  if (phone) {
    return (
      <div ref={wrapRef} className="w-full">
        <div className="kw-app @container overflow-hidden rounded-[28px] border border-panel-edge" style={{ height: 660, containerType: 'inline-size' }}>
          <DeviceContext.Provider value={{ device: 'mobile', scale: 1, frameless: true }}>{children}</DeviceContext.Provider>
        </div>
      </div>
    )
  }

  const { width, height } = DEVICES[device]
  const bezel = BEZEL[device]
  const outerW = width + bezel * 2
  const outerH = (device === 'web' ? height + WEB_CHROME : height) + bezel * 2
  // Fit the page's width first, then shrink further (down to half size) so the whole device
  // is on screen at once; below that the page simply scrolls.
  const scale = Math.min(1, (avail - 8) / outerW, Math.max(maxHeight / outerH, MIN_HEIGHT_SCALE))

  return (
    <div ref={wrapRef} className="w-full">
      <div className="mx-auto" style={{ width: outerW * scale, height: outerH * scale }}>
        <div style={{ width: outerW, height: outerH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {device === 'web' ? (
            <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#2f3350] bg-[#1b1e33] shadow-[0_40px_90px_-40px_rgba(124,108,255,0.55)]">
              <div className="flex shrink-0 items-center gap-3 border-b border-[#2f3350] px-4" style={{ height: WEB_CHROME }}>
                <span className="flex gap-2" aria-hidden="true">
                  <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                  <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                  <span className="h-3 w-3 rounded-full bg-[#28C840]" />
                </span>
                <span className="mx-auto flex h-7 w-[46%] items-center justify-center gap-1.5 rounded-lg bg-[#0f1122] text-xs text-[#A1A7CA]">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 118 0v3" />
                  </svg>
                  {url}
                </span>
                <span className="w-14" aria-hidden="true" />
              </div>
              <DeviceContext.Provider value={{ device, scale, frameless: false }}>
                <Screen device={device} url={url}>
                  {children}
                </Screen>
              </DeviceContext.Provider>
            </div>
          ) : (
            <div className="relative h-full" style={{ padding: bezel }}>
              {/* titanium body */}
              <div
                className="absolute inset-0 border border-[#3a3d57] bg-gradient-to-b from-[#23263d] to-[#12141f] shadow-[0_40px_90px_-30px_rgba(124,108,255,0.55),inset_0_0_0_2px_rgba(255,255,255,0.04)]"
                style={{ borderRadius: device === 'mobile' ? 58 : 38 }}
                aria-hidden="true"
              />
              {device === 'mobile' && (
                <>
                  <span className="absolute -left-[3px] top-28 h-8 w-[3px] rounded-l bg-[#3a3d57]" aria-hidden="true" />
                  <span className="absolute -left-[3px] top-44 h-14 w-[3px] rounded-l bg-[#3a3d57]" aria-hidden="true" />
                  <span className="absolute -right-[3px] top-40 h-20 w-[3px] rounded-r bg-[#3a3d57]" aria-hidden="true" />
                </>
              )}
              {device === 'tablet' && <span className="absolute left-1/2 top-[7px] h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-[#05060b]" aria-hidden="true" />}
              <div className="relative h-full overflow-hidden" style={{ borderRadius: device === 'mobile' ? 46 : 22 }}>
                <DeviceContext.Provider value={{ device, scale, frameless: false }}>
                  <Screen device={device} url={url}>
                    {children}
                  </Screen>
                </DeviceContext.Provider>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
