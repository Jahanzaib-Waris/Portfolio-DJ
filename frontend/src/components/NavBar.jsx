import { NavLink } from 'react-router-dom'
import SystemButton from './SystemButton'

const links = [
  { to: '/', label: 'Home' },
  { to: '/blogs', label: 'Blogs' },
  { to: '/projects', label: 'Projects' },
]

export default function NavBar({ onRequestQuote }) {
  return (
    <header className="sticky top-0 z-40 border-b border-panel-edge/60 bg-void/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NavLink to="/" className="system-heading glow-text text-lg font-bold text-neon-blue">
          &lt;/&gt; Hunter.dev
        </NavLink>
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `system-heading text-sm tracking-wide transition-colors ${
                  isActive ? 'text-neon-blue glow-text' : 'text-slate-300 hover:text-neon-blue'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <SystemButton onClick={onRequestQuote}>Request Quote</SystemButton>
        </div>
      </nav>
    </header>
  )
}
