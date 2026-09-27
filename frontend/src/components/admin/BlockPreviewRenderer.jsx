/**
 * Visual Preview of the block on the canvas, rendered with actual FlowBase styles.
 * When the author taps or clicks this block, it triggers selection into the properties drawer.
 */
export default function BlockPreviewRenderer({ block, isSelected, onSelect }) {
  const renderPreviewContent = () => {
    switch (block.type) {
      case 'heading': {
        const Tag = ['h2', 'h3', 'h4'].includes(block.level) ? block.level : 'h2'
        return (
          <div className="fb-block fb-block-heading !my-0">
            {block.kicker && <span className="fb-block-kicker">{block.kicker}</span>}
            <Tag className="!my-0">{block.text || <span className="text-slate-600 italic">Empty Heading...</span>}</Tag>
          </div>
        )
      }

      case 'paragraph': {
        return (
          <div className="fb-block fb-block-paragraph !my-0">
            {block.html ? (
              <div dangerouslySetInnerHTML={{ __html: block.html }} />
            ) : (
              <p className="text-slate-600 italic">Empty paragraph — click to edit in sidebar</p>
            )}
          </div>
        )
      }

      case 'text_image': {
        const floatClass = block.float === 'left' ? 'fb-float-left' : 'fb-float-right'
        const widthClass =
          block.imageWidth === 'small'
            ? 'fb-float-sm'
            : block.imageWidth === 'large'
            ? 'fb-float-lg'
            : 'fb-float-md'

        return (
          <div className="fb-block fb-text-image-wrap clearfix !my-0">
            {block.imageSrc ? (
              <figure className={`fb-float-figure ${floatClass} ${widthClass}`}>
                <img src={block.imageSrc} alt={block.alt || ''} className="rounded-lg border border-panel-edge" />
                {block.caption && <figcaption className="fb-float-caption">{block.caption}</figcaption>}
              </figure>
            ) : (
              <div className={`rounded-lg border border-dashed border-panel-edge/60 bg-abyss/80 p-6 text-center text-xs text-slate-500 ${floatClass} ${widthClass}`}>
                <span>🖼️ Floating Image Placeholder</span>
              </div>
            )}
            <div className="fb-text-body">
              {block.html ? (
                <div dangerouslySetInnerHTML={{ __html: block.html }} />
              ) : (
                <p className="text-slate-600 italic">Type wrapped text in the sidebar...</p>
              )}
            </div>
          </div>
        )
      }

      case 'callout': {
        const style = ['info', 'tip', 'warning', 'success'].includes(block.style) ? block.style : 'info'
        return (
          <div className={`fb-block fb-callout fb-callout--${style} !my-0`}>
            {block.title && <strong className="fb-callout-title">{block.title}</strong>}
            <div className="fb-callout-body">{block.text || <span className="text-slate-600 italic">Callout message...</span>}</div>
          </div>
        )
      }

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

      case 'image': {
        const layoutClass =
          block.layout === 'wide'
            ? 'fb-image--wide'
            : block.layout === 'full'
            ? 'fb-image--full'
            : 'fb-image--standard'

        return block.src ? (
          <figure className={`fb-block fb-image ${layoutClass} !my-0`}>
            <img src={block.src} alt={block.alt || ''} className="rounded-xl border border-panel-edge" />
            {block.caption && <figcaption className="fb-image-caption">{block.caption}</figcaption>}
          </figure>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-panel-edge/80 bg-abyss/40 py-8 text-center text-xs text-slate-500">
            <svg className="mb-2 h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Empty Image Block — Click to set image source</span>
          </div>
        )
      }

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

      case 'columns': {
        const layoutClass =
          block.layout === 'wide-left'
            ? 'fb-columns--wide-left'
            : block.layout === 'wide-right'
            ? 'fb-columns--wide-right'
            : block.layout === 'three-col'
            ? 'fb-columns--three-col'
            : 'fb-columns--equal'

        if (block.layout === 'three-col') {
          return (
            <div className={`fb-block fb-columns-grid ${layoutClass} !my-0`}>
              <div className="fb-col rounded-lg border border-dashed border-panel-edge/40 bg-abyss/30 p-3" dangerouslySetInnerHTML={{ __html: block.left || '<span class="text-slate-600 italic">Column 1</span>' }} />
              <div className="fb-col rounded-lg border border-dashed border-panel-edge/40 bg-abyss/30 p-3" dangerouslySetInnerHTML={{ __html: block.center || '<span class="text-slate-600 italic">Column 2</span>' }} />
              <div className="fb-col rounded-lg border border-dashed border-panel-edge/40 bg-abyss/30 p-3" dangerouslySetInnerHTML={{ __html: block.right || '<span class="text-slate-600 italic">Column 3</span>' }} />
            </div>
          )
        }

        return (
          <div className={`fb-block fb-columns-grid ${layoutClass} !my-0`}>
            <div className="fb-col fb-col-left rounded-lg border border-dashed border-panel-edge/40 bg-abyss/30 p-3" dangerouslySetInnerHTML={{ __html: block.left || '<span class="text-slate-600 italic">Left Column</span>' }} />
            <div className="fb-col fb-col-right rounded-lg border border-dashed border-panel-edge/40 bg-abyss/30 p-3" dangerouslySetInnerHTML={{ __html: block.right || '<span class="text-slate-600 italic">Right Column</span>' }} />
          </div>
        )
      }

      case 'stats': {
        const items = block.items || []
        return (
          <div className="fb-block fb-stats-grid !my-0">
            {items.map((stat, i) => (
              <div key={i} className="fb-stat-cell">
                <span className="fb-stat-val">{stat.value || '0'}</span>
                <span className="fb-stat-lbl">{stat.label || 'Metric'}</span>
              </div>
            ))}
          </div>
        )
      }

      case 'faq': {
        const items = block.items || []
        return (
          <div className="fb-block fb-faq-list !my-0">
            {items.map((item, i) => (
              <details key={i} className="fb-faq-item" open>
                <summary className="fb-faq-q">{item.question || 'FAQ Question'}</summary>
                <div className="fb-faq-a"><p>{item.answer || 'Answer description...'}</p></div>
              </details>
            ))}
          </div>
        )
      }

      case 'button': {
        const alignClass =
          block.align === 'center'
            ? 'justify-center'
            : block.align === 'right'
            ? 'justify-end'
            : 'justify-start'
        const btnVariant = block.variant === 'secondary' ? 'system-button-secondary' : 'system-button-primary'
        return (
          <div className={`fb-block fb-standalone-btn flex ${alignClass} !my-0`}>
            <span className={`${btnVariant} inline-block pointer-events-none`}>{block.text || 'Button Link'}</span>
          </div>
        )
      }

      case 'cta': {
        const btnVariant = block.variant === 'secondary' ? 'system-button-secondary' : 'system-button-primary'
        return (
          <div className="fb-block fb-cta-box !my-0">
            <div className="fb-cta-inner">
              <div className="fb-cta-text">
                <h3>{block.heading || 'Call to Action Title'}</h3>
                <p>{block.text || 'Supporting description...'}</p>
              </div>
              <span className={`fb-cta-btn ${btnVariant} pointer-events-none`}>
                {block.buttonText || 'Learn More'} &rarr;
              </span>
            </div>
          </div>
        )
      }

      case 'divider': {
        return <hr className="fb-block fb-divider !my-0" />
      }

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
      onClick={onSelect}
      className={`markdown-body relative cursor-pointer rounded-xl p-4 transition-all duration-150 ${
        isSelected
          ? 'ring-2 ring-neon-blue bg-neon-blue/[0.04] shadow-lg shadow-neon-blue/10'
          : 'hover:bg-white/[0.02] hover:ring-1 hover:ring-panel-edge'
      }`}
    >
      {renderPreviewContent()}
      
      {/* Floating Edit Hint Badge on Hover/Select */}
      <div className={`absolute right-3 top-3 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono uppercase font-semibold ${
          isSelected ? 'bg-neon-blue text-white shadow-xs' : 'bg-slate-800 text-slate-300 border border-panel-edge'
        }`}>
          {isSelected ? 'Editing in Drawer ✎' : 'Click to Edit ✎'}
        </span>
      </div>
    </div>
  )
}
