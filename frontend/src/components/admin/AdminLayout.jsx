import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { getBranding } from '../../api/client'
import { useAuth } from '../../auth/authContext'

// Grouped, WordPress-style nav: a top-level item either links directly
// (Dashboard, Quotes) or holds children that expand under it (Blog,
// Portfolio, Settings). `ready: false` renders the existing greyed "soon"
// treatment for sections whose pages don't exist yet.
const nav = [
  { key: 'dashboard', to: '/admin', label: 'Dashboard', end: true, ready: true },
  {
    key: 'blog',
    label: 'Blog',
    children: [
      { to: '/admin/blog', label: 'All posts', end: true, ready: true },
      { to: '/admin/blog/new', label: 'Add new', ready: true },
    ],
  },
  { key: 'analytics', to: '/admin/analytics', label: 'Analytics', ready: true },
  {
    key: 'portfolio',
    label: 'Portfolio',
    children: [
      { to: '/admin/projects', label: 'Projects', ready: true },
      { to: '/admin/skills', label: 'Skills', ready: true },
      { to: '/admin/profile', label: 'Profile', ready: true },
    ],
  },
  { key: 'quotes', to: '/admin/quotes', label: 'Quote requests', ready: true },
  {
    key: 'settings',
    label: 'Settings',
    children: [
      { to: '/admin/settings/account', label: 'Account', ready: true },
      { to: '/admin/settings/branding', label: 'Branding', ready: true },
      { to: '/admin/settings/theme', label: 'Theme', ready: true },
    ],
  },
]

function isGroupActive(item, pathname) {
  if (!item.children) return false
  return item.children.some((child) => pathname.startsWith(child.to))
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [siteName, setSiteName] = useState(null)

  useEffect(() => {
    getBranding()
      .then((data) => setSiteName(data.site_name))
      .catch(() => {})
  }, [])
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(nav.filter((item) => item.children).map((item) => [item.key, isGroupActive(item, location.pathname)])),
  )

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  const toggleGroup = (key) => setOpenGroups((open) => ({ ...open, [key]: !open[key] }))

  const linkClass = ({ isActive }) =>
    `block rounded-md px-3 py-2 text-sm transition-colors ${
      isActive
        ? 'bg-neon-blue/10 text-neon-blue'
        : 'text-slate-300 hover:bg-panel-edge/40 hover:text-neon-blue'
    }`

  const soonItem = (label) => (
    <span
      className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-600"
      title="Not built yet"
    >
      {label}
      <span className="text-[10px] uppercase tracking-wide text-slate-700">soon</span>
    </span>
  )

  const navItems = (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        if (item.children) {
          const active = isGroupActive(item, location.pathname)
          const open = openGroups[item.key] ?? active
          return (
            <div key={item.key}>
              <button
                type="button"
                onClick={() => toggleGroup(item.key)}
                aria-expanded={open}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? 'text-neon-blue' : 'text-slate-300 hover:bg-panel-edge/40 hover:text-neon-blue'
                }`}
              >
                {item.label}
                <span className={`text-xs transition-transform ${open ? 'rotate-90' : ''}`}>&rsaquo;</span>
              </button>
              {open && (
                <div className="ml-3 flex flex-col gap-1 border-l border-panel-edge/60 pl-3">
                  {item.children.map((child) =>
                    child.ready ? (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end={child.end}
                        className={linkClass}
                        onClick={() => setMenuOpen(false)}
                      >
                        {child.label}
                      </NavLink>
                    ) : (
                      <div key={child.to}>{soonItem(child.label)}</div>
                    ),
                  )}
                </div>
              )}
            </div>
          )
        }

        return item.ready ? (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.end}
            className={linkClass}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </NavLink>
        ) : (
          <div key={item.key}>{soonItem(item.label)}</div>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-panel-edge/60 bg-void/85 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-panel-edge text-slate-200 lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span className="text-lg leading-none">{menuOpen ? '×' : '≡'}</span>
            </button>
            <Link to="/admin" className="system-heading text-base text-neon-blue">
              {siteName ? `${siteName} — Control Panel` : 'Control Panel'}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden text-xs text-slate-400 transition-colors hover:text-neon-blue sm:inline"
            >
              View site &rarr;
            </Link>
            <span className="hidden text-xs text-slate-400 sm:inline">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-panel-edge px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-status-red/60 hover:text-status-red"
            >
              Log out
            </button>
          </div>
        </div>

        {menuOpen && <div className="border-t border-panel-edge/60 px-4 py-3 lg:hidden">{navItems}</div>}
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-panel-edge/60 p-4 lg:block">
          {navItems}
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
