import React from 'react'

type StatCardProps = {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: string
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'yellow' | 'red'
}

export default function StatCard({ title, value, icon, trend, color = 'blue' }: StatCardProps) {
  const colorStyles = {
    blue: 'from-[rgba(56,189,248,0.15)] to-[rgba(30,58,138,0.1)] border-[rgba(56,189,248,0.3)]',
    green: 'from-[rgba(34,197,94,0.15)] to-[rgba(22,163,74,0.1)] border-[rgba(34,197,94,0.3)]',
    yellow: 'from-[rgba(251,191,36,0.15)] to-[rgba(245,158,11,0.1)] border-[rgba(251,191,36,0.3)]',
    red: 'from-[rgba(239,68,68,0.15)] to-[rgba(185,28,28,0.1)] border-[rgba(239,68,68,0.3)]'
  }

  const iconColors = {
    blue: 'text-[#38BDF8]',
    green: 'text-[#22C55E]',
    yellow: 'text-[#FACC15]',
    red: 'text-[#EF4444]'
  }
  
  return (
    <div className={`bg-gradient-to-br ${colorStyles[color]} border rounded-xl p-4 backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-[rgba(255,255,255,0.6)] font-medium uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <i className={`fa-solid fa-arrow-${trend.isPositive ? 'up' : 'down'}`} />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`text-2xl ${iconColors[color]} opacity-80`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
