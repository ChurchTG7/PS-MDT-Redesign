import React, { useState, useMemo } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import { useFetchNui, useRealtimeUpdate } from '../utils/hooks'
import type { LicenseRecord, VehicleRegistration } from '../types/api'

export default function DMVPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'licenses' | 'registrations'>('licenses')

  // Fetch licenses and registrations
  const { data: licenseRecords = [], loading: loadingLicenses, error: licenseError, refetch: refetchLicenses } = 
    useFetchNui<LicenseRecord[]>('getAllLicenses', null)
  
  const { data: vehicleRegistrations = [], loading: loadingRegs, error: regsError, refetch: refetchRegs } = 
    useFetchNui<VehicleRegistration[]>('getAllVehicleRegistrations', null)

  // Real-time updates
  useRealtimeUpdate('licenseUpdated', () => {
    refetchLicenses()
  })

  useRealtimeUpdate('vehicleRegistrationUpdated', () => {
    refetchRegs()
  })

  // Transform license records for display
  const licenses = useMemo(() => {
    if (!licenseRecords) return []
    return licenseRecords.flatMap((record) => {
      const licensesList: Array<{
        id: string
        holder: string
        type: string
        status: string
        citizenid: string
        points: number
        suspensions: typeof record.suspensions
      }> = []

      const licenseTypes = [
        { key: 'driver', name: 'Driver License' },
        { key: 'weapon', name: 'Weapon License' },
        { key: 'business', name: 'Business License' },
        { key: 'hunting', name: 'Hunting License' },
        { key: 'pilot', name: 'Pilot License' }
      ]

      // Check if licenses object exists
      if (!record.licenses) return licensesList

      licenseTypes.forEach(({ key, name }) => {
        const licenseValue = record.licenses[key as keyof typeof record.licenses]
        if (licenseValue !== false && licenseValue !== undefined) {
          licensesList.push({
            id: `${record.citizenid}-${key}`,
            holder: `${record.firstname} ${record.lastname}`,
            type: name,
            status: typeof licenseValue === 'string' ? licenseValue : 'active',
            citizenid: record.citizenid,
            points: record.points || 0,
            suspensions: record.suspensions || []
          })
        }
      })

      return licensesList
    })
  }, [licenseRecords])

  // Filter licenses and registrations
  const filteredLicenses = useMemo(() => {
    if (!searchQuery) return licenses
    const query = searchQuery.toLowerCase()
    return licenses.filter(license => 
      license.holder.toLowerCase().includes(query) ||
      license.type.toLowerCase().includes(query) ||
      license.citizenid.includes(query)
    )
  }, [licenses, searchQuery])

  const filteredRegistrations = useMemo(() => {
    if (!vehicleRegistrations) return []
    if (!searchQuery) return vehicleRegistrations
    const query = searchQuery.toLowerCase()
    return vehicleRegistrations.filter(reg => 
      reg.plate.toLowerCase().includes(query) ||
      reg.owner.toLowerCase().includes(query) ||
      reg.model.toLowerCase().includes(query) ||
      reg.brand.toLowerCase().includes(query)
    )
  }, [vehicleRegistrations, searchQuery])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'suspended': return 'danger'
      case 'expired': return 'warning'
      default: return 'default'
    }
  }

  const getPointsColor = (points: number) => {
    if (points >= 8) return 'text-red-400'
    if (points >= 5) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <div className="space-y-6">
      {/* Search & Tabs */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'licenses' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('licenses')}
              icon={<i className="fa-solid fa-id-card" />}
              className="flex-1"
            >
              Licenses
            </Button>
            <Button
              variant={activeTab === 'registrations' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('registrations')}
              icon={<i className="fa-solid fa-car" />}
              className="flex-1"
            >
              Vehicle Registrations
            </Button>
          </div>
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<i className="fa-solid fa-magnifying-glass" />}
          />
        </div>
      </Card>

      {/* Licenses Tab */}
      {activeTab === 'licenses' && (
        <Card 
          title="Driver & Weapon Licenses" 
          subtitle={`${filteredLicenses.length} licenses on file`}
          headerAction={
            <Button size="sm" variant="primary">
              <i className="fa-solid fa-plus" />
              Issue License
            </Button>
          }
        >
          {loadingLicenses ? (
            <div className="flex items-center justify-center py-12">
              <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-400 mr-3" />
              <span className="text-[rgba(255,255,255,0.7)]">Loading licenses...</span>
            </div>
          ) : licenseError ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-exclamation-triangle text-3xl text-red-400 mb-3" />
              <p className="text-red-400 mb-4">Failed to load licenses</p>
              <Button size="sm" variant="primary" onClick={() => refetchLicenses()}>
                Retry
              </Button>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-search text-3xl text-[rgba(255,255,255,0.3)] mb-3" />
              <p className="text-[rgba(255,255,255,0.5)]">No licenses found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLicenses.map((license) => (
              <div
                key={license.id}
                className="p-4 bg-[rgba(11,19,34,0.4)] rounded-xl border border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.3)] transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-[rgba(255,255,255,0.5)]">{license.id}</span>
                      <Badge variant={getStatusColor(license.status)}>
                        {license.status.toUpperCase()}
                      </Badge>
                      {license.points > 0 && (
                        <Badge variant={license.points >= 8 ? 'danger' : 'warning'}>
                          {license.points} POINTS
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{license.holder}</h3>
                    <p className="text-sm text-[rgba(255,255,255,0.7)]">{license.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <i className="fa-solid fa-eye" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <i className="fa-solid fa-pen" />
                    </Button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Citizen ID</span>
                    <p className="text-sm text-white font-medium font-mono">{license.citizenid}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Status</span>
                    <Badge variant={getStatusColor(license.status)}>{license.status.toUpperCase()}</Badge>
                  </div>
                  <div>
                    <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Points</span>
                    <p className={`text-sm font-bold ${getPointsColor(license.points)}`}>
                      {license.points} / 12
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Suspensions</span>
                    <p className="text-sm text-white font-medium">{license.suspensions.length}</p>
                  </div>
                </div>

                {/* Points Warning */}
                {license.points >= 8 && (
                  <div className="mt-3 p-3 bg-[rgba(239,68,68,0.1)] rounded-lg border border-[rgba(239,68,68,0.3)]">
                    <div className="flex gap-2">
                      <i className="fa-solid fa-triangle-exclamation text-red-400" />
                      <p className="text-xs text-[rgba(255,255,255,0.9)]">
                        High point count - Suspension recommended at 12 points
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </Card>
      )}

      {/* Registrations Tab */}
      {activeTab === 'registrations' && (
        <Card 
          title="Vehicle Registrations" 
          subtitle={`${filteredRegistrations.length} vehicles registered`}
          headerAction={
            <Button size="sm" variant="primary">
              <i className="fa-solid fa-plus" />
              Register Vehicle
            </Button>
          }
        >
          {loadingRegs ? (
            <div className="flex items-center justify-center py-12">
              <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-400 mr-3" />
              <span className="text-[rgba(255,255,255,0.7)]">Loading registrations...</span>
            </div>
          ) : regsError ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-exclamation-triangle text-3xl text-red-400 mb-3" />
              <p className="text-red-400 mb-4">Failed to load registrations</p>
              <Button size="sm" variant="primary" onClick={() => refetchRegs()}>
                Retry
              </Button>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-search text-3xl text-[rgba(255,255,255,0.3)] mb-3" />
              <p className="text-[rgba(255,255,255,0.5)]">No registrations found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRegistrations.map((reg) => (
              <div
                key={reg.plate}
                className="p-4 bg-[rgba(11,19,34,0.4)] rounded-xl border border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.3)] transition-all"
              >
                {/* Header */}
                <div className="flex items-start gap-4">
                  {/* Vehicle Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[rgba(168,85,247,0.3)] to-[rgba(126,34,206,0.2)] border border-[rgba(168,85,247,0.5)] flex items-center justify-center">
                      <i className="fa-solid fa-car text-2xl text-purple-400" />
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">{reg.plate}</Badge>
                      <Badge variant={getStatusColor(reg.status)}>
                        {reg.status.toUpperCase()}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {reg.brand} {reg.model}
                    </h3>
                    <p className="text-sm text-[rgba(255,255,255,0.6)] mb-3">
                      Owner: <span className="text-white font-medium">{reg.owner}</span>
                    </p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Color</span>
                        <p className="text-sm text-white font-medium">{reg.color}</p>
                      </div>
                      <div>
                        <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Owner ID</span>
                        <p className="text-xs text-white font-mono">{reg.ownerCitizenid}</p>
                      </div>
                      <div>
                        <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Registered</span>
                        <p className="text-sm text-white font-medium">{formatDate(reg.registrationDate)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Expires</span>
                        <p className="text-sm text-white font-medium">{formatDate(reg.expiryDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="ghost">
                      <i className="fa-solid fa-eye" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <i className="fa-solid fa-pen" />
                    </Button>
                  </div>
                </div>

                {/* Expiry Warning */}
                {reg.status === 'expired' && (
                  <div className="mt-3 p-3 bg-[rgba(251,191,36,0.1)] rounded-lg border border-[rgba(251,191,36,0.3)]">
                    <div className="flex gap-2">
                      <i className="fa-solid fa-clock text-yellow-400" />
                      <p className="text-xs text-[rgba(255,255,255,0.9)]">
                        Registration has expired - Renewal required
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <i className="fa-solid fa-id-card text-3xl text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-white mb-1">
              {licenses.filter(l => l.status === 'active').length}
            </p>
            <p className="text-xs text-[rgba(255,255,255,0.6)] uppercase">Active Licenses</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <i className="fa-solid fa-car text-3xl text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-white mb-1">
              {vehicleRegistrations?.filter((r: VehicleRegistration) => r.status === 'active').length || 0}
            </p>
            <p className="text-xs text-[rgba(255,255,255,0.6)] uppercase">Active Registrations</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <i className="fa-solid fa-triangle-exclamation text-3xl text-yellow-400 mb-2" />
            <p className="text-2xl font-bold text-white mb-1">
              {licenses.filter(l => l.status === 'suspended' || l.status === 'revoked').length + 
               (vehicleRegistrations?.filter((r: VehicleRegistration) => r.status === 'expired' || r.status === 'suspended').length || 0)}
            </p>
            <p className="text-xs text-[rgba(255,255,255,0.6)] uppercase">Needs Attention</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
