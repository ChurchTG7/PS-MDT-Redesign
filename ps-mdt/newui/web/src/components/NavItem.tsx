import React from 'react'

type Props = {
  icon?: React.ReactNode
  label: string
  active?: boolean
}

export default function NavItem({ icon, label, active }: Props) {
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!active) {
      e.currentTarget.style.borderColor = `rgba(var(--theme-border-rgb), 0.3)`
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!active) {
      e.currentTarget.style.borderColor = 'transparent'
    }
  }

  return (
    <div 
      className={`
        flex items-center gap-[1vh] px-[1.2vh] py-[0.8vh] md:py-[1vh] rounded-lg cursor-pointer 
        transition-all duration-200 font-semibold text-[1.2vh] md:text-[1.3vh]
        ${active 
          ? 'text-white border shadow-lg' 
          : 'text-[rgba(255,255,255,0.75)] hover:text-white hover:bg-[rgba(18,25,43,0.6)] border border-transparent'
        }
      `}
      style={active ? {
        background: `linear-gradient(to right, rgba(var(--theme-accent-rgb), 0.32), rgba(18, 25, 43, 0.75))`,
        borderColor: `rgba(var(--theme-border-rgb), 0.6)`
      } : {}}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {icon && (
        <div 
          className={`text-[1.4vh] md:text-[1.6vh] transition-opacity ${active ? 'opacity-100' : 'opacity-70'}`}
          style={active ? { color: `var(--theme-icon)` } : {}}
        >
          {icon}
        </div>
      )}
      <div className="truncate">{label}</div>
    </div>
  )
}
