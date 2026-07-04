import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import SystemButton from './SystemButton'

const links = [
  { to: '/', label: 'Home' },
  { to: '/blogs', label: 'Blogs' },
  { to: '/projects', label: 'Projects' },
]

export default function NavBar({ profile, onRequestQuote }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `system-heading text-sm tracking-wide transition-colors ${
      isActive ? 'text-neon-blue glow-text' : 'text-slate-300 hover:text-neon-blue'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-panel-edge/60 bg-void/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NavLink
          to="/"
          className="system-heading glow-text flex items-center gap-2 text-lg font-bold text-neon-blue"
          onClick={() => setMenuOpen(false)}
        >
          {profile?.photo ? (
            <img
              src={profile.photo}
              alt={profile.name}
              className="h-8 w-8 rounded-full border border-neon-blue/50 object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neon-blue/50 bg-neon-blue/10 text-sm">
              {(profile?.name?.[0] || 'P').toUpperCase()}
            </span>
          )}
          {profile?.name || 'Portfolio'}
        </NavLink>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 sm:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
          <SystemButton variant="primary" onClick={onRequestQuote}>
            Request Quote
          </SystemButton>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-panel-edge text-slate-200 sm:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`}
            />
            <span className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span
              className={`absolute left-0 top-[14px] h-0.5 w-5 bg-current transition-transform ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`}
            />
          </span>
        </button>
      </nav>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-panel-edge/60 px-6 py-4 sm:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={linkClass}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <SystemButton
              variant="primary"
              onClick={() => {
                setMenuOpen(false)
                onRequestQuote()
              }}
              className="w-full text-center"
            >
              Request Quote
            </SystemButton>
          </div>
        </div>
      )}
    </header>
  )
}
