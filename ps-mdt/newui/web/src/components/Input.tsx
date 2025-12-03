import React from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export default function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-[rgba(255,255,255,0.9)]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.5)]">
            {icon}
          </div>
        )}
        <input
          className={`w-full bg-[rgba(11,19,34,0.6)] border border-[rgba(36,72,176,0.3)] rounded-lg px-4 py-2 text-white placeholder:text-[rgba(255,255,255,0.4)] focus:outline-none focus:border-[rgba(56,189,248,0.6)] focus:ring-2 focus:ring-[rgba(56,189,248,0.2)] transition-all ${icon ? 'pl-10' : ''} ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  )
}
