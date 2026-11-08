import { Link } from 'react-router-dom'

export default function AdminPageHeader({
  breadcrumbs = [],
  title,
  subtitle,
  badge,
  dirty = false,
  saving = false,
  onSave,
  saveLabel = 'Save Changes',
  backTo,
  children,
}) {
  return (
    <div className="sticky top-0 z-30 -mx-3 -mt-3 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 mb-4 sm:mb-6 border-b border-panel-edge/80 bg-void/90 backdrop-blur-md px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Left Side: Back & Breadcrumbs & Title */}
        <div className="flex items-center gap-3 min-w-0">
          {backTo && (
            <Link
              to={backTo}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-panel-edge bg-abyss text-slate-300 hover:text-white hover:border-neon-blue/60 transition-colors shrink-0"
              title="Back"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
          )}

          <div className="min-w-0">
            {/* Breadcrumb Trail */}
            {breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1
                  return (
                    <span key={idx} className="flex items-center gap-1.5">
                      {crumb.to && !isLast ? (
                        <Link
                          to={crumb.to}
                          className="hover:text-neon-blue transition-colors truncate max-w-[150px]"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={isLast ? 'text-slate-300 font-medium truncate max-w-[200px]' : ''}>
                          {crumb.label}
                        </span>
                      )}
                      {!isLast && <span className="text-slate-600 font-mono">/</span>}
                    </span>
                  )
                })}
              </nav>
            )}

            {/* Title & Status */}
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold font-display tracking-tight text-white truncate leading-tight">
                {title}
              </h1>
              {badge && (
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium border border-panel-edge bg-abyss text-slate-300">
                  {badge}
                </span>
              )}
              {dirty && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved changes
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Side: Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-end">
          {children}

          {backTo && (
            <Link
              to={backTo}
              className="px-3.5 py-1.5 rounded-lg border border-panel-edge text-slate-400 hover:text-white hover:bg-panel-edge/40 text-xs font-medium transition-colors"
            >
              Cancel
            </Link>
          )}

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-neon-blue text-abyss hover:bg-neon-blue/90 disabled:opacity-50 transition-all shadow-sm shadow-neon-blue/20"
            >
              {saving ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-abyss border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{saveLabel}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
