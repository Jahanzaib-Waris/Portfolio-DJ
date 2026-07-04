import StatusPanel from './StatusPanel'

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export function CardSkeleton() {
  return (
    <StatusPanel glow={false} className="h-full">
      <Skeleton className="mb-4 h-40 w-full" />
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
    </StatusPanel>
  )
}
