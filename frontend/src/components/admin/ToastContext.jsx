import { useCallback, useState } from 'react'
import { ToastContext } from './toastStore'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5)
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto dismiss after 3.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
        aria-live="polite"
        role="region"
      >
        {toasts.map((t) => {
          let border = 'border-panel-edge'
          let icon = 'ℹ️'
          let bg = 'bg-panel/95'
          let text = 'text-slate-100'

          if (t.type === 'success') {
            border = 'border-emerald-500/50'
            icon = '✓'
            bg = 'bg-[#0B1E19]/95'
            text = 'text-emerald-300'
          } else if (t.type === 'error') {
            border = 'border-rose-500/50'
            icon = '✕'
            bg = 'bg-[#2A0E13]/95'
            text = 'text-rose-300'
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-in ${border} ${bg}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                t.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : t.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-neon-blue/20 text-neon-blue'
              }`}>
                {icon}
              </span>
              <p className={`text-xs font-medium leading-relaxed flex-1 ${text}`}>{t.message}</p>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white text-xs p-0.5"
                aria-label="Dismiss toast"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
