import React, { useState } from 'react'
import Button from './Button'
import Badge from './Badge'
import withErrorBoundary from './withErrorBoundary'
import VehicleLinker, { VehicleInfo, VehicleLinkerSafe } from './VehicleLinker'

export interface VehicleInvolved extends VehicleInfo {
  id?: number
  incident_id?: string
  status?: 'involved' | 'suspect' | 'bystander'
  owner_info?: string
  custom_details?: string
}

interface VehiclesInvolvedManagerProps {
  vehicles: VehicleInvolved[]
  onChange: (vehicles: VehicleInvolved[]) => void
  availableVehicles?: VehicleInfo[]
  disabled?: boolean
}

export default function VehiclesInvolvedManager({
  vehicles,
  onChange,
  availableVehicles = [],
  disabled = false,
}: VehiclesInvolvedManagerProps) {
  const [showLinker, setShowLinker] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleAddVehicle = (vehicle: VehicleInfo) => {
    const newVehicle: VehicleInvolved = {
      ...vehicle,
      status: 'involved',
    }
    onChange([...vehicles, newVehicle])
    setShowLinker(false)
  }

  const handleRemoveVehicle = (index: number) => {
    onChange(vehicles.filter((_, i) => i !== index))
  }

  const handleUpdateStatus = (index: number, status: 'involved' | 'suspect' | 'bystander') => {
    const updated = [...vehicles]
    updated[index] = { ...updated[index], status }
    onChange(updated)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'suspect':
        return 'danger'
      case 'bystander':
        return 'info'
      case 'involved':
      default:
        return 'warning'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'suspect':
        return 'fa-exclamation-triangle'
      case 'bystander':
        return 'fa-eye'
      case 'involved':
      default:
        return 'fa-car'
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase">
          Vehicles Involved
        </label>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setShowLinker(true)}
          disabled={disabled}
        >
          <i className="fa-solid fa-plus mr-1" />
          Add Vehicle
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-8 bg-[rgba(11,19,34,0.4)] rounded-lg border border-dashed border-[rgba(255,255,255,0.1)]">
          <i className="fa-solid fa-car text-3xl text-[rgba(255,255,255,0.3)] mb-2" />
          <p className="text-sm text-[rgba(255,255,255,0.5)]">
            No vehicles added yet
          </p>
          <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
            Click "Add Vehicle" to link vehicles to this incident
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {vehicles.map((vehicle, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-[rgba(11,19,34,0.4)] rounded-lg border border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.3)] transition-all"
            >
              {/* Vehicle Icon */}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[rgba(168,85,247,0.3)] to-[rgba(126,34,206,0.2)] border border-[rgba(168,85,247,0.5)] flex items-center justify-center flex-shrink-0">
                <i className={`fa-solid ${getStatusIcon(vehicle.status || 'involved')} text-purple-400`} />
              </div>

              {/* Vehicle Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-white truncate">
                    {vehicle.brand ? `${vehicle.brand} ${vehicle.model}` : vehicle.model}
                  </p>
                  <Badge variant={getStatusColor(vehicle.status || 'involved')}>
                    {vehicle.status || 'involved'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.6)]">
                  <span className="font-mono bg-[rgba(56,189,248,0.1)] px-2 py-0.5 rounded">
                    {vehicle.plate}
                  </span>
                  <span>{vehicle.color}</span>
                  {vehicle.owner_info && (
                    <>
                      <span>•</span>
                      <span>
                        <i className="fa-solid fa-user mr-1" />
                        {vehicle.owner_info}
                      </span>
                    </>
                  )}
                </div>
                {vehicle.notes && (
                  <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1 italic">
                    {vehicle.notes}
                  </p>
                )}
                {vehicle.custom_details && (
                  <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                    <i className="fa-solid fa-note-sticky mr-1" />
                    {vehicle.custom_details}
                  </p>
                )}
              </div>

              {/* Status Selector */}
              {!disabled && (
                <select
                  value={vehicle.status || 'involved'}
                  onChange={(e) =>
                    handleUpdateStatus(index, e.target.value as 'involved' | 'suspect' | 'bystander')
                  }
                  className="px-3 py-1.5 bg-[rgba(11,19,34,0.6)] border border-[rgba(var(--outline-rgb),0.2)]
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)]
                    transition-all"
                >
                  <option value="involved">Involved</option>
                  <option value="suspect">Suspect</option>
                  <option value="bystander">Bystander</option>
                </select>
              )}

              {/* Remove Button */}
              {!disabled && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleRemoveVehicle(index)}
                >
                  <i className="fa-solid fa-trash" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Note */}
      {vehicles.length > 0 && (
        <div className="text-xs text-[rgba(255,255,255,0.5)] flex items-start gap-2 p-3 bg-[rgba(56,189,248,0.05)] rounded-lg border border-[rgba(56,189,248,0.1)]">
          <i className="fa-solid fa-info-circle text-blue-400 mt-0.5" />
          <span>
            Mark vehicles as <strong>Suspect</strong> if they were involved in criminal activity,
            <strong> Bystander</strong> if they were nearby but not involved, or
            <strong> Involved</strong> for general involvement.
          </span>
        </div>
      )}

      {/* Vehicle Linker Modal */}
      <VehicleLinkerSafe
        isOpen={showLinker}
        onClose={() => setShowLinker(false)}
        onLinkVehicle={handleAddVehicle}
        availableVehicles={availableVehicles}
      />
    </div>
  )
}

export const VehiclesInvolvedManagerSafe = withErrorBoundary(VehiclesInvolvedManager, { scopeName: 'VehiclesInvolvedManager', fullScreen: false })
