import React, { PropsWithChildren } from 'react'

type CardProps = PropsWithChildren<{
  title?: string
  subtitle?: string
  className?: string
  headerAction?: React.ReactNode
}>

export default function Card({ title, subtitle, children, className = '', headerAction }: CardProps) {
  return (
    <div 
      className={`bg-[rgba(15,23,42,0.82)] border rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden ${className}`}
      style={{ borderColor: `rgba(var(--theme-border-rgb), 0.2)` }}
    >
      {(title || subtitle || headerAction) && (
        <div 
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: `rgba(var(--theme-border-rgb), 0.15)` }}
        >
          <div>
            {title && <h3 className="text-base font-bold text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-[rgba(255,255,255,0.6)] mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}
