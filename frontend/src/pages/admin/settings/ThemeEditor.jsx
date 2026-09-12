import { useEffect, useState } from 'react'

import { getTheme, updateTheme } from '../../../api/client'
import Field from '../../../components/admin/Field'
import StatusPanel from '../../../components/StatusPanel'
import SystemButton from '../../../components/SystemButton'
import { Skeleton } from '../../../components/Skeleton'
import applyTheme, { RADIUS_REM, SHADOW_VALUE, resolveButtonVars, resolveCardBorder } from '../../../utils/applyTheme'
import { fieldErrorsFrom, formErrorFrom, messageFor } from '../../../utils/apiErrors'

const selectClass =
  'w-full rounded-md border border-panel-edge bg-abyss/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-neon-blue'

const colorFields = [
  ['color_void', 'Page background'],
  ['color_panel', 'Card background'],
  ['color_panel_edge', 'Border'],
  ['color_neon_blue', 'Accent (links, highlights)'],
  ['color_neon_indigo', 'Secondary accent'],
  ['color_accent', 'Primary button'],
  ['color_status_green', 'Success'],
  ['color_status_red', 'Error'],
]

const fontDisplayOptions = ['Inter', 'Poppins', 'Space Grotesk', 'Manrope', 'Sora']
const fontMonoOptions = ['JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'Roboto Mono']
const radiusOptions = [['sharp', 'Sharp'], ['soft', 'Soft'], ['rounded', 'Rounded']]
const shadowOptions = [['none', 'None'], ['subtle', 'Subtle'], ['elevated', 'Elevated']]
const buttonStyleOptions = [['solid', 'Solid fill'], ['outline', 'Outline'], ['soft', 'Soft tint']]
const cardStyleOptions = [['clean', 'Clean border'], ['accent', 'Accent border']]

function PreviewPanel({ theme }) {
  const btn = resolveButtonVars(theme)
  const cardBorder = resolveCardBorder(theme)

  return (
    <div
      className="rounded-lg p-6"
      style={{
        background: theme.color_void,
        border: `1px solid ${theme.color_panel_edge}`,
      }}
    >
      <div
        className="p-5"
        style={{
          background: theme.color_panel,
          border: `1px solid ${cardBorder}`,
          borderRadius: RADIUS_REM[theme.radius_scale],
          boxShadow: SHADOW_VALUE[theme.shadow_intensity],
        }}
      >
        <p style={{ color: theme.color_neon_blue, fontFamily: `"${theme.font_display}", sans-serif`, fontWeight: 600 }}>
          Sample card
        </p>
        <p className="mt-1 text-sm" style={{ color: '#9ca3af' }}>
          This is how cards and text will look with these settings.
        </p>
        <code
          className="mt-2 inline-block rounded px-2 py-0.5 text-xs"
          style={{ fontFamily: `"${theme.font_mono}", monospace`, background: 'rgba(255,255,255,0.06)', color: theme.color_neon_blue }}
        >
          const example = true
        </code>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold"
            style={{
              background: btn.bg,
              color: btn.fg,
              border: `1px solid ${btn.border}`,
              borderRadius: `calc(${RADIUS_REM[theme.radius_scale]} * 0.75)`,
              fontFamily: `"${theme.font_display}", sans-serif`,
            }}
          >
            Primary button
          </button>
          <span className="text-sm" style={{ color: theme.color_status_green }}>
            Success text
          </span>
          <span className="text-sm" style={{ color: theme.color_status_red }}>
            Error text
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ThemeEditor() {
  const [theme, setTheme] = useState(null)
  const [loadState, setLoadState] = useState('loading')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    document.title = 'Theme — Control Panel'

    let cancelled = false
    getTheme()
      .then((data) => {
        if (cancelled) return
        setTheme(data)
        setLoadState('ready')
      })
      .catch(() => !cancelled && setLoadState('error'))

    return () => {
      cancelled = true
    }
  }, [])

  const update = (patch) => {
    setTheme((prev) => ({ ...prev, ...patch }))
    setDirty(true)
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    setFieldErrors({})
    setFormError(null)
    setSaved(false)

    try {
      const result = await updateTheme(theme)
      setTheme(result)
      applyTheme(result)
      setDirty(false)
      setSaved(true)
    } catch (error) {
      setFieldErrors(fieldErrorsFrom(error))
      setFormError(formErrorFrom(error))
    } finally {
      setSaving(false)
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (loadState === 'error' || !theme) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-status-red">Theme settings could not be loaded.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-white sm:text-3xl">Theme</h1>
        <div className="flex items-center gap-3 text-xs">
          {dirty && <span className="text-accent">Unsaved changes</span>}
          {saved && !dirty && <span className="text-status-green">Saved</span>}
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        One theme, fully customizable — colors, typography, borders and button/card style.
        Changes apply site-wide the moment you save, no rebuild needed.
      </p>

      {formError && (
        <p role="alert" className="mt-4 text-sm text-status-red">
          {formError}
        </p>
      )}

      <div className="mt-6">
        <p className="system-heading mb-2 text-xs uppercase tracking-wide text-slate-400">Live preview</p>
        <PreviewPanel theme={theme} />
      </div>

      <StatusPanel glow={false} className="mt-5 p-5">
        <p className="system-heading mb-3 text-sm text-white">Colors</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {colorFields.map(([key, label]) => (
            <Field key={key} label={label} htmlFor={key} error={messageFor(fieldErrors, key)}>
              <div className="flex items-center gap-2">
                <input
                  id={key}
                  type="color"
                  value={theme[key]}
                  onChange={(e) => update({ [key]: e.target.value })}
                  className="h-9 w-12 rounded border border-panel-edge bg-transparent"
                />
                <input
                  value={theme[key]}
                  onChange={(e) => update({ [key]: e.target.value })}
                  className={selectClass}
                />
              </div>
            </Field>
          ))}
        </div>
      </StatusPanel>

      <StatusPanel glow={false} className="mt-5 grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Display font" htmlFor="font_display">
          <select
            id="font_display"
            value={theme.font_display}
            onChange={(e) => update({ font_display: e.target.value })}
            className={selectClass}
          >
            {fontDisplayOptions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </Field>

        <Field label="Monospace font" htmlFor="font_mono">
          <select
            id="font_mono"
            value={theme.font_mono}
            onChange={(e) => update({ font_mono: e.target.value })}
            className={selectClass}
          >
            {fontMonoOptions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </Field>
      </StatusPanel>

      <StatusPanel glow={false} className="mt-5 grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Corner radius" htmlFor="radius_scale">
          <select
            id="radius_scale"
            value={theme.radius_scale}
            onChange={(e) => update({ radius_scale: e.target.value })}
            className={selectClass}
          >
            {radiusOptions.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>

        <Field label="Shadow" htmlFor="shadow_intensity">
          <select
            id="shadow_intensity"
            value={theme.shadow_intensity}
            onChange={(e) => update({ shadow_intensity: e.target.value })}
            className={selectClass}
          >
            {shadowOptions.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>

        <Field label="Button style" htmlFor="button_style">
          <select
            id="button_style"
            value={theme.button_style}
            onChange={(e) => update({ button_style: e.target.value })}
            className={selectClass}
          >
            {buttonStyleOptions.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>

        <Field label="Card style" htmlFor="card_style">
          <select
            id="card_style"
            value={theme.card_style}
            onChange={(e) => update({ card_style: e.target.value })}
            className={selectClass}
          >
            {cardStyleOptions.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
      </StatusPanel>

      <div className="mt-6">
        <SystemButton onClick={save} disabled={saving} variant="primary">
          {saving ? 'Saving...' : 'Save changes'}
        </SystemButton>
      </div>
    </div>
  )
}
