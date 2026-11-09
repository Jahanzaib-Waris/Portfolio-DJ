const pad = (n) => String(n).padStart(2, '0')

/** Today's date (or the given Date) as YYYY-MM-DD in the browser's local timezone. */
export const localDateStr = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
