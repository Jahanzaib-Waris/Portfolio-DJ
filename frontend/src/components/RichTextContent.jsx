import DOMPurify from 'dompurify'

/**
 * Renders HTML produced by the admin panel's rich-text editor (see
 * components/admin/RichTextEditor.jsx).
 *
 * Sanitized here rather than trusted as-is: ProseMirror's schema already
 * restricts what can be typed into the editor, but this is the actual
 * `dangerouslySetInnerHTML` boundary, and a compromised admin account
 * shouldn't be able to turn into stored XSS against every site visitor.
 */
export default function RichTextContent({ children, className = '' }) {
  const clean = DOMPurify.sanitize(children || '')

  return <div className={`markdown-body ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />
}
