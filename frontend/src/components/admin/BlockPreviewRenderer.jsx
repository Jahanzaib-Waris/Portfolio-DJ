import { renderSvgIcon } from '../../utils/blogBlocks'

/**
 * Visual Preview of the block on the canvas, rendered with actual FlowBase styles.
 * If the block is a container, it renders its children recursively inside flex layout.
 * Tapping any block (container or atomic child) selects it in the properties inspector.
 */
export default function BlockPreviewRenderer({
  block,
  isSelected,
  onSelect,
  selectedBlockId,
  onSelectChild,
}) {
  const handleClick = (e) => {
    e.stopPropagation()
    onSelect(block.id)
  }

  const renderContent = () => {
    switch (block.type) {
      /* ---- Container / Flex Layout (Figma Auto-Layout / FlutterFlow Row/Column) ---- */
      case 'container': {
        const dirClass = block.direction === 'column' ? 'fb-flex-col' : 'fb-flex-row'
        const wrapClass = block.wrap ? 'fb-flex-wrap' : 'fb-flex-nowrap'
        const justifyClass =
          block.justify === 'center'
            ? 'fb-justify-center'
            : block.justify === 'between'
            ? 'fb-justify-between'
            : block.justify === 'end'
            ? 'fb-justify-end'
            : 'fb-justify-start'
        const alignClass =
          block.align === 'start'
            ? 'fb-items-start'
            : block.align === 'stretch'
            ? 'fb-items-stretch'
            : 'fb-items-center'
        const gapClass = `fb-gap-${block.gap || 'md'}`
        const padClass = `fb-pad-${block.padding || 'md'}`
        const bgClass = `fb-bg-${block.background || 'none'}`
        const borderClass = `fb-border-${block.border || 'none'}`
        const radiusClass = `fb-radius-${block.radius || 'md'}`

        const children = block.children || []

        return (
          <div
            className={`fb-container min-h-[4rem] !my-0 ${dirClass} ${wrapClass} ${justifyClass} ${alignClass} ${gapClass} ${padClass} ${bgClass} ${borderClass} ${radiusClass}`}
          >
            {children.length > 0 ? (
              children.map((child) => (
                <div
                  key={child.id}
                  className="flex-1 min-w-[140px]"
                >
                  <BlockPreviewRenderer
                    block={child}
                    isSelected={selectedBlockId === child.id}
                    onSelect={onSelectChild || onSelect}
                    selectedBlockId={selectedBlockId}
                    onSelectChild={onSelectChild}
                  />
                </div>
              ))
            ) : (
              <div className="w-full py-4 text-center text-xs text-slate-500 italic border border-dashed border-panel-edge/60 rounded-lg">
                Empty container — add child blocks in inspector
              </div>
            )}
          </div>
        )
      }

      /* ---- Heading ---- */
      case 'heading': {
        const Tag = ['h2', 'h3', 'h4'].includes(block.level) ? block.level : 'h2'
        const alignClass =
          block.align === 'center'
            ? 'text-center'
            : block.align === 'right'
            ? 'text-right'
            : 'text-left'

        return (
          <div className={`fb-block fb-block-heading !my-0 ${alignClass}`}>
            {block.kicker && <span className="fb-block-kicker">{block.kicker}</span>}
            <Tag className="!my-0">{block.text || <span className="text-slate-600 italic">Heading text...</span>}</Tag>
          </div>
        )
      }

      /* ---- Text / Paragraph ---- */
      case 'text':
      case 'paragraph': {
        return (
          <div className="fb-block fb-block-text !my-0">
            {block.html ? (
              <div dangerouslySetInnerHTML={{ __html: block.html }} />
            ) : (
              <p className="text-slate-600 italic">Empty text block — click to edit in sidebar</p>
            )}
          </div>
        )
      }

      /* ---- Image ---- */
      case 'image': {
        const radClass = `fb-radius-${block.radius || 'md'}`
        const fitClass = block.fit === 'contain' ? 'fb-img-contain' : 'fb-img-cover'
        const style = block.width && block.width !== '100%' && block.width !== 'auto' ? { width: block.width } : {}

        return block.src ? (
          <figure className={`fb-block fb-atomic-image ${radClass} !my-0`} style={style}>
            <img src={block.src} alt={block.alt || ''} className={`${fitClass} ${radClass}`} />
            {block.caption && <figcaption className="fb-image-caption">{block.caption}</figcaption>}
          </figure>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-panel-edge/80 bg-abyss/40 py-6 text-center text-xs text-slate-500">
            <svg className="mb-1.5 h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Empty Image</span>
          </div>
        )
      }

      /* ---- Icon Badge ---- */
      case 'icon_badge': {
        const variant = block.variant || 'primary'
        return (
          <div className={`fb-block fb-icon-badge fb-badge--${variant} !my-0`}>
            <span
              className="fb-badge-icon"
              dangerouslySetInnerHTML={{ __html: renderSvgIcon(block.icon || 'bolt') }}
            />
            <span className="fb-badge-text">{block.text || 'Badge Text'}</span>
          </div>
        )
      }

      /* ---- Button ---- */
      case 'button': {
        const variant =
          block.variant === 'secondary'
            ? 'system-button-secondary'
            : block.variant === 'subtle'
            ? 'fb-btn-subtle'
            : 'system-button-primary'

        return (
          <div className="fb-block fb-atomic-button !my-0">
            <span className={`${variant} inline-block pointer-events-none`}>{block.text || 'Action Button'}</span>
          </div>
        )
      }

      /* ---- Code Block ---- */
      case 'code': {
        const lang = block.language || 'dart'
        return (
          <div className="fb-block fb-code-card !my-0">
            <div className="fb-code-bar">
              <span className="fb-code-dot" />
              <span className="fb-code-dot" />
              <span className="fb-code-dot" />
              {block.filename && <span className="fb-code-filename">{block.filename}</span>}
              <span className="fb-code-lang ml-auto">{lang}</span>
            </div>
            <pre>
              <code className={`language-${lang}`}>
                {block.code || '// Paste code in properties drawer'}
              </code>
            </pre>
          </div>
        )
      }

      /* ---- Callout / Alert Box ---- */
      case 'callout': {
        const style = ['info', 'tip', 'warning', 'success'].includes(block.style) ? block.style : 'info'
        return (
          <div className={`fb-block fb-callout fb-callout--${style} !my-0`}>
            {block.title && <strong className="fb-callout-title">{block.title}</strong>}
            <div className="fb-callout-body">{block.text || <span className="text-slate-600 italic">Callout message...</span>}</div>
          </div>
        )
      }

      /* ---- Quote ---- */
      case 'quote': {
        return (
          <blockquote className="fb-block fb-pull-quote !my-0">
            <p>"{block.quote || 'Quote text...'}"</p>
            {block.author && (
              <cite className="fb-quote-author">
                {block.author}
                {block.role && <span className="fb-quote-role"> — {block.role}</span>}
              </cite>
            )}
          </blockquote>
        )
      }

      /* ---- Divider ---- */
      case 'divider': {
        return <hr className={`fb-block fb-divider fb-divider--${block.style || 'gradient'} !my-0`} />
      }

      /* ---- Classic ---- */
      case 'classic':
      default: {
        return (
          <div className="fb-block !my-0">
            <div dangerouslySetInnerHTML={{ __html: block.html || '<p class="text-slate-600 italic">Empty classic post content</p>' }} />
          </div>
        )
      }
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`markdown-body group/preview relative cursor-pointer rounded-xl p-3 transition-all duration-150 ${
        isSelected
          ? 'ring-2 ring-neon-blue bg-neon-blue/[0.04] shadow-md shadow-neon-blue/10'
          : 'hover:bg-white/[0.02] hover:ring-1 hover:ring-panel-edge'
      }`}
    >
      {renderContent()}

      {/* Floating Tag Badge on Select / Hover */}
      <div className={`absolute right-2 top-2 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/preview:opacity-100'}`}>
        <span
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold ${
            isSelected
              ? 'bg-neon-blue text-white shadow-xs'
              : 'bg-slate-900/90 text-slate-300 border border-panel-edge'
          }`}
        >
          {block.type}
          {isSelected && ' • active'}
        </span>
      </div>
    </div>
  )
}
