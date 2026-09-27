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
        align: 'center', // 'start' | 'center' | 'stretch'
        gap: 'md', // 'none' | 'sm' | 'md' | 'lg'
        padding: 'md', // 'none' | 'sm' | 'md' | 'lg'
        background: 'subtle', // 'none' | 'subtle' | 'gradient' | 'accent'
        border: 'solid', // 'none' | 'solid' | 'dashed'
        radius: 'lg', // 'none' | 'md' | 'lg' | 'full'
        children: [
          createDefaultBlock('image'),
          createDefaultBlock('text'),
        ],
      };

    /* ---- Atomic Blocks ---- */
    case 'heading':
      return { id, type: 'heading', level: 'h2', kicker: '', text: '', align: 'left' };

    case 'text':
    case 'paragraph':
      return { id, type: 'text', html: '' };

    case 'image':
      return {
        id,
        type: 'image',
        src: '',
        alt: '',
        caption: '',
        fit: 'cover',
        width: '100%',
        radius: 'md',
      };

    case 'icon_badge':
      return {
        id,
        type: 'icon_badge',
        icon: 'bolt',
        text: 'Feature Highlight',
        variant: 'primary',
      };

    case 'button':
      return {
        id,
        type: 'button',
        text: 'Get Started',
        url: '/#start',
        variant: 'primary',
      };

    case 'code':
      return { id, type: 'code', language: 'dart', filename: '', code: '' };

    case 'callout':
      return { id, type: 'callout', style: 'info', title: '', text: '' };

    case 'quote':
      return { id, type: 'quote', quote: '', author: '', role: '' };

    case 'divider':
      return { id, type: 'divider', style: 'gradient' };

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
        const wrapClass = block.wrap ? 'fb-flex-wrap' : 'fb-flex-nowrap';
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
            : 'fb-items-center';
        const gapClass = `fb-gap-${block.gap || 'md'}`;
        const padClass = `fb-pad-${block.padding || 'md'}`;
        const bgClass = `fb-bg-${block.background || 'none'}`;
        const borderClass = `fb-border-${block.border || 'none'}`;
        const radiusClass = `fb-radius-${block.radius || 'md'}`;

        const childrenHtml = (block.children || [])
          .map((child) => renderSingleBlock(child))
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
        return `<div class="fb-block fb-block-heading ${alignClass}">${kickerHtml}<${tag}>${escapeHtml(block.text || '')}</${tag}></div>`;
      }

      case 'text':
      case 'paragraph': {
        return `<div class="fb-block fb-block-text">${block.html || '<p></p>'}</div>`;
      }

      case 'image': {
        if (!block.src) return '';
        const widthStyle = block.width && block.width !== '100%' && block.width !== 'auto' ? `style="width: ${escapeHtml(block.width)}"` : '';
        const fitClass = block.fit === 'contain' ? 'fb-img-contain' : 'fb-img-cover';
        const radClass = `fb-radius-${block.radius || 'md'}`;
        const captionHtml = block.caption?.trim()
          ? `<figcaption class="fb-image-caption">${escapeHtml(block.caption.trim())}</figcaption>`
          : '';

        return (
          `<figure class="fb-block fb-atomic-image ${radClass}" ${widthStyle}>` +
          `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || '')}" class="${fitClass} ${radClass}" loading="lazy" />` +
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
        return (
          `<div class="fb-block fb-atomic-button">` +
          `<a href="${escapeHtml(block.url || '/#start')}" class="${variant}">${escapeHtml(block.text || 'Learn More')}</a>` +
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
        const authorHtml = block.author?.trim()
          ? `<cite class="fb-quote-author">${escapeHtml(block.author.trim())}${
              block.role?.trim() ? `<span class="fb-quote-role"> — ${escapeHtml(block.role.trim())}</span>` : ''
            }</cite>`
          : '';
        return (
          `<blockquote class="fb-block fb-pull-quote">` +
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
