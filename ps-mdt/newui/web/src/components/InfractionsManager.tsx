import React, { useState, useMemo } from 'react'
import Input from './Input'
import Button from './Button'
import Badge from './Badge'

export interface Infraction {
  code: string
  title: string
  class: 'Infraction' | 'Misdemeanor' | 'Felony'
  fine: number
  jail: number
}

interface InfractionsManagerProps {
  infractions: Infraction[]
  onInfractionsChange: (infractions: Infraction[]) => void
  availableCharges: Infraction[]
}

export default function InfractionsManager({
  infractions,
  onInfractionsChange,
  availableCharges,
}: InfractionsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Filter available charges based on search
  const filteredCharges = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    return availableCharges.filter(
      (charge) =>
        !infractions.some((inf) => inf.code === charge.code) && // Exclude already added
        (charge.code.toLowerCase().includes(query) ||
          charge.title.toLowerCase().includes(query) ||
          charge.class.toLowerCase().includes(query))
    )
  }, [searchQuery, availableCharges, infractions])

  const addInfraction = (charge: Infraction) => {
    onInfractionsChange([...infractions, charge])
    setSearchQuery('')
    setIsSearching(false)
  }

  const removeInfraction = (index: number) => {
    onInfractionsChange(infractions.filter((_, i) => i !== index))
  }

  // Calculate totals
  const totalFine = infractions.reduce((sum, inf) => sum + inf.fine, 0)
  const totalJail = infractions.reduce((sum, inf) => sum + inf.jail, 0)

  const getClassColor = (chargeClass: string) => {
    switch (chargeClass) {
      case 'Felony':
        return 'bg-red-500/20 border-red-500/30 text-red-200'
      case 'Misdemeanor':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200'
      case 'Infraction':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-200'
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <div>
        <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
          Search & Add Infractions
        </label>
        <div className="relative">
          <Input
            placeholder="Search by code (e.g., (1)01), title, or class..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearching(true)
            }}
            onFocus={() => setIsSearching(true)}
            onBlur={() => setTimeout(() => setIsSearching(false), 200)}
          />
          
          {/* Search Results Dropdown */}
          {isSearching && filteredCharges.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[rgba(15,23,42,0.98)] border border-[rgba(56,189,248,0.3)] rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {filteredCharges.map((charge) => (
                <div
                  key={charge.code}
                  className="px-4 py-3 hover:bg-[rgba(56,189,248,0.1)] cursor-pointer border-b border-[rgba(56,189,248,0.1)] last:border-b-0 transition-colors"
                  onClick={() => addInfraction(charge)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm">
                        {charge.code} - {charge.title}
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)] truncate">
                        {charge.class}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-[rgba(255,255,255,0.7)]">
                        ${charge.fine}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {isSearching && searchQuery && filteredCharges.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[rgba(15,23,42,0.98)] border border-[rgba(56,189,248,0.3)] rounded-lg shadow-lg z-10 p-4">
              <p className="text-sm text-[rgba(255,255,255,0.5)]">No matching charges found</p>
            </div>
          )}
        </div>
      </div>

      {/* Added Infractions List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase">
            Added Charges ({infractions.length})
          </label>
          {infractions.length > 0 && (
            <button
              onClick={() => onInfractionsChange([])}
              className="text-xs text-[rgba(255,255,255,0.5)] hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {infractions.length === 0 ? (
          <div className="px-4 py-3 bg-[rgba(255,255,255,0.05)] rounded-lg text-center">
            <p className="text-sm text-[rgba(255,255,255,0.4)]">
              No charges added yet. Search above to add infractions.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {infractions.map((infraction, index) => (
              <div
                key={`${infraction.code}-${index}`}
                className={`px-4 py-3 rounded-lg border ${getClassColor(
                  infraction.class
                )} flex items-start justify-between gap-3`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {infraction.code} - {infraction.title}
                  </div>
                  <div className="text-xs mt-1 flex gap-3">
                    <span>Fine: ${infraction.fine}</span>
                    {infraction.jail > 0 && <span>Jail: {infraction.jail} min</span>}
                  </div>
                </div>
                <button
                  onClick={() => removeInfraction(index)}
                  className="flex-shrink-0 text-[rgba(255,255,255,0.5)] hover:text-red-400 transition-colors mt-0.5"
                  title="Remove charge"
                >
                  <i className="fa-solid fa-trash-alt" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {infractions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[rgba(var(--outline-rgb),0.2)]">
          <div className="bg-[rgba(var(--accent-rgb),0.1)] rounded-lg p-3 text-center">
            <div className="text-xs text-[rgba(255,255,255,0.6)] uppercase mb-1">
              Total Fine
            </div>
            <div className="text-xl font-bold text-green-400">
              ${totalFine.toLocaleString()}
            </div>
          </div>
          {totalJail > 0 && (
            <div className="bg-[rgba(255,0,0,0.1)] rounded-lg p-3 text-center">
              <div className="text-xs text-[rgba(255,255,255,0.6)] uppercase mb-1">
                Total Jail Time
              </div>
              <div className="text-xl font-bold text-red-400">
                {totalJail} min
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
