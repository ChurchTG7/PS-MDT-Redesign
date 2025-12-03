import React, { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import IncidentCodeManager, { type IncidentCode } from '../components/IncidentCodeManager'
import InfractionsManager, { type Infraction } from '../components/InfractionsManager'
import VehiclesInvolvedManager, { type VehicleInvolved } from '../components/VehiclesInvolvedManager'
import { FormModal, FormModalSafe } from '../components/Modal'
import { CameraViewer, CameraGrid, CameraViewerSafe, CameraGridSafe } from '../components/CameraViewer'
import ErrorBoundary from '../components/ErrorBoundary'
import { useFetchNui, useRealtimeUpdate, useNuiSubmit, usePagination, useNuiListener } from '../utils/hooks'
import type { Incident, CreateIncidentPayload, SecurityCamera } from '../types/api'
import { mockPenalCodes, mockIncidentCodes } from '../utils/mockData'

export default function IncidentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [showCameras, setShowCameras] = useState(false)
  const [selectedCamera, setSelectedCamera] = useState<SecurityCamera | null>(null)
  const [cameraIncidentId, setCameraIncidentId] = useState<number | string | null>(null)

  // Form state for creating incidents/reports
  const [formData, setFormData] = useState<CreateIncidentPayload & { 
    codes?: IncidentCode[] // Changed from single code to array of codes
    caseNumber?: string
    suspects?: string[]
    witnesses?: string[]
    charges?: Infraction[]
    evidence?: string[]
    vehiclesInvolved?: VehicleInvolved[]
  }>({
    title: '',
    code: '',
    location: '',
    description: '',
    priority: 'medium',
    units: [],
    civilians: [],
    codes: [],
    caseNumber: '',
    suspects: [],
    witnesses: [],
    charges: [],
    evidence: [],
    vehiclesInvolved: [],
  })

  // Fetch incidents from server (both incident and report types)
  const {
    data: allIncidents,
    loading,
    error,
    refetch,
  } = useFetchNui<Incident[]>('getIncidents', [])

  // Submit handler for creating incidents
  const { submit: submitIncident, submitting: submittingIncident } = useNuiSubmit<CreateIncidentPayload, Incident>(
    'createIncident',
    (newIncident) => {
      console.log('[ps-mdt] Incident created:', newIncident)
      setIsCreateModalOpen(false)
      resetForm()
      refetch()
    },
    (error) => {
      console.error('[ps-mdt] Error creating incident:', error)
      alert(`Failed to create incident: ${error}`)
    }
  )

  // Submit handler for creating reports (attached to incidents)
  const { submit: submitReport, submitting: submittingReport } = useNuiSubmit<any, Incident>(
    'createReport',
    (newReport) => {
      console.log('[ps-mdt] Report created:', newReport)
      setIsCreateModalOpen(false)
      resetForm()
      refetch()
    },
    (error) => {
      console.error('[ps-mdt] Error creating report:', error)
      alert(`Failed to create report: ${error}`)
    }
  )

  // Fetch cameras from server
  const {
    data: allCameras,
    loading: camerasLoading,
    refetch: refetchCameras,
  } = useFetchNui<SecurityCamera[]>('getCameras', [])

  // Listen for real-time updates
  useRealtimeUpdate<{ incidentId: number }>('incidentCreated', () => {
    refetch()
  })

  useRealtimeUpdate<{ incidentId: number }>('incidentUpdated', () => {
    refetch()
  })

  useRealtimeUpdate<{ cameraId: number }>('cameraStatusChanged', () => {
    refetchCameras()
  })

  // Listen for normalized pushes and refetch
  useNuiListener('incidents', () => {
    refetch()
  })
  useNuiListener('incidentData', () => {
    refetch()
  })

  // Filter incidents based on search and filters
  const filteredIncidents = (allIncidents || []).filter((incident) => {
    // Status filter
    if (statusFilter !== 'all' && incident.status !== statusFilter) {
      return false
    }

    // Priority filter
    if (priorityFilter !== 'all' && incident.priority !== priorityFilter) {
      return false
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        incident.id.toString().includes(query) ||
        incident.title.toLowerCase().includes(query) ||
        incident.code?.toLowerCase().includes(query) ||
        incident.location?.toLowerCase().includes(query) ||
        incident.officerName?.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Separate active high-priority incidents for alert banner
  const activeHighPriorityIncidents = filteredIncidents.filter(
    (i) => i.status === 'active' && (i.priority === 'high' || i.priority === 'critical')
  )

  // Pagination
  const { currentItems, currentPage, totalPages, goToPage, nextPage, prevPage, hasNext, hasPrev } =
    usePagination(filteredIncidents, 10)

    const handleSubmit = async () => {
    try {
      const incidentPayload: CreateIncidentPayload = {
        title: formData.title,
        code: formData.code,
        location: formData.location,
        description: formData.description,
        priority: formData.priority || 'medium',
        units: formData.units || [],
        civilians: formData.civilians || [],
      }
      await submitIncident(incidentPayload)
    } catch (error) {
      console.error('Failed to submit:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      location: '',
      description: '',
      priority: 'medium',
      units: [],
      civilians: [],
      codes: [],
      vehiclesInvolved: [],
    })
  }

  const getSeverityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'danger'
      case 'high':
        return 'danger'
      case 'medium':
        return 'warning'
      case 'low':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'danger'
      case 'resolved':
        return 'success'
      case 'closed':
        return 'default'
      default:
        return 'default'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search incidents by ID, code, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<i className="fa-solid fa-magnifying-glass" />}
              />
            </div>
            <Button
              variant="primary"
              icon={<i className="fa-solid fa-plus" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Incident
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={statusFilter === 'all' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'active' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'resolved' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('resolved')}
              >
                Resolved
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'closed' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('closed')}
              >
                Closed
              </Button>
            </div>

            <div className="h-8 w-px bg-[rgba(255,255,255,0.1)]" />

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={priorityFilter === 'all' ? 'primary' : 'secondary'}
                onClick={() => setPriorityFilter('all')}
              >
                All Priority
              </Button>
              <Button
                size="sm"
                variant={priorityFilter === 'critical' ? 'danger' : 'secondary'}
                onClick={() => setPriorityFilter('critical')}
              >
                Critical
              </Button>
              <Button
                size="sm"
                variant={priorityFilter === 'high' ? 'danger' : 'secondary'}
                onClick={() => setPriorityFilter('high')}
              >
                High
              </Button>
              <Button
                size="sm"
                variant={priorityFilter === 'medium' ? 'primary' : 'secondary'}
                onClick={() => setPriorityFilter('medium')}
              >
                Medium
              </Button>
              <Button
                size="sm"
                variant={priorityFilter === 'low' ? 'primary' : 'secondary'}
                onClick={() => setPriorityFilter('low')}
              >
                Low
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Incidents Alert */}
      {activeHighPriorityIncidents.length > 0 && (
        <div className="bg-gradient-to-r from-[rgba(239,68,68,0.2)] to-[rgba(185,28,28,0.15)] border border-[rgba(239,68,68,0.4)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[rgba(239,68,68,0.3)] flex items-center justify-center animate-pulse">
            <i className="fa-solid fa-siren-on text-red-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white">Active Emergencies</h4>
            <p className="text-sm text-[rgba(255,255,255,0.7)]">
              {activeHighPriorityIncidents.length} high priority incident
              {activeHighPriorityIncidents.length !== 1 ? 's' : ''} require attention
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setStatusFilter('active')
              setPriorityFilter('high')
            }}
          >
            View Active
          </Button>
        </div>
      )}

      {/* Incidents List */}
      <Card
        title="Recent Incidents"
        subtitle={
          loading
            ? 'Loading incidents...'
            : `${filteredIncidents.length} incident${filteredIncidents.length !== 1 ? 's' : ''}`
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[rgba(255,255,255,0.5)]">
            <i className="fa-solid fa-spinner fa-spin mr-2 text-xl" />
            <span>Loading incidents...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-400">
            <i className="fa-solid fa-exclamation-triangle text-3xl mb-3" />
            <p className="font-medium">Failed to load incidents</p>
            <p className="text-sm text-[rgba(255,255,255,0.5)] mt-1">{error}</p>
            <Button variant="primary" size="sm" onClick={() => refetch()} className="mt-4">
              <i className="fa-solid fa-refresh mr-2" />
              Retry
            </Button>
          </div>
        ) : currentItems.length > 0 ? (
          <div className="space-y-3">
            {currentItems.map((incident) => (
              <div
                key={incident.id}
                className="flex items-start gap-4 p-4 bg-[rgba(11,19,34,0.4)] rounded-xl border border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.3)] transition-all cursor-pointer"
                onClick={() => setSelectedIncident(incident)}
              >
                {/* Severity Indicator */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      incident.priority === 'critical' || incident.priority === 'high'
                        ? 'bg-gradient-to-br from-[rgba(239,68,68,0.3)] to-[rgba(185,28,28,0.2)] border border-[rgba(239,68,68,0.5)]'
                        : incident.priority === 'medium'
                        ? 'bg-gradient-to-br from-[rgba(251,191,36,0.3)] to-[rgba(245,158,11,0.2)] border border-[rgba(251,191,36,0.5)]'
                        : 'bg-gradient-to-br from-[rgba(56,189,248,0.3)] to-[rgba(30,58,138,0.2)] border border-[rgba(56,189,248,0.5)]'
                    }`}
                  >
                    <i
                      className={`fa-solid fa-siren text-lg ${
                        incident.priority === 'critical' || incident.priority === 'high'
                          ? 'text-red-400'
                          : incident.priority === 'medium'
                          ? 'text-yellow-400'
                          : 'text-blue-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Incident Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-[rgba(255,255,255,0.5)]">
                      #{incident.id}
                    </span>
                    <Badge variant={getSeverityColor(incident.priority)}>
                      {incident.priority.toUpperCase()}
                    </Badge>
                    <Badge variant={getStatusColor(incident.status)}>
                      {incident.status.toUpperCase()}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-white mb-2">
                    {incident.code ? `${incident.code} - ` : ''}
                    {incident.title}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-[rgba(255,255,255,0.6)] mb-2">
                    <span>
                      <i className="fa-solid fa-location-dot mr-1.5" />
                      {incident.location}
                    </span>
                    <span>
                      <i className="fa-solid fa-clock mr-1.5" />
                      {formatTimeAgo(incident.date)}
                    </span>
                    {incident.officerName && (
                      <span>
                        <i className="fa-solid fa-user-police mr-1.5" />
                        {incident.officerName}
                      </span>
                    )}
                  </div>
                  {incident.units && incident.units.length > 0 && (
                    <div className="flex gap-1.5">
                      {incident.units.map((unit, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-[rgba(56,189,248,0.15)] text-[#38BDF8] text-xs rounded-md font-medium"
                        >
                          {unit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="primary">
                    <i className="fa-solid fa-eye" />
                    View
                  </Button>
                  <Button size="sm" variant="secondary">
                    <i className="fa-solid fa-pen" />
                    Edit
                  </Button>
                  {incident.status === 'active' && (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCameraIncidentId(incident.id)
                        setShowCameras(true)
                      }}
                    >
                      <i className="fa-solid fa-video mr-1" />
                      Cameras
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-[rgba(255,255,255,0.5)]">
            <i className="fa-solid fa-inbox text-4xl mb-3" />
            <p className="text-lg font-medium">No incidents found</p>
            <p className="text-sm mt-1">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first incident to get started'}
            </p>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="secondary" disabled={!hasPrev} onClick={prevPage}>
            <i className="fa-solid fa-chevron-left" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              size="sm"
              variant={currentPage === page ? 'primary' : 'secondary'}
              onClick={() => goToPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button size="sm" variant="secondary" disabled={!hasNext} onClick={nextPage}>
            <i className="fa-solid fa-chevron-right" />
          </Button>
        </div>
      )}

      {/* Create Incident Modal */}
      <FormModalSafe
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          resetForm()
        }}
        onSubmit={handleSubmit}
        title="Create New Incident"
        submitText="Create Incident"
        isLoading={submittingIncident || submittingReport}
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase mb-3 pb-2 border-b border-[rgba(var(--outline-rgb),0.2)]">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                  Incident Title *
                </label>
                <Input
                  placeholder="e.g., Burglary in Progress"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <IncidentCodeManager
                  codes={(formData.codes as IncidentCode[]) || []}
                  onCodesChange={(codes) =>
                    setFormData({
                      ...formData,
                      codes,
                      code: codes.length > 0 ? codes[0].code : '', // Set primary code to first selected
                    })
                  }
                  availableCodes={mockIncidentCodes as IncidentCode[]}
                />
              </div>
              <div>
                <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                  Priority *
                </label>
                <select
                  className="w-full px-4 py-3 bg-[rgba(11,19,34,0.4)] border border-[rgba(var(--outline-rgb),0.2)]
                    rounded-lg text-white
                    focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)]
                    transition-all"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as 'low' | 'medium' | 'high' | 'critical',
                    })
                  }
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                  Location *
                </label>
                <Input
                  placeholder="e.g., Legion Square, Grove Street"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Incident Details */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase mb-3 pb-2 border-b border-[rgba(var(--outline-rgb),0.2)]">
              Incident Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                  Description *
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-[rgba(11,19,34,0.4)] border border-[rgba(var(--outline-rgb),0.2)]
                    rounded-lg text-white placeholder-[rgba(255,255,255,0.3)]
                    focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)]
                    transition-all resize-none"
                  rows={4}
                  placeholder="Provide a detailed description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                    Responding Units (comma-separated)
                  </label>
                  <Input
                    placeholder="e.g., Unit 07, Unit 12"
                    value={formData.units?.join(', ') || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        units: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter((s) => s),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                    Civilians Involved (comma-separated)
                  </label>
                  <Input
                    placeholder="e.g., John Doe, Jane Smith"
                    value={formData.civilians?.join(', ') || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        civilians: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter((s) => s),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vehicles Involved */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase mb-3 pb-2 border-b border-[rgba(var(--outline-rgb),0.2)]">
              Vehicles Involved
            </h3>
            <VehiclesInvolvedManager
              vehicles={formData.vehiclesInvolved || []}
              onChange={(vehicles) =>
                setFormData({
                  ...formData,
                  vehiclesInvolved: vehicles,
                })
              }
            />
          </div>

          {/* Notice */}
          <div className="p-4 bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.2)] rounded-lg">
            <div className="flex gap-3">
              <i className="fa-solid fa-circle-info text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-[rgba(255,255,255,0.8)] font-medium mb-1">
                  Incident Guidelines
                </p>
                <p className="text-xs text-[rgba(255,255,255,0.6)]">
                  High priority incidents will trigger alerts to all units. You can add evidence and update status after creation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </FormModalSafe>

      {/* Camera Grid Modal */}
      {showCameras && !selectedCamera && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgba(15,23,42,0.98)] border-2 border-[rgba(56,189,248,0.3)] rounded-xl p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  <i className="fa-solid fa-video mr-2 text-blue-400" />
                  Security Camera Access
                </h2>
                <p className="text-[rgba(255,255,255,0.6)]">
                  {cameraIncidentId && `Incident #${cameraIncidentId} - `}
                  Select a camera to view live feed
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCameras(false)
                  setCameraIncidentId(null)
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-times text-2xl" />
              </button>
            </div>

            {camerasLoading ? (
              <div className="flex items-center justify-center py-12">
                <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-400 mr-3" />
                <span className="text-[rgba(255,255,255,0.7)]">Loading cameras...</span>
              </div>
            ) : (
              <ErrorBoundary fullScreen={false} scopeName="CameraGrid">
                <CameraGridSafe 
                  cameras={allCameras || []} 
                  onCameraSelect={(camera) => setSelectedCamera(camera)}
                />
              </ErrorBoundary>
            )}
          </div>
        </div>
      )}

      {/* Camera Viewer Modal */}
      {selectedCamera && (
        <ErrorBoundary fullScreen={false} scopeName="CameraViewer">
          <CameraViewerSafe
            camera={selectedCamera}
            onClose={() => {
              setSelectedCamera(null)
              refetchCameras() // Refresh camera status
            }}
            incidentId={cameraIncidentId || undefined}
          />
        </ErrorBoundary>
      )}
    </div>
  )
}
