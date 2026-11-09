import { Fragment, useEffect, useState } from 'react'
import DeviceFrame from './DeviceFrame'
import { DEVICES } from './deviceContext'

// Remembers the visitor's last choice while they move between prototypes (not saved anywhere).
let lastDevice = 'mobile'

const ICONS = {
  mobile: <path d="M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zm3 16h2" />,
  tablet: <path d="M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1zm5.5 15.5h1" />,
  web: <path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm5 15h6m-3-3v3" />,
}

/** Device switcher + reset above a framed demo. Children are the demo (screen content). */
export default function DemoStage({ url, children }) {
  const [device, setDevice] = useState(lastDevice)
  const [resetKey, setResetKey] = useState(0)
  const [phone, setPhone] = useState(false)
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight))

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(max-width: 640px)') : null
    const update = () => setPhone(Boolean(mq?.matches))
    update()
    mq?.addEventListener('change', update)
    return () => mq?.removeEventListener('change', update)
  }, [])

  const choose = (d) => {
    lastDevice = d
    setDevice(d)
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {phone ? (
          <p className="text-xs text-[#A1A7CA]">Shown at your screen size. Open on a laptop to compare tablet and web layouts.</p>
        ) : (
          <div role="radiogroup" aria-label="Preview on a device" className="inline-flex rounded-xl border border-panel-edge bg-abyss/70 p-0.5">
            {Object.entries(DEVICES).map(([id, d]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={device === id}
                onClick={() => choose(id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1 text-[13px] font-medium transition-colors ${
                  device === id ? 'bg-neon-deep text-white shadow' : 'text-[#A1A7CA] hover:text-white'
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {ICONS[id]}
                </svg>
                {d.label}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setResetKey((k) => k + 1)}
          className="rounded-lg border border-panel-edge px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-neon-indigo hover:text-white"
        >
          Reset demo
        </button>
      </div>

      {/* The frame may use the screen height minus the site header, this toolbar and a little air. */}
      <DeviceFrame device={device} url={url} maxHeight={Math.max(320, vh - 140)}>
        <Fragment key={resetKey}>{children}</Fragment>
      </DeviceFrame>
    </div>
  )
}
