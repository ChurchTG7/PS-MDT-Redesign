import React, { useState, useEffect } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import { FormModal } from '../components/Modal'
import { useFetchNui, useRealtimeUpdate, useSearch, useNuiSubmit, usePagination, useNuiListener } from '../utils/hooks'
import type { Report, CreateReportPayload } from '../types/api'

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  // Form state for creating/editing reports
  const [formData, setFormData] = useState<CreateReportPayload>({
    title: '',
    reportType: 'incident',
    description: '',
    location: '',
    suspects: [],
    witnesses: [],
    charges: [],
    evidence: [],
    priority: 'medium',
  })

  // Fetch reports from server
  const {
    data: allReports,
    loading,
    error,
    refetch,
  } = useFetchNui<Report[]>('getReports', [])

  // Submit handler for creating reports
  const { submit: submitReport, submitting } = useNuiSubmit<CreateReportPayload, Report>(
    'createReport',
    (newReport) => {
      console.log('[ps-mdt] Report created:', newReport)
      setIsCreateModalOpen(false)
      resetForm()
      refetch() // Refresh the list
    },
    (error) => {
      console.error('[ps-mdt] Error creating report:', error)
      alert(`Failed to create report: ${error}`)
    }
  )

  // Listen for real-time updates
  useRealtimeUpdate<{ reportId: number }>('reportCreated', () => {
    refetch()
  })

  useRealtimeUpdate<{ reportId: number }>('reportUpdated', () => {
    refetch()
  })

  useRealtimeUpdate<{ reportId: number }>('reportDeleted', () => {
    refetch()
  })

  useRealtimeUpdate('refreshReports', () => {
    refetch()
  })

  // Listen for normalized 'reports' push and refetch
  useNuiListener('reports', () => {
    refetch()
  })

  // Filter reports based on search and filters
  const filteredReports = (allReports || []).filter((report) => {
    // Status filter
    if (statusFilter !== 'all' && report.status !== statusFilter) {
      return false
    }

    // Priority filter
    if (priorityFilter !== 'all' && report.priority !== priorityFilter) {
      return false
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        report.caseNumber?.toLowerCase().includes(query) ||
        report.title.toLowerCase().includes(query) ||
        report.officerName?.toLowerCase().includes(query) ||
        report.description?.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Pagination
  const { currentItems, currentPage, totalPages, goToPage, nextPage, prevPage, hasNext, hasPrev } =
    usePagination(filteredReports, 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitReport(formData)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      reportType: 'incident',
      description: '',
      location: '',
      suspects: [],
      witnesses: [],
      charges: [],
      evidence: [],
      priority: 'medium',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'reviewed':
        return 'info'
      case 'closed':
        return 'success'
      case 'draft':
        return 'warning'
      default:
        return 'default'
    }
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

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search reports by case #, title, or officer..."
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
              Create Report
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
                variant={statusFilter === 'draft' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('draft')}
              >
                Draft
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'submitted' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('submitted')}
              >
                Submitted
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'reviewed' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('reviewed')}
              >
                Reviewed
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
                variant={priorityFilter === 'low' ? 'success' : 'secondary'}
                onClick={() => setPriorityFilter('low')}
              >
                Low
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Reports List */}
      <Card
        title="All Reports"
        subtitle={
          loading
            ? 'Loading reports...'
            : `${filteredReports.length} report${filteredReports.length !== 1 ? 's' : ''} found`
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[rgba(255,255,255,0.5)]">
            <i className="fa-solid fa-spinner fa-spin mr-2 text-xl" />
            <span>Loading reports...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-400">
            <i className="fa-solid fa-exclamation-triangle text-3xl mb-3" />
            <p className="font-medium">Failed to load reports</p>
            <p className="text-sm text-[rgba(255,255,255,0.5)] mt-1">{error}</p>
            <Button variant="primary" size="sm" onClick={() => refetch()} className="mt-4">
              <i className="fa-solid fa-refresh mr-2" />
              Retry
            </Button>
          </div>
        ) : currentItems.length > 0 ? (
          <div className="space-y-3">
            {currentItems.map((report) => (
              <div
                key={report.id}
                className="flex items-center gap-4 p-4 bg-[rgba(11,19,34,0.4)] rounded-xl border border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.3)] transition-all cursor-pointer group"
                onClick={() => setSelectedReport(report)}
              >
                {/* Report Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[rgba(56,189,248,0.2)] to-[rgba(30,58,138,0.3)] border border-[rgba(56,189,248,0.4)] flex items-center justify-center">
                    <i className="fa-solid fa-file-lines text-[#38BDF8]" />
                  </div>
                </div>

                {/* Report Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-[rgba(255,255,255,0.5)]">
                      {report.caseNumber || `#${report.id}`}
                    </span>
                    <Badge variant={getStatusColor(report.status)}>
                      {report.status.toUpperCase()}
                    </Badge>
                    <Badge variant={getPriorityColor(report.priority)}>
                      {report.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-white mb-1 truncate">{report.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-[rgba(255,255,255,0.6)]">
                    <span>
                      <i className="fa-solid fa-user-police mr-1.5" />
                      {report.officerName || 'Unknown'}
                    </span>
                    <span>
                      <i className="fa-solid fa-calendar mr-1.5" />
                      {new Date(report.date).toLocaleString()}
                    </span>
                    {report.suspects && report.suspects.length > 0 && (
                      <span>
                        <i className="fa-solid fa-users mr-1.5" />
                        {report.suspects.length} suspect{report.suspects.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {report.charges && report.charges.length > 0 && (
                      <span>
                        <i className="fa-solid fa-gavel mr-1.5" />
                        {report.charges.length} charge{report.charges.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" title="View Report">
                    <i className="fa-solid fa-eye" />
                  </Button>
                  <Button size="sm" variant="ghost" title="Edit Report">
                    <i className="fa-solid fa-pen" />
                  </Button>
                  <Button size="sm" variant="ghost" title="Print Report">
                    <i className="fa-solid fa-print" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-[rgba(255,255,255,0.5)]">
            <i className="fa-solid fa-inbox text-4xl mb-3" />
            <p className="text-lg font-medium">No reports found</p>
            <p className="text-sm mt-1">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first report to get started'}
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

      {/* Create Report Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          resetForm()
        }}
        onSubmit={handleSubmit}
        title="Create New Report"
        submitText="Create Report"
        isLoading={submitting}
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
                  Report Title *
                </label>
                <Input
                  placeholder="e.g., Armed Robbery - Fleeca Bank"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                  Report Type *
                </label>
                <select
                  className="w-full px-4 py-3 bg-[rgba(11,19,34,0.4)] border border-[rgba(var(--outline-rgb),0.2)]
                    rounded-lg text-white
                    focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.5)]
                    transition-all"
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                  required
                >
                  <option value="incident">Incident Report</option>
                  <option value="arrest">Arrest Report</option>
                  <option value="traffic">Traffic Report</option>
                  <option value="investigation">Investigation Report</option>
                  <option value="other">Other</option>
                </select>
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
                      priority: e.target.value as 'low' | 'medium' | 'high',
                    })
                  }
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                  Location *
                </label>
                <Input
                  placeholder="e.g., Fleeca Bank, Legion Square"
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
                  placeholder="Provide a detailed description of the incident..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                    Suspects Involved (comma-separated)
                  </label>
                  <Input
                    placeholder="e.g., John Doe, Jane Smith"
                    value={formData.suspects?.join(', ') || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        suspects: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter((s) => s),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-[rgba(255,255,255,0.6)] uppercase mb-2">
                    Witnesses (comma-separated)
                  </label>
                  <Input
                    placeholder="e.g., Alice Brown, Bob Wilson"
                    value={formData.witnesses?.join(', ') || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        witnesses: e.target.value
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

          {/* Notice */}
          <div className="p-4 bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.2)] rounded-lg">
            <div className="flex gap-3">
              <i className="fa-solid fa-circle-info text-theme-icon mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-[rgba(255,255,255,0.8)] font-medium mb-1">
                  Report Guidelines
                </p>
                <p className="text-xs text-[rgba(255,255,255,0.6)]">
                  All reports must be accurate and complete. You can edit this report after submission.
                  Evidence, charges, and additional details can be attached later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  )
}
