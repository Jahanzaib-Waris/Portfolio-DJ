import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { deleteProject, getProjects } from '../../api/client'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import SearchInput from '../../components/admin/SearchInput'
import { useToast } from '../../components/admin/toastStore'
import StatusPanel from '../../components/StatusPanel'
import SystemButton from '../../components/SystemButton'
import { Skeleton } from '../../components/Skeleton'
import usePaginatedList from '../../hooks/usePaginatedList'

export default function ProjectList() {
  const { items: projects, loadState, hasMore, loadingMore, moreFailed, loadMore, reload } =
    usePaginatedList(getProjects)

  const [query, setQuery] = useState('')
  const filteredProjects = projects.filter((project) => {
    const term = query.trim().toLowerCase()
    if (!term) return true
    return (
      project.title.toLowerCase().includes(term) ||
      project.tech_stack.toLowerCase().includes(term)
    )
  })

  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    document.title = 'Projects — Control Panel'
  }, [])

  const cancelDelete = useCallback(() => {
    setPendingDelete(null)
    setDeleteError(null)
  }, [])

  const toast = useToast()

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteProject(pendingDelete.id)
      toast.success(`Deleted project "${pendingDelete.title}"`)
      setPendingDelete(null)
      reload()
    } catch {
      setDeleteError('Could not delete that project. Try again.')
      toast.error('Could not delete that project. Try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mt-3 text-2xl text-white sm:text-3xl">Projects</h1>
          <p className="mt-2 text-sm text-slate-400">
            Ordered by display order, lowest first.
          </p>
        </div>
        <SystemButton as={Link} to="/admin/projects/new" variant="primary">
          New project
        </SystemButton>
      </div>

      {loadState === 'error' && (
        <p className="mt-8 text-sm text-status-red">Failed to load projects. Try refreshing.</p>
      )}

      {loadState === 'ready' && projects.length === 0 && (
        <StatusPanel className="mt-8 p-8 text-center">
          <p className="text-slate-400">No projects yet.</p>
          <SystemButton as={Link} to="/admin/projects/new" className="mt-4">
            Add the first one
          </SystemButton>
        </StatusPanel>
      )}

      {loadState === 'ready' && projects.length > 0 && (
        <div className="mt-6">
          <SearchInput value={query} onChange={setQuery} placeholder="Search projects..." />
        </div>
      )}

      {loadState === 'ready' && projects.length > 0 && filteredProjects.length === 0 && (
        <p className="mt-6 text-sm text-slate-400">No projects match &ldquo;{query}&rdquo;.</p>
      )}

      <div className="mt-4 space-y-3">
        {loadState === 'loading' &&
          [1, 2, 3].map((i) => (
            <StatusPanel key={i} glow={false} className="p-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="mt-2 h-3 w-24" />
            </StatusPanel>
          ))}

        {filteredProjects.map((project) => (
          <StatusPanel key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {project.thumbnail ? (
                <img
                  src={project.thumbnail}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded border border-panel-edge object-cover"
                />
              ) : (
                <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded border border-dashed border-panel-edge text-xs font-mono text-slate-400 bg-abyss/40">
                  no img
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-sm font-semibold text-white">{project.title}</h2>
                  <span className="rounded-full bg-abyss border border-panel-edge px-2 py-0.5 text-xs font-mono text-slate-300">
                    #{project.display_order}
                  </span>
                  {project.is_featured && (
                    <span className="rounded-full bg-neon-blue/15 border border-neon-blue/30 px-2 py-0.5 text-xs font-mono font-medium text-neon-blue">
                      Featured
                    </span>
                  )}
                </div>
                {project.tech_stack_list?.length > 0 && (
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {project.tech_stack_list.join(' · ')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto justify-end">
              <Link
                to={`/admin/projects/${project.id}/edit`}
                className="rounded-md border border-neon-blue/50 px-3 py-1.5 text-neon-blue transition-colors hover:bg-neon-blue/10"
              >
                Edit
              </Link>
              <button
                onClick={() => setPendingDelete(project)}
                className="rounded-md border border-panel-edge px-3 py-1.5 text-slate-400 transition-colors hover:border-status-red/60 hover:text-status-red"
              >
                Delete
              </button>
            </div>
          </StatusPanel>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <SystemButton onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </SystemButton>
          {moreFailed && <p className="text-sm text-status-red">Couldn&rsquo;t load more.</p>}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this project?"
        message={
          deleteError ||
          `"${pendingDelete?.title}" will be permanently removed. This cannot be undone.`
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}
