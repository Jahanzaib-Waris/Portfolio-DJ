import { useEffect } from 'react'

function setMetaDescription(content) {
  let tag = document.querySelector('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.name = 'description'
    document.head.appendChild(tag)
  }
  tag.content = content
}

/**
 * Sets the browser tab title and meta description for the page it's called
 * from. Each public page owns its own title outright — nothing else writes
 * document.title after mount — so there's no race between this and, say,
 * PublicLayout's profile fetch resolving late.
 */
export default function useDocumentMeta(title, description) {
  useEffect(() => {
    if (title) document.title = title
    if (description) setMetaDescription(description)
  }, [title, description])
}
