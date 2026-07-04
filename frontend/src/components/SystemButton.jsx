export default function SystemButton({ as: Tag = 'button', className = '', children, ...rest }) {
  return (
    <Tag className={`system-button inline-block px-5 py-2.5 text-sm font-semibold cursor-pointer ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
