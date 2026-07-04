function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 .5C5.73.5.98 5.24.98 11.5c0 4.86 3.15 8.97 7.52 10.42.55.1.75-.24.75-.53 0-.26-.01-1.13-.02-2.05-3.06.67-3.71-1.3-3.71-1.3-.5-1.26-1.22-1.6-1.22-1.6-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.2.92.1-.71.38-1.2.7-1.48-2.44-.28-5.01-1.22-5.01-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.92 0 0 .92-.3 3.02 1.13a10.5 10.5 0 0 1 5.5 0c2.1-1.43 3.02-1.13 3.02-1.13.6 1.52.22 2.64.11 2.92.7.77 1.13 1.75 1.13 2.95 0 4.22-2.58 5.15-5.03 5.42.39.34.74 1 .74 2.03 0 1.47-.01 2.65-.01 3.01 0 .29.2.64.76.53A10.52 10.52 0 0 0 23.02 11.5C23.02 5.24 18.27.5 12 .5Z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94v5.67H9.35V9h3.41v1.56h.05c.475-.9 1.637-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0-.83.67-1.5 1.5-1.5h16.5c.83 0 1.5.67 1.5 1.5v10.5c0 .83-.67 1.5-1.5 1.5H3.75c-.83 0-1.5-.67-1.5-1.5V6.75Zm1.5 0 8.25 6 8.25-6"
      />
    </svg>
  )
}

export default function Footer({ profile }) {
  const links = [
    profile?.github_url && { label: 'GitHub', href: profile.github_url, Icon: GithubIcon },
    profile?.linkedin_url && { label: 'LinkedIn', href: profile.linkedin_url, Icon: LinkedInIcon },
    profile?.email && { label: 'Email', href: `mailto:${profile.email}`, Icon: MailIcon },
  ].filter(Boolean)

  return (
    <footer className="border-t border-panel-edge/60 bg-void/80 px-6 py-10 text-center">
      <div className="mx-auto h-px w-16 bg-gradient-to-r from-neon-blue to-neon-indigo" />

      <p className="system-heading mt-6 text-sm text-white">{profile?.name || 'Portfolio'}</p>
      {profile?.tagline && <p className="mt-1 text-xs text-slate-400">{profile.tagline}</p>}

      {links.length > 0 && (
        <div className="mt-5 flex justify-center gap-3">
          {links.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-panel-edge text-slate-300 transition-colors hover:border-neon-blue/60 hover:text-neon-blue"
            >
              <Icon />
            </a>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-slate-500">
        &copy; {new Date().getFullYear()} {profile?.name || 'Portfolio'}. All rights reserved.
      </p>
    </footer>
  )
}
