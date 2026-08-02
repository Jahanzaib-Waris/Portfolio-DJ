/** Label + control + error message, so the four admin forms stay consistent. */
export default function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="system-heading mb-1 block text-xs text-slate-400">
          {label} {hint && <span className="font-normal text-slate-600">{hint}</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-status-red">{error}</p>}
    </div>
  )
}
