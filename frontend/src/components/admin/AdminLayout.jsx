import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../../auth/authContext'

const nav = [
  { to: '/admin', label: 'Dashboard', end: true, ready: true },
  { to: '/admin/blog', label: 'Blog posts', ready: true },
  { to: '/admin/projects', label: 'Projects', ready: false },
  { to: '/admin/skills', label: 'Skills', ready: false },
  { to: '/admin/profile', label: 'Profile', ready: false },
  { to: '/admin/quotes', label: 'Quote requests', ready: false },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  const linkClass = ({ isActive }) =>
    `block rounded-md px-3 py-2 text-sm transition-colors ${
      isActive
        ? 'bg-neon-blue/10 text-neon-blue'
        : 'text-slate-300 hover:bg-panel-edge/40 hover:text-neon-blue'
    }`

  const navItems = (
    <nav className="flex flex-col gap-1">
      {nav.map((item) =>
        item.ready ? (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </NavLink>
        ) : (
          <span
            key={item.to}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-600"
            title="Not built yet"
          >
            {item.label}
            <span className="text-[10px] uppercase tracking-wide text-slate-700">soon</span>
          </span>
        ),
      )}
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
            <Link to="/admin" className="system-heading glow-text text-base text-neon-blue">
              Control Panel
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
