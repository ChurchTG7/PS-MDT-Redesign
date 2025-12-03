import React from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-[rgba(56,189,248,0.2)] text-[#38BDF8] border-[rgba(56,189,248,0.4)]',
    success: 'bg-[rgba(34,197,94,0.2)] text-[#22C55E] border-[rgba(34,197,94,0.4)]',
    warning: 'bg-[rgba(251,191,36,0.2)] text-[#FACC15] border-[rgba(251,191,36,0.4)]',
    danger: 'bg-[rgba(239,68,68,0.2)] text-[#EF4444] border-[rgba(239,68,68,0.4)]',
    info: 'bg-[rgba(99,102,241,0.2)] text-[#818CF8] border-[rgba(99,102,241,0.4)]',
    secondary: 'bg-[rgba(100,116,139,0.2)] text-[#94A3B8] border-[rgba(100,116,139,0.4)]'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  )
}
