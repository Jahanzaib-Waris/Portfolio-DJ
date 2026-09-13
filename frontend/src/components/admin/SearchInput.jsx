import { inputClass } from './formStyles'

/**
 * Filters over whatever's already loaded on screen — not a server-side
 * search. That's a real limit worth knowing: with "Load more" pagination,
 * a term only matches items fetched so far, not the full remote list.
 */
export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputClass} max-w-xs`}
      aria-label={placeholder}
    />
  )
}
