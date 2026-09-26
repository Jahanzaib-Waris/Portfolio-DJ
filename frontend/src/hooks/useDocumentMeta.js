import { useEffect } from 'react'

function setOrCreateMeta(selector, attributeName, attributeValue, content) {
  let tag = document.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attributeName, attributeValue)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setOrCreateCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

/**
 * Sets the browser tab title, meta description, Open Graph tags, Twitter tags,
 * and canonical URL for the current page.
 */
export default function useDocumentMeta(title, description, canonicalPath) {
  useEffect(() => {
    if (title) {
      document.title = title
      setOrCreateMeta('meta[property="og:title"]', 'property', 'og:title', title)
      setOrCreateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    }

    if (description) {
      setOrCreateMeta('meta[name="description"]', 'name', 'description', description)
      setOrCreateMeta('meta[property="og:description"]', 'property', 'og:description', description)
      setOrCreateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    }

    const currentUrl = canonicalPath
      ? `https://portfolio-dj-j1sv.vercel.app${canonicalPath}`
      : window.location.href.split('?')[0]

    setOrCreateCanonical(currentUrl)
    setOrCreateMeta('meta[property="og:url"]', 'property', 'og:url', currentUrl)
  }, [title, description, canonicalPath])
}
