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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div className="system-panel w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="system-heading text-base text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <SystemButton onClick={onCancel} disabled={busy}>
            Cancel
          </SystemButton>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md border border-status-red/60 bg-status-red/10 px-5 py-2.5 text-sm font-semibold text-status-red transition-colors hover:bg-status-red/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
