export default function StatusPanel({ as: Tag = 'div', className = '', glow = true, children, ...rest }) {
  return (
    <Tag
      className={`system-panel ${glow ? 'system-panel-glow' : ''} p-6 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
