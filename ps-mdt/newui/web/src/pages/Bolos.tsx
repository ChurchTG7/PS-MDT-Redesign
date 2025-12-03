import React, { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import { FormModal } from '../components/Modal'
import { useFetchNui, useRealtimeUpdate, useNuiSubmit, usePagination } from '../utils/hooks'
import { fetchNui } from '../utils/nui'
import type { Bolo, CreateBoloPayload } from '../types/api'

export default function BolosPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [boloType, setBoloType] = useState<'person' | 'vehicle'>('person')
  const [selectedBolo, setSelectedBolo] = useState<Bolo | null>(null)

  // Form state for creating BOLOs
  const [formData, setFormData] = useState<CreateBoloPayload>({
    type: 'person',
    title: '',
    description: '',
    priority: 'medium',
    details: {},
    lastSeen: '',
  })

  // Fetch BOLOs from server
  const {
    data: allBolos,
    loading,
    error,
    refetch,
  } = useFetchNui<Bolo[]>('getBolos', [])

  // Submit handler for creating BOLOs
  const { submit: submitBolo, submitting } = useNuiSubmit<CreateBoloPayload, Bolo>(
    'createBolo',
    (newBolo) => {
      console.log('[ps-mdt] BOLO created:', newBolo)
      setIsCreateModalOpen(false)
      resetForm()
      refetch()
    },
    (error) => {
      console.error('[ps-mdt] Error creating BOLO:', error)
      alert(`Failed to create BOLO: ${error}`)
    }
  )

  // Handler for cancelling BOLO
  const handleCancelBolo = async (boloId: number) => {
    const result = await fetchNui('cancelBolo', { boloId })
    if (result.success) {
      refetch()
    } else {
      alert(`Failed to cancel BOLO: ${result.error}`)
    }
  }

  // Handler for resolving BOLO
  const handleResolveBolo = async (boloId: number) => {
    const result = await fetchNui('updateBolo', { boloId, status: 'resolved' })
    if (result.success) {
      refetch()
    } else {
      alert(`Failed to resolve BOLO: ${result.error}`)
    }
  }

  // Listen for real-time updates
  useRealtimeUpdate('boloCreated', () => {
    refetch()
  })

  useRealtimeUpdate('boloUpdated', () => {
    refetch()
  })

  useRealtimeUpdate('boloCancelled', () => {
    refetch()
  })

  useRealtimeUpdate('boloResolved', () => {
    refetch()
  })

  // Filter BOLOs based on search and filters
  const filteredBolos = (allBolos || []).filter((bolo) => {
    // Type filter
    if (typeFilter !== 'all' && bolo.type !== typeFilter) {
      return false
    }

    // Status filter
    if (statusFilter !== 'all' && bolo.status !== statusFilter) {
      return false
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        bolo.title.toLowerCase().includes(query) ||
        bolo.description.toLowerCase().includes(query) ||
        bolo.details?.name?.toLowerCase().includes(query) ||
        bolo.details?.plate?.toLowerCase().includes(query) ||
        bolo.details?.model?.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Count active high priority BOLOs for alert banner
  const activeHighPriorityBolos = filteredBolos.filter(
    (b) => b.status === 'active' && b.priority === 'high'
  )

  // Pagination
  const { currentItems, currentPage, totalPages, goToPage, nextPage, prevPage, hasNext, hasPrev } =
    usePagination(filteredBolos, 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitBolo(formData)
  }

  const resetForm = () => {
    setFormData({
      type: 'person',
      title: '',
      description: '',
      priority: 'medium',
      details: {},
      lastSeen: '',
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getTypeIcon = (type: string) => {
    return type === 'person' ? 'fa-user' : 'fa-car'
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
                placeholder="Search BOLOs by name, description, plate, or vehicle..."
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
              Create BOLO
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={typeFilter === 'all' ? 'primary' : 'secondary'}
                onClick={() => setTypeFilter('all')}
              >
                All Types
              </Button>
              <Button
                size="sm"
                variant={typeFilter === 'person' ? 'primary' : 'secondary'}
                onClick={() => setTypeFilter('person')}
                icon={<i className="fa-solid fa-user" />}
              >
                Person
              </Button>
              <Button
                size="sm"
                variant={typeFilter === 'vehicle' ? 'primary' : 'secondary'}
                onClick={() => setTypeFilter('vehicle')}
                icon={<i className="fa-solid fa-car" />}
              >
                Vehicle
              </Button>
            </div>

            <div className="h-8 w-px bg-[rgba(255,255,255,0.1)]" />

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={statusFilter === 'all' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('all')}
              >
                All Status
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
                variant={statusFilter === 'cancelled' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('cancelled')}
              >
                Cancelled
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'expired' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('expired')}
              >
                Expired
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Active BOLOs Alert */}
      {activeHighPriorityBolos.length > 0 && (
        <div className="bg-gradient-to-r from-[rgba(251,191,36,0.2)] to-[rgba(245,158,11,0.15)] border border-[rgba(251,191,36,0.4)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[rgba(251,191,36,0.3)] flex items-center justify-center animate-pulse">
            <i className="fa-solid fa-bell text-yellow-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white">🚨 Active High Priority BOLOs</h4>
            <p className="text-sm text-[rgba(255,255,255,0.7)]">
              {activeHighPriorityBolos.length} high priority BOLO
              {activeHighPriorityBolos.length !== 1 ? 's' : ''} require immediate attention
            </p>
          </div>
        </div>
      )}

      {/* BOLOs List */}
      <Card
        title="All BOLOs"
        subtitle={
          loading
            ? 'Loading BOLOs...'
            : `${filteredBolos.length} active alert${filteredBolos.length !== 1 ? 's' : ''}`
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[rgba(255,255,255,0.5)]">
            <i className="fa-solid fa-spinner fa-spin mr-2 text-xl" />
            <span>Loading BOLOs...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-400">
            <i className="fa-solid fa-exclamation-triangle text-3xl mb-3" />
            <p className="font-medium">Failed to load BOLOs</p>
            <p className="text-sm text-[rgba(255,255,255,0.5)] mt-1">{error}</p>
            <Button variant="primary" size="sm" onClick={() => refetch()} className="mt-4">
              <i className="fa-solid fa-refresh mr-2" />
              Retry
            </Button>
          </div>
        ) : currentItems.length > 0 ? (
          <div className="space-y-4">
            {currentItems.map((bolo) => (
              <div
                key={bolo.id}
                className="p-4 bg-[rgba(11,19,34,0.4)] rounded-xl border-2 border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.4)] transition-all cursor-pointer"
                onClick={() => setSelectedBolo(bolo)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        bolo.type === 'person'
                          ? 'bg-gradient-to-br from-[rgba(56,189,248,0.3)] to-[rgba(30,58,138,0.2)] border border-[rgba(56,189,248,0.5)]'
                          : 'bg-gradient-to-br from-[rgba(168,85,247,0.3)] to-[rgba(126,34,206,0.2)] border border-[rgba(168,85,247,0.5)]'
                      }`}
                    >
                      <i
                        className={`fa-solid ${getTypeIcon(bolo.type)} text-lg ${
                          bolo.type === 'person' ? 'text-theme-icon' : 'text-purple-400'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-[rgba(255,255,255,0.5)]">
                          #{bolo.id}
                        </span>
                        <Badge variant={getPriorityColor(bolo.priority)}>
                          {bolo.priority.toUpperCase()} PRIORITY
                        </Badge>
                        <Badge variant="default">{bolo.type.toUpperCase()}</Badge>
                        {bolo.status !== 'active' && (
                          <Badge variant={bolo.status === 'resolved' ? 'success' : 'default'}>
                            {bolo.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-bold text-lg text-white">{bolo.title}</h4>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary">
                      <i className="fa-solid fa-eye" />
                    </Button>
                    {bolo.status === 'active' && (
                      <Button size="sm" variant="secondary">
                        <i className="fa-solid fa-pen" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
                      Description
                    </span>
                    <p className="text-sm text-white mt-0.5">{bolo.description}</p>
                  </div>
                  {bolo.type === 'person' && (
                    <>
                      {bolo.details.name && (
                        <div>
                          <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
                            Name
                          </span>
                          <p className="text-sm text-white mt-0.5">{bolo.details.name}</p>
                        </div>
                      )}
                      {bolo.details.distinguishingFeatures && (
                        <div className="md:col-span-2">
                          <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
                            Distinguishing Features
                          </span>
                          <p className="text-sm text-white mt-0.5">
                            {bolo.details.distinguishingFeatures}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {bolo.type === 'vehicle' && (
                    <>
                      {bolo.details.plate && (
                        <div>
                          <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
                            License Plate
                          </span>
                          <p className="text-sm text-white mt-0.5 font-mono">
                            {bolo.details.plate}
                          </p>
                        </div>
                      )}
                      {bolo.details.model && (
                        <div>
                          <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
                            Vehicle Model
                          </span>
                          <p className="text-sm text-white mt-0.5">{bolo.details.model}</p>
                        </div>
                      )}
                      {bolo.details.color && (
                        <div>
                          <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
                            Color
                          </span>
                          <p className="text-sm text-white mt-0.5">{bolo.details.color}</p>
                        </div>
                      )}
                    </>
                  )}
                  {bolo.lastSeen && (
                    <div>
                      <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
                        Last Seen
                      </span>
                      <p className="text-sm text-white mt-0.5">
                        <i className="fa-solid fa-location-dot mr-1.5 text-red-400" />
                        {bolo.lastSeen} ({formatTimeAgo(bolo.date)})
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[rgba(36,72,176,0.15)]">
                  <span className="text-xs text-[rgba(255,255,255,0.6)]">
                    Issued by{' '}
                    <span className="text-[#38BDF8] font-medium">
                      {bolo.officerName || 'Unknown'}
                    </span>{' '}
                    on {new Date(bolo.date).toLocaleDateString()}
                  </span>
                  {bolo.status === 'active' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Are you sure you want to cancel this BOLO?')) {
                            handleCancelBolo(bolo.id)
                          }
                        }}
                      >
                        <i className="fa-solid fa-bell-slash" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Mark this BOLO as resolved?')) {
                            handleResolveBolo(bolo.id)
                          }
                        }}
                      >
                        <i className="fa-solid fa-check" />
                        Resolved
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-[rgba(255,255,255,0.5)]">
            <i className="fa-solid fa-inbox text-4xl mb-3" />
            <p className="text-lg font-medium">No BOLOs found</p>
            <p className="text-sm mt-1">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'active'
                ? 'Try adjusting your search or filters'
                : 'Create your first BOLO to get started'}
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

      {/* Create BOLO Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          resetForm()
        }}
        onSubmit={handleSubmit}
        title="Create New BOLO"
        submitText="Issue BOLO"
        isLoading={submitting}
        size="lg"
      >
        <div className="space-y-4">
          {/* BOLO Type Selection */}
          <div>
            <label className="block text-sm font-medium text-[rgba(255,255,255,0.9)] mb-2">
              BOLO Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'person'
                    ? 'border-[#38BDF8] bg-[rgba(56,189,248,0.1)]'
                    : 'border-[rgba(255,255,255,0.1)] bg-[rgba(11,19,34,0.4)] hover:border-[rgba(255,255,255,0.2)]'
                }`}
                onClick={() => setFormData({ ...formData, type: 'person', details: {} })}
              >
                <i className="fa-solid fa-user text-2xl text-theme-icon mb-2" />
                <div className="text-sm font-medium">Person BOLO</div>
              </button>
              <button
                type="button"
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'vehicle'
                    ? 'border-[#A855F7] bg-[rgba(168,85,247,0.1)]'
                    : 'border-[rgba(255,255,255,0.1)] bg-[rgba(11,19,34,0.4)] hover:border-[rgba(255,255,255,0.2)]'
                }`}
                onClick={() => setFormData({ ...formData, type: 'vehicle', details: {} })}
              >
                <i className="fa-solid fa-car text-2xl text-purple-400 mb-2" />
                <div className="text-sm font-medium">Vehicle BOLO</div>
              </button>
            </div>
          </div>

          {/* Common Fields */}
          <Input
            label="Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={
              formData.type === 'person'
                ? 'e.g., John "Scarface" Martinez'
                : 'e.g., Stolen Police Cruiser'
            }
            required
          />

          <div>
            <label className="block text-sm font-medium text-[rgba(255,255,255,0.9)] mb-2">
              Description *
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-lg bg-[rgba(11,19,34,0.6)] border-2 border-[rgba(36,72,176,0.2)] text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#38BDF8] transition-colors resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={
                formData.type === 'person'
                  ? 'Physical description, clothing, behavior...'
                  : 'Vehicle description, damage, modifications...'
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgba(255,255,255,0.9)] mb-2">
                Priority *
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg bg-[rgba(11,19,34,0.6)] border-2 border-[rgba(36,72,176,0.2)] text-white focus:outline-none focus:border-[#38BDF8] transition-colors"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as 'low' | 'medium' | 'high',
                  })
                }
                required
              >
                <option value="high">🔴 High Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="low">🟢 Low Priority</option>
              </select>
            </div>

            <Input
              label="Last Seen Location"
              value={formData.lastSeen || ''}
              onChange={(e) => setFormData({ ...formData, lastSeen: e.target.value })}
              placeholder="e.g., Grove Street"
              icon={<i className="fa-solid fa-location-dot" />}
            />
          </div>

          {/* Person-Specific Fields */}
          {formData.type === 'person' && (
            <>
              <div className="pt-4 border-t border-[rgba(36,72,176,0.2)]">
                <h4 className="text-sm font-semibold text-[rgba(255,255,255,0.9)] mb-3">
                  Person Details
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.details.name || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      details: { ...formData.details, name: e.target.value },
                    })
                  }
                  placeholder="e.g., John Martinez"
                />

                <div>
                  <label className="block text-sm font-medium text-[rgba(255,255,255,0.9)] mb-2">
                    Gender
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-lg bg-[rgba(11,19,34,0.6)] border-2 border-[rgba(36,72,176,0.2)] text-white focus:outline-none focus:border-[#38BDF8] transition-colors"
                    value={formData.details.gender || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        details: { ...formData.details, gender: e.target.value },
                      })
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <Input
                  label="Height"
                  value={formData.details.height || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      details: { ...formData.details, height: e.target.value },
                    })
                  }
                  placeholder="e.g., 6 ft 2 in"
                />

                <Input
                  label="Weight"
                  value={formData.details.weight || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      details: { ...formData.details, weight: e.target.value },
                    })
                  }
                  placeholder="e.g., 180 lbs"
                />

                <Input
                  label="Hair Color"
                  value={formData.details.hairColor || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      details: { ...formData.details, hairColor: e.target.value },
                    })
                  }
                  placeholder="e.g., Black"
                />

                <Input
                  label="Eye Color"
                  value={formData.details.eyeColor || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      details: { ...formData.details, eyeColor: e.target.value },
                    })
                  }
                  placeholder="e.g., Brown"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgba(255,255,255,0.9)] mb-2">
                  Distinguishing Features
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg bg-[rgba(11,19,34,0.6)] border-2 border-[rgba(36,72,176,0.2)] text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#38BDF8] transition-colors resize-none"
                  rows={2}
                  value={formData.details.distinguishingFeatures || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      details: { ...formData.details, distinguishingFeatures: e.target.value },
                    })
                  }
                  placeholder="Tattoos, scars, piercings, etc."
                />
              </div>
            </>
          )}

          {/* Vehicle-Specific Fields */}
          {formData.type === 'vehicle' && (
            <>
              <div className="pt-4 border-t border-[rgba(36,72,176,0.2)]">
                <h4 className="text-sm font-semibold text-[rgba(255,255,255,0.9)] mb-3">
                  Vehicle Details
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="License Plate"
                  value={formData.details.plate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      details: { ...formData.details, plate: e.target.value.toUpperCase() },
                    })
                  }
                  placeholder="e.g., ABC1234"
                  icon={<i className="fa-solid fa-id-card" />}
                />

                <Input
                  label="Model"
                  value={formData.details.model || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      details: { ...formData.details, model: e.target.value },
                    })
                  }
                  placeholder="e.g., Sultan RS"
                />

                <Input
                  label="Color"
                  value={formData.details.color || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      details: { ...formData.details, color: e.target.value },
                    })
                  }
                  placeholder="e.g., Black"
                />

                <div>
                  <label className="block text-sm font-medium text-[rgba(255,255,255,0.9)] mb-2">
                    Vehicle Type
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-lg bg-[rgba(11,19,34,0.6)] border-2 border-[rgba(36,72,176,0.2)] text-white focus:outline-none focus:border-[#38BDF8] transition-colors"
                    value={formData.details.vehicleType || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        details: { ...formData.details, vehicleType: e.target.value },
                      })
                    }
                  >
                    <option value="">Select type</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Sports">Sports Car</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </FormModal>
    </div>
  )
}
