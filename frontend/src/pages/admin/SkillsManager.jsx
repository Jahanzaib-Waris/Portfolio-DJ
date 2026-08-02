import { useCallback, useEffect, useState } from 'react'

import { createSkill, deleteSkill, getSkills, updateSkill } from '../../api/client'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import Field from '../../components/admin/Field'
import { inputClass } from '../../components/admin/formStyles'
import StatusPanel from '../../components/StatusPanel'
import SystemButton from '../../components/SystemButton'
import { Skeleton } from '../../components/Skeleton'
import { fieldErrorsFrom, formErrorFrom, messageFor } from '../../utils/apiErrors'

const blank = { name: '', description: '', display_order: 0 }

export default function SkillsManager() {
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
      setDraft(blank)
      load()
    } catch (error) {
      setCreateErrors(fieldErrorsFrom(error))
      setCreateError(formErrorFrom(error))
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
      setEditingId(null)
      load()
    } catch (error) {
      setEditErrors(fieldErrorsFrom(error))
    } finally {
      setSavingEdit(false)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await deleteSkill(pendingDelete.id)
      setPendingDelete(null)
      load()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow system-heading text-xs text-neon-indigo">// Content</p>
      <h1 className="mt-3 text-2xl text-white sm:text-3xl">Skills</h1>
      <p className="mt-2 text-sm text-slate-400">
        The tech stack cards on the home page. Lower display order shows first.
      </p>

      <StatusPanel glow={false} className="mt-8 p-5">
        <h2 className="system-heading text-sm text-white">Add a skill</h2>
        <form onSubmit={add} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label="Name" htmlFor="new-name" error={messageFor(createErrors, 'name')}>
              <input
                id="new-name"
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Django"
                className={inputClass}
              />
            </Field>
            <Field label="Order" htmlFor="new-order" error={messageFor(createErrors, 'display_order')}>
              <input
                id="new-order"
                type="number"
                min={0}
                value={draft.display_order}
                onChange={(e) => setDraft({ ...draft, display_order: e.target.value })}
                className={`${inputClass} sm:w-24`}
              />
            </Field>
          </div>

          <Field
            label="Description"
            hint="(short blurb)"
            htmlFor="new-desc"
            error={messageFor(createErrors, 'description')}
          >
            <input
              id="new-desc"
              maxLength={200}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="REST APIs, ORM, admin-driven CMS"
              className={inputClass}
            />
          </Field>

          {createError && <p className="text-sm text-status-red">{createError}</p>}

          <SystemButton type="submit" variant="primary" disabled={creating}>
            {creating ? 'Adding...' : 'Add skill'}
          </SystemButton>
        </form>
      </StatusPanel>

      {loadState === 'error' && (
        <p className="mt-8 text-sm text-status-red">Failed to load skills. Try refreshing.</p>
      )}

      <div className="mt-6 space-y-3">
        {loadState === 'loading' &&
          [1, 2, 3].map((i) => (
            <StatusPanel key={i} glow={false} className="p-4">
              <Skeleton className="h-5 w-32" />
            </StatusPanel>
          ))}

        {loadState === 'ready' && skills.length === 0 && (
          <p className="text-sm text-slate-500">No skills yet.</p>
        )}

        {skills.map((skill) =>
          editingId === skill.id ? (
            <StatusPanel key={skill.id} className="space-y-3 p-4">
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
                    className={`${inputClass} sm:w-24`}
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
              <div className="flex gap-2">
                <SystemButton onClick={saveEdit} disabled={savingEdit} variant="primary">
                  {savingEdit ? 'Saving...' : 'Save'}
                </SystemButton>
                <SystemButton onClick={() => setEditingId(null)} disabled={savingEdit}>
                  Cancel
                </SystemButton>
              </div>
            </StatusPanel>
          ) : (
            <StatusPanel key={skill.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{skill.name}</h3>
                  <span className="rounded-full bg-panel-edge/50 px-2 py-0.5 text-[10px] text-slate-400">
                    #{skill.display_order}
                  </span>
                </div>
                {skill.description && (
                  <p className="mt-1 truncate text-xs text-slate-500">{skill.description}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2 text-xs">
                <button
                  onClick={() => startEdit(skill)}
                  className="rounded-md border border-neon-blue/50 px-3 py-1.5 text-neon-blue transition-colors hover:bg-neon-blue/10"
                >
                  Edit
                </button>
                <button
                  onClick={() => setPendingDelete(skill)}
                  className="rounded-md border border-panel-edge px-3 py-1.5 text-slate-400 transition-colors hover:border-status-red/60 hover:text-status-red"
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
        message={`"${pendingDelete?.name}" will be removed from the home page.`}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
