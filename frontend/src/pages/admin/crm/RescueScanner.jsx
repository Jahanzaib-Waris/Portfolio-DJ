import { useState } from 'react'
import { APP_STORE_COUNTRIES, searchApps } from '../../../api/appStoreClient'
import { useToast } from '../../../components/admin/toastStore'
import { inputClass } from '../../../components/admin/formStyles'
import { Skeleton } from '../../../components/Skeleton'
import StatusPanel from '../../../components/StatusPanel'

const EXAMPLE_TERMS = ['habit tracker', 'expense tracker', 'fitness planner', 'language learning', 'invoice maker']

/**
 * App Store rescue scanner (prototype). Searches Apple's public catalogue and ranks apps
 * by signs they need help: low or falling ratings and no recent updates.
 * Import / pitch actions are handled by ClientRadar through the props below.
 */
export default function RescueScanner({ items, setItems, importedMap, importingId, onImport, onOpenPitch }) {
  const toast = useToast()
  const [term, setTerm] = useState('')
  const [country, setCountry] = useState('us')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [showHealthy, setShowHealthy] = useState(false)

  const runSearch = async (value = term) => {
    if (!value.trim()) return
    setLoading(true)
    try {
      setItems(await searchApps(value, { country }))
      setSearched(true)
    } catch (err) {
      toast.error(err.message || 'App Store search failed.')
    } finally {
      setLoading(false)
    }
  }

  const visible = items.filter((item) => showHealthy || item.rescue.score >= 30)

  return (
    <div className="space-y-4">
      <StatusPanel glow={false} className="space-y-3 p-4">
        <p className="text-sm text-slate-300">
          Search a niche your studio builds in. Apps with low or falling ratings and no recent updates rank
          highest, and the publisher&rsquo;s website gives you a way in. This reads Apple&rsquo;s public App
          Store search; results are a lead list, not a verdict, so check the app before reaching out.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            runSearch()
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="e.g. habit tracker"
            aria-label="App Store search term"
            className={`${inputClass} sm:flex-1`}
          />
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-label="App Store country"
            className={`${inputClass} sm:w-44`}
          >
            {APP_STORE_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading || !term.trim()}
            className="rounded-lg border border-neon-blue/40 bg-neon-blue/15 px-4 py-2 text-sm font-semibold text-neon-blue transition-colors hover:bg-neon-blue/25 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>Try:</span>
          {EXAMPLE_TERMS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTerm(t)
                runSearch(t)
              }}
              className="rounded-full border border-panel-edge px-2.5 py-1 hover:border-slate-400 hover:text-white"
            >
              {t}
            </button>
          ))}
          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={showHealthy}
              onChange={(e) => setShowHealthy(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#6D5AF6]"
            />
            Show healthy apps too
          </label>
        </div>
      </StatusPanel>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!loading && searched && visible.length === 0 && (
        <StatusPanel className="p-8 text-center text-sm text-slate-400">
          No rescue candidates for this search. Try another niche or tick &ldquo;Show healthy apps too&rdquo;.
        </StatusPanel>
      )}

      {!loading && visible.length > 0 && (
        <ul className="space-y-2">
          {visible.map((item) => {
            const isImported = Boolean(importedMap[item.id])
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-panel-edge bg-panel/70 p-3.5 sm:flex-row sm:items-center sm:p-4"
              >
                {item.app.icon ? (
                  <img src={item.app.icon} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-xl border border-panel-edge" />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-xl border border-dashed border-panel-edge" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{item.app.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {item.company} &middot; {item.app.genre}
                    {item.website && (
                      <>
                        {' '}
                        &middot;{' '}
                        <a href={item.website} target="_blank" rel="noreferrer" className="text-neon-blue hover:underline">
                          website
                        </a>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">{item.rescue.reasons.join(' · ') || 'No weak signals found'}</p>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <span className="rounded-lg border border-panel-edge bg-abyss px-2.5 py-1 text-xs font-bold text-white">
                    {item.rescue.score} pts
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white">
                      App Store
                    </a>
                    {isImported ? (
                      <button type="button" onClick={() => onOpenPitch(item)} className="font-semibold text-emerald-300 hover:underline">
                        In CRM · Open pitch
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={importingId === item.id}
                        onClick={() => onImport(item)}
                        className="rounded-md border border-neon-blue/50 px-3 py-1.5 text-neon-blue hover:bg-neon-blue/10 disabled:opacity-50"
                      >
                        {importingId === item.id ? 'Importing...' : 'Add to CRM'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
