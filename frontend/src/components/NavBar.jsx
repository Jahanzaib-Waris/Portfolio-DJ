import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import SystemButton from './SystemButton'

const navLinks = [
  { to: '/blogs', label: 'Blog' },
  { to: '/#services', label: 'Services', isAnchor: true },
  { to: '/#about', label: 'About', isAnchor: true },
  { to: '/#process', label: 'Process', isAnchor: true },
  { to: '/projects', label: 'Projects' },
]

export default function NavBar({ profile, onRequestQuote }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `system-heading text-sm tracking-wide [WebkitTapHighlightColor:transparent] ${
      isActive ? 'text-white' : 'text-[#A1A7CA] hover:text-white'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-panel-edge bg-void/72 backdrop-blur-[14px] backdrop-saturate-[160%]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link
          to="/"
          className="system-heading flex items-center gap-2.5 text-lg font-bold text-white"
          onClick={() => setMenuOpen(false)}
        >
          {profile?.photo ? (
            <img
              src={profile.photo}
              alt={profile.name}
              className="h-8 w-8 rounded-lg border border-neon-indigo/50 object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-indigo to-neon-blue font-mono-ui text-xs font-bold text-white shadow-[0_0_12px_rgba(124,108,255,0.4)]">
              {(profile?.name ? profile.name.slice(0, 2) : 'JW').toUpperCase()}
            </span>
          )}
          <span>{profile?.name || 'Jahanzaib Waris'}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 sm:flex">
          {navLinks.map((link) =>
            link.isAnchor ? (
              <a
                key={link.to}
                href={link.to}
                className="system-heading text-sm tracking-wide text-[#A1A7CA] hover:text-white [WebkitTapHighlightColor:transparent]"
              >
                {link.label}
              </a>
            ) : (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ),
          )}
          <SystemButton variant="primary" size="sm" onClick={onRequestQuote}>
            Start a project
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
        <div className="border-t border-panel-edge px-6 py-4 sm:hidden bg-[#0A0C16]">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) =>
              link.isAnchor ? (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="system-heading text-sm tracking-wide text-[#A1A7CA] hover:text-white"
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={linkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ),
            )}
            <SystemButton
              variant="primary"
              size="sm"
              onClick={() => {
                setMenuOpen(false)
                onRequestQuote()
              }}
              className="w-full text-center"
            >
              Start a project
            </SystemButton>
          </div>
        </div>
      )}
    </header>
  )
}
