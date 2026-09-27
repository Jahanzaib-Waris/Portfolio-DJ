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
  const accent = (!theme.color_accent || theme.color_accent.toLowerCase() === '#238636') ? '#6D5AF6' : theme.color_accent
  switch (theme.button_style) {
    case 'outline':
      return { bg: 'transparent', fg: accent, border: accent }
    case 'soft':
      return { bg: withAlpha(accent, '1a'), fg: accent, border: withAlpha(accent, '4d') }
    case 'solid':
    default:
      return { bg: accent, fg: '#ffffff', border: 'transparent' }
  }
}

export function resolveCardBorder(theme) {
  const accent = (!theme.color_accent || theme.color_accent.toLowerCase() === '#238636') ? '#6D5AF6' : theme.color_accent
  const edge = (!theme.color_panel_edge || theme.color_panel_edge.toLowerCase() === '#30363d') ? '#232848' : theme.color_panel_edge
  return theme.card_style === 'accent' ? withAlpha(accent, '4d') : edge
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

  const colorVoid = (!theme.color_void || theme.color_void.toLowerCase() === '#0d1117') ? '#0A0C16' : theme.color_void
  const colorPanel = (!theme.color_panel || theme.color_panel.toLowerCase() === '#161b22') ? '#11142A' : theme.color_panel
  const colorPanelEdge = (!theme.color_panel_edge || theme.color_panel_edge.toLowerCase() === '#30363d') ? '#232848' : theme.color_panel_edge
  const colorNeonBlue = (!theme.color_neon_blue || theme.color_neon_blue.toLowerCase() === '#58a6ff') ? '#38BDF8' : theme.color_neon_blue
  const colorNeonIndigo = (!theme.color_neon_indigo || theme.color_neon_indigo.toLowerCase() === '#388bfd') ? '#7C6CFF' : theme.color_neon_indigo
  const colorAccent = (!theme.color_accent || theme.color_accent.toLowerCase() === '#238636') ? '#6D5AF6' : theme.color_accent
  const colorStatusGreen = theme.color_status_green || '#3fb950'
  const colorStatusRed = (!theme.color_status_red || theme.color_status_red.toLowerCase() === '#f85149') ? '#FCA5A5' : theme.color_status_red

  root.setProperty('--color-void', colorVoid)
  root.setProperty('--color-panel', colorPanel)
  root.setProperty('--color-panel-edge', colorPanelEdge)
  root.setProperty('--color-neon-blue', colorNeonBlue)
  root.setProperty('--color-neon-indigo', colorNeonIndigo)
  root.setProperty('--color-accent', colorAccent)
  root.setProperty('--color-accent-hover', '#5B48E8')
  root.setProperty('--color-status-green', colorStatusGreen)
  root.setProperty('--color-status-red', colorStatusRed)

  root.setProperty('--theme-radius', RADIUS_REM[theme.radius_scale] ?? RADIUS_REM.soft)
  root.setProperty('--theme-shadow', SHADOW_VALUE[theme.shadow_intensity] ?? SHADOW_VALUE.none)
  root.setProperty('--card-border-color', resolveCardBorder({ ...theme, color_accent: colorAccent, color_panel_edge: colorPanelEdge }))

  const btn = resolveButtonVars({ ...theme, color_accent: colorAccent })
  root.setProperty('--btn-primary-bg', btn.bg)
  root.setProperty('--btn-primary-fg', btn.fg)
  root.setProperty('--btn-primary-border', btn.border)
  root.setProperty('--btn-primary-hover-bg', '#5B48E8')

  const fontDisplay = (!theme.font_display || theme.font_display === 'Inter') ? 'Manrope' : theme.font_display
  const fontMono = (!theme.font_mono || theme.font_mono === 'JetBrains Mono') ? 'Fira Code' : theme.font_mono

  loadGoogleFont(fontDisplay)
  root.setProperty('--font-display', `"${fontDisplay}", ${GOOGLE_FONT_FALLBACKS[fontDisplay] || 'sans-serif'}`)

  loadGoogleFont(fontMono)
  root.setProperty('--font-mono-ui', `"${fontMono}", ${GOOGLE_FONT_FALLBACKS[fontMono] || 'monospace'}`)
}
