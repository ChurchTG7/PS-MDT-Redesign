import React, { useState, useMemo } from 'react'
import Input from './Input'
import Button from './Button'

export interface IncidentCode {
  code: string
  title: string
  class?: string
}

interface IncidentCodeManagerProps {
  codes: IncidentCode[]
  onCodesChange: (codes: IncidentCode[]) => void
  availableCodes: IncidentCode[]
}

export default function IncidentCodeManager({
  codes,
  onCodesChange,
  availableCodes,
}: IncidentCodeManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Filter available codes based on search
  const filteredCodes = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    return availableCodes.filter(
      (availCode) =>
        !codes.some((c) => c.code === availCode.code) && // Exclude already added
        (availCode.code.toLowerCase().includes(query) ||
          availCode.title.toLowerCase().includes(query))
    )
  }, [searchQuery, availableCodes, codes])

  const addCode = (codeItem: IncidentCode) => {
    onCodesChange([...codes, codeItem])
    setSearchQuery('')
    setIsSearching(false)
  }

  const removeCode = (index: number) => {
    onCodesChange(codes.filter((_, i) => i !== index))
  }

  const getCodeColor = (code: string): string => {
    const prefix = code.split('-')[0]
    const num = parseInt(prefix.replace('10-', ''))
    
    // Color coding by incident type
    if (num >= 50 && num <= 59) return 'bg-blue-500/20 border-blue-500/30 text-blue-200' // Traffic
    if (num >= 30 && num <= 39) return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200' // Robbery/Burglary
    if (num >= 80 && num <= 89) return 'bg-red-500/20 border-red-500/30 text-red-200' // Pursuit/Critical
    if (num >= 20 && num <= 29) return 'bg-orange-500/20 border-orange-500/30 text-orange-200' // Assault/Disturbance
    return 'bg-purple-500/20 border-purple-500/30 text-purple-200' // Other
  }

  const getCodeDescription = (code: string): string => {
    const codeMap: Record<string, string> = {
      '10-1': 'Unable to Copy',
      '10-4': 'Acknowledged',
      '10-7': 'Out of Service',
      '10-8': 'In Service',
      '10-10': 'Civilian Dispute',
      '10-15': 'Citizen Assist',
      '10-20': 'Suspicious Person',
      '10-25': 'Domestic Disturbance',
      '10-31': 'Burglary in Progress',
      '10-32': 'Armed Robbery',
      '10-33': 'Officer Needs Assistance',
      '10-50': 'Traffic Stop',
      '10-53': 'Traffic Accident',
      '10-54': 'Reckless Driving',
      '10-55': 'Speeding',
      '10-71': 'Prowler',
      '10-80': 'Vehicle Pursuit',
      '10-91': 'Silent Alarm',
    }
    return codeMap[code] || 'Incident Code'
  }

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <div>
        <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
          Search & Add Incident Codes
        </label>
        <div className="relative">
          <Input
            placeholder="Search by code (e.g., 10-31, 10-80) or title (e.g., Burglary, Pursuit)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearching(true)
            }}
            onFocus={() => setIsSearching(true)}
            onBlur={() => setTimeout(() => setIsSearching(false), 200)}
          />

          {/* Search Results Dropdown */}
          {isSearching && filteredCodes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[rgba(15,23,42,0.98)] border border-[rgba(56,189,248,0.3)] rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {filteredCodes.map((codeItem) => (
                <div
                  key={codeItem.code}
                  className="px-4 py-3 hover:bg-[rgba(56,189,248,0.1)] cursor-pointer border-b border-[rgba(56,189,248,0.1)] last:border-b-0 transition-colors"
                  onClick={() => addCode(codeItem)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm">
                        {codeItem.code} - {codeItem.title}
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)] truncate">
                        {getCodeDescription(codeItem.code)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isSearching && searchQuery && filteredCodes.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[rgba(15,23,42,0.98)] border border-[rgba(56,189,248,0.3)] rounded-lg shadow-lg z-10 p-4">
              <p className="text-sm text-[rgba(255,255,255,0.5)]">No matching codes found</p>
            </div>
          )}
        </div>
      </div>

      {/* Added Codes List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase">
            Added Codes ({codes.length})
          </label>
          {codes.length > 0 && (
            <button
              onClick={() => onCodesChange([])}
              className="text-xs text-[rgba(255,255,255,0.5)] hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {codes.length === 0 ? (
          <div className="px-4 py-3 bg-[rgba(255,255,255,0.05)] rounded-lg text-center">
            <p className="text-sm text-[rgba(255,255,255,0.4)]">
              No codes added yet. Search above to add incident codes.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {codes.map((codeItem, index) => (
              <div
                key={`${codeItem.code}-${index}`}
                className={`px-4 py-3 rounded-lg border ${getCodeColor(
                  codeItem.code
                )} flex items-start justify-between gap-3`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {codeItem.code} - {codeItem.title}
                  </div>
                  <div className="text-xs mt-1 text-[rgba(255,255,255,0.7)]">
                    {getCodeDescription(codeItem.code)}
                  </div>
                </div>
                <button
                  onClick={() => removeCode(index)}
                  className="flex-shrink-0 text-[rgba(255,255,255,0.5)] hover:text-red-400 transition-colors mt-0.5"
                  title="Remove code"
                >
                  <i className="fa-solid fa-trash-alt" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {codes.length > 0 && (
        <div className="pt-2 border-t border-[rgba(var(--outline-rgb),0.2)]">
          <div className="bg-[rgba(var(--accent-rgb),0.1)] rounded-lg p-3">
            <div className="text-xs text-[rgba(255,255,255,0.6)] uppercase mb-1">
              Primary Incident Code
            </div>
            <div className="text-lg font-bold text-blue-400">
              {codes[0]?.code} - {codes[0]?.title}
            </div>
            {codes.length > 1 && (
              <div className="text-xs text-[rgba(255,255,255,0.5)] mt-2">
                +{codes.length - 1} additional code(s)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
