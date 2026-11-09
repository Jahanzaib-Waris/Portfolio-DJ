import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { deleteProject, getProjects } from '../../api/client'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import RowActionsMenu from '../../components/admin/RowActionsMenu'
import SearchInput from '../../components/admin/SearchInput'
import { editButtonClass, rowClass, tableWrapClass, tdClass, thClass } from '../../components/admin/formStyles'
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

      {(loadState === 'loading' || filteredProjects.length > 0) && (
        <div className={tableWrapClass}>
          <table className="w-full text-sm">
            <thead className="border-b border-panel-edge">
              <tr>
                <th scope="col" className={thClass}>Project</th>
                <th scope="col" className={`${thClass} hidden sm:table-cell`}>Order</th>
                <th scope="col" className={`${thClass} text-right`}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-edge/70">
              {loadState === 'loading' &&
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td className={tdClass}><Skeleton className="h-8 w-56 max-w-full" /></td>
                    <td className={`${tdClass} hidden sm:table-cell`}><Skeleton className="h-4 w-8" /></td>
                    <td className={tdClass}></td>
                  </tr>
                ))}

              {filteredProjects.map((project) => (
                <tr key={project.id} className={rowClass}>
                  <td className={`${tdClass} max-w-0 w-full sm:w-auto sm:max-w-md`}>
                    <div className="flex items-center gap-3">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt=""
                          loading="lazy"
                          className="h-8 w-12 shrink-0 rounded border border-panel-edge object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded border border-dashed border-panel-edge bg-abyss/40 text-xs text-slate-400">
                          &mdash;
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/projects/${project.id}/edit`}
                            className="truncate font-medium text-white hover:text-neon-blue"
                          >
                            {project.title}
                          </Link>
                          {project.is_featured && (
                            <span className="shrink-0 rounded-full border border-neon-blue/30 bg-neon-blue/15 px-2 py-0.5 text-xs font-medium text-neon-blue">
                              Featured
                            </span>
                          )}
                        </div>
                        {project.tech_stack_list?.length > 0 && (
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {project.tech_stack_list.join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`${tdClass} hidden whitespace-nowrap text-xs text-slate-400 sm:table-cell`}>
                    #{project.display_order}
                  </td>
                  <td className={tdClass}>
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/projects/${project.id}/edit`} className={`${editButtonClass} hidden sm:inline-block`}>
                        Edit
                      </Link>
                      <RowActionsMenu
                        label={`Actions for ${project.title}`}
                        items={[
                          { label: 'Edit', to: `/admin/projects/${project.id}/edit` },
                          { label: 'Delete', danger: true, onSelect: () => setPendingDelete(project) },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
