import React, { useState, useMemo } from 'react'
import Button from './Button'
import Input from './Input'
import Badge from './Badge'
import withErrorBoundary from './withErrorBoundary'

export interface VehicleInfo {
  plate: string
  model: string
  brand?: string
  color: string
  class?: string
  notes?: string
}

interface VehicleLinkerProps {
  isOpen: boolean
  onClose: () => void
  onLinkVehicle: (vehicle: VehicleInfo) => void
  availableVehicles?: VehicleInfo[]
  loading?: boolean
}

export default function VehicleLinker({
  isOpen,
  onClose,
  onLinkVehicle,
  availableVehicles = [],
  loading = false,
}: VehicleLinkerProps) {
  const [mode, setMode] = useState<'search' | 'custom'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [customVehicle, setCustomVehicle] = useState<VehicleInfo>({
    plate: '',
    model: '',
    brand: '',
    color: '',
    class: '',
    notes: '',
  })

  const filteredVehicles = useMemo(() => {
    if (!searchQuery) return availableVehicles
    const query = searchQuery.toLowerCase()
    return availableVehicles.filter(
      (v) =>
        v.plate.toLowerCase().includes(query) ||
        v.model.toLowerCase().includes(query) ||
        v.brand?.toLowerCase().includes(query) ||
        v.color.toLowerCase().includes(query)
    )
  }, [searchQuery, availableVehicles])

  const handleLinkVehicle = (vehicle: VehicleInfo) => {
    onLinkVehicle(vehicle)
    resetForm()
  }

  const handleAddCustom = () => {
    if (!customVehicle.plate || !customVehicle.model || !customVehicle.color) {
      alert('Please fill in Plate, Model, and Color fields')
      return
    }
    onLinkVehicle(customVehicle)
    resetForm()
  }

  const resetForm = () => {
    setSearchQuery('')
    setCustomVehicle({
      plate: '',
      model: '',
      brand: '',
      color: '',
      class: '',
      notes: '',
    })
    setMode('search')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[rgba(15,23,42,0.98)] border-2 border-[rgba(56,189,248,0.3)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[rgba(11,19,34,0.8)] border-b border-[rgba(56,189,248,0.2)] p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              <i className="fa-solid fa-car mr-2 text-blue-400" />
              Link Vehicle
            </h2>
            <p className="text-sm text-[rgba(255,255,255,0.6)]">
              Search for registered vehicles or add custom vehicle information
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            <i className="fa-solid fa-times" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 border-b border-[rgba(255,255,255,0.1)] pb-4">
            <button
              onClick={() => setMode('search')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'search'
                  ? 'bg-[rgba(56,189,248,0.2)] text-blue-400 border border-[rgba(56,189,248,0.5)]'
                  : 'text-[rgba(255,255,255,0.6)] hover:text-white'
              }`}
            >
              <i className="fa-solid fa-magnifying-glass mr-2" />
              Search Vehicles
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'custom'
                  ? 'bg-[rgba(56,189,248,0.2)] text-blue-400 border border-[rgba(56,189,248,0.5)]'
                  : 'text-[rgba(255,255,255,0.6)] hover:text-white'
              }`}
            >
              <i className="fa-solid fa-plus mr-2" />
              Add Custom
            </button>
          </div>

          {/* Search Mode */}
          {mode === 'search' && (
            <div className="space-y-4">
              <Input
                placeholder="Search by plate, model, brand, or color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<i className="fa-solid fa-magnifying-glass" />}
              />

              {loading ? (
                <div className="flex items-center justify-center py-8 text-[rgba(255,255,255,0.5)]">
                  <i className="fa-solid fa-spinner fa-spin mr-2" />
                  Loading vehicles...
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="text-center py-8 text-[rgba(255,255,255,0.5)]">
                  <i className="fa-solid fa-car text-3xl mb-2" />
                  <p>
                    {searchQuery
                      ? 'No vehicles found matching your search'
                      : 'No registered vehicles available'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredVehicles.map((vehicle, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-[rgba(11,19,34,0.4)] rounded-lg border border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.3)] transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[rgba(168,85,247,0.3)] to-[rgba(126,34,206,0.2)] border border-[rgba(168,85,247,0.5)] flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-car text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">
                            {vehicle.brand ? `${vehicle.brand} ${vehicle.model}` : vehicle.model}
                          </p>
                          <p className="text-xs text-[rgba(255,255,255,0.6)]">
                            {vehicle.color} • {vehicle.plate}
                            {vehicle.class && ` • ${vehicle.class}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleLinkVehicle(vehicle)}
                      >
                        <i className="fa-solid fa-link mr-1" />
                        Link
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom Mode */}
          {mode === 'custom' && (
            <div className="space-y-4">
              <p className="text-sm text-[rgba(255,255,255,0.7)]">
                Add custom vehicle information if the vehicle is not in the system.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                    License Plate *
                  </label>
                  <Input
                    placeholder="e.g., ABC123"
                    value={customVehicle.plate}
                    onChange={(e) =>
                      setCustomVehicle({ ...customVehicle, plate: e.target.value.toUpperCase() })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                    Color *
                  </label>
                  <Input
                    placeholder="e.g., Red, Black"
                    value={customVehicle.color}
                    onChange={(e) =>
                      setCustomVehicle({ ...customVehicle, color: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                    Brand/Make
                  </label>
                  <Input
                    placeholder="e.g., Ford, BMW"
                    value={customVehicle.brand || ''}
                    onChange={(e) =>
                      setCustomVehicle({ ...customVehicle, brand: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                    Model *
                  </label>
                  <Input
                    placeholder="e.g., Mustang, 3 Series"
                    value={customVehicle.model}
                    onChange={(e) =>
                      setCustomVehicle({ ...customVehicle, model: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                    Class
                  </label>
                  <Input
                    placeholder="e.g., Sedan, SUV"
                    value={customVehicle.class || ''}
                    onChange={(e) =>
                      setCustomVehicle({ ...customVehicle, class: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                  Additional Notes
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-[rgba(11,19,34,0.4)] border border-[rgba(var(--outline-rgb),0.2)]
                    rounded-lg text-white placeholder-[rgba(255,255,255,0.3)]
                    focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)]
                    transition-all resize-none"
                  rows={3}
                  placeholder="Any additional information about this vehicle..."
                  value={customVehicle.notes || ''}
                  onChange={(e) =>
                    setCustomVehicle({ ...customVehicle, notes: e.target.value })
                  }
                />
              </div>

              <div className="bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.3)] rounded-lg p-3">
                <p className="text-xs text-[rgba(255,255,255,0.7)]">
                  <i className="fa-solid fa-info-circle mr-2 text-yellow-400" />
                  Required fields: Plate, Model, Color
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[rgba(255,255,255,0.1)]">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            {mode === 'custom' && (
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleAddCustom}
              >
                <i className="fa-solid fa-check mr-2" />
                Add Vehicle
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const VehicleLinkerSafe = withErrorBoundary(VehicleLinker, { scopeName: 'VehicleLinker', fullScreen: false })
