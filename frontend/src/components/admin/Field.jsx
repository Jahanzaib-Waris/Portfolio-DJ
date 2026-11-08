/** Label + control + error message, so the four admin forms stay consistent. */
export default function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="system-heading mb-1.5 block text-xs font-semibold text-slate-300">
          {label} {hint && <span className="font-normal font-sans text-xs text-slate-400 ml-1">{hint}</span>}
        </label>
      )}
      {children}
      {error && <p role="alert" className="mt-1.5 text-xs font-medium text-status-red">{error}</p>}
    </div>
  )
}
