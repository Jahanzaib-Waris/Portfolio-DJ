/**
 * Builds a request body for a model that has file fields.
 *
 * The awkward part these endpoints share: sending an *existing* file back as
 * its URL string makes DRF try to parse the URL as an upload and reject it. So
 * we only switch to multipart when a new file is genuinely chosen, and
 * otherwise send plain JSON that simply omits the file fields — which leaves
 * whatever is already stored untouched.
 *
 * @param fields   plain scalar fields
 * @param files    { fieldName: File | null } — nulls are ignored
 * @param removals field names to clear on the server
 */
export default function buildPayload(fields, files = {}, removals = []) {
  const hasNewFile = Object.values(files).some(Boolean)

  if (hasNewFile) {
    const data = new FormData()
    Object.entries(fields).forEach(([key, value]) => data.append(key, value ?? ''))
    Object.entries(files).forEach(([key, file]) => {
      if (file) data.append(key, file)
    })
    // An empty string is how multipart clears a file field.
    removals.forEach((key) => {
      if (!files[key]) data.append(key, '')
    })
    return data
  }

  const payload = { ...fields }
  removals.forEach((key) => {
    payload[key] = null
  })
  return payload
}
