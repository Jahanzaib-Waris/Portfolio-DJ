/**
 * Mirrors what Django's SlugField will accept: lowercase, ASCII, hyphen-joined.
 *
 * Used to suggest a slug from the title while the author hasn't set one by
 * hand. The server is still the authority — it enforces uniqueness, which this
 * can't know about.
 */
export default function slugify(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents: "Café" -> "Cafe"
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220) // BlogPost.slug max_length
}
