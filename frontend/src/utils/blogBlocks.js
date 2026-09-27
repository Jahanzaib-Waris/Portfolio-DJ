/**
 * Utilities for serialization, deserialization, and HTML compilation of blog blocks.
 *
 * Supported block types:
 * - heading: { level: 'h2'|'h3'|'h4', kicker: string, text: string }
 * - paragraph: { html: string }
 * - callout: { type: 'tip'|'info'|'warning'|'success', title: string, text: string }
 * - code: { language: string, filename: string, code: string }
 * - image: { src: string, alt: string, caption: string, layout: 'standard'|'wide' }
 * - quote: { quote: string, author: string, role: string }
 * - list: { ordered: boolean, items: string[] }
 * - divider: {}
 * - cta: { heading: string, text: string, buttonText: string, buttonUrl: string, variant: 'primary'|'secondary' }
 * - columns: { left: string, right: string }
 * - classic: { html: string }
 */

export const BLOCK_METADATA_HEADER = '<!-- FLOWBASE_BLOCKS_V1:';
export const BLOCK_METADATA_FOOTER = ':FLOWBASE_BLOCKS_V1 -->';

/**
 * Generate a unique ID for a block instance in the editor.
 */
export function createBlockId() {
  return 'b_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Creates a new block with sensible defaults.
 */
export function createDefaultBlock(type) {
  const id = createBlockId();
  switch (type) {
    case 'heading':
      return { id, type: 'heading', level: 'h2', kicker: '', text: '' };
    case 'paragraph':
      return { id, type: 'paragraph', html: '' };
    case 'callout':
      return { id, type: 'callout', style: 'info', title: '', text: '' };
    case 'code':
      return { id, type: 'code', language: 'dart', filename: '', code: '' };
    case 'image':
      return { id, type: 'image', src: '', alt: '', caption: '', layout: 'standard' };
    case 'quote':
      return { id, type: 'quote', quote: '', author: '', role: '' };
    case 'list':
      return { id, type: 'list', ordered: false, items: [''] };
    case 'divider':
      return { id, type: 'divider' };
    case 'cta':
      return {
        id,
        type: 'cta',
        heading: 'Ready to build?',
        text: 'Let us help you bring your vision to reality.',
        buttonText: 'Get Started',
        buttonUrl: '/#start',
        variant: 'primary',
      };
    case 'columns':
      return {
        id,
        type: 'columns',
        left: '',
        right: '',
      };
    case 'classic':
    default:
      return { id, type: 'classic', html: '' };
  }
}

/**
 * Compiles a list of blocks into clean, responsive HTML.
 */
export function compileBlocksToHTML(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return '';

  const htmlParts = blocks.map((block) => {
    switch (block.type) {
      case 'heading': {
        const tag = ['h2', 'h3', 'h4'].includes(block.level) ? block.level : 'h2';
        const kickerHtml = block.kicker?.trim()
          ? `<span class="fb-block-kicker">${escapeHtml(block.kicker.trim())}</span>`
          : '';
        return `<div class="fb-block fb-block-heading">${kickerHtml}<${tag}>${escapeHtml(block.text || '')}</${tag}></div>`;
      }

      case 'paragraph': {
        return `<div class="fb-block fb-block-paragraph">${block.html || '<p></p>'}</div>`;
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

      case 'image': {
        if (!block.src) return '';
        const layoutClass = block.layout === 'wide' ? 'fb-image--wide' : 'fb-image--standard';
        const captionHtml = block.caption?.trim()
          ? `<figcaption class="fb-image-caption">${escapeHtml(block.caption.trim())}</figcaption>`
          : '';
        return (
          `<figure class="fb-block fb-image ${layoutClass}">` +
          `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || '')}" loading="lazy" />` +
          `${captionHtml}` +
          `</figure>`
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

      case 'list': {
        const tag = block.ordered ? 'ol' : 'ul';
        const items = (block.items || [])
          .filter((item) => item && item.trim().length > 0)
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('\n');
        return `<div class="fb-block fb-block-list"><${tag}>${items}</${tag}></div>`;
      }

      case 'divider': {
        return `<hr class="fb-block fb-divider" />`;
      }

      case 'cta': {
        const btnVariant = block.variant === 'secondary' ? 'system-button-secondary' : 'system-button-primary';
        return (
          `<div class="fb-block fb-cta-box">` +
          `<div class="fb-cta-inner">` +
          `<div class="fb-cta-text">` +
          `<h3>${escapeHtml(block.heading || '')}</h3>` +
          `<p>${escapeHtml(block.text || '')}</p>` +
          `</div>` +
          `<a href="${escapeHtml(block.buttonUrl || '/#start')}" class="fb-cta-btn ${btnVariant}">${escapeHtml(block.buttonText || 'Learn More')} &rarr;</a>` +
          `</div>` +
          `</div>`
        );
      }

      case 'columns': {
        return (
          `<div class="fb-block fb-columns-grid">` +
          `<div class="fb-col fb-col-left">${block.left || ''}</div>` +
          `<div class="fb-col fb-col-right">${block.right || ''}</div>` +
          `</div>`
        );
      }

      case 'classic':
      default: {
        return block.html || '';
      }
    }
  });

  const bodyHtml = htmlParts.join('\n\n');

  // Embed the pristine block data inside an HTML comment at the end
  // This allows lossless editing when re-opened in the Block Builder!
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
 * If modern block metadata comment is present, restores exact blocks.
 * Otherwise, wraps legacy HTML in a 'classic' block so no content is lost.
 */
export function parseHTMLToBlocks(html) {
  if (!html || typeof html !== 'string' || !html.trim()) {
    return [createDefaultBlock('paragraph')];
  }

  // Check for embedded FlowBase blocks
  const startIndex = html.indexOf(BLOCK_METADATA_HEADER);
  const endIndex = html.indexOf(BLOCK_METADATA_FOOTER);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    try {
      const rawEncoded = html.substring(startIndex + BLOCK_METADATA_HEADER.length, endIndex);
      const decoded = decodeURIComponent(rawEncoded);
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure every restored block has an id
        return parsed.map((b) => ({
          ...b,
          id: b.id || createBlockId(),
        }));
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
