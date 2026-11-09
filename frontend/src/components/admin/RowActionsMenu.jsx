import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const itemClass =
  'flex w-full items-center px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:bg-panel-edge/60 focus:bg-panel-edge/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'

/**
 * Compact "⋯" overflow menu for secondary row actions.
 *
 * items: [{ label, to?, href?, onSelect?, danger?, disabled?, hidden? }]
 * The menu is position: fixed so it is not clipped by a scrolling table wrapper.
 */
export default function RowActionsMenu({ items, label = 'Row actions' }) {
  const visible = items.filter((item) => !item.hidden)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()

  const close = useCallback((returnFocus = false) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }, [])

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 176
      setPos({
        top: rect.bottom + 4,
        left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
      })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return undefined
    menuRef.current?.querySelector('[role="menuitem"]:not(:disabled)')?.focus()

    const onPointerDown = (e) => {
      if (menuRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return
      close()
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close(true)
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const els = [...menuRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')]
        if (!els.length) return
        const i = els.indexOf(document.activeElement)
        const next = e.key === 'ArrowDown' ? (i + 1) % els.length : (i - 1 + els.length) % els.length
        els[next].focus()
      }
    }
    const onViewportChange = () => close()

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [open, close])

  if (visible.length === 0) return null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        title={label}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-panel-edge text-slate-300 transition-colors hover:border-slate-400 hover:text-white"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="10" r="1.6" />
          <circle cx="10" cy="10" r="1.6" />
          <circle cx="16" cy="10" r="1.6" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 176 }}
          className="z-50 overflow-hidden rounded-lg border border-panel-edge bg-panel py-1 shadow-xl shadow-black/40"
        >
          {visible.map((item) => {
            const cls = `${itemClass} ${item.danger ? '!text-status-red' : ''}`
            if (item.to) {
              return (
                <Link key={item.label} to={item.to} role="menuitem" className={cls} onClick={() => close()}>
                  {item.label}
                </Link>
              )
            }
            if (item.href) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  className={cls}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noreferrer' : undefined}
                  onClick={() => close()}
                >
                  {item.label}
                </a>
              )
            }
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={cls}
                onClick={() => {
                  close()
                  item.onSelect?.()
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
