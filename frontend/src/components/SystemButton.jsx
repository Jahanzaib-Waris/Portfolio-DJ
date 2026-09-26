const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
}

export default function SystemButton({
  as: Tag = 'button',
  size = 'md',
  variant = 'ghost',
  className = '',
  children,
  ...rest
}) {
  let variantClass = ''
  if (variant === 'primary') variantClass = 'system-button-primary'
  else if (variant === 'outline') variantClass = 'system-button border border-panel-edge bg-transparent hover:bg-accent-hover hover:border-accent-hover text-white transition-colors'

  return (
    <Tag
      className={`system-button ${variantClass} inline-block font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${sizes[size] || sizes.md} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
