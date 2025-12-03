import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantStyles = {
    primary: 'text-white border shadow-lg',
    secondary: 'bg-[rgba(15,23,42,0.8)] text-[rgba(255,255,255,0.9)] border hover:bg-[rgba(15,23,42,0.95)]',
    success: 'bg-gradient-to-r from-[rgba(34,197,94,0.32)] to-[rgba(22,163,74,0.4)] text-white border border-[rgba(34,197,94,0.5)] hover:from-[rgba(34,197,94,0.42)] hover:to-[rgba(22,163,74,0.5)] shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]',
    danger: 'bg-gradient-to-r from-[rgba(239,68,68,0.32)] to-[rgba(185,28,28,0.4)] text-white border border-[rgba(239,68,68,0.5)] hover:from-[rgba(239,68,68,0.42)] hover:to-[rgba(185,28,28,0.5)] shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]',
    ghost: 'bg-transparent text-[rgba(255,255,255,0.8)] hover:text-white'
  }
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  // Dynamic styles for theme-aware variants
  const dynamicStyle = variant === 'primary' ? {
    background: `linear-gradient(to right, rgba(var(--theme-accent-rgb), 0.32), rgba(var(--theme-primary-rgb), 0.4))`,
    borderColor: `rgba(var(--theme-button-highlight-rgb), 0.5)`,
  } : variant === 'secondary' ? {
    borderColor: `rgba(var(--theme-border-rgb), 0.3)`,
  } : variant === 'ghost' ? {} : {}
  
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'primary') {
      e.currentTarget.style.background = `linear-gradient(to right, rgba(var(--theme-accent-rgb), 0.42), rgba(var(--theme-primary-rgb), 0.5))`
      e.currentTarget.style.boxShadow = `0 0 20px rgba(var(--theme-button-highlight-rgb), 0.4)`
    } else if (variant === 'secondary') {
      e.currentTarget.style.borderColor = `rgba(var(--theme-border-rgb), 0.5)`
    } else if (variant === 'ghost') {
      e.currentTarget.style.backgroundColor = `rgba(var(--theme-accent-rgb), 0.1)`
    }
  }
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'primary') {
      e.currentTarget.style.background = `linear-gradient(to right, rgba(var(--theme-accent-rgb), 0.32), rgba(var(--theme-primary-rgb), 0.4))`
      e.currentTarget.style.boxShadow = ''
    } else if (variant === 'secondary') {
      e.currentTarget.style.borderColor = `rgba(var(--theme-border-rgb), 0.3)`
    } else if (variant === 'ghost') {
      e.currentTarget.style.backgroundColor = 'transparent'
    }
  }
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      style={dynamicStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </button>
  )
}
