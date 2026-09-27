import { renderSvgIcon, getChildLayoutStyles, getEmbedVideoUrl } from '../../utils/blogBlocks'

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
  isChild = false,
}) {
  const handleClick = (e) => {
    e.stopPropagation()
    onSelect(block.id)
  }

  const renderContent = () => {
    switch (block.type) {
      /* ---- Container / Flex Layout (Figma Auto-Layout / FlutterFlow Row/Column) ---- */
      case 'container': {
        const direction = block.direction || 'row'
        const dirClass = direction === 'column' ? 'fb-flex-col' : 'fb-flex-row'
        const wrapClass = block.wrap !== false ? 'fb-flex-wrap' : 'fb-flex-nowrap'
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
            : block.align === 'end'
            ? 'fb-items-end'
            : block.align === 'center'
            ? 'fb-items-center'
            : direction === 'column'
            ? 'fb-items-stretch'
            : 'fb-items-start'
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
              children.map((child) => {
                const childStyles = getChildLayoutStyles(child, direction)
                return (
                  <div
                    key={child.id}
                    style={childStyles}
                    className="fb-child-item relative transition-all"
                  >
                    <BlockPreviewRenderer
                      block={child}
                      isSelected={selectedBlockId === child.id}
                      onSelect={onSelectChild || onSelect}
                      selectedBlockId={selectedBlockId}
                      onSelectChild={onSelectChild}
                      isChild={true}
                    />
                  </div>
                )
              })
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
        const gradientClass =
          block.gradient && block.gradient !== 'none' ? `fb-heading-gradient--${block.gradient}` : ''

        return (
          <div className={`fb-block fb-block-heading !my-0 w-full ${alignClass} ${gradientClass}`}>
            {block.kicker && <span className="fb-block-kicker">{block.kicker}</span>}
            <Tag className="!my-0">{block.text || <span className="text-slate-600 italic">Heading text...</span>}</Tag>
          </div>
        )
      }

      /* ---- Text / Paragraph ---- */
      case 'text':
      case 'paragraph': {
        return (
          <div className="fb-block fb-block-text !my-0 w-full">
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
        const imgStyles = {}
        if (block.height && block.height !== 'auto') {
          imgStyles.height = block.height
        }
        if (block.aspectRatio && block.aspectRatio !== 'auto') {
          imgStyles.aspectRatio = block.aspectRatio
        }

        return block.src ? (
          <figure className={`fb-block fb-atomic-image ${radClass} !my-0 w-full`}>
            <img
              src={block.src}
              alt={block.alt || ''}
              style={imgStyles}
              className={`w-full ${fitClass} ${radClass}`}
            />
            {block.caption && <figcaption className="fb-image-caption">{block.caption}</figcaption>}
          </figure>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-panel-edge/80 bg-abyss/40 py-6 text-center text-xs text-slate-500 w-full">
            <svg className="mb-1.5 h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium text-slate-400">Empty Image</span>
            <span className="text-[10px] text-slate-600">Select to add URL / upload & control height</span>
          </div>
        )
      }

      /* ---- Data & Comparison Table ---- */
      case 'table': {
        const columns = Array.isArray(block.columns) ? block.columns : []
        const rows = Array.isArray(block.rows) ? block.rows : []
        const stripedClass = block.striped ? 'fb-table--striped' : ''
        const compactClass = block.compact ? 'fb-table--compact' : ''

        return (
          <div className="fb-block fb-table-wrapper !my-0 w-full">
            {block.title && <div className="fb-table-title">{block.title}</div>}
            <div className="fb-table-scroll">
              <table className={`fb-table ${stripedClass} ${compactClass}`}>
                {block.hasHeader !== false && columns.length > 0 && (
                  <thead>
                    <tr>
                      {columns.map((col) => {
                        const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        const highlight = col.isHighlight ? 'fb-table-col-highlight' : ''
                        const colWidth = col.width ? { width: col.width } : {}
                        return (
                          <th key={col.id} className={`${align} ${highlight}`} style={colWidth}>
                            {col.label}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      {(row.cells || []).map((cell, cIdx) => {
                        const col = columns[cIdx] || {}
                        const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        const highlight = col.isHighlight ? 'fb-table-col-highlight' : ''

                        return (
                          <td key={cIdx} className={`${align} ${highlight}`}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {cell.type === 'check' && (
                                <span className={`fb-table-check ${cell.status === 'no' ? 'no' : 'yes'}`}>
                                  {cell.status === 'no' ? '✕' : '✓'}
                                </span>
                              )}
                              <span>{cell.text}</span>
                              {cell.badge && <span className="fb-table-badge">{cell.badge}</span>}
                              {cell.imageSrc && (
                                <img src={cell.imageSrc} alt="" className="h-6 w-6 rounded object-cover inline-block" />
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      /* ---- List Block ---- */
      case 'list': {
        const items = Array.isArray(block.items) ? block.items : []
        const isOrdered = block.listType === 'ordered'
        const Tag = isOrdered ? 'ol' : 'ul'
        const spacingClass = `fb-list--${block.spacing || 'normal'}`
        const styleClass = `fb-list--${block.style || 'check'}`

        return (
          <div className="fb-block fb-list-wrapper !my-0 w-full">
            <Tag className={`fb-list ${styleClass} ${spacingClass}`}>
              {items.map((item, idx) => (
                <li key={item.id || idx} className="fb-list-item">
                  {isOrdered ? (
                    <span className="fb-list-num">{idx + 1}.</span>
                  ) : block.style === 'arrow' ? (
                    <span className="fb-list-bullet arrow">→</span>
                  ) : block.style === 'bolt' ? (
                    <span className="fb-list-bullet bolt">⚡</span>
                  ) : block.style === 'dot' ? (
                    <span className="fb-list-bullet dot">•</span>
                  ) : (
                    <span className="fb-list-bullet check">✓</span>
                  )}
                  <span className="fb-list-content">{item.text || 'List item text...'}</span>
                </li>
              ))}
            </Tag>
          </div>
        )
      }

      /* ---- Video Block ---- */
      case 'video': {
        if (!block.url) {
          return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-panel-edge/80 bg-abyss/40 py-8 text-center text-xs text-slate-500 w-full">
              <svg className="mb-2 h-7 w-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-slate-400">Empty Video Block</span>
              <span className="text-[10px] text-slate-600">Select to add YouTube / Vimeo / MP4 link</span>
            </div>
          )
        }

        const embedUrl = getEmbedVideoUrl(block.url, block.provider)
        const aspectClass =
          block.aspectRatio === '4/3'
            ? 'aspect-[4/3]'
            : block.aspectRatio === '21/9'
            ? 'aspect-[21/9]'
            : block.aspectRatio === '1/1'
            ? 'aspect-square'
            : 'aspect-video'
        const radClass = `fb-radius-${block.radius || 'lg'}`

        return (
          <figure className={`fb-block fb-video-block ${radClass} !my-0 w-full`}>
            <div className={`fb-video-wrapper w-full ${aspectClass} ${radClass} overflow-hidden`}>
              {block.provider === 'mp4' ? (
                <video src={embedUrl} className="w-full h-full object-cover" controls playsInline />
              ) : (
                <iframe
                  src={embedUrl}
                  title={block.title || 'Video'}
                  className="w-full h-full border-0 pointer-events-none"
                />
              )}
            </div>
            {block.caption && (
              <figcaption className="fb-video-caption font-mono text-[11px] text-slate-400 text-center mt-2">
                {block.caption}
              </figcaption>
            )}
          </figure>
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
        const sizeClass = block.size === 'sm' ? 'text-xs py-1 px-2.5' : block.size === 'lg' ? 'text-base py-3 px-6' : ''
        const fullClass = block.fullWidth ? 'w-full block text-center' : 'inline-block'

        return (
          <div className={`fb-block fb-atomic-button !my-0 ${block.fullWidth ? 'w-full' : ''}`}>
            <span className={`${variant} ${sizeClass} ${fullClass} pointer-events-none`}>
              {block.text || 'Action Button'}
            </span>
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
          <blockquote className={`fb-block fb-pull-quote !my-0 ${block.style === 'card' ? 'fb-pull-quote--card' : ''}`}>
            <p>"{block.quote || 'Quote text...'}"</p>
            {(block.author || block.avatar) && (
              <cite className="fb-quote-author flex items-center mt-2">
                {block.avatar && (
                  <img src={block.avatar} alt="" className="h-8 w-8 rounded-full object-cover border border-panel-edge mr-2.5 inline-block" />
                )}
                <span>
                  {block.author}
                  {block.role && <span className="fb-quote-role"> — {block.role}</span>}
                </span>
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
      className={`markdown-body group/preview relative cursor-pointer transition-all duration-150 ${
        isChild ? 'rounded-lg p-1' : 'rounded-xl p-3'
      } ${
        isSelected
          ? 'ring-2 ring-neon-blue bg-neon-blue/[0.04] shadow-md shadow-neon-blue/10'
          : 'hover:bg-white/[0.02] hover:ring-1 hover:ring-panel-edge'
      }`}
    >
      {renderContent()}

      {/* Floating Tag Badge on Select / Hover */}
      <div
        className={`absolute ${
          isChild ? 'right-1 top-1' : 'right-2 top-2'
        } z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/preview:opacity-100'}`}
      >
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
