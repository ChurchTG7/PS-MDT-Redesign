import React, { useState, useMemo } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import { useFetchNui, useRealtimeUpdate } from '../utils/hooks'
import ErrorBoundary from '../components/ErrorBoundary'
import type { Evidence } from '../types/api'

export default function EvidencePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [caseNumberInput, setCaseNumberInput] = useState('')
  const [activeCaseNumber, setActiveCaseNumber] = useState('')
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)

  // Fetch evidence by case number - don't auto-fetch until we have a case number
  const { data: evidenceItems = [], loading, error, refetch } = useFetchNui<Evidence[]>(
    'getEvidenceByCaseNumber',
    [],
    false
  )

  // Real-time updates
  useRealtimeUpdate('evidenceCreated', () => {
    if (activeCaseNumber) {
      refetch({ caseNumber: activeCaseNumber })
    }
  })

  useRealtimeUpdate('evidenceUpdated', () => {
    if (activeCaseNumber) {
      refetch({ caseNumber: activeCaseNumber })
    }
  })

  // Handle case number search
  const handleSearch = () => {
    if (caseNumberInput.trim()) {
      setActiveCaseNumber(caseNumberInput.trim())
      refetch({ caseNumber: caseNumberInput.trim() })
    }
  }

  // Filter evidence
  const filteredEvidence = useMemo(() => {
    if (!evidenceItems) return []
    
    return evidenceItems.filter(item => {
      const matchesSearch = 
        item.evidenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
  }, [evidenceItems, searchQuery, filterStatus])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'processed': return 'info'
      case 'archived': return 'secondary'
      case 'destroyed': return 'danger'
      default: return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <div className="space-y-4">
          {/* Case Number Search */}
          <div className="flex gap-3">
            <Input
              placeholder="Enter case number to load evidence..."
              value={caseNumberInput}
              onChange={(e) => setCaseNumberInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              icon={<i className="fa-solid fa-folder-open" />}
              className="flex-1"
            />
            <Button variant="primary" onClick={handleSearch}>
              <i className="fa-solid fa-magnifying-glass mr-2" />
              Load Case
            </Button>
          </div>

          {/* Evidence Search & Filter */}
          {activeCaseNumber && (
            <div className="flex gap-3">
              <Input
                placeholder="Search evidence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<i className="fa-solid fa-search" />}
                className="flex-1"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-[rgba(15,23,42,0.6)] border border-[rgba(36,72,176,0.2)] rounded-lg text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="archived">Archived</option>
                <option value="destroyed">Destroyed</option>
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Evidence List */}
      {activeCaseNumber && (
        <Card 
          title={`Evidence - Case ${activeCaseNumber}`} 
          subtitle={`${filteredEvidence.length} items`}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <i className="fa-solid fa-spinner fa-spin text-3xl spinner-theme mr-3" />
              <span className="text-[rgba(255,255,255,0.7)]">Loading evidence...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-exclamation-triangle text-3xl text-red-400 mb-3" />
              <p className="text-red-400 mb-4">Failed to load evidence</p>
              <Button size="sm" variant="primary" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : filteredEvidence.length === 0 ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-box-open text-3xl text-[rgba(255,255,255,0.3)] mb-3" />
              <p className="text-[rgba(255,255,255,0.5)]">No evidence found for this case</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvidence.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-[rgba(11,19,34,0.4)] rounded-xl border border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.3)] transition-all cursor-pointer"
                  onClick={() => setSelectedEvidence(item)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-[#38BDF8]">{item.evidenceId}</span>
                        <Badge variant={getStatusColor(item.status)}>
                          {item.status.toUpperCase()}
                        </Badge>
                        <Badge variant="default">{item.type}</Badge>
                      </div>
                      <h3 className="text-lg font-bold text-white">{item.description}</h3>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Officer</span>
                      <p className="text-sm text-white font-medium">{item.officerName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Location</span>
                      <p className="text-sm text-white font-medium">{item.location}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Date Collected</span>
                      <p className="text-sm text-white font-medium">{formatDate(item.date)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Chain Entries</span>
                      <p className="text-sm text-white font-medium">{item.chainOfCustody.length}</p>
                    </div>
                  </div>

                  {/* Serial Number if exists */}
                  {item.metadata?.serialNumber && (
                    <div className="mt-3 p-2 rounded-lg border" style={{
                      backgroundColor: 'rgba(var(--theme-accent-rgb), 0.1)',
                      borderColor: 'rgba(var(--theme-border-rgb), 0.2)'
                    }}>
                      <span className="text-xs text-[rgba(255,255,255,0.6)]">Serial Number:</span>
                      <span className="ml-2 text-sm font-mono text-theme-icon">{item.metadata.serialNumber}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Chain of Custody Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgba(15,23,42,0.98)] border border-[rgba(56,189,248,0.3)] rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ErrorBoundary fullScreen={false} scopeName="EvidenceModal">
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-lg font-bold text-[#38BDF8]">{selectedEvidence.evidenceId}</span>
                  <Badge variant={getStatusColor(selectedEvidence.status)}>
                    {selectedEvidence.status.toUpperCase()}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedEvidence.description}</h2>
                <p className="text-[rgba(255,255,255,0.6)] text-sm">Type: {selectedEvidence.type}</p>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-times text-2xl" />
              </button>
            </div>

            {/* Evidence Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Collected By</label>
                <p className="text-white font-medium">{selectedEvidence.officerName}</p>
              </div>
              <div>
                <label className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Location</label>
                <p className="text-white font-medium">{selectedEvidence.location}</p>
              </div>
              <div>
                <label className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Date Collected</label>
                <p className="text-white font-medium">{formatDate(selectedEvidence.date)}</p>
              </div>
              <div>
                <label className="text-xs text-[rgba(255,255,255,0.5)] uppercase">Case Number</label>
                <p className="text-white font-medium font-mono">{selectedEvidence.caseNumber || 'N/A'}</p>
              </div>
            </div>

            {/* Metadata */}
            {selectedEvidence.metadata && Object.keys(selectedEvidence.metadata).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3">Additional Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedEvidence.metadata.serialNumber && (
                    <div className="p-3 rounded-lg border" style={{
                      backgroundColor: 'rgba(var(--theme-accent-rgb), 0.1)',
                      borderColor: 'rgba(var(--theme-border-rgb), 0.2)'
                    }}>
                      <span className="text-xs text-[rgba(255,255,255,0.6)]">Serial Number</span>
                      <p className="text-sm font-mono text-theme-icon">{selectedEvidence.metadata.serialNumber}</p>
                    </div>
                  )}
                  {selectedEvidence.metadata.weight && (
                    <div className="p-3 rounded-lg border" style={{
                      backgroundColor: 'rgba(var(--theme-accent-rgb), 0.1)',
                      borderColor: 'rgba(var(--theme-border-rgb), 0.2)'
                    }}>
                      <span className="text-xs text-[rgba(255,255,255,0.6)]">Weight</span>
                      <p className="text-sm text-white">{selectedEvidence.metadata.weight}</p>
                    </div>
                  )}
                  {selectedEvidence.metadata.quantity && (
                    <div className="p-3 rounded-lg border" style={{
                      backgroundColor: 'rgba(var(--theme-accent-rgb), 0.1)',
                      borderColor: 'rgba(var(--theme-border-rgb), 0.2)'
                    }}>
                      <span className="text-xs text-[rgba(255,255,255,0.6)]">Quantity</span>
                      <p className="text-sm text-white">{selectedEvidence.metadata.quantity}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chain of Custody */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">
                <i className="fa-solid fa-link text-theme-icon mr-2" />
                Chain of Custody
              </h3>
              <div className="space-y-3">
                {selectedEvidence.chainOfCustody.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="p-4 bg-[rgba(11,19,34,0.6)] rounded-lg border border-[rgba(36,72,176,0.2)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full step-theme flex items-center justify-center">
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">{entry.officerName}</span>
                          <span className="text-xs text-[rgba(255,255,255,0.5)]">•</span>
                          <span className="text-xs text-[rgba(255,255,255,0.5)]">{formatDate(entry.date)}</span>
                        </div>
                        <p className="text-sm text-[rgba(255,255,255,0.8)]">{entry.action}</p>
                        {entry.notes && (
                          <p className="text-xs text-[rgba(255,255,255,0.6)] mt-1 italic">Note: {entry.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-[rgba(36,72,176,0.2)]">
              <Button variant="ghost" onClick={() => setSelectedEvidence(null)}>
                Close
              </Button>
              <Button variant="primary">
                <i className="fa-solid fa-exchange-alt mr-2" />
                Transfer Evidence
              </Button>
              <Button variant="secondary">
                <i className="fa-solid fa-edit mr-2" />
                Update Status
              </Button>
            </div>
            </ErrorBoundary>
          </div>
        </div>
      )}

      {/* Instructions Card */}
      {!activeCaseNumber && (
        <Card title="Evidence Locker">
          <div className="text-center py-12">
            <i className="fa-solid fa-box-archive text-6xl text-[rgba(56,189,248,0.3)] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Enter Case Number</h3>
            <p className="text-[rgba(255,255,255,0.6)]">
              Enter a case number above to view associated evidence items and chain of custody records
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
