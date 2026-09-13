import { Link } from 'react-router-dom'

import useDocumentMeta from '../hooks/useDocumentMeta'
import StatusPanel from '../components/StatusPanel'
import SystemButton from '../components/SystemButton'

export default function NotFound() {
  useDocumentMeta('Page not found — Portfolio', 'The page you were looking for doesn’t exist.')

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <StatusPanel glow={false} className="p-10">
        <p className="system-heading text-xs uppercase tracking-wide text-slate-400">404</p>
        <h1 className="mt-3 text-2xl text-white sm:text-3xl">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          The page you were looking for doesn&rsquo;t exist, or may have moved.
        </p>
        <SystemButton as={Link} to="/" variant="primary" className="mt-6 inline-block">
          Back to home
        </SystemButton>
      </StatusPanel>
    </div>
  )
}
