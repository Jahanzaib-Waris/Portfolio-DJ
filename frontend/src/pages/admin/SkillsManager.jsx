import { useCallback, useEffect, useState } from 'react'

import { createSkill, deleteSkill, getSkills, updateSkill } from '../../api/client'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import Field from '../../components/admin/Field'
import { inputClass } from '../../components/admin/formStyles'
import { useToast } from '../../components/admin/toastStore'
import StatusPanel from '../../components/StatusPanel'
import SystemButton from '../../components/SystemButton'
import { Skeleton } from '../../components/Skeleton'
import { fieldErrorsFrom, formErrorFrom, messageFor } from '../../utils/apiErrors'

const blank = { name: '', description: '', display_order: 0 }

export default function SkillsManager() {
  const toast = useToast()
  const [skills, setSkills] = useState([])
  const [loadState, setLoadState] = useState('loading')

  const [draft, setDraft] = useState(blank)
  const [creating, setCreating] = useState(false)
  const [createErrors, setCreateErrors] = useState({})
  const [createError, setCreateError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(blank)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editErrors, setEditErrors] = useState({})

  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Skills are few — one large page avoids a Load more button here.
  const load = useCallback(() => {
    setLoadState('loading')
    getSkills({ page_size: 100 })
      .then((data) => {
        setSkills(data.results ?? data)
        setLoadState('ready')
      })
      .catch(() => setLoadState('error'))
  }, [])

  useEffect(() => {
    document.title = 'Skills — Control Panel'
    load()
  }, [load])

  const add = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateErrors({})
    setCreateError(null)
    try {
      await createSkill(draft)
      toast.success(`Added skill "${draft.name}"`)
      setDraft(blank)
      load()
    } catch (error) {
      setCreateErrors(fieldErrorsFrom(error))
      const err = formErrorFrom(error) || error?.message || 'Could not add skill'
      setCreateError(err)
      toast.error(err)
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (skill) => {
    setEditingId(skill.id)
    setEditErrors({})
    setEditDraft({
      name: skill.name,
      description: skill.description || '',
      display_order: skill.display_order ?? 0,
    })
  }

  const saveEdit = async () => {
    setSavingEdit(true)
    setEditErrors({})
    try {
      await updateSkill(editingId, editDraft)
      toast.success(`Updated "${editDraft.name}"`)
      setEditingId(null)
      load()
    } catch (error) {
      setEditErrors(fieldErrorsFrom(error))
      toast.error(error?.message || 'Could not update skill')
    } finally {
      setSavingEdit(false)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await deleteSkill(pendingDelete.id)
      toast.success(`Deleted "${pendingDelete.name}"`)
      setPendingDelete(null)
      load()
    } catch (err) {
      toast.error(err?.message || 'Failed to delete skill')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl pb-16">
      {/* Top Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <span>Portfolio</span>
          <span className="text-slate-600 font-mono">/</span>
          <span className="text-slate-300 font-medium">Skills</span>
        </nav>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Technical Skills</h1>
        <p className="mt-1 text-sm text-slate-400">
          Technologies, frameworks, and architecture capabilities highlighted on the public portfolio.
        </p>
      </div>

      {/* Add New Skill Form */}
      <StatusPanel glow={false} className="mt-6 p-4 sm:p-5 border-panel-edge">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>+ Add New Capability</span>
        </h2>
        <form onSubmit={add} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label="Skill / Framework Name" htmlFor="new-name" error={messageFor(createErrors, 'name')}>
              <input
                id="new-name"
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. FlutterFlow, Supabase, Tailwind CSS"
                className={inputClass}
              />
            </Field>
            <Field label="Display Order" htmlFor="new-order" error={messageFor(createErrors, 'display_order')}>
              <input
                id="new-order"
                type="number"
                min={0}
                value={draft.display_order}
                onChange={(e) => setDraft({ ...draft, display_order: e.target.value })}
                className={`${inputClass} sm:w-28`}
              />
            </Field>
          </div>

          <Field
            label="Short Capability Description"
            hint="(1-2 line summary of expertise)"
            htmlFor="new-desc"
            error={messageFor(createErrors, 'description')}
          >
            <input
              id="new-desc"
              maxLength={200}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="e.g. Multi-platform architecture, custom actions, and rapid prototyping"
              className={inputClass}
            />
          </Field>

          {createError && (
            <p role="alert" className="text-sm text-status-red">
              {createError}
            </p>
          )}

          <div className="flex justify-end">
            <SystemButton type="submit" variant="primary" size="sm" disabled={creating}>
              {creating ? 'Adding...' : '+ Add Skill'}
            </SystemButton>
          </div>
        </form>
      </StatusPanel>

      {loadState === 'error' && (
        <p className="mt-8 text-sm text-status-red">Failed to load skills. Try refreshing.</p>
      )}

      {/* Existing Skills List */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Configured Skills ({skills.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Sorted by display order</span>
        </div>

        {loadState === 'loading' &&
          [1, 2, 3].map((i) => (
            <StatusPanel key={i} glow={false} className="p-4">
              <Skeleton className="h-5 w-32" />
            </StatusPanel>
          ))}

        {loadState === 'ready' && skills.length === 0 && (
          <StatusPanel className="p-8 text-center">
            <p className="text-sm text-slate-400">No skills added yet.</p>
          </StatusPanel>
        )}

        {skills.map((skill) =>
          editingId === skill.id ? (
            <div key={skill.id} className="p-4 rounded-xl border border-neon-blue/50 bg-panel/90 space-y-3 shadow-lg">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Field label="Name" error={messageFor(editErrors, 'name')}>
                  <input
                    value={editDraft.name}
                    onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Order" error={messageFor(editErrors, 'display_order')}>
                  <input
                    type="number"
                    min={0}
                    value={editDraft.display_order}
                    onChange={(e) => setEditDraft({ ...editDraft, display_order: e.target.value })}
                    className={`${inputClass} sm:w-28`}
                  />
                </Field>
              </div>
              <Field label="Description" error={messageFor(editErrors, 'description')}>
                <input
                  maxLength={200}
                  value={editDraft.description}
                  onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  disabled={savingEdit}
                  className="px-3 py-1.5 rounded-lg border border-panel-edge text-xs font-medium text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={savingEdit}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-neon-blue text-abyss hover:bg-neon-blue/90"
                >
                  {savingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <StatusPanel key={skill.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 hover:border-slate-500/50 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">{skill.name}</h4>
                  <span className="rounded-full bg-abyss border border-panel-edge px-2 py-0.5 text-xs font-mono text-slate-400">
                    #{skill.display_order}
                  </span>
                </div>
                {skill.description && (
                  <p className="mt-1 text-xs text-slate-400 truncate">{skill.description}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto justify-end">
                <button
                  onClick={() => startEdit(skill)}
                  className="rounded-lg border border-neon-blue/40 px-3 py-1.5 text-neon-blue transition-colors hover:bg-neon-blue/10 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => setPendingDelete(skill)}
                  className="rounded-lg border border-panel-edge px-3 py-1.5 text-slate-400 transition-colors hover:border-rose-500/60 hover:text-rose-400"
                >
                  Delete
                </button>
              </div>
            </StatusPanel>
          ),
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this skill?"
        message={`"${pendingDelete?.name}" will be removed from the home page showcase.`}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
