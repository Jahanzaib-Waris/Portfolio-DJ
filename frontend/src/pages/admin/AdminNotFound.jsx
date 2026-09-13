import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import StatusPanel from '../../components/StatusPanel'
import SystemButton from '../../components/SystemButton'

export default function AdminNotFound() {
  useEffect(() => {
    document.title = 'Page not found — Control Panel'
  }, [])

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <StatusPanel glow={false} className="p-10">
        <p className="system-heading text-xs uppercase tracking-wide text-slate-400">404</p>
        <h1 className="mt-3 text-2xl text-white">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          There&rsquo;s no admin screen at this address.
        </p>
        <SystemButton as={Link} to="/admin" variant="primary" className="mt-6 inline-block">
          Back to dashboard
        </SystemButton>
      </StatusPanel>
    </div>
  )
}
