import { useEffect, useMemo, useRef } from 'react'
import DOMPurify from 'dompurify'

/**
 * Renders HTML produced by the admin panel's rich-text editor (see
 * components/admin/RichTextEditor.jsx).
 *
 * Sanitized with DOMPurify and automatically enhanced with 1-click
 * Copy buttons on all <pre> code blocks.
 */
export default function RichTextContent({ children, className = '' }) {
  const containerRef = useRef(null)
  const clean = useMemo(() => DOMPurify.sanitize(children || ''), [children])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const preElements = el.querySelectorAll('pre')
    preElements.forEach((pre) => {
      if (pre.querySelector('.copy-code-btn')) return

      pre.style.position = 'relative'
      const btn = document.createElement('button')
      btn.className = 'copy-code-btn'
      btn.type = 'button'
      btn.textContent = 'Copy'
      btn.setAttribute('aria-label', 'Copy code snippet')

      btn.addEventListener('click', () => {
        const code = pre.querySelector('code')?.innerText || pre.innerText
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = '✓ Copied'
          btn.classList.add('copied')
          setTimeout(() => {
            btn.textContent = 'Copy'
            btn.classList.remove('copied')
          }, 2000)
        }).catch(() => {})
      })

      pre.appendChild(btn)
    })
  }, [clean])

  return (
    <div
      ref={containerRef}
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
