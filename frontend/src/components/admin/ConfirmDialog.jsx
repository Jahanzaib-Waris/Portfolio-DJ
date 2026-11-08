import { useEffect } from 'react'

import SystemButton from '../SystemButton'

/** Modal confirmation for destructive actions. Escape and backdrop both cancel. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs px-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="system-panel w-full max-w-sm p-6 border border-panel-edge" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 text-sm font-bold">
            ⚠️
          </span>
          <h2 id="confirm-dialog-title" className="system-heading text-base font-bold text-white">{title}</h2>
        </div>
        <p id="confirm-dialog-message" className="mt-3 text-xs leading-relaxed text-slate-300">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <SystemButton onClick={onCancel} disabled={busy} autoFocus>
            Cancel
          </SystemButton>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg border border-status-red/60 bg-status-red/15 px-4 py-2 text-xs font-semibold text-status-red transition-colors hover:bg-status-red/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
