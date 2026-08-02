/**
 * DRF returns validation failures as `{ field: ["message"] }` and other
 * problems as `{ detail: "..." }`. These pull the two apart so a form can put
 * messages next to the field that caused them.
 */

export function fieldErrorsFrom(error) {
  const data = error?.response?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  return data
}

export function formErrorFrom(error) {
  if (!error?.response) return 'Cannot reach the server.'

  const data = error.response.data
  if (data?.detail) return String(data.detail)

  if (error.response.status === 403) return 'You do not have permission to do that.'
  if (error.response.status === 413) return 'That file is too large.'

  // Field-level errors are rendered against their fields, so don't repeat them.
  if (data && typeof data === 'object' && Object.keys(data).length) return null

  return 'Something went wrong. Try again.'
}

/** Renders whichever shape DRF used for a single field. */
export function messageFor(fieldErrors, field) {
  const value = fieldErrors?.[field]
  if (!value) return null
  return Array.isArray(value) ? value[0] : String(value)
}
