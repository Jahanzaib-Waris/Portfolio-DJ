const sizes = {
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
  const variantClass = variant === 'primary' ? 'system-button-primary' : ''

  return (
    <Tag
      className={`system-button ${variantClass} inline-block font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
