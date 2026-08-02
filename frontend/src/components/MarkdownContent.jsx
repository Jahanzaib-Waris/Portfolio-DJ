import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * The single Markdown renderer, shared by the public post page and the admin
 * editor's preview pane.
 *
 * Sharing it is the point: a preview rendered by different code than the live
 * page is a preview you can't trust.
 */
export default function MarkdownContent({ children, className = '' }) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // `node` is react-markdown's AST entry — strip it so it doesn't land
          // on the DOM element as an unknown attribute.
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
