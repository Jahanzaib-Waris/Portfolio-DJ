/**
 * Atomic + Container Block System (Figma / Webflow / FlutterFlow style)
 *
 * LAYOUT / CONTAINER BLOCKS:
 * - container: {
 *     direction: 'row'|'column',
 *     wrap: boolean,
 *     justify: 'start'|'center'|'between'|'end',
 *     align: 'start'|'center'|'stretch',
 *     gap: 'none'|'sm'|'md'|'lg',
 *     padding: 'none'|'sm'|'md'|'lg',
 *     background: 'none'|'subtle'|'gradient'|'accent',
 *     border: 'none'|'solid'|'dashed',
 *     radius: 'none'|'md'|'lg'|'full',
 *     children: Block[]
 *   }
 *
 * ATOMIC BLOCKS (can live on canvas or inside any Container/Row):
 * - heading: { level: 'h2'|'h3'|'h4', kicker: string, text: string, align: 'left'|'center'|'right' }
 * - text: { html: string }
 * - image: { src: string, alt: string, caption: string, fit: 'cover'|'contain'|'auto', width: 'auto'|'25%'|'33%'|'50%'|'66%'|'100%', radius: 'none'|'md'|'lg'|'full' }
 * - icon_badge: { icon: 'star'|'check'|'bolt'|'shield'|'code'|'sparkles'|'terminal'|'heart', text: string, variant: 'primary'|'emerald'|'amber'|'sky'|'slate' }
 * - button: { text: string, url: string, variant: 'primary'|'secondary'|'subtle' }
 * - code: { code: string, language: string, filename: string }
 * - callout: { style: 'tip'|'info'|'warning'|'success', title: string, text: string }
 * - quote: { quote: string, author: string, role: string }
 * - divider: { style: 'hairline'|'gradient'|'dots' }
 * - classic: { html: string } (legacy compatibility)
 */

export const BLOCK_METADATA_HEADER = '<!-- FLOWBASE_BLOCKS_V2:';
export const BLOCK_METADATA_FOOTER = ':FLOWBASE_BLOCKS_V2 -->';

// Legacy V1 Header fallback support
export const V1_HEADER = '<!-- FLOWBASE_BLOCKS_V1:';
export const V1_FOOTER = ':FLOWBASE_BLOCKS_V1 -->';

export function createBlockId() {
  return 'b_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function getChildLayoutStyles(child, parentDirection = 'row') {
  const isCol = parentDirection === 'column';
  const widthMode = child.layoutWidth || child.width;
  const alignSelf = child.alignSelf;

  const styles = {};

  if (alignSelf && alignSelf !== 'auto') {
    styles.alignSelf =
      alignSelf === 'start' ? 'flex-start' : alignSelf === 'end' ? 'flex-end' : alignSelf;
  }

  if (isCol) {
    if (widthMode === 'hug' || (['button', 'icon_badge'].includes(child.type) && widthMode !== '100%')) {
      styles.width = 'fit-content';
      styles.maxWidth = '100%';
    } else {
      styles.width = '100%';
    }
    return styles;
  }

  // Row Mode
  if (widthMode === 'hug' || (['button', 'icon_badge'].includes(child.type) && !widthMode)) {
    styles.flex = '0 0 auto';
    styles.width = 'auto';
    return styles;
  }

  if (widthMode && widthMode.endsWith('%') && widthMode !== '100%') {
    styles.flex = `0 0 ${widthMode}`;
    styles.maxWidth = widthMode;
    styles.width = widthMode;
    return styles;
  }

  if (child.type === 'image') {
    const imgWidth = child.width || '40%';
    if (imgWidth === 'auto' || imgWidth === 'hug') {
      styles.flex = '0 0 auto';
      styles.width = 'auto';
    } else if (imgWidth.endsWith('%') && imgWidth !== '100%') {
      styles.flex = `0 0 ${imgWidth}`;
      styles.maxWidth = imgWidth;
      styles.width = imgWidth;
    } else {
      styles.flex = '1 1 0%';
      styles.minWidth = '0';
    }
    return styles;
  }

  // Default in row is fill: flex: 1 1 0%
  styles.flex = '1 1 0%';
  styles.minWidth = '0';
  return styles;
}

export function getChildLayoutStyleString(child, parentDirection = 'row') {
  const obj = getChildLayoutStyles(child, parentDirection);
  return Object.entries(obj)
    .map(([k, v]) => {
      const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${v};`;
    })
    .join(' ');
}

export function getEmbedVideoUrl(url, provider = 'youtube') {
  if (!url) return '';
  if (provider === 'youtube') {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  }
  if (provider === 'vimeo') {
    const regExp = /(?:vimeo)\.com.*(?:videos\/|video\/|channels\/|)\n?([0-9]+)/;
    const match = url.match(regExp);
    return match && match[1] ? `https://player.vimeo.com/video/${match[1]}` : url;
  }
  return url;
}

export function createDefaultBlock(type) {
  const id = createBlockId();
  switch (type) {
    /* ---- Container / Layout (Flexbox Row/Col) ---- */
    case 'container':
      return {
        id,
        type: 'container',
        direction: 'row', // 'row' | 'column'
        wrap: true,
        justify: 'start', // 'start' | 'center' | 'between' | 'end'
        align: 'start', // 'start' | 'center' | 'end' | 'stretch' (top aligned in row by default)
        gap: 'md', // 'none' | 'sm' | 'md' | 'lg'
        padding: 'md', // 'none' | 'sm' | 'md' | 'lg'
        background: 'subtle', // 'none' | 'subtle' | 'gradient' | 'accent'
        border: 'solid', // 'none' | 'solid' | 'dashed'
        radius: 'lg', // 'none' | 'md' | 'lg' | 'full'
        children: [
          {
            ...createDefaultBlock('image'),
            width: '40%',
            layoutWidth: '40%',
          },
          {
            ...createDefaultBlock('text'),
            layoutWidth: 'fill',
            html: '<p>Write your content here. When placed inside a container with an image or another block, elements automatically align side-by-side with responsive auto-layout.</p>',
          },
        ],
      };

    /* ---- Atomic Blocks ---- */
    case 'heading':
      return {
        id,
        type: 'heading',
        level: 'h2',
        kicker: '',
        text: '',
        align: 'left',
        gradient: 'none', // 'none' | 'neon' | 'emerald' | 'amber'
        layoutWidth: 'fill',
      };

    case 'text':
    case 'paragraph':
      return { id, type: 'text', html: '', layoutWidth: 'fill' };

    case 'image':
      return {
        id,
        type: 'image',
        src: '',
        alt: '',
        caption: '',
        fit: 'cover',
        width: '100%',
        layoutWidth: 'fill',
        height: 'auto', // 'auto' | '220px' | '280px' | '340px' | '420px' | '500px'
        aspectRatio: 'auto', // 'auto' | '16/9' | '4/3' | '1/1' | '21/9'
        radius: 'md',
      };

    case 'table':
      return {
        id,
        type: 'table',
        title: 'Comparison Table',
        hasHeader: true,
        striped: true,
        compact: false,
        columns: [
          { id: 'c1', label: 'Feature', align: 'left', width: '40%' },
          { id: 'c2', label: 'FlowBase (Ours)', align: 'center', width: '30%', isHighlight: true },
          { id: 'c3', label: 'Alternative', align: 'center', width: '30%' },
        ],
        rows: [
          {
            id: 'r1',
            cells: [
              { text: 'Visual Auto-Layout', type: 'text' },
              { text: 'Full Flex Row/Stack', type: 'check', status: 'yes' },
              { text: 'Rigid Blocks', type: 'check', status: 'no' },
            ],
          },
          {
            id: 'r2',
            cells: [
              { text: 'Performance Rating', type: 'text' },
              { text: '99/100 Lighthouse', type: 'text', badge: 'Fast' },
              { text: '72/100', type: 'text' },
            ],
          },
          {
            id: 'r3',
            cells: [
              { text: 'Live Canvas Inspector', type: 'text' },
              { text: 'Instant Updates', type: 'check', status: 'yes' },
              { text: 'Delayed Reloads', type: 'check', status: 'no' },
            ],
          },
        ],
        layoutWidth: 'fill',
      };

    case 'list':
      return {
        id,
        type: 'list',
        listType: 'unordered', // 'unordered' | 'ordered'
        style: 'check', // 'check' | 'dot' | 'arrow' | 'bolt'
        spacing: 'normal', // 'compact' | 'normal' | 'relaxed'
        items: [
          { id: 'l1', text: 'Real-time responsive auto-layout containers (Row and Stack)' },
          { id: 'l2', text: 'Granular height, aspect ratio, and flex sizing controls' },
          { id: 'l3', text: 'Rich data comparison tables and responsive video embeds' },
        ],
        layoutWidth: 'fill',
      };

    case 'video':
      return {
        id,
        type: 'video',
        provider: 'youtube', // 'youtube' | 'vimeo' | 'mp4'
        url: '',
        title: 'Video Demo',
        aspectRatio: '16/9', // '16/9' | '4/3' | '21/9' | '1/1'
        caption: '',
        radius: 'lg',
        layoutWidth: 'fill',
      };

    case 'icon_badge':
      return {
        id,
        type: 'icon_badge',
        icon: 'bolt',
        text: 'Feature Highlight',
        variant: 'primary',
        layoutWidth: 'hug',
      };

    case 'button':
      return {
        id,
        type: 'button',
        text: 'Get Started',
        url: '/#start',
        variant: 'primary',
        size: 'md', // 'sm' | 'md' | 'lg'
        target: '_self', // '_self' | '_blank'
        fullWidth: false,
        layoutWidth: 'hug',
      };

    case 'code':
      return {
        id,
        type: 'code',
        language: 'dart',
        filename: '',
        code: '',
        showLineNumbers: false,
        layoutWidth: 'fill',
      };

    case 'callout':
      return {
        id,
        type: 'callout',
        style: 'info',
        title: '',
        text: '',
        icon: 'info',
        layoutWidth: 'fill',
      };

    case 'quote':
      return {
        id,
        type: 'quote',
        quote: '',
        author: '',
        role: '',
        avatar: '',
        style: 'editorial', // 'editorial' | 'card'
        layoutWidth: 'fill',
      };

    case 'divider':
      return { id, type: 'divider', style: 'gradient', layoutWidth: 'fill' };

    case 'classic':
    default:
      return { id, type: 'classic', html: '' };
  }
}

/**
 * Compiles atomic & container blocks to responsive HTML
 */
export function compileBlocksToHTML(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return '';

  const renderSingleBlock = (block) => {
    switch (block.type) {
      case 'container': {
        const dirClass = block.direction === 'column' ? 'fb-flex-col' : 'fb-flex-row';
        const wrapClass = block.wrap !== false ? 'fb-flex-wrap' : 'fb-flex-nowrap';
        const justifyClass =
          block.justify === 'center'
            ? 'fb-justify-center'
            : block.justify === 'between'
            ? 'fb-justify-between'
            : block.justify === 'end'
            ? 'fb-justify-end'
            : 'fb-justify-start';
        const alignClass =
          block.align === 'start'
            ? 'fb-items-start'
            : block.align === 'stretch'
            ? 'fb-items-stretch'
            : block.align === 'end'
            ? 'fb-items-end'
            : 'fb-items-center';
        const gapClass = `fb-gap-${block.gap || 'md'}`;
        const padClass = `fb-pad-${block.padding || 'md'}`;
        const bgClass = `fb-bg-${block.background || 'none'}`;
        const borderClass = `fb-border-${block.border || 'none'}`;
        const radiusClass = `fb-radius-${block.radius || 'md'}`;

        const direction = block.direction || 'row';
        const childrenHtml = (block.children || [])
          .map((child) => {
            const layoutStyle = getChildLayoutStyleString(child, direction);
            return `<div class="fb-child-item" style="${layoutStyle}">\n${renderSingleBlock(child)}\n</div>`;
          })
          .join('\n');

        return (
          `<div class="fb-block fb-container ${dirClass} ${wrapClass} ${justifyClass} ${alignClass} ${gapClass} ${padClass} ${bgClass} ${borderClass} ${radiusClass}">` +
          `\n${childrenHtml}\n` +
          `</div>`
        );
      }

      case 'heading': {
        const tag = ['h2', 'h3', 'h4'].includes(block.level) ? block.level : 'h2';
        const kickerHtml = block.kicker?.trim()
          ? `<span class="fb-block-kicker">${escapeHtml(block.kicker.trim())}</span>`
          : '';
        const alignClass = block.align ? `fb-text-${block.align}` : '';
        const gradientClass =
          block.gradient && block.gradient !== 'none' ? `fb-heading-gradient--${block.gradient}` : '';
        return `<div class="fb-block fb-block-heading ${alignClass} ${gradientClass}">${kickerHtml}<${tag}>${escapeHtml(block.text || '')}</${tag}></div>`;
      }

      case 'text':
      case 'paragraph': {
        return `<div class="fb-block fb-block-text">${block.html || '<p></p>'}</div>`;
      }

      case 'image': {
        if (!block.src) return '';
        const fitClass = block.fit === 'contain' ? 'fb-img-contain' : 'fb-img-cover';
        const radClass = `fb-radius-${block.radius || 'md'}`;
        const captionHtml = block.caption?.trim()
          ? `<figcaption class="fb-image-caption">${escapeHtml(block.caption.trim())}</figcaption>`
          : '';

        const inlineStyles = [];
        if (block.height && block.height !== 'auto') {
          inlineStyles.push(`height: ${escapeHtml(block.height)}`);
        }
        if (block.aspectRatio && block.aspectRatio !== 'auto') {
          inlineStyles.push(`aspect-ratio: ${escapeHtml(block.aspectRatio)}`);
        }
        const imgStyleStr = inlineStyles.length > 0 ? `style="${inlineStyles.join('; ')}"` : '';

        return (
          `<figure class="fb-block fb-atomic-image ${radClass}">` +
          `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || '')}" class="${fitClass} ${radClass}" ${imgStyleStr} loading="lazy" />` +
          `${captionHtml}` +
          `</figure>`
        );
      }

      case 'table': {
        const columns = Array.isArray(block.columns) ? block.columns : [];
        const rows = Array.isArray(block.rows) ? block.rows : [];
        const stripedClass = block.striped ? 'fb-table--striped' : '';
        const compactClass = block.compact ? 'fb-table--compact' : '';
        const titleHtml = block.title?.trim()
          ? `<div class="fb-table-title">${escapeHtml(block.title.trim())}</div>`
          : '';

        const theadHtml =
          block.hasHeader !== false && columns.length > 0
            ? `<thead><tr>` +
              columns
                .map((col) => {
                  const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
                  const highlight = col.isHighlight ? 'fb-table-col-highlight' : '';
                  const colWidth = col.width ? `style="width: ${escapeHtml(col.width)}"` : '';
                  return `<th class="${align} ${highlight}" ${colWidth}>${escapeHtml(col.label || '')}</th>`;
                })
                .join('') +
              `</tr></thead>`
            : '';

        const tbodyHtml = rows
          .map((row) => {
            const cellsHtml = (row.cells || [])
              .map((cell, cIdx) => {
                const col = columns[cIdx] || {};
                const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
                const highlight = col.isHighlight ? 'fb-table-col-highlight' : '';

                let cellBody = '';
                if (cell.type === 'check') {
                  if (cell.status === 'yes') {
                    cellBody = `<span class="fb-table-check yes">✓</span> ${escapeHtml(cell.text || '')}`;
                  } else if (cell.status === 'no') {
                    cellBody = `<span class="fb-table-check no">✕</span> ${escapeHtml(cell.text || '')}`;
                  } else {
                    cellBody = escapeHtml(cell.text || '');
                  }
                } else {
                  cellBody = escapeHtml(cell.text || '');
                }

                if (cell.badge) {
                  cellBody += ` <span class="fb-table-badge">${escapeHtml(cell.badge)}</span>`;
                }

                if (cell.imageSrc) {
                  cellBody = `<div class="flex items-center gap-2">${cellBody}<img src="${escapeHtml(cell.imageSrc)}" alt="" class="h-6 w-6 rounded object-cover inline-block" /></div>`;
                }

                return `<td class="${align} ${highlight}">${cellBody}</td>`;
              })
              .join('');
            return `<tr>${cellsHtml}</tr>`;
          })
          .join('\n');

        return (
          `<div class="fb-block fb-table-wrapper">` +
          `${titleHtml}` +
          `<div class="fb-table-scroll">` +
          `<table class="fb-table ${stripedClass} ${compactClass}">` +
          `${theadHtml}` +
          `<tbody>${tbodyHtml}</tbody>` +
          `</table>` +
          `</div>` +
          `</div>`
        );
      }

      case 'list': {
        const items = Array.isArray(block.items) ? block.items : [];
        const isOrdered = block.listType === 'ordered';
        const Tag = isOrdered ? 'ol' : 'ul';
        const spacingClass = `fb-list--${block.spacing || 'normal'}`;
        const styleClass = `fb-list--${block.style || 'check'}`;

        const itemsHtml = items
          .map((item, idx) => {
            let marker = '';
            if (isOrdered) {
              marker = `<span class="fb-list-num">${idx + 1}.</span>`;
            } else if (block.style === 'arrow') {
              marker = `<span class="fb-list-bullet arrow">→</span>`;
            } else if (block.style === 'bolt') {
              marker = `<span class="fb-list-bullet bolt">⚡</span>`;
            } else if (block.style === 'dot') {
              marker = `<span class="fb-list-bullet dot">•</span>`;
            } else {
              marker = `<span class="fb-list-bullet check">✓</span>`;
            }
            return `<li class="fb-list-item">${marker}<span class="fb-list-content">${escapeHtml(item.text || '')}</span></li>`;
          })
          .join('\n');

        return (
          `<div class="fb-block fb-list-wrapper">` +
          `<${Tag} class="fb-list ${styleClass} ${spacingClass}">\n${itemsHtml}\n</${Tag}>` +
          `</div>`
        );
      }

      case 'video': {
        if (!block.url) return '';
        const embedUrl = getEmbedVideoUrl(block.url, block.provider);
        const aspectClass =
          block.aspectRatio === '4/3'
            ? 'aspect-[4/3]'
            : block.aspectRatio === '21/9'
            ? 'aspect-[21/9]'
            : block.aspectRatio === '1/1'
            ? 'aspect-square'
            : 'aspect-video';
        const radClass = `fb-radius-${block.radius || 'lg'}`;
        const captionHtml = block.caption?.trim()
          ? `<figcaption class="fb-video-caption font-mono text-[11px] text-slate-400 text-center mt-2">${escapeHtml(block.caption.trim())}</figcaption>`
          : '';

        if (block.provider === 'mp4') {
          return (
            `<figure class="fb-block fb-video-block ${radClass}">` +
            `<video src="${escapeHtml(embedUrl)}" class="w-full ${aspectClass} ${radClass} object-cover" controls playsinline></video>` +
            `${captionHtml}` +
            `</figure>`
          );
        }

        return (
          `<figure class="fb-block fb-video-block ${radClass}">` +
          `<div class="fb-video-wrapper w-full ${aspectClass} ${radClass} overflow-hidden">` +
          `<iframe src="${escapeHtml(embedUrl)}" title="${escapeHtml(block.title || 'Video')}" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` +
          `</div>` +
          `${captionHtml}` +
          `</figure>`
        );
      }

      case 'icon_badge': {
        const variant = block.variant || 'primary';
        return (
          `<div class="fb-block fb-icon-badge fb-badge--${variant}">` +
          `<span class="fb-badge-icon">${renderSvgIcon(block.icon)}</span>` +
          `<span class="fb-badge-text">${escapeHtml(block.text || '')}</span>` +
          `</div>`
        );
      }

      case 'button': {
        const variant = block.variant === 'secondary' ? 'system-button-secondary' : block.variant === 'subtle' ? 'fb-btn-subtle' : 'system-button-primary';
        const targetAttr = block.target === '_blank' ? 'target="_blank" rel="noopener noreferrer"' : '';
        const sizeClass = block.size === 'sm' ? 'text-xs py-1 px-2.5' : block.size === 'lg' ? 'text-base py-3 px-6' : '';
        const fullClass = block.fullWidth ? 'w-full block text-center' : 'inline-block';

        return (
          `<div class="fb-block fb-atomic-button ${block.fullWidth ? 'w-full' : ''}">` +
          `<a href="${escapeHtml(block.url || '/#start')}" class="${variant} ${sizeClass} ${fullClass}" ${targetAttr}>${escapeHtml(block.text || 'Learn More')}</a>` +
          `</div>`
        );
      }

      case 'code': {
        const lang = block.language?.trim() || 'code';
        const fileBar = block.filename?.trim()
          ? `<div class="fb-code-bar"><span class="fb-code-dot"></span><span class="fb-code-dot"></span><span class="fb-code-dot"></span><span class="fb-code-filename">${escapeHtml(block.filename.trim())}</span><span class="fb-code-lang">${escapeHtml(lang)}</span></div>`
          : `<div class="fb-code-bar"><span class="fb-code-dot"></span><span class="fb-code-dot"></span><span class="fb-code-dot"></span><span class="fb-code-lang ml-auto">${escapeHtml(lang)}</span></div>`;
        return (
          `<div class="fb-block fb-code-card">` +
          `${fileBar}` +
          `<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(block.code || '')}</code></pre>` +
          `</div>`
        );
      }

      case 'callout': {
        const style = ['info', 'tip', 'warning', 'success'].includes(block.style) ? block.style : 'info';
        const titleHtml = block.title?.trim()
          ? `<strong class="fb-callout-title">${escapeHtml(block.title.trim())}</strong>`
          : '';
        return (
          `<div class="fb-block fb-callout fb-callout--${style}">` +
          `${titleHtml}` +
          `<div class="fb-callout-body">${escapeHtml(block.text || '')}</div>` +
          `</div>`
        );
      }

      case 'quote': {
        const avatarHtml = block.avatar?.trim()
          ? `<img src="${escapeHtml(block.avatar.trim())}" alt="" class="h-9 w-9 rounded-full object-cover border border-panel-edge mr-2.5 inline-block" />`
          : '';
        const authorHtml = block.author?.trim()
          ? `<cite class="fb-quote-author flex items-center mt-3">${avatarHtml}<span>${escapeHtml(block.author.trim())}${
              block.role?.trim() ? `<span class="fb-quote-role"> — ${escapeHtml(block.role.trim())}</span>` : ''
            }</span></cite>`
          : '';
        const quoteClass = block.style === 'card' ? 'fb-pull-quote--card' : '';
        return (
          `<blockquote class="fb-block fb-pull-quote ${quoteClass}">` +
          `<p>"${escapeHtml(block.quote || '')}"</p>` +
          `${authorHtml}` +
          `</blockquote>`
        );
      }

      case 'divider': {
        return `<hr class="fb-block fb-divider fb-divider--${block.style || 'gradient'}" />`;
      }

      case 'classic':
      default: {
        return block.html || '';
      }
    }
  };

  const bodyHtml = blocks.map(renderSingleBlock).join('\n\n');

  // Lossless metadata embed
  try {
    const serializedBlocks = JSON.stringify(blocks);
    const encoded = encodeURIComponent(serializedBlocks);
    return `${bodyHtml}\n\n${BLOCK_METADATA_HEADER}${encoded}${BLOCK_METADATA_FOOTER}`;
  } catch {
    return bodyHtml;
  }
}

/**
 * Parses existing post HTML back into structured blocks.
 */
export function parseHTMLToBlocks(html) {
  if (!html || typeof html !== 'string' || !html.trim()) {
    return [createDefaultBlock('text')];
  }

  // Check V2 format
  let startIndex = html.indexOf(BLOCK_METADATA_HEADER);
  let endIndex = html.indexOf(BLOCK_METADATA_FOOTER);
  let headerLen = BLOCK_METADATA_HEADER.length;

  // Check V1 fallback format
  if (startIndex === -1) {
    startIndex = html.indexOf(V1_HEADER);
    endIndex = html.indexOf(V1_FOOTER);
    headerLen = V1_HEADER.length;
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    try {
      const rawEncoded = html.substring(startIndex + headerLen, endIndex);
      const decoded = decodeURIComponent(rawEncoded);
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return ensureBlockIds(parsed);
      }
    } catch (err) {
      console.warn('Failed to parse embedded block metadata, falling back to classic block', err);
    }
  }

  // Legacy post without block metadata -> Classic block
  return [
    {
      id: createBlockId(),
      type: 'classic',
      html: html.trim(),
    },
  ];
}

function ensureBlockIds(blocks) {
  return blocks.map((b) => {
    const copy = { ...b, id: b.id || createBlockId() };
    if (b.type === 'container' && Array.isArray(b.children)) {
      copy.children = ensureBlockIds(b.children);
    }
    return copy;
  });
}

export function renderSvgIcon(iconName) {
  switch (iconName) {
    case 'bolt':
      return `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>`;
    case 'star':
      return `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>`;
    case 'check':
      return `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>`;
    case 'shield':
      return `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>`;
    case 'sparkles':
      return `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>`;
    case 'terminal':
      return `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
    case 'heart':
      return `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>`;
    case 'code':
    default:
      return `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
