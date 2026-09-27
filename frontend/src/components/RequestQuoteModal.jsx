import { useEffect } from 'react'
import EnquiryForm from './EnquiryForm'

export default function RequestQuoteModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="system-panel w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="fb-kicker mb-1">Start a project</p>
            <h2 className="system-heading text-2xl text-white">Tell me about your app</h2>
            <p className="mt-1 text-xs text-[#A1A7CA]">
              Building something new, fixing something broken, or adding an integration? Send the details and I will get back to you.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-panel-edge text-slate-400 hover:text-white hover:border-neon-indigo transition-colors cursor-pointer"
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>

        <EnquiryForm isModal={true} />
      </div>
    </div>
  )
}
