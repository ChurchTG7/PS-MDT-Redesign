import React, { useState, useEffect } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import VehicleLinker, { type VehicleInfo, VehicleLinkerSafe } from '../components/VehicleLinker'
import { fetchNui } from '../utils/nui'
import { useRealtimeUpdate } from '../utils/hooks'
import { useAppStore } from '../store/useAppStore'
import type { PersonProfile, VehicleProfile, ProfileNote, ChargeRecord } from '../types/api'

type SearchType = 'person' | 'vehicle'
type ProfileTab = 'overview' | 'charges' | 'incidents' | 'evidence' | 'bolos' | 'vehicles' | 'notes'

interface LinkedEvidence {
  id: string
  type: 'casing' | 'blood' | 'fingerprint' | 'gsr' | 'physical'
  description: string
  location: string
  date: string
  caseNumber?: string
  status: string
}

interface LinkedIncident {
  id: string
  title: string
  location: string
  date: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'closed' | 'investigating'
  role: 'suspect' | 'victim' | 'witness'
}

interface LinkedBolo {
  id: string
  type: 'person' | 'vehicle'
  title: string
  description: string
  issuedBy: string
  date: string
  status: 'active' | 'expired' | 'cancelled'
}

export default function ProfilePage() {
  const [searchType, setSearchType] = useState<SearchType>('person')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isVehicleLinkerOpen, setIsVehicleLinkerOpen] = useState(false)
  const [availableVehicles, setAvailableVehicles] = useState<VehicleInfo[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isSafeImageUrl = (url?: string) => {
    if (!url || typeof url !== 'string') return false
    try {
      const u = new URL(url)
      return ['https:', 'http:', 'data:', 'blob:'].includes(u.protocol)
    } catch {
      return false
    }
  }

  const navigationContext = useAppStore((s) => s.navigationContext)
  const clearNavigationContext = useAppStore((s) => s.clearNavigationContext)

  // Auto-search when navigated from another page with context
  useEffect(() => {
    if (navigationContext?.profileSearch) {
      setSearchQuery(navigationContext.profileSearch)
      setSearchType('person')
      // Trigger search
      const autoSearch = async () => {
        setIsSearching(true)
        setSearchError(null)
        setSelectedProfile(null)

        try {
          const response = await fetchNui<PersonProfile>('searchPerson', {
            query: navigationContext.profileSearch,
          })

          if (response.success && response.data) {
            setSelectedProfile({ type: 'person', data: response.data })
            setSearchError(null)
          } else {
            setSearchError(response.error || 'Person profile not found')
          }
        } catch (error) {
          setSearchError('Failed to search for person')
        } finally {
          setIsSearching(false)
          clearNavigationContext() // Clear after use
        }
      }
      autoSearch()
    }
  }, [navigationContext, clearNavigationContext])

  // Reset mugshot fallback when the selected profile's image changes
  useEffect(() => {
    setImageError(false)
  }, [selectedProfile?.data?.image])


  // Real-time updates for profiles
  useRealtimeUpdate('profileUpdated', (data: any) => {
    if (
      selectedProfile &&
      selectedProfile.type === 'person' &&
      data.citizenid === selectedProfile.data.citizenid
    ) {
      handleSearch() // Refresh profile
    }
  })

  useRealtimeUpdate('chargeAdded', (data: any) => {
    if (
      selectedProfile &&
      selectedProfile.type === 'person' &&
      data.citizenid === selectedProfile.data.citizenid
    ) {
      handleSearch() // Refresh profile
    }
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search query')
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setSelectedProfile(null)

    try {
      if (searchType === 'person') {
        // Search for person by query
        const response = await fetchNui<PersonProfile>('searchPerson', {
          query: searchQuery,
        })

        if (response.success && response.data) {
          setSelectedProfile({ type: 'person', data: response.data })
          setSearchError(null)
        } else {
          setSearchError(response.error || 'Person profile not found')
        }
      } else {
        // Vehicle search
        const response = await fetchNui<VehicleProfile>('searchVehicle', {
          query: searchQuery.toUpperCase(),
        })

        if (response.success && response.data) {
          setSelectedProfile({ type: 'vehicle', data: response.data })
          setSearchError(null)
        } else {
          setSearchError(response.error || 'Vehicle not found')
        }
      }
    } catch (error) {
      console.error('Profile search failed:', error)
      setSearchError('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedProfile || selectedProfile.type !== 'person') return

    setIsAddingNote(true)
    try {
      const response = await fetchNui('addProfileNote', {
        citizenid: selectedProfile.data.citizenid,
        note: newNote,
        isImportant: false,
      })

      if (response.success) {
        setNewNote('')
        handleSearch() // Refresh profile to show new note
      } else {
        alert(`Failed to add note: ${response.error}`)
      }
    } catch (error) {
      console.error('Failed to add note:', error)
      alert('Failed to add note')
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleAddCharge = async () => {
    // TODO: Open charge selection modal
    alert('Charge addition modal - to be implemented')
  }

  const handleCreateWarrant = async () => {
    // TODO: Open warrant creation modal
    alert('Warrant creation modal - to be implemented')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'convicted':
        return 'danger'
      case 'pending':
        return 'warning'
      case 'dismissed':
        return 'info'
      case 'active':
        return 'success'
      case 'matched':
        return 'success'
      case 'stored':
        return 'info'
      case 'analyzing':
        return 'warning'
      case 'closed':
        return 'default'
      case 'investigating':
        return 'warning'
      case 'expired':
        return 'default'
      case 'cancelled':
        return 'danger'
      case 'registered':
        return 'success'
      case 'stolen':
        return 'danger'
      case 'impounded':
        return 'warning'
      case 'scrapped':
        return 'default'
      default:
        return 'default'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'suspect':
        return 'danger'
      case 'victim':
        return 'warning'
      case 'witness':
        return 'info'
      default:
        return 'default'
    }
  }

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'casing':
        return 'fa-circle-dot'
      case 'blood':
        return 'fa-droplet'
      case 'fingerprint':
        return 'fa-fingerprint'
      case 'gsr':
        return 'fa-hand-sparkles'
      case 'physical':
        return 'fa-box'
      default:
        return 'fa-file'
    }
  }

  const getEvidenceColor = (type: string) => {
    switch (type) {
      case 'casing':
        return 'orange'
      case 'blood':
        return 'red'
      case 'fingerprint':
        return 'blue'
      case 'gsr':
        return 'yellow'
      case 'physical':
        return 'purple'
      default:
        return 'gray'
    }
  }

  const formatLicenseStatus = (license: boolean | string | undefined) => {
    if (license === true || license === 'valid') return 'Valid'
    if (license === false || license === 'revoked') return 'Revoked'
    if (license === 'suspended') return 'Suspended'
    return 'None'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <div className="flex flex-col gap-4">
          {/* Search Type Toggle */}
          <div className="flex gap-2">
            <Button
              variant={searchType === 'person' ? 'primary' : 'secondary'}
              onClick={() => setSearchType('person')}
              icon={<i className="fa-solid fa-user" />}
              className="flex-1"
            >
              Search Person
            </Button>
            <Button
              variant={searchType === 'vehicle' ? 'primary' : 'secondary'}
              onClick={() => setSearchType('vehicle')}
              icon={<i className="fa-solid fa-car" />}
              className="flex-1"
            >
              Search Vehicle
            </Button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder={searchType === 'person' ? 'Enter name or Citizen ID...' : 'Enter plate number or VIN...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSearchError(null)
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              icon={<i className="fa-solid fa-magnifying-glass" />}
              className="flex-1"
            />
            <Button 
              variant="primary" 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              <i className={`fa-solid ${isSearching ? 'fa-spinner fa-spin' : 'fa-search'}`} />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Error */}
          {searchError && (
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-exclamation-circle text-red-400" />
                <span className="text-sm text-red-400">{searchError}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Profile Display */}
      {selectedProfile && selectedProfile.type === 'person' && (
        <>
          {/* Person Header Card */}
          <Card>
            <div className="flex gap-6">
              {/* Photo */}
              <div className="flex-shrink-0">
                {selectedProfile.data.image && !imageError && isSafeImageUrl(selectedProfile.data.image) ? (
                  <img
                    src={selectedProfile.data.image}
                    alt="Mugshot"
                    className="w-32 h-32 rounded-xl border-2 border-[rgba(56,189,248,0.5)] object-cover"
                    onError={(e) => {
                      // Prefer React state over DOM mutation
                      console.warn('[MDT] Mugshot failed to load, using fallback UI')
                      setImageError(true)
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-gradient-to-br flex items-center justify-center border" style={{
                    background: `linear-gradient(to bottom right, rgba(var(--theme-accent-rgb), 0.3), rgba(var(--theme-primary-rgb), 0.2))`,
                    borderColor: `var(--theme-border)`
                  }}>
                    <i className="fa-solid fa-user text-5xl text-theme-icon" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {selectedProfile.data.fullName ||
                        `${selectedProfile.data.firstname} ${selectedProfile.data.lastname}`}
                    </h2>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="default">{selectedProfile.data.citizenid}</Badge>
                      {selectedProfile.data.warrants && selectedProfile.data.warrants.length > 0 && (
                        <Badge variant="danger">
                          <i className="fa-solid fa-gavel mr-1" />
                          {selectedProfile.data.warrants.length} Warrant
                          {selectedProfile.data.warrants.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {selectedProfile.data.flags && selectedProfile.data.flags.length > 0 && (
                        <Badge variant="warning">
                          <i className="fa-solid fa-flag mr-1" />
                          {selectedProfile.data.flags.length} Flag
                          {selectedProfile.data.flags.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary">
                      <i className="fa-solid fa-file-plus" />
                      New Report
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleAddCharge}>
                      <i className="fa-solid fa-gavel" />
                      Add Charge
                    </Button>
                    <Button size="sm" variant="danger" onClick={handleCreateWarrant}>
                      <i className="fa-solid fa-handcuffs" />
                      Issue Warrant
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">DOB</span>
                    <p className="text-sm text-white font-medium">
                      {selectedProfile.data.dob || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Gender</span>
                    <p className="text-sm text-white font-medium">
                      {selectedProfile.data.gender || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Phone</span>
                    <p className="text-sm text-white font-medium">
                      {selectedProfile.data.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">
                      Nationality
                    </span>
                    <p className="text-sm text-white font-medium">
                      {selectedProfile.data.nationality || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-white mb-1">
                  {selectedProfile.data.charges?.length || 0}
                </p>
                <p className="text-xs text-[rgba(255,255,255,0.6)] uppercase">Charges</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400 mb-1">
                  {selectedProfile.data.warrants?.length || 0}
                </p>
                <p className="text-xs text-[rgba(255,255,255,0.6)] uppercase">Warrants</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-theme-icon mb-1">
                  {selectedProfile.data.vehicles?.length || 0}
                </p>
                <p className="text-xs text-[rgba(255,255,255,0.6)] uppercase">Vehicles</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400 mb-1">
                  {selectedProfile.data.properties?.length || 0}
                </p>
                <p className="text-xs text-[rgba(255,255,255,0.6)] uppercase">Properties</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400 mb-1">
                  {selectedProfile.data.notes?.length || 0}
                </p>
                <p className="text-xs text-[rgba(255,255,255,0.6)] uppercase">Notes</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400 mb-1">
                  {Object.values(selectedProfile.data.licenses || {}).filter((l) => l === true || l === 'valid').length}
                </p>
                <p className="text-xs text-[rgba(255,255,255,0.6)] uppercase">Licenses</p>
              </div>
            </Card>
          </div>

          {/* Tab Navigation */}
          <Card>
            <div className="flex flex-wrap gap-2 border-b border-[rgba(36,72,176,0.15)] pb-4">
              <Button
                size="sm"
                variant={activeTab === 'overview' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('overview')}
                icon={<i className="fa-solid fa-id-card" />}
              >
                Overview
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'charges' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('charges')}
                icon={<i className="fa-solid fa-gavel" />}
              >
                Charges ({selectedProfile.data.charges?.length || 0})
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'incidents' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('incidents')}
                icon={<i className="fa-solid fa-file-lines" />}
              >
                Incidents ({selectedProfile.data.incidents?.length || 0})
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'evidence' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('evidence')}
                icon={<i className="fa-solid fa-box-archive" />}
              >
                Evidence ({selectedProfile.data.evidence?.length || 0})
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'bolos' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('bolos')}
                icon={<i className="fa-solid fa-bullhorn" />}
              >
                BOLOs ({selectedProfile.data.bolos?.length || 0})
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'vehicles' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('vehicles')}
                icon={<i className="fa-solid fa-car" />}
              >
                Vehicles ({selectedProfile.data.vehicles?.length || 0})
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'notes' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('notes')}
                icon={<i className="fa-solid fa-note-sticky" />}
              >
                Notes ({selectedProfile.data.notes?.length || 0})
              </Button>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <i className="fa-solid fa-circle-info text-theme-icon" />
                        Personal Information
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Full Name:</span>
                          <span className="text-white font-medium">
                            {selectedProfile.data.fullName ||
                              `${selectedProfile.data.firstname} ${selectedProfile.data.lastname}`}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Citizen ID:</span>
                          <span className="text-white font-mono">
                            {selectedProfile.data.citizenid}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Date of Birth:</span>
                          <span className="text-white">{selectedProfile.data.dob || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Gender:</span>
                          <span className="text-white">
                            {selectedProfile.data.gender || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Phone Number:</span>
                          <span className="text-white font-mono">
                            {selectedProfile.data.phone || 'N/A'}
                          </span>
                        </div>
                        {selectedProfile.data.email && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Email:</span>
                            <span className="text-white">{selectedProfile.data.email}</span>
                          </div>
                        )}
                        {selectedProfile.data.address && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Address:</span>
                            <span className="text-white">{selectedProfile.data.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <i className="fa-solid fa-id-badge text-green-400" />
                        Licenses & Status
                      </h3>
                      <div className="space-y-2">
                        {selectedProfile.data.licenses && (
                          <>
                            {selectedProfile.data.licenses.driver && (
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    selectedProfile.data.licenses.driver === true ||
                                    selectedProfile.data.licenses.driver === 'valid'
                                      ? 'success'
                                      : 'danger'
                                  }
                                >
                                  <i className="fa-solid fa-car mr-1" />
                                  Driver License:{' '}
                                  {formatLicenseStatus(selectedProfile.data.licenses.driver)}
                                </Badge>
                              </div>
                            )}
                            {selectedProfile.data.licenses.weapon && (
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    selectedProfile.data.licenses.weapon === true ||
                                    selectedProfile.data.licenses.weapon === 'valid'
                                      ? 'success'
                                      : 'danger'
                                  }
                                >
                                  <i className="fa-solid fa-gun mr-1" />
                                  Weapon License:{' '}
                                  {formatLicenseStatus(selectedProfile.data.licenses.weapon)}
                                </Badge>
                              </div>
                            )}
                            {selectedProfile.data.licenses.business && (
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    selectedProfile.data.licenses.business === true ||
                                    selectedProfile.data.licenses.business === 'valid'
                                      ? 'success'
                                      : 'danger'
                                  }
                                >
                                  <i className="fa-solid fa-briefcase mr-1" />
                                  Business License:{' '}
                                  {formatLicenseStatus(selectedProfile.data.licenses.business)}
                                </Badge>
                              </div>
                            )}
                            {selectedProfile.data.licenses.hunting && (
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    selectedProfile.data.licenses.hunting === true ||
                                    selectedProfile.data.licenses.hunting === 'valid'
                                      ? 'success'
                                      : 'danger'
                                  }
                                >
                                  <i className="fa-solid fa-crosshairs mr-1" />
                                  Hunting License:{' '}
                                  {formatLicenseStatus(selectedProfile.data.licenses.hunting)}
                                </Badge>
                              </div>
                            )}
                            {selectedProfile.data.licenses.pilot && (
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    selectedProfile.data.licenses.pilot === true ||
                                    selectedProfile.data.licenses.pilot === 'valid'
                                      ? 'success'
                                      : 'danger'
                                  }
                                >
                                  <i className="fa-solid fa-plane mr-1" />
                                  Pilot License:{' '}
                                  {formatLicenseStatus(selectedProfile.data.licenses.pilot)}
                                </Badge>
                              </div>
                            )}
                          </>
                        )}
                        {selectedProfile.data.fingerprint && (
                          <div className="mt-3 p-2 bg-[rgba(11,19,34,0.4)] rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Fingerprint ID</p>
                            <p className="text-xs text-white font-mono">
                              {selectedProfile.data.fingerprint}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedProfile.data.warrants && selectedProfile.data.warrants.length > 0 && (
                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <i className="fa-solid fa-triangle-exclamation text-red-400 text-xl" />
                        <div>
                          <p className="text-sm font-semibold text-red-400">ACTIVE WARRANTS</p>
                          <p className="text-xs text-gray-300">
                            This individual has {selectedProfile.data.warrants.length} active
                            warrant(s). Proceed with caution.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {selectedProfile.data.warrants.map((warrant: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 bg-[rgba(11,19,34,0.4)] rounded-lg border border-red-500/20"
                          >
                            <p className="text-sm font-medium text-white mb-1">
                              {warrant.reason || 'Warrant Issued'}
                            </p>
                            <p className="text-xs text-gray-400">
                              Issued: {formatDate(warrant.date)} • By: {warrant.officerName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProfile.data.flags && selectedProfile.data.flags.length > 0 && (
                    <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                      <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-flag" />
                        Profile Flags
                      </h4>
                      <div className="space-y-1">
                        {selectedProfile.data.flags.map((flag: string, idx: number) => (
                          <div key={idx} className="text-sm text-gray-300">
                            • {flag}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProfile.data.properties && selectedProfile.data.properties.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <i className="fa-solid fa-house text-purple-400" />
                        Owned Properties
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedProfile.data.properties.map((property: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 bg-[rgba(11,19,34,0.4)] rounded-lg border border-[rgba(36,72,176,0.15)]"
                          >
                            <p className="text-sm font-medium text-white mb-1">
                              {property.address}
                            </p>
                            <p className="text-xs text-gray-400">
                              {property.propertyType}
                              {property.purchaseDate &&
                                ` • Purchased: ${formatDate(property.purchaseDate)}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Charges Tab */}
              {activeTab === 'charges' && (
                <div className="space-y-3">
                  {!selectedProfile.data.charges || selectedProfile.data.charges.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <i className="fa-solid fa-gavel text-3xl mb-2" />
                      <p>No charges on record</p>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleAddCharge}
                        className="mt-4"
                      >
                        <i className="fa-solid fa-plus mr-2" />
                        Add First Charge
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end mb-3">
                        <Button size="sm" variant="primary" onClick={handleAddCharge}>
                          <i className="fa-solid fa-plus mr-2" />
                          Add Charge
                        </Button>
                      </div>
                      {selectedProfile.data.charges.map((charge: ChargeRecord, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-[rgba(11,19,34,0.4)] rounded-lg border border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.3)] transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{charge.charge}</span>
                              <Badge variant="default">{charge.chargeCode}</Badge>
                              <Badge variant="info">{charge.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-300 mb-2">
                              {charge.description || 'No description provided'}
                            </p>
                            <div className="flex gap-4 text-xs text-[rgba(255,255,255,0.6)]">
                              <span>
                                <i className="fa-solid fa-calendar mr-1" />
                                {formatDate(charge.date)}
                              </span>
                              <span>
                                <i className="fa-solid fa-user-police mr-1" />
                                {charge.officerName || charge.officer}
                              </span>
                              {charge.fine > 0 && (
                                <span>
                                  <i className="fa-solid fa-dollar-sign mr-1" />
                                  Fine: {formatCurrency(charge.fine)}
                                </span>
                              )}
                              {charge.sentence > 0 && (
                                <span>
                                  <i className="fa-solid fa-clock mr-1" />
                                  Sentence: {charge.sentence} months
                                </span>
                              )}
                            </div>
                            {charge.notes && (
                              <p className="text-xs text-gray-400 mt-2 italic">{charge.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Vehicles Tab */}
              {activeTab === 'vehicles' && (
                <div className="space-y-3">
                  {!selectedProfile.data.vehicles || selectedProfile.data.vehicles.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <div>
                        <i className="fa-solid fa-car text-4xl mb-3 text-[rgba(255,255,255,0.3)]" />
                        <p className="text-[rgba(255,255,255,0.6)] mb-2">No vehicles linked to this profile</p>
                        <p className="text-xs text-[rgba(255,255,255,0.4)]">
                          Add a vehicle to link it to this person's profile
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={async () => {
                          // Fetch available vehicles from system
                          setLoadingVehicles(true)
                          try {
                            const response = await fetchNui<VehicleInfo[]>('getAvailableVehicles', {})
                            if (response.success && response.data) {
                              setAvailableVehicles(response.data)
                            }
                          } catch (error) {
                            console.error('Failed to fetch vehicles:', error)
                            setAvailableVehicles([])
                          } finally {
                            setLoadingVehicles(false)
                            setIsVehicleLinkerOpen(true)
                          }
                        }}
                      >
                        <i className="fa-solid fa-plus mr-2" />
                        Link Vehicle
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[rgba(255,255,255,0.6)]">
                          {selectedProfile.data.vehicles.length} vehicle{selectedProfile.data.vehicles.length !== 1 ? 's' : ''}
                        </p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            setLoadingVehicles(true)
                            try {
                              const response = await fetchNui<VehicleInfo[]>('getAvailableVehicles', {})
                              if (response.success && response.data) {
                                setAvailableVehicles(response.data)
                              }
                            } catch (error) {
                              console.error('Failed to fetch vehicles:', error)
                              setAvailableVehicles([])
                            } finally {
                              setLoadingVehicles(false)
                              setIsVehicleLinkerOpen(true)
                            }
                          }}
                        >
                          <i className="fa-solid fa-plus mr-1" />
                          Add More
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedProfile.data.vehicles.map((vehicle: VehicleProfile, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-[rgba(11,19,34,0.4)] rounded-lg border border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.3)] transition-all cursor-pointer"
                          onClick={() => {
                            setSearchType('vehicle')
                            setSearchQuery(vehicle.plate)
                            handleSearch()
                          }}
                        >
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[rgba(168,85,247,0.3)] to-[rgba(126,34,206,0.2)] border border-[rgba(168,85,247,0.5)] flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-car text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white truncate">
                                {vehicle.brand ? `${vehicle.brand} ${vehicle.model}` : vehicle.model}
                              </p>
                              <Badge variant={getStatusColor(vehicle.status)}>
                                {vehicle.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-[rgba(255,255,255,0.6)]">
                              {vehicle.color} • {vehicle.plate}
                              {vehicle.class && ` • ${vehicle.class}`}
                            </p>
                            {vehicle.flags && vehicle.flags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {vehicle.flags.map((flag, flagIdx) => (
                                  <Badge key={flagIdx} variant="warning">
                                    <i className="fa-solid fa-flag mr-1" />
                                    {flag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button size="sm" variant="secondary">
                            <i className="fa-solid fa-external-link" />
                          </Button>
                        </div>
                      ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {selectedProfile.data.notes && selectedProfile.data.notes.length > 0 && (
                    <div className="space-y-3">
                      {selectedProfile.data.notes.map((note: ProfileNote, idx: number) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border ${
                            note.isImportant
                              ? 'bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.3)]'
                              : 'bg-[rgba(11,19,34,0.4)] border-[rgba(36,72,176,0.15)]'
                          }`}
                        >
                          <div className="flex gap-3">
                            {note.isImportant && (
                              <i className="fa-solid fa-triangle-exclamation text-yellow-400 text-xl" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {note.authorName || 'Unknown Officer'}
                                  </p>
                                  <p className="text-xs text-[rgba(255,255,255,0.5)]">
                                    {formatDate(note.date)}
                                  </p>
                                </div>
                                {note.isImportant && (
                                  <Badge variant="warning">
                                    <i className="fa-solid fa-star mr-1" />
                                    Important
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-[rgba(255,255,255,0.9)]">{note.note}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Note Section */}
                  <div className="mt-4 p-4 bg-[rgba(11,19,34,0.6)] rounded-lg border border-[rgba(36,72,176,0.2)]">
                    <h4 className="text-sm font-semibold text-white mb-3">Add New Note</h4>
                    <textarea
                      className="w-full px-4 py-3 rounded-lg bg-[rgba(11,19,34,0.6)] border-2 border-[rgba(36,72,176,0.2)] text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#38BDF8] transition-colors resize-none"
                      rows={4}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter note about this person..."
                    />
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || isAddingNote}
                      >
                        <i
                          className={`fa-solid ${
                            isAddingNote ? 'fa-spinner fa-spin' : 'fa-plus'
                          } mr-1`}
                        />
                        {isAddingNote ? 'Adding...' : 'Add Note'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setNewNote('')}
                        disabled={!newNote.trim()}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {(!selectedProfile.data.notes || selectedProfile.data.notes.length === 0) && (
                    <div className="text-center py-8 text-gray-400">
                      <i className="fa-solid fa-note-sticky text-3xl mb-2" />
                      <p>No notes on record</p>
                      <p className="text-sm mt-1">Add the first note using the form above</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Vehicle Profile Display */}
      {selectedProfile && selectedProfile.type === 'vehicle' && (
        <>
          {/* Vehicle Header */}
          <Card>
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-[rgba(168,85,247,0.3)] to-[rgba(126,34,206,0.2)] border border-[rgba(168,85,247,0.5)] flex items-center justify-center">
                  <i className="fa-solid fa-car text-5xl text-purple-400" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {selectedProfile.data.brand
                        ? `${selectedProfile.data.brand} ${selectedProfile.data.model}`
                        : selectedProfile.data.model}
                    </h2>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="default">{selectedProfile.data.plate}</Badge>
                      <Badge variant={getStatusColor(selectedProfile.data.status)}>
                        {selectedProfile.data.status.toUpperCase()}
                      </Badge>
                      {selectedProfile.data.class && (
                        <Badge variant="info">{selectedProfile.data.class}</Badge>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="primary">
                    <i className="fa-solid fa-file-plus" />
                    Create Report
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Color</span>
                    <p className="text-sm text-white font-medium">{selectedProfile.data.color}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">
                      Registered To
                    </span>
                    <p className="text-sm text-white font-medium">
                      {selectedProfile.data.owner || 'Unknown'}
                    </p>
                  </div>
                  {selectedProfile.data.registrationDate && (
                    <div>
                      <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">
                        Registered
                      </span>
                      <p className="text-sm text-white font-medium">
                        {formatDate(selectedProfile.data.registrationDate)}
                      </p>
                    </div>
                  )}
                  {selectedProfile.data.lastSeen && (
                    <div>
                      <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">
                        Last Seen
                      </span>
                      <p className="text-sm text-white font-medium">
                        {selectedProfile.data.lastSeen}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Flags */}
          {selectedProfile.data.flags && selectedProfile.data.flags.length > 0 && (
            <Card title="Vehicle Flags">
              <div className="space-y-2">
                {selectedProfile.data.flags.map((flag: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-[rgba(239,68,68,0.1)] rounded-lg border border-[rgba(239,68,68,0.3)]"
                  >
                    <div className="flex gap-3">
                      <i className="fa-solid fa-flag text-red-400" />
                      <p className="text-sm text-white">{flag}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Vehicle Notes */}
          {selectedProfile.data.notes && (
            <Card title="Notes">
              <div className="p-4 bg-[rgba(11,19,34,0.4)] rounded-lg border border-[rgba(36,72,176,0.15)]">
                <p className="text-sm text-white">{selectedProfile.data.notes}</p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* No Results */}
      {!selectedProfile && (
        <Card>
          <div className="text-center py-12">
            <i className="fa-solid fa-magnifying-glass text-4xl text-[rgba(56,189,248,0.3)] mb-4" />
            <p className="text-[rgba(255,255,255,0.6)]">Search for a person or vehicle to view their profile</p>
          </div>
        </Card>
      )}

      {/* Vehicle Linker Modal */}
      {selectedProfile && selectedProfile.type === 'person' && (
        <VehicleLinkerSafe
          isOpen={isVehicleLinkerOpen}
          onClose={() => setIsVehicleLinkerOpen(false)}
          onLinkVehicle={async (vehicle) => {
            try {
              const response = await fetchNui('linkVehicleToProfile', {
                citizenid: selectedProfile.data.citizenid,
                vehicle: vehicle,
              })

              if (response.success) {
                setIsVehicleLinkerOpen(false)
                handleSearch() // Refresh profile to show new vehicle
                alert('Vehicle linked successfully!')
              } else {
                alert(`Failed to link vehicle: ${response.error}`)
              }
            } catch (error) {
              console.error('Failed to link vehicle:', error)
              alert('Failed to link vehicle')
            }
          }}
          availableVehicles={availableVehicles}
          loading={loadingVehicles}
        />
      )}
    </div>
  )
}
