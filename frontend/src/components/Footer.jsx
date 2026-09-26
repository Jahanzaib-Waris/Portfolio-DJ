function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12 .5C5.73.5.98 5.24.98 11.5c0 4.86 3.15 8.97 7.52 10.42.55.1.75-.24.75-.53 0-.26-.01-1.13-.02-2.05-3.06.67-3.71-1.3-3.71-1.3-.5-1.26-1.22-1.6-1.22-1.6-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.2.92.1-.71.38-1.2.7-1.48-2.44-.28-5.01-1.22-5.01-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.92 0 0 .92-.3 3.02 1.13a10.5 10.5 0 0 1 5.5 0c2.1-1.43 3.02-1.13 3.02-1.13.6 1.52.22 2.64.11 2.92.7.77 1.13 1.75 1.13 2.95 0 4.22-2.58 5.15-5.03 5.42.39.34.74 1.74 2.03 0 1.47-.01 2.65-.01 3.01 0 .29.2.64.76.53A10.52 10.52 0 0 0 23.02 11.5C23.02 5.24 18.27.5 12 .5Z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94v5.67H9.35V9h3.41v1.56h.05c.475-.9 1.637-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0-.83.67-1.5 1.5-1.5h16.5c.83 0 1.5.67 1.5 1.5v10.5c0 .83-.67 1.5-1.5 1.5H3.75c-.83 0-1.5-.67-1.5-1.5V6.75Zm1.5 0 8.25 6 8.25-6"
      />
    </svg>
  )
}

export default function Footer({ profile }) {
  const socialLinks = [
    { label: 'LinkedIn', href: profile?.linkedin_url || 'https://www.linkedin.com/in/jahanzaib-waris/', Icon: LinkedInIcon },
    profile?.github_url && { label: 'GitHub', href: profile.github_url, Icon: GithubIcon },
    profile?.email && { label: 'Email', href: `mailto:${profile.email}`, Icon: MailIcon },
  ].filter(Boolean)

  return (
    <footer className="border-t border-panel-edge bg-void px-6 pt-16 pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand info */}
          <div className="md:col-span-5 lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 32 32" className="h-8 w-8 rounded-lg shrink-0" aria-hidden="true" focusable="false">
                <rect width="32" height="32" rx="8" fill="#6D5AF6" />
                <path d="M11 23V10.5h10.5M11 16.5h5.2" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="21.2" cy="16.5" r="2.3" fill="#fff" />
              </svg>
              <span className="system-heading text-lg font-bold text-white">FlowBase</span>
            </div>
            <p className="mt-4 text-sm text-[#A1A7CA] max-w-sm leading-relaxed">
              Practical FlutterFlow fixes, custom Dart code and hands-on help getting your app built, rescued or connected.
            </p>
            <p className="mt-2 text-xs text-[#A1A7CA]/70">
              Built by {profile?.name || 'Jahanzaib Waris'}
            </p>
          </div>

          {/* Column 2: Blog */}
          <div className="md:col-span-3 lg:col-span-3">
            <h3 className="fb-kicker mb-4">Blog</h3>
            <ul className="flex flex-col gap-2.5 text-sm text-[#A1A7CA]">
              <li>
                <a href="/blogs" className="hover:text-white transition-colors">
                  All posts
                </a>
              </li>
              <li>
                <a href="/blogs" className="hover:text-white transition-colors">
                  FlutterFlow Fixes
                </a>
              </li>
              <li>
                <a href="/blogs" className="hover:text-white transition-colors">
                  Custom Code
                </a>
              </li>
              <li>
                <a href="/blogs" className="hover:text-white transition-colors">
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Work with me */}
          <div className="md:col-span-4 lg:col-span-4">
            <h3 className="fb-kicker mb-4">Work with me</h3>
            <ul className="flex flex-col gap-2.5 text-sm text-[#A1A7CA]">
              <li>
                <a href="/#services" className="hover:text-white transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="/#about" className="hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/#process" className="hover:text-white transition-colors">
                  My process
                </a>
              </li>
              <li>
                <a href="/projects" className="hover:text-white transition-colors">
                  Projects
                </a>
              </li>
            </ul>

            <div className="mt-5 flex gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-panel-edge text-[#A1A7CA] transition-colors hover:border-neon-indigo/60 hover:text-white"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col md:flex-row items-center justify-between border-t border-panel-edge pt-8 text-xs text-[#A1A7CA]">
          <p>
            &copy; {new Date().getFullYear()} FlowBase. All rights reserved.
          </p>
          <p className="mt-2 md:mt-0">
            Not affiliated with FlutterFlow or Google.
          </p>
        </div>
      </div>
    </footer>
  )
}
