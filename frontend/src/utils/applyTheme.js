// Resolves the SiteTheme API shape into concrete CSS custom property values
// and applies them to the document root — no rebuild needed, since every
// visual token in index.css reads from these vars (with defaults matching
// the shipped look, so a fetch failure or first-paint-before-fetch is safe).

export const RADIUS_REM = { sharp: '0.25rem', soft: '0.5rem', rounded: '0.875rem' }

export const SHADOW_VALUE = {
  none: 'none',
  subtle: '0 1px 2px rgba(1, 4, 9, 0.4)',
  elevated: '0 8px 24px rgba(1, 4, 9, 0.55)',
}

const GOOGLE_FONT_FALLBACKS = {
  Inter: '-apple-system, "Segoe UI", sans-serif',
  Poppins: 'sans-serif',
  'Space Grotesk': 'sans-serif',
  Manrope: 'sans-serif',
  Sora: 'sans-serif',
  'JetBrains Mono': '"Consolas", monospace',
  'Fira Code': '"Consolas", monospace',
  'IBM Plex Mono': '"Consolas", monospace',
  'Roboto Mono': '"Consolas", monospace',
}

/** Appends an alpha channel (as a hex pair) to a `#rrggbb` color. */
function withAlpha(hex, alphaHex) {
  return `${hex}${alphaHex}`
}

export function resolveButtonVars(theme) {
  switch (theme.button_style) {
    case 'outline':
      return { bg: 'transparent', fg: theme.color_accent, border: theme.color_accent }
    case 'soft':
      return { bg: withAlpha(theme.color_accent, '1a'), fg: theme.color_accent, border: withAlpha(theme.color_accent, '4d') }
    case 'solid':
    default:
      return { bg: theme.color_accent, fg: '#ffffff', border: 'transparent' }
  }
}

export function resolveCardBorder(theme) {
  return theme.card_style === 'accent' ? withAlpha(theme.color_accent, '4d') : theme.color_panel_edge
}

function loadGoogleFont(family) {
  const id = `google-font-${family.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return

  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`
  document.head.appendChild(link)
}

export default function applyTheme(theme) {
  if (!theme) return
  const root = document.documentElement.style

  root.setProperty('--color-void', theme.color_void)
  root.setProperty('--color-panel', theme.color_panel)
  root.setProperty('--color-panel-edge', theme.color_panel_edge)
  root.setProperty('--color-neon-blue', theme.color_neon_blue)
  root.setProperty('--color-neon-indigo', theme.color_neon_indigo)
  root.setProperty('--color-accent', theme.color_accent)
  root.setProperty('--color-status-green', theme.color_status_green)
  root.setProperty('--color-status-red', theme.color_status_red)

  root.setProperty('--theme-radius', RADIUS_REM[theme.radius_scale] ?? RADIUS_REM.soft)
  root.setProperty('--theme-shadow', SHADOW_VALUE[theme.shadow_intensity] ?? SHADOW_VALUE.none)
  root.setProperty('--card-border-color', resolveCardBorder(theme))

  const btn = resolveButtonVars(theme)
  root.setProperty('--btn-primary-bg', btn.bg)
  root.setProperty('--btn-primary-fg', btn.fg)
  root.setProperty('--btn-primary-border', btn.border)

  if (theme.font_display) {
    loadGoogleFont(theme.font_display)
    root.setProperty('--font-display', `"${theme.font_display}", ${GOOGLE_FONT_FALLBACKS[theme.font_display] || 'sans-serif'}`)
  }
  if (theme.font_mono) {
    loadGoogleFont(theme.font_mono)
    root.setProperty('--font-mono-ui', `"${theme.font_mono}", ${GOOGLE_FONT_FALLBACKS[theme.font_mono] || 'monospace'}`)
  }
}
