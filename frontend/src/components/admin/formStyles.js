// Shared input styling for the admin forms. Kept out of the component files so
// a module never exports both a component and a constant, which breaks Fast Refresh.

export const inputClass =
  'w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/30 focus:ring-offset-1 focus:ring-offset-void'

export const fileInputClass =
  'w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border file:border-panel-edge file:bg-abyss/60 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-200 hover:file:border-neon-blue/60 hover:file:bg-panel transition-colors'

// Shared compact data-table styling for admin list pages.
export const tableWrapClass =
  'mt-4 overflow-x-auto rounded-lg border border-panel-edge bg-panel/60'
export const thClass =
  'px-3 py-2 text-left text-xs font-medium text-slate-400 whitespace-nowrap sm:px-4'
export const tdClass = 'px-3 py-2.5 align-middle sm:px-4'
export const rowClass = 'transition-colors hover:bg-panel-edge/30'
export const editButtonClass =
  'rounded-md border border-neon-blue/50 px-3 py-1.5 text-xs text-neon-blue transition-colors hover:bg-neon-blue/10'
