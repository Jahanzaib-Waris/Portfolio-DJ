// Shared input styling for the admin forms. Kept out of the component files so
// a module never exports both a component and a constant, which breaks Fast Refresh.

export const inputClass =
  'w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-neon-blue'

export const fileInputClass =
  'w-full text-xs text-slate-400 file:mr-3 file:rounded-md file:border file:border-panel-edge file:bg-abyss/60 file:px-3 file:py-1.5 file:text-xs file:text-slate-200'
