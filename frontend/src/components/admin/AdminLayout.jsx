import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { getBranding, getCrmLeads, getQuoteRequests } from '../../api/client'
import { useAuth } from '../../auth/authContext'
import { ToastProvider } from './ToastContext'

// Nav items with icons and hierarchy
const navConfig = [
  {
    key: 'dashboard',
    to: '/admin',
    label: 'Dashboard',
    end: true,
    ready: true,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'blog',
    label: 'Blog',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    children: [
      { to: '/admin/blog', label: 'All posts', end: true, ready: true },
      { to: '/admin/blog/new', label: 'Add new', ready: true },
    ],
  },
  {
    key: 'analytics',
    to: '/admin/analytics',
    label: 'Analytics',
    ready: true,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'portfolio',
    label: 'Portfolio',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    children: [
      { to: '/admin/projects', label: 'Projects', ready: true },
      { to: '/admin/skills', label: 'Skills', ready: true },
      { to: '/admin/profile', label: 'Profile', ready: true },
    ],
  },
  {
    key: 'crm',
    label: 'Sales & CRM',
    badgeKey: 'crmDue',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    children: [
      { to: '/admin/crm', label: 'Pipeline & Deals', end: true, ready: true },
      { to: '/admin/crm/prospects', label: 'Lead Prospector', ready: true },
      { to: '/admin/crm/radar', label: 'Client Radar', ready: true },
    ],
  },
  {
    key: 'quotes',
    to: '/admin/quotes',
    label: 'Quote requests',
    badgeKey: 'quotesCount',
    ready: true,
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    children: [
      { to: '/admin/settings/account', label: 'Account', ready: true },
      { to: '/admin/settings/branding', label: 'Branding', ready: true },
      { to: '/admin/settings/theme', label: 'Theme', ready: true },
      { to: '/admin/settings/integrations', label: 'API Integrations', ready: true },
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
  const [badges, setBadges] = useState({ quotesCount: 0, crmDue: 0 })

  useEffect(() => {
    let cancelled = false
    getBranding()
      .then((data) => !cancelled && setSiteName(data.site_name))
      .catch(() => {})

    // Fetch badges
    getQuoteRequests({ page_size: 1 })
      .then((res) => {
        if (!cancelled && res?.count !== undefined) {
          setBadges((prev) => ({ ...prev, quotesCount: res.count }))
        }
      })
      .catch(() => {})

    getCrmLeads()
      .then((res) => {
        if (!cancelled && Array.isArray(res?.items)) {
          const today = new Date().toISOString().slice(0, 10)
          const due = res.items.filter(
            (l) =>
              l.next_follow_up &&
              l.next_follow_up.slice(0, 10) <= today &&
              l.stage !== 'closed_won' &&
              l.stage !== 'closed_lost',
          ).length
          setBadges((prev) => ({ ...prev, crmDue: due }))
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [location.pathname])

  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(navConfig.filter((item) => item.children).map((item) => [item.key, isGroupActive(item, location.pathname)])),
  )

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  const toggleGroup = (key) => setOpenGroups((open) => ({ ...open, [key]: !open[key] }))

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
      isActive
        ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30 shadow-sm'
        : 'text-slate-300 hover:bg-panel-edge/40 hover:text-white'
    }`

  const subLinkClass = ({ isActive }) =>
    `block rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      isActive
        ? 'bg-neon-blue/15 text-neon-blue font-semibold'
        : 'text-slate-400 hover:bg-panel-edge/40 hover:text-slate-200'
    }`

  const soonItem = (label) => (
    <span
      className="flex items-center justify-between rounded-md px-3 py-1.5 text-xs text-slate-400"
      title="Feature under development"
    >
      {label}
      <span className="text-xs uppercase font-mono tracking-wider text-slate-400">soon</span>
    </span>
  )

  const usernameDisplay =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Admin'

  const navItems = (
    <nav className="flex flex-col gap-1.5">
      {navConfig.map((item) => {
        if (item.children) {
          const active = isGroupActive(item, location.pathname)
          const open = openGroups[item.key] ?? active
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0

          return (
            <div key={item.key} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(item.key)}
                aria-expanded={open}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'text-neon-blue bg-panel-edge/30'
                    : 'text-slate-300 hover:bg-panel-edge/40 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={active ? 'text-neon-blue' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {badgeCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                       {badgeCount}
                    </span>
                  )}
                  <span className={`text-xs text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}>
                    &rsaquo;
                  </span>
                </div>
              </button>
              {open && (
                <div className="ml-5 flex flex-col gap-1 border-l border-panel-edge/60 pl-3">
                  {item.children.map((child) =>
                    child.ready ? (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end={child.end}
                        className={subLinkClass}
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

        const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0

        return item.ready ? (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.end}
            className={linkClass}
            onClick={() => setMenuOpen(false)}
          >
            <span className="text-slate-400 group-hover:text-neon-blue">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {badgeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-neon-blue/20 text-neon-blue border border-neon-blue/30">
                {badgeCount}
              </span>
            )}
          </NavLink>
        ) : (
          <div key={item.key}>{soonItem(item.label)}</div>
        )
      })}
    </nav>
  )

  return (
    <ToastProvider>
      <div className="admin-shell flex min-h-screen flex-col bg-void text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-panel-edge/80 bg-void/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-panel-edge text-slate-300 hover:text-white hover:bg-panel-edge/50 lg:hidden transition-colors shrink-0"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <Link to="/admin" className="system-heading flex items-center gap-2 text-base font-bold text-white hover:text-neon-blue transition-colors min-w-0">
              <img src="/logo.png" alt="Jerry Dev Studio" className="h-6 w-6 rounded object-contain shrink-0" />
              <span className="truncate max-w-[130px] xs:max-w-[190px] sm:max-w-none">{siteName ? `${siteName}` : 'Jerry Dev Studio'}</span>
              <span className="hidden sm:inline-block text-xs font-normal text-slate-400 font-mono shrink-0">
                / control-panel
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-neon-blue transition-colors"
            >
              <span>View live site</span>
              <span>&rarr;</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-panel-edge">
              <span className="h-2 w-2 rounded-full bg-status-green animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">{usernameDisplay}</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-panel-edge px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-status-red/60 hover:text-status-red hover:bg-status-red/10"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-panel-edge/80 bg-abyss/40 p-4 lg:block">
          <div className="sticky top-20">
            <p className="px-3 pb-2 text-xs font-mono uppercase tracking-widest text-slate-400">
              Workspace Navigation
            </p>
            {navItems}
          </div>
        </aside>

        {/* Mobile Slide-Over Drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
              onClick={() => setMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-[84vw] max-w-xs bg-panel border-r border-panel-edge shadow-2xl p-4 sm:p-5 flex flex-col justify-between z-10 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-panel-edge mb-4">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="h-6 w-6 rounded" />
                    <span className="font-bold text-white text-sm">Control Panel</span>
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                {navItems}
              </div>

              <div className="pt-4 border-t border-panel-edge space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Logged in as:</span>
                  <span className="font-semibold text-slate-200">{usernameDisplay}</span>
                </div>
                <Link
                  to="/"
                  target="_blank"
                  className="block text-center w-full py-2 rounded border border-panel-edge text-xs text-neon-blue hover:bg-neon-blue/10 font-semibold"
                >
                  Visit Public Site ↗
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="min-w-0 flex-1 p-3 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
    </ToastProvider>
  )
}
