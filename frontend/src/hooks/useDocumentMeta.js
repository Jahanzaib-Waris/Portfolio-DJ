import { useEffect } from 'react'

const SITE_URL = 'https://jerry-dev-studio.web.app'
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`

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
 * Sets page title, meta description, Open Graph, Twitter cards, canonical URL,
 * and dynamic JSON-LD structured data.
 *
 * Supports both object signature:
 *   useDocumentMeta({ title, description, canonicalPath, image, type, keywords, schema })
 * and legacy positional arguments:
 *   useDocumentMeta(title, description, canonicalPath, options)
 */
export default function useDocumentMeta(titleOrOptions, maybeDescription, maybeCanonicalPath, maybeOptions) {
  let title, description, canonicalPath, image, type, keywords, schema

  if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
    ;({ title, description, canonicalPath, image, type, keywords, schema } = titleOrOptions)
  } else {
    title = titleOrOptions
    description = maybeDescription
    canonicalPath = maybeCanonicalPath
    if (maybeOptions && typeof maybeOptions === 'object') {
      ;({ image, type, keywords, schema } = maybeOptions)
    }
  }

  useEffect(() => {
    // 1. Title
    if (title) {
      document.title = title
      setOrCreateMeta('meta[property="og:title"]', 'property', 'og:title', title)
      setOrCreateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    }

    // 2. Description
    if (description) {
      setOrCreateMeta('meta[name="description"]', 'name', 'description', description)
      setOrCreateMeta('meta[property="og:description"]', 'property', 'og:description', description)
      setOrCreateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    }

    // 3. Keywords
    if (keywords) {
      setOrCreateMeta('meta[name="keywords"]', 'name', 'keywords', keywords)
    }

    // 4. Canonical & URL
    let currentUrl = `${SITE_URL}/`
    if (canonicalPath) {
      if (canonicalPath === '/') {
        currentUrl = `${SITE_URL}/`
      } else {
        const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`
        currentUrl = `${SITE_URL}${cleanPath}`
      }
    } else if (typeof window !== 'undefined') {
      currentUrl = window.location.href.split('?')[0]
    }

    setOrCreateCanonical(currentUrl)
    setOrCreateMeta('meta[property="og:url"]', 'property', 'og:url', currentUrl)
    setOrCreateMeta('meta[name="twitter:url"]', 'name', 'twitter:url', currentUrl)

    // 5. OpenGraph Type & Site Name
    setOrCreateMeta('meta[property="og:type"]', 'property', 'og:type', type || 'website')
    setOrCreateMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Jerry Dev Studio')

    // 6. Image
    const resolvedImage = image
      ? (image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`)
      : DEFAULT_IMAGE
    setOrCreateMeta('meta[property="og:image"]', 'property', 'og:image', resolvedImage)
    setOrCreateMeta('meta[name="twitter:image"]', 'name', 'twitter:image', resolvedImage)

    // 7. Dynamic JSON-LD Structured Data
    let schemaTag = document.getElementById('route-seo-schema')
    if (schema) {
      if (!schemaTag) {
        schemaTag = document.createElement('script')
        schemaTag.id = 'route-seo-schema'
        schemaTag.type = 'application/ld+json'
        document.head.appendChild(schemaTag)
      }
      schemaTag.textContent = JSON.stringify(schema)
    } else if (schemaTag) {
      schemaTag.remove()
    }

    return () => {
      const activeSchema = document.getElementById('route-seo-schema')
      if (activeSchema) {
        activeSchema.remove()
      }
    }
  }, [title, description, canonicalPath, image, type, keywords, schema])
}
