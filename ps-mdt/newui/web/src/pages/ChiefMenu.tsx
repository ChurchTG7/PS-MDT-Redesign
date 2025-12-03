import React, { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Input from '../components/Input'
import { useFetchNui, useRealtimeUpdate } from '../utils/hooks'
import ErrorBoundary from '../components/ErrorBoundary'
import { fetchNui } from '../utils/nui'
import { isDebugEnabled, setDebugEnabled, toggleDebug } from '../utils/nui'
import { useAppStore } from '../store/useAppStore'

interface Officer {
  id: string
  name: string
  callsign: string
  rank: string
  badge: string
  department: string
  status: 'active' | 'on-leave' | 'suspended'
  onDuty: boolean
  incidents: number
  arrests: number
  warnings: number
}

interface Application {
  id: string
  name: string
  appliedDate: string
  status: string
}

interface DisciplineRecord {
  id: string
  officer: string
  action: string
  reason: string
  severity: 'Minor' | 'Major'
  date: string
}

interface PenalCode {
  code: string
  title: string
  description: string
  class: string
  category: string
  fine: number
  jail: number
}

interface SOP {
  id: string
  title: string
  category: string
  content: string
  lastUpdated: string
  updatedBy: string
}

interface Quote {
  id: string
  text: string
  author: string
  addedBy: string
  dateAdded: string
  isActive: boolean
}

interface DepartmentConfig {
  name: string
  abbreviation: string
  themeColor: string
  secondaryColor: string
  motto: string
  logo: string
}

interface Rank {
  id: number
  name: string
  abbreviation: string
  pay: number
  permissions: string[]
}

const ChiefMenu: React.FC = () => {
  const canAccessChief = useAppStore((s) => s.canAccessChief)
  if (!canAccessChief) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-lock text-4xl text-red-400 mb-3" />
          <div className="text-white font-semibold">Access Denied</div>
          <div className="text-gray-400 text-sm">You do not have permission to access the Chief Menu.</div>
        </div>
      </div>
    )
  }
  const [selectedTab, setSelectedTab] = useState<'roster' | 'hiring' | 'discipline' | 'actions' | 'clockaudit' | 'penalcode' | 'sop' | 'qotd' | 'settings' | 'about'>('roster')

  const tabs = [
    { id: 'roster' as const, label: 'Roster', icon: 'users', color: 'blue' },
    { id: 'hiring' as const, label: 'Hiring', icon: 'user-plus', color: 'green' },
    { id: 'discipline' as const, label: 'Discipline', icon: 'gavel', color: 'red' },
    { id: 'actions' as const, label: 'Actions', icon: 'bolt', color: 'yellow' },
    { id: 'clockaudit' as const, label: 'Clock-in Audit', icon: 'clock', color: 'teal' },
    { id: 'penalcode' as const, label: 'Penal Code', icon: 'scale-balanced', color: 'purple' },
    { id: 'sop' as const, label: 'SOPs', icon: 'book', color: 'indigo' },
    { id: 'qotd' as const, label: 'QOTD', icon: 'quote-left', color: 'pink' },
    { id: 'settings' as const, label: 'Settings', icon: 'gear', color: 'gray' },
    { id: 'about' as const, label: 'About', icon: 'circle-info', color: 'cyan' }
  ]

  // Mock department stats
  const stats = [
    { label: 'Active Officers', value: '47', icon: 'user-shield', color: 'blue', trend: '+3' },
    { label: 'Pending Applications', value: '12', icon: 'user-plus', color: 'green', trend: '+5' },
    { label: 'Active Incidents', value: '8', icon: 'siren-on', color: 'red', trend: '-2' },
    { label: 'On Duty', value: '23', icon: 'wifi', color: 'emerald', trend: '+4' }
  ]

  const getTabColorClasses = (color: string, isActive: boolean) => {
    if (isActive) {
      switch (color) {
        case 'blue': return 'badge-theme'
        case 'green': return 'bg-green-500/20 border-green-500 text-green-400'
        case 'red': return 'bg-red-500/20 border-red-500 text-red-400'
        case 'yellow': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
        case 'teal': return 'bg-teal-500/20 border-teal-500 text-teal-400'
        case 'purple': return 'bg-purple-500/20 border-purple-500 text-purple-400'
        case 'indigo': return 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
        case 'pink': return 'bg-pink-500/20 border-pink-500 text-pink-400'
        case 'gray': return 'bg-gray-500/20 border-gray-500 text-gray-300'
        case 'cyan': return 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
        default: return 'badge-theme'
      }
    }
    return 'bg-gray-800/30 border-gray-700/50 text-gray-400 hover:bg-gray-700/40 hover:border-gray-600 hover:text-gray-300'
  }

  return (
    <div className="flex flex-col gap-3 h-full p-3 overflow-hidden">
      <div className="flex-shrink-0">
        {/* Simple Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-crown text-lg text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Chief of Police</h1>
              <p className="text-gray-400 text-xs">Department Command Center</p>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation - More Compact */}
        <div className="flex gap-1.5 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`
                px-2.5 py-1.5 rounded-lg border-2 font-semibold text-xs whitespace-nowrap
                transition-all duration-200 flex items-center gap-1.5 flex-shrink-0
                ${getTabColorClasses(tab.color, selectedTab === tab.id)}
              `}
            >
              <i className={`fa-solid fa-${tab.icon}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        {selectedTab === 'roster' && <RosterTab />}
        {selectedTab === 'hiring' && <HiringTab />}
        {selectedTab === 'discipline' && <DisciplineTab />}
        {selectedTab === 'actions' && <ActionsTab />}
        {selectedTab === 'clockaudit' && <ClockAuditTab />}
        {selectedTab === 'penalcode' && <PenalCodeTab />}
        {selectedTab === 'sop' && <SOPTab />}
        {selectedTab === 'qotd' && <QOTDTab />}
        {selectedTab === 'settings' && <SettingsTab />}
        {selectedTab === 'about' && <AboutTab />}
      </div>
    </div>
  )
}

// Roster Tab Component
function RosterTab() {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Fetch officer roster from backend
  const { data: officerData = [], loading, error, refetch } = useFetchNui<Officer[]>(
    'getOfficerRoster',
    []
  )
  
  const officers = officerData || []

  // Real-time updates
  useRealtimeUpdate('officerUpdated', () => {
    refetch()
  })

  const filteredOfficers = officers.filter(officer =>
    officer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    officer.callsign?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    officer.rank?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'on-leave': return 'warning'
      case 'suspended': return 'danger'
      default: return 'secondary'
    }
  }

  return (
    <ErrorBoundary fullScreen={false} scopeName="RosterTab">
      <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          <i className="fa-solid fa-users mr-2" />
          Department Roster ({officers.length})
        </h3>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={loading} onClick={() => refetch()}>
              <i className={`fa-solid fa-rotate ${loading ? 'fa-spin' : ''}`} />
            </Button>
            <Button variant="primary" size="sm" icon={<i className="fa-solid fa-download" />}>
              Export
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search officers by name, callsign, or rank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<i className="fa-solid fa-search" />}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <i className="fa-solid fa-spinner fa-spin text-3xl spinner-theme mr-3" />
            <span className="text-[rgba(255,255,255,0.7)]">Loading roster...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-exclamation-triangle text-3xl text-red-400 mb-3" />
            <p className="text-red-400 mb-4">Failed to load roster</p>
            <Button size="sm" variant="primary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : filteredOfficers.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-users-slash text-3xl text-[rgba(255,255,255,0.3)] mb-3" />
            <p className="text-[rgba(255,255,255,0.5)]">No officers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[rgba(15,23,42,0.95)] backdrop-blur-sm z-10">
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-2 font-semibold text-gray-400">Callsign</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-400">Name</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-400">Rank</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-400">Department</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-400">Status</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-400">Incidents</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-400">Arrests</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-400">Warnings</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfficers.map((officer) => (
                  <tr key={officer.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="py-3 px-2 font-mono font-semibold text-theme-icon">{officer.callsign}</td>
                    <td className="py-3 px-2 text-white">{officer.name}</td>
                    <td className="py-3 px-2">
                      <Badge variant="warning">{officer.rank}</Badge>
                    </td>
                    <td className="py-3 px-2 text-gray-300">{officer.department}</td>
                    <td className="py-3 px-2">
                      <Badge variant={getStatusColor(officer.status)}>
                        {officer.onDuty && officer.status === 'active' ? 'On Duty' : officer.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center text-white">{officer.incidents}</td>
                    <td className="py-3 px-2 text-center text-white">{officer.arrests}</td>
                    <td className="py-3 px-2 text-center">
                      {officer.warnings > 0 ? (
                        <span className="text-yellow-400 font-semibold">{officer.warnings}</span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button variant="secondary" size="sm">
                        <i className="fa-solid fa-pen" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </ErrorBoundary>
  )
}

// Hiring Tab Component
function HiringTab() {
  // Fetch applications from backend
  const { data: applicationData = [], loading, error, refetch } = useFetchNui<Application[]>(
    'getApplications',
    []
  )
  
  const applications = applicationData || []

  // Real-time updates
  useRealtimeUpdate('applicationReceived', () => {
    refetch()
  })

  const handleAccept = async (applicationId: string) => {
    const response = await fetchNui('approveApplication', { applicationId })
    if (response.success) {
      refetch()
    }
  }

  const handleDeny = async (applicationId: string) => {
    const response = await fetchNui('rejectApplication', { applicationId })
    if (response.success) {
      refetch()
    }
  }

  return (
    <ErrorBoundary fullScreen={false} scopeName="HiringTab">
      <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          <i className="fa-solid fa-user-plus mr-2" />
          Hiring & Applications ({applications.length})
        </h3>
        <Button variant="secondary" size="sm" disabled={loading} onClick={() => refetch()}>
          <i className={`fa-solid fa-rotate ${loading ? 'fa-spin' : ''}`} />
        </Button>
      </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <i className="fa-solid fa-spinner fa-spin text-3xl spinner-theme mr-3" />
            <span className="text-[rgba(255,255,255,0.7)]">Loading applications...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-exclamation-triangle text-3xl text-red-400 mb-3" />
            <p className="text-red-400 mb-4">Failed to load applications</p>
            <Button size="sm" variant="primary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className="fa-solid fa-inbox text-4xl mb-4 block" />
            No pending applications
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.map((applicant) => (
              <div key={applicant.id} className="bg-gray-800/40 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full icon-bg-theme flex items-center justify-center">
                    <i className="fa-solid fa-user text-theme-icon text-xl" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{applicant.name}</div>
                    <div className="text-xs text-gray-400">Applied: {applicant.appliedDate}</div>
                  </div>
                </div>
                <Badge variant="warning" className="mb-3">{applicant.status}</Badge>
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleAccept(applicant.id)}
                    className="flex-1"
                  >
                    <i className="fa-solid fa-check mr-1" /> Accept
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeny(applicant.id)}
                    className="flex-1"
                  >
                    <i className="fa-solid fa-xmark mr-1" /> Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </ErrorBoundary>
  )
}

// Discipline Tab Component
function DisciplineTab() {
  // Fetch discipline records from backend
  const { data: recordData = [], loading, error, refetch } = useFetchNui<DisciplineRecord[]>(
    'getDisciplineRecords',
    []
  )
  
  const records = recordData || []

  // Real-time updates
  useRealtimeUpdate('disciplineRecordCreated', () => {
    refetch()
  })

  return (
    <ErrorBoundary fullScreen={false} scopeName="DisciplineTab">
      <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          <i className="fa-solid fa-gavel mr-2" />
          Disciplinary Actions ({records.length})
        </h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={loading} onClick={() => refetch()}>
            <i className={`fa-solid fa-rotate ${loading ? 'fa-spin' : ''}`} />
          </Button>
          <Button variant="primary" size="sm" icon={<i className="fa-solid fa-plus" />}>
            New Action
          </Button>
        </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <i className="fa-solid fa-spinner fa-spin text-3xl spinner-theme mr-3" />
            <span className="text-[rgba(255,255,255,0.7)]">Loading records...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-exclamation-triangle text-3xl text-red-400 mb-3" />
            <p className="text-red-400 mb-4">Failed to load discipline records</p>
            <Button size="sm" variant="primary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className="fa-solid fa-clipboard-check text-4xl mb-4 block" />
            No disciplinary records
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div key={record.id} className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{record.officer}</span>
                    <Badge variant={record.severity === 'Major' ? 'danger' : 'warning'}>
                      {record.severity}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-400">{record.date}</span>
                </div>
                <div className="mb-2 text-sm">
                  <span className="font-semibold">Action: </span>
                  <span className="text-gray-300">{record.action}</span>
                </div>
                <div className="text-sm text-gray-400">
                  <span className="font-semibold">Reason: </span>
                  {record.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </ErrorBoundary>
  )
}

// Actions Tab Component
function ActionsTab() {
  const [exportType, setExportType] = useState<'all' | 'roster' | 'incidents' | 'discipline'>('all')
  const officer = useAppStore((s) => s.officer)
  const isChief = (officer?.rank || '').toLowerCase().includes('chief')

  // Modal states
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [showRecallModal, setShowRecallModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [showCommendationModal, setShowCommendationModal] = useState(false)

  // Form states
  const [announcementMessage, setAnnouncementMessage] = useState('')
  const [emergencyMessage, setEmergencyMessage] = useState('')
  const [recallReason, setRecallReason] = useState('')
  const [recallLocation, setRecallLocation] = useState('Mission Row PD')
  const [auditType, setAuditType] = useState<'full' | 'roster' | 'incidents' | 'discipline'>('full')
  const [meetingTime, setMeetingTime] = useState('')
  const [meetingLocation, setMeetingLocation] = useState('Briefing Room')
  const [meetingAgenda, setMeetingAgenda] = useState('')
  const [commendationOfficer, setCommendationOfficer] = useState('')
  const [commendationReason, setCommendationReason] = useState('')
  const [commendationType, setCommendationType] = useState<'excellence' | 'bravery' | 'service' | 'medal'>('excellence')

  const handleExport = (type: string) => {
    console.log('Exporting:', type)
    // In production, this would trigger NUI callback to export data
  }

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'announce':
        setShowAnnouncementModal(true)
        break
      case 'emergency':
        setShowEmergencyModal(true)
        break
      case 'recall':
        setShowRecallModal(true)
        break
      case 'audit':
        setShowAuditModal(true)
        break
      case 'staffmeeting':
        setShowMeetingModal(true)
        break
      case 'commendation':
        setShowCommendationModal(true)
        break
      default:
        console.log('Bulk action:', action)
    }
  }

  const handleSendAnnouncement = async () => {
    if (!announcementMessage.trim()) return
    
    try {
      await fetchNui('sendDepartmentAnnouncement', {
        message: announcementMessage,
        sender: officer?.firstname + ' ' + officer?.lastname || 'Chief',
        rank: officer?.rank || 'Chief of Police'
      })
      setAnnouncementMessage('')
      setShowAnnouncementModal(false)
    } catch (error) {
      console.error('Failed to send announcement:', error)
    }
  }

  const handleSendEmergencyAlert = async () => {
    if (!emergencyMessage.trim()) return
    
    try {
      await fetchNui('sendEmergencyAlert', {
        message: emergencyMessage,
        sender: officer?.firstname + ' ' + officer?.lastname || 'Chief',
        timestamp: new Date().toISOString()
      })
      setEmergencyMessage('')
      setShowEmergencyModal(false)
    } catch (error) {
      console.error('Failed to send emergency alert:', error)
    }
  }

  const handleSendRecall = async () => {
    if (!recallReason.trim()) return
    
    try {
      await fetchNui('sendAllUnitsRecall', {
        reason: recallReason,
        location: recallLocation,
        sender: officer?.firstname + ' ' + officer?.lastname || 'Chief',
        timestamp: new Date().toISOString()
      })
      setRecallReason('')
      setRecallLocation('Mission Row PD')
      setShowRecallModal(false)
    } catch (error) {
      console.error('Failed to send recall:', error)
    }
  }

  const handleGenerateAudit = async () => {
    try {
      await fetchNui('generateAuditReport', {
        type: auditType,
        generatedBy: officer?.firstname + ' ' + officer?.lastname || 'Chief',
        timestamp: new Date().toISOString()
      })
      setShowAuditModal(false)
    } catch (error) {
      console.error('Failed to generate audit:', error)
    }
  }

  const handleCallMeeting = async () => {
    if (!meetingTime.trim() || !meetingAgenda.trim()) return
    
    try {
      await fetchNui('callStaffMeeting', {
        time: meetingTime,
        location: meetingLocation,
        agenda: meetingAgenda,
        calledBy: officer?.firstname + ' ' + officer?.lastname || 'Chief',
        timestamp: new Date().toISOString()
      })
      setMeetingTime('')
      setMeetingLocation('Briefing Room')
      setMeetingAgenda('')
      setShowMeetingModal(false)
    } catch (error) {
      console.error('Failed to call meeting:', error)
    }
  }

  const handleIssueCommendation = async () => {
    if (!commendationOfficer.trim() || !commendationReason.trim()) return
    
    try {
      await fetchNui('issueCommendation', {
        officer: commendationOfficer,
        reason: commendationReason,
        type: commendationType,
        issuedBy: officer?.firstname + ' ' + officer?.lastname || 'Chief',
        timestamp: new Date().toISOString()
      })
      setCommendationOfficer('')
      setCommendationReason('')
      setCommendationType('excellence')
      setShowCommendationModal(false)
    } catch (error) {
      console.error('Failed to issue commendation:', error)
    }
  }

  return (
    <div className="space-y-4">
      {isChief && (
        <Card title="Debug Tools (Chief)" subtitle="Toggle client-side debug logging for NUI calls and messages">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white mb-1">Debug Logging</div>
              <div className="text-xs text-gray-400">Logs all NUI requests/responses and inbound messages to console</div>
            </div>
            <button
              onClick={() => setDebugEnabled(!isDebugEnabled())}
              className={`px-3 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                isDebugEnabled()
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {isDebugEnabled() ? (
                <><i className="fa-solid fa-bug mr-2"/> Enabled</>
              ) : (
                <><i className="fa-regular fa-bug mr-2"/> Disabled</>
              )}
            </button>
          </div>
        </Card>
      )}
      <Card title="Department Actions" subtitle="Chief command operations">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => handleBulkAction('announce')}
            className="p-4 hover:brightness-110 border-2 border-active/30 hover:border-active/50 rounded-lg transition-all duration-200"
            style={{ backgroundColor: 'rgba(var(--theme-accent-rgb), 0.1)' }}
          >
            <i className="fa-solid fa-bullhorn text-2xl text-theme-icon mb-2 block" />
            <div className="font-semibold text-white text-sm">Department Announcement</div>
            <div className="text-xs text-gray-400 mt-1">Send message to all officers</div>
          </button>

          <button
            onClick={() => handleBulkAction('emergency')}
            className="p-4 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-200"
          >
            <i className="fa-solid fa-triangle-exclamation text-2xl text-red-400 mb-2 block" />
            <div className="font-semibold text-white text-sm">Emergency Alert</div>
            <div className="text-xs text-gray-400 mt-1">Send urgent alert to on-duty units</div>
          </button>

          <button
            onClick={() => handleBulkAction('recall')}
            className="p-4 bg-yellow-500/10 hover:bg-yellow-500/20 border-2 border-yellow-500/30 hover:border-yellow-500/50 rounded-lg transition-all duration-200"
          >
            <i className="fa-solid fa-bell text-2xl text-yellow-400 mb-2 block" />
            <div className="font-semibold text-white text-sm">All Units Recall</div>
            <div className="text-xs text-gray-400 mt-1">Call all units to station</div>
          </button>

          <button
            onClick={() => handleBulkAction('audit')}
            className="p-4 bg-teal-500/10 hover:bg-teal-500/20 border-2 border-teal-500/30 hover:border-teal-500/50 rounded-lg transition-all duration-200"
          >
            <i className="fa-solid fa-clipboard-list text-2xl text-teal-400 mb-2 block" />
            <div className="font-semibold text-white text-sm">Generate Audit Report</div>
            <div className="text-xs text-gray-400 mt-1">Full department audit</div>
          </button>

          <button
            onClick={() => handleBulkAction('staffmeeting')}
            className="p-4 bg-indigo-500/10 hover:bg-indigo-500/20 border-2 border-indigo-500/30 hover:border-indigo-500/50 rounded-lg transition-all duration-200"
          >
            <i className="fa-solid fa-users-rectangle text-2xl text-indigo-400 mb-2 block" />
            <div className="font-semibold text-white text-sm">Call Staff Meeting</div>
            <div className="text-xs text-gray-400 mt-1">Notify supervisors of meeting</div>
          </button>

          <button
            onClick={() => handleBulkAction('commendation')}
            className="p-4 bg-green-500/10 hover:bg-green-500/20 border-2 border-green-500/30 hover:border-green-500/50 rounded-lg transition-all duration-200"
          >
            <i className="fa-solid fa-award text-2xl text-green-400 mb-2 block" />
            <div className="font-semibold text-white text-sm">Issue Commendation</div>
            <div className="text-xs text-gray-400 mt-1">Recognize officer excellence</div>
          </button>
        </div>
      </Card>

      {/* Data Export - Hidden for future feature development
      <Card title="Data Export" subtitle="Download department records">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <button
              onClick={() => setExportType('all')}
              className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                exportType === 'all'
                  ? 'badge-theme'
                  : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <i className="fa-solid fa-database mr-2" />
              All Data
            </button>
            <button
              onClick={() => setExportType('roster')}
              className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                exportType === 'roster'
                  ? 'badge-theme'
                  : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <i className="fa-solid fa-users mr-2" />
              Roster
            </button>
            <button
              onClick={() => setExportType('incidents')}
              className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                exportType === 'incidents'
                  ? 'badge-theme'
                  : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <i className="fa-solid fa-file-lines mr-2" />
              Incidents
            </button>
            <button
              onClick={() => setExportType('discipline')}
              className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                exportType === 'discipline'
                  ? 'badge-theme'
                  : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <i className="fa-solid fa-gavel mr-2" />
              Discipline
            </button>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white mb-1">
                  Export {exportType === 'all' ? 'All Department Data' : exportType.charAt(0).toUpperCase() + exportType.slice(1)}
                </div>
                <div className="text-xs text-gray-400">
                  Download as CSV or JSON format
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExport(`${exportType}-csv`)}
                  icon={<i className="fa-solid fa-file-csv" />}
                >
                  CSV
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleExport(`${exportType}-json`)}
                  icon={<i className="fa-solid fa-file-code" />}
                >
                  JSON
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
      */}

      {/* Department Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[rgba(15,23,42,0.95)] border border-gray-700 rounded-xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-bullhorn text-blue-400" />
                Department Announcement
              </h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">
                  Announcement Message
                </label>
                <textarea
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none min-h-[120px]"
                  placeholder="Enter your department-wide announcement..."
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">This will be sent to all officers in the department</p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowAnnouncementModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSendAnnouncement}
                  disabled={!announcementMessage.trim()}
                >
                  <i className="fa-solid fa-paper-plane mr-2" />
                  Send Announcement
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Alert Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[rgba(15,23,42,0.95)] border border-red-500/30 rounded-xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation text-red-400" />
                Emergency Alert
              </h3>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-300">
                  <i className="fa-solid fa-info-circle mr-2" />
                  This will send an urgent alert to all on-duty units with sound notification
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">
                  Emergency Message
                </label>
                <textarea
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none min-h-[120px]"
                  placeholder="Enter emergency alert details..."
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowEmergencyModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleSendEmergencyAlert}
                  disabled={!emergencyMessage.trim()}
                >
                  <i className="fa-solid fa-bell mr-2" />
                  Send Emergency Alert
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Units Recall Modal */}
      {showRecallModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[rgba(15,23,42,0.95)] border border-gray-700 rounded-xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-bell text-yellow-400" />
                All Units Recall
              </h3>
              <button
                onClick={() => setShowRecallModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">
                  Recall Location
                </label>
                <Input
                  placeholder="Enter recall location..."
                  value={recallLocation}
                  onChange={(e) => setRecallLocation(e.target.value)}
                  icon={<i className="fa-solid fa-location-dot" />}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">
                  Reason for Recall
                </label>
                <textarea
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none min-h-[100px]"
                  placeholder="Enter reason for recalling all units..."
                  value={recallReason}
                  onChange={(e) => setRecallReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowRecallModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSendRecall}
                  disabled={!recallReason.trim()}
                  className="!bg-gradient-to-r !from-[rgba(234,179,8,0.32)] !to-[rgba(202,138,4,0.4)] !border-[rgba(234,179,8,0.5)] hover:!from-[rgba(234,179,8,0.42)] hover:!to-[rgba(202,138,4,0.5)] hover:!shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                >
                  <i className="fa-solid fa-users mr-2" />
                  Send Recall Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Audit Report Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[rgba(15,23,42,0.95)] border border-gray-700 rounded-xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-clipboard-list text-teal-400" />
                Generate Audit Report
              </h3>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-3 block">
                  Audit Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAuditType('full')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      auditType === 'full'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <i className="fa-solid fa-database mr-2" />
                    Full Department
                  </button>
                  <button
                    onClick={() => setAuditType('roster')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      auditType === 'roster'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <i className="fa-solid fa-users mr-2" />
                    Roster Only
                  </button>
                  <button
                    onClick={() => setAuditType('incidents')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      auditType === 'incidents'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <i className="fa-solid fa-siren-on mr-2" />
                    Incidents
                  </button>
                  <button
                    onClick={() => setAuditType('discipline')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      auditType === 'discipline'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <i className="fa-solid fa-gavel mr-2" />
                    Discipline
                  </button>
                </div>
              </div>
              <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-3">
                <p className="text-sm text-teal-300">
                  <i className="fa-solid fa-info-circle mr-2" />
                  Report will be generated and available in the exports folder
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowAuditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGenerateAudit}
                >
                  <i className="fa-solid fa-file-pdf mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Staff Meeting Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[rgba(15,23,42,0.95)] border border-gray-700 rounded-xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-users-rectangle text-indigo-400" />
                Call Staff Meeting
              </h3>
              <button
                onClick={() => setShowMeetingModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">
                  Meeting Time
                </label>
                <Input
                  placeholder="e.g., Today at 8:00 PM or Tomorrow 1400 hours"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  icon={<i className="fa-solid fa-clock" />}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">
                  Meeting Location
                </label>
                <Input
                  placeholder="Enter meeting location..."
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  icon={<i className="fa-solid fa-location-dot" />}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">
                  Meeting Agenda
                </label>
                <textarea
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none min-h-[100px]"
                  placeholder="Enter meeting agenda and topics..."
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowMeetingModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCallMeeting}
                  disabled={!meetingTime.trim() || !meetingAgenda.trim()}
                >
                  <i className="fa-solid fa-calendar-check mr-2" />
                  Schedule Meeting
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Commendation Modal */}
      {showCommendationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[rgba(15,23,42,0.95)] border border-gray-700 rounded-xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-award text-green-400" />
                Issue Commendation
              </h3>
              <button
                onClick={() => setShowCommendationModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">
                  Officer Name or Badge Number
                </label>
                <Input
                  placeholder="Enter officer name or badge number..."
                  value={commendationOfficer}
                  onChange={(e) => setCommendationOfficer(e.target.value)}
                  icon={<i className="fa-solid fa-user" />}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-3 block">
                  Commendation Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCommendationType('excellence')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      commendationType === 'excellence'
                        ? 'bg-green-500/20 border-green-500 text-green-300'
                        : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <i className="fa-solid fa-star mr-2" />
                    Excellence
                  </button>
                  <button
                    onClick={() => setCommendationType('bravery')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      commendationType === 'bravery'
                        ? 'bg-green-500/20 border-green-500 text-green-300'
                        : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <i className="fa-solid fa-shield-halved mr-2" />
                    Bravery
                  </button>
                  <button
                    onClick={() => setCommendationType('service')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      commendationType === 'service'
                        ? 'bg-green-500/20 border-green-500 text-green-300'
                        : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <i className="fa-solid fa-handshake mr-2" />
                    Service
                  </button>
                  <button
                    onClick={() => setCommendationType('medal')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      commendationType === 'medal'
                        ? 'bg-green-500/20 border-green-500 text-green-300'
                        : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <i className="fa-solid fa-medal mr-2" />
                    Medal of Honor
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">
                  Reason for Commendation
                </label>
                <textarea
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none min-h-[120px]"
                  placeholder="Describe the officer's exemplary actions or achievements..."
                  value={commendationReason}
                  onChange={(e) => setCommendationReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowCommendationModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onClick={handleIssueCommendation}
                  disabled={!commendationOfficer.trim() || !commendationReason.trim()}
                >
                  <i className="fa-solid fa-certificate mr-2" />
                  Issue Commendation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Clock-in Audit Tab Component
function ClockAuditTab() {
  interface ClockEntry {
    id: string
    officer: string
    badge: string
    clockIn: string
    clockOut: string | null
    duration: string
    date: string
    status: 'active' | 'off-duty' | 'suspended' | 'loa'
    rank?: string
    department?: string
  }

  const [clockEntries, setClockEntries] = useState<ClockEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('today')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'off-duty' | 'suspended' | 'loa'>('all')
  const [selectedOfficer, setSelectedOfficer] = useState<ClockEntry | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)

  // Fetch clock-in audit data from server
  React.useEffect(() => {
    const fetchClockAudit = async () => {
      setLoading(true)
      try {
        const response = await fetchNui<{ data: ClockEntry[] }>('ps-mdt:chief:getClockAudit', {
          limit: 100,
          filter: statusFilter === 'all' ? 'all' : statusFilter
        })
        
        if (response.data && Array.isArray(response.data)) {
          setClockEntries(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch clock audit data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClockAudit()
  }, [statusFilter])

  // Mock historical data for calendar view - 90 days
  const getOfficerHistory = (officerId: string) => {
    // In production, this would fetch from the server
    const history = []
    const today = new Date('2024-10-19')
    
    // Generate 90 days of mock data
    for (let i = 0; i < 90; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Skip some random days to simulate days off (about 30% of days)
      if (Math.random() > 0.7) continue
      
      // Generate random but realistic shift times
      const clockInHour = 7 + Math.floor(Math.random() * 4) // 7-10 AM
      const clockInMinute = Math.floor(Math.random() * 4) * 15 // 0, 15, 30, or 45
      const shiftLength = 7.5 + Math.random() * 1.5 // 7.5-9 hours
      const totalMinutes = Math.floor(shiftLength * 60)
      const clockOutHour = clockInHour + Math.floor(totalMinutes / 60)
      const clockOutMinute = (clockInMinute + (totalMinutes % 60)) % 60
      
      const formatTime = (hour: number, minute: number) => {
        const period = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`
      }
      
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      
      history.push({
        date: date.toISOString().split('T')[0],
        clockIn: formatTime(clockInHour, clockInMinute),
        clockOut: formatTime(clockOutHour, clockOutMinute),
        duration: `${hours}h ${minutes}m`
      })
    }
    
    return history.reverse() // Show oldest to newest
  }

  const handleExportHistory = (officer: ClockEntry) => {
    const history = getOfficerHistory(officer.id)
    
    // Create CSV content
    const csvHeader = 'Date,Officer,Badge,Clock In,Clock Out,Duration\n'
    const csvRows = history.map(record => 
      `${record.date},${officer.officer},${officer.badge},${record.clockIn},${record.clockOut},${record.duration}`
    ).join('\n')
    
    const csvContent = csvHeader + csvRows
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${officer.officer.replace(/\s+/g, '_')}_Clock_History_90days.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('Exported 90 days of clock-in history for:', officer.officer)
  }

  const handleViewCalendar = (officer: ClockEntry) => {
    setSelectedOfficer(officer)
    setShowCalendar(true)
  }

  const filteredEntries = clockEntries

  const activeOfficers = clockEntries.filter(e => e.status === 'active').length
  const totalHoursToday = clockEntries.reduce((sum, entry) => {
    if (!entry.duration || entry.duration === '--' || entry.duration === 'On Duty') return sum
    const match = entry.duration.match(/(\d+)h/)
    const hours = match ? parseFloat(match[1]) : 0
    return sum + hours
  }, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="spinner-theme w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading clock-in audit data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="rounded-lg p-4 border"
          style={{ 
            backgroundImage: 'linear-gradient(to bottom right, rgba(var(--theme-accent-rgb), 0.1), rgba(var(--theme-primary-rgb), 0.05))',
            borderColor: 'rgba(var(--theme-accent-rgb), 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-xs mb-1">Currently Clocked In</div>
              <div className="text-2xl font-bold text-white">{activeOfficers}</div>
            </div>
            <div className="w-12 h-12 rounded-xl icon-bg-theme flex items-center justify-center">
              <i className="fa-solid fa-clock text-theme-icon text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-xs mb-1">Total Hours Today</div>
              <div className="text-2xl font-bold text-white">{totalHoursToday.toFixed(1)}h</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <i className="fa-solid fa-business-time text-green-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-xs mb-1">Total Sessions</div>
              <div className="text-2xl font-bold text-white">{clockEntries.length}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <i className="fa-solid fa-list-check text-purple-400 text-xl" />
            </div>
          </div>
        </div>
      </div>

      <Card title="Clock-in Records" subtitle="Officer attendance tracking">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Button
            variant={statusFilter === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'success' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            <i className="fa-solid fa-clock mr-1" />
            Active
          </Button>
          <Button
            variant={statusFilter === 'off-duty' ? 'secondary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('off-duty')}
          >
            <i className="fa-solid fa-moon mr-1" />
            Off-Duty
          </Button>
          <Button
            variant={statusFilter === 'suspended' ? 'danger' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('suspended')}
          >
            <i className="fa-solid fa-ban mr-1" />
            Suspended
          </Button>
          <Button
            variant={statusFilter === 'loa' ? 'secondary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter('loa')}
          >
            <i className="fa-solid fa-plane-departure mr-1" />
            LOA
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-3 px-2 text-left text-gray-400 text-xs font-semibold">Officer</th>
                <th className="py-3 px-2 text-left text-gray-400 text-xs font-semibold">Badge</th>
                <th className="py-3 px-2 text-left text-gray-400 text-xs font-semibold">Clock In</th>
                <th className="py-3 px-2 text-left text-gray-400 text-xs font-semibold">Clock Out</th>
                <th className="py-3 px-2 text-left text-gray-400 text-xs font-semibold">Duration</th>
                <th className="py-3 px-2 text-left text-gray-400 text-xs font-semibold">Status</th>
                <th className="py-3 px-2 text-right text-gray-400 text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full icon-bg-theme flex items-center justify-center">
                        <i className="fa-solid fa-user text-theme-icon text-xs" />
                      </div>
                      <span className="text-white text-sm">{entry.officer}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-300 text-sm">#{entry.badge}</td>
                  <td className="py-3 px-2 text-gray-300 text-sm">{entry.clockIn}</td>
                  <td className="py-3 px-2 text-gray-300 text-sm">
                    {entry.clockOut || (
                      <span className="text-yellow-400 flex items-center gap-1">
                        <i className="fa-solid fa-clock animate-pulse" />
                        On Duty
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-white text-sm font-semibold">{entry.duration}</td>
                  <td className="py-3 px-2">
                    <Badge 
                      variant={
                        entry.status === 'active' ? 'success' :
                        entry.status === 'off-duty' ? 'secondary' :
                        entry.status === 'suspended' ? 'danger' :
                        'warning'
                      }
                    >
                      {entry.status === 'active' ? 'ACTIVE' :
                       entry.status === 'off-duty' ? 'OFF-DUTY' :
                       entry.status === 'suspended' ? 'SUSPENDED' :
                       'LOA'}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleViewCalendar(entry)}
                      >
                        <i className="fa-solid fa-calendar-days" />
                      </Button>
                      <Button variant="secondary" size="sm">
                        <i className="fa-solid fa-eye" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <i className="fa-solid fa-clock text-4xl mb-4 block" />
            No clock-in records found
          </div>
        )}
      </Card>

      {/* Calendar Modal */}
      {showCalendar && selectedOfficer && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCalendar(false)}
        >
          <div 
            className="bg-gray-900 rounded-xl border-2 max-w-4xl w-full max-h-[90vh] overflow-hidden"
            style={{ borderColor: 'rgba(var(--theme-accent-rgb), 0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="border-b p-4"
              style={{ 
                backgroundImage: 'linear-gradient(to right, rgba(var(--theme-accent-rgb), 0.2), rgba(var(--theme-primary-rgb), 0.1))',
                borderBottomColor: 'rgba(var(--theme-accent-rgb), 0.3)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full icon-bg-theme flex items-center justify-center">
                    <i className="fa-solid fa-calendar-days text-theme-icon text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Clock-in History</h2>
                    <p className="text-sm text-gray-400">
                      {selectedOfficer.officer} - Badge #{selectedOfficer.badge}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="w-10 h-10 rounded-lg bg-gray-800/50 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white transition-all"
                >
                  <i className="fa-solid fa-xmark text-lg" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div 
                  className="border rounded-lg p-3"
                  style={{ 
                    backgroundColor: 'rgba(var(--theme-accent-rgb), 0.1)',
                    borderColor: 'rgba(var(--theme-accent-rgb), 0.2)'
                  }}
                >
                  <div className="text-xs text-gray-400 mb-1">Total Days Worked</div>
                  <div className="text-2xl font-bold text-theme-icon">
                    {getOfficerHistory(selectedOfficer.id).length}
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Total Hours</div>
                  <div className="text-2xl font-bold text-green-400">
                    {getOfficerHistory(selectedOfficer.id).reduce((sum, entry) => {
                      const hours = parseFloat(entry.duration.split('h')[0])
                      return sum + hours
                    }, 0).toFixed(1)}h
                  </div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Average Hours/Day</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {(getOfficerHistory(selectedOfficer.id).reduce((sum, entry) => {
                      const hours = parseFloat(entry.duration.split('h')[0])
                      return sum + hours
                    }, 0) / getOfficerHistory(selectedOfficer.id).length).toFixed(1)}h
                  </div>
                </div>
              </div>

              {/* Calendar/Timeline View */}
              <Card title="Attendance Timeline" subtitle="Last 90 days of clock-in records">
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {getOfficerHistory(selectedOfficer.id).map((record, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 hover:bg-gray-800/50 hover:border-gray-600 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg icon-bg-theme flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-calendar text-theme-icon" />
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">
                              {new Date(record.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                              <span className="flex items-center gap-1">
                                <i className="fa-solid fa-clock text-green-400" />
                                In: {record.clockIn}
                              </span>
                              <span className="text-gray-600">•</span>
                              <span className="flex items-center gap-1">
                                <i className="fa-solid fa-clock text-red-400" />
                                Out: {record.clockOut}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{record.duration}</div>
                          <div className="text-xs text-gray-500">Duration</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-800 p-4 bg-gray-900/50">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Showing {getOfficerHistory(selectedOfficer.id).length} clock-in records (90 days)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCalendar(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleExportHistory(selectedOfficer)}
                    icon={<i className="fa-solid fa-download" />}
                  >
                    Export CSV
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Penal Code Tab Component
function PenalCodeTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [penalCodes, setPenalCodes] = useState<any[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCode, setEditingCode] = useState<any | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [codeToDelete, setCodeToDelete] = useState<any | null>(null)

  // Fetch penal codes
  const fetchPenalCodes = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetchNui<{ data: any[] }>('getPenalCodes', {})
      if (response && response.data && Array.isArray(response.data)) {
        setPenalCodes(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch penal codes:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPenalCodes()
  }, [])

  // Get unique categories
  const categories = React.useMemo(() => {
    if (!penalCodes || penalCodes.length === 0) return ['All']
    const uniqueCategories = Array.from(new Set(penalCodes.map((code: any) => code.category)))
    return ['All', ...uniqueCategories.sort()]
  }, [penalCodes])

  // Filter codes
  const filteredCodes = React.useMemo(() => {
    if (!penalCodes) return []
    return penalCodes.filter((code: any) => {
      if (code.isActive === false) return false
      
      const matchesSearch = code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           code.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           code.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || code.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [penalCodes, searchQuery, selectedCategory])

  const getSeverityColor = (classType: string) => {
    const normalized = classType?.toLowerCase()
    switch (normalized) {
      case 'felony': return 'danger'
      case 'misdemeanor': return 'warning'
      case 'infraction': return 'info'
      default: return 'default'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTime = (minutes: number) => {
    if (minutes === 0) return '0 minutes'
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    return `${hours}h ${mins}m`
  }

  const handleAddCode = () => {
    setEditingCode({
      code: '',
      title: '',
      description: '',
      class: 'misdemeanor',
      category: '',
      fine: 0,
      sentence: 0,
      points: 0,
      isActive: true
    })
    setShowEditModal(true)
  }

  const handleEditCode = (code: any) => {
    setEditingCode({ ...code })
    setShowEditModal(true)
  }

  const handleDeleteCode = (code: any) => {
    setCodeToDelete(code)
    setShowDeleteConfirm(true)
  }

  const handleSaveCode = async () => {
    if (!editingCode) return

    try {
      const action = editingCode.id ? 'updatePenalCode' : 'createPenalCode'
      await fetchNui(action, editingCode)
      setShowEditModal(false)
      setEditingCode(null)
      fetchPenalCodes()
    } catch (err) {
      console.error('Failed to save penal code:', err)
    }
  }

  const confirmDelete = async () => {
    if (!codeToDelete) return

    try {
      await fetchNui('deletePenalCode', { id: codeToDelete.id })
      setShowDeleteConfirm(false)
      setCodeToDelete(null)
      fetchPenalCodes()
    } catch (err) {
      console.error('Failed to delete penal code:', err)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Penal Code Management</h3>
            <p className="text-xs text-gray-400">{filteredCodes.length} codes found</p>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleAddCode}
            icon={<i className="fa-solid fa-plus" />}
          >
            Add Code
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3 mb-4">
          <Input
            placeholder="Search by code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<i className="fa-solid fa-magnifying-glass" />}
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === category
                    ? 'badge-theme'
                    : 'bg-gray-800/30 border border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner-theme w-10 h-10 mr-3" />
            <p className="text-white">Loading penal codes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-exclamation-triangle text-3xl text-red-400 mb-3" />
            <p className="text-red-400">Failed to load penal codes</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-search text-3xl text-gray-500 mb-3" />
            <p className="text-gray-500">No penal codes found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCodes.map((code) => (
              <div
                key={code.id || code.code}
                className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 hover:border-active transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-theme-icon">{code.code}</span>
                      <Badge variant={getSeverityColor(code.class)}>
                        {code.class?.toUpperCase() || 'N/A'}
                      </Badge>
                      <Badge variant="default">{code.category}</Badge>
                      {code.points && code.points > 0 && (
                        <Badge variant="warning">{code.points} pts</Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{code.title}</h3>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleEditCode(code)}
                      className="!p-1.5 !min-w-0"
                    >
                      <i className="fa-solid fa-pen text-xs" />
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleDeleteCode(code)}
                      className="!p-1.5 !min-w-0"
                    >
                      <i className="fa-solid fa-trash text-xs" />
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 mb-2 line-clamp-2">{code.description}</p>

                {/* Penalties */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                    <i className="fa-solid fa-clock text-red-400 text-xs" />
                    <div>
                      <p className="text-[10px] text-gray-500">Jail Time</p>
                      <p className="text-xs font-semibold text-white">{formatTime(code.sentence || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                    <i className="fa-solid fa-dollar-sign text-green-400 text-xs" />
                    <div>
                      <p className="text-[10px] text-gray-500">Fine</p>
                      <p className="text-xs font-semibold text-white">{formatCurrency(code.fine || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Reference */}
      <Card title="Severity Levels">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="danger">FELONY</Badge>
            </div>
            <p className="text-[10px] text-gray-400">
              Most serious crimes with significant jail time and fines
            </p>
          </div>
          <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="warning">MISDEMEANOR</Badge>
            </div>
            <p className="text-[10px] text-gray-400">
              Lesser crimes with moderate penalties
            </p>
          </div>
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="info">INFRACTION</Badge>
            </div>
            <p className="text-[10px] text-gray-400">
              Minor violations usually resulting in fines only
            </p>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      {showEditModal && editingCode && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-xl border-2 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'rgba(var(--theme-accent-rgb), 0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="border-b p-4 sticky top-0 bg-gray-900 z-10"
              style={{ 
                backgroundImage: 'linear-gradient(to right, rgba(var(--theme-accent-rgb), 0.2), rgba(var(--theme-primary-rgb), 0.1))',
                borderBottomColor: 'rgba(var(--theme-accent-rgb), 0.3)'
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingCode.id ? 'Edit Penal Code' : 'Add Penal Code'}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-times text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Code</label>
                  <Input
                    value={editingCode.code}
                    onChange={(e) => setEditingCode({ ...editingCode, code: e.target.value })}
                    placeholder="PC 487"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Class</label>
                  <select
                    value={editingCode.class}
                    onChange={(e) => setEditingCode({ ...editingCode, class: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-active"
                  >
                    <option value="felony">Felony</option>
                    <option value="misdemeanor">Misdemeanor</option>
                    <option value="infraction">Infraction</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Title</label>
                <Input
                  value={editingCode.title}
                  onChange={(e) => setEditingCode({ ...editingCode, title: e.target.value })}
                  placeholder="Grand Theft"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Category</label>
                <Input
                  value={editingCode.category}
                  onChange={(e) => setEditingCode({ ...editingCode, category: e.target.value })}
                  placeholder="Property Crimes"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
                <textarea
                  value={editingCode.description}
                  onChange={(e) => setEditingCode({ ...editingCode, description: e.target.value })}
                  placeholder="Description of the crime..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-active resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Fine ($)</label>
                  <Input
                    type="number"
                    value={editingCode.fine}
                    onChange={(e) => setEditingCode({ ...editingCode, fine: parseInt(e.target.value) || 0 })}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Jail (min)</label>
                  <Input
                    type="number"
                    value={editingCode.sentence}
                    onChange={(e) => setEditingCode({ ...editingCode, sentence: parseInt(e.target.value) || 0 })}
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Points</label>
                  <Input
                    type="number"
                    value={editingCode.points || 0}
                    onChange={(e) => setEditingCode({ ...editingCode, points: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingCode.isActive !== false}
                  onChange={(e) => setEditingCode({ ...editingCode, isActive: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700"
                />
                <label htmlFor="isActive" className="text-sm text-white">Active</label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 flex justify-end gap-2" style={{ borderTopColor: 'rgba(var(--theme-accent-rgb), 0.3)' }}>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveCode}>
                {editingCode.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && codeToDelete && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-gray-900 rounded-xl border-2 border-red-500/30 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-trash text-3xl text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete Penal Code</h2>
              <p className="text-gray-400 text-sm">
                Are you sure you want to delete <span className="font-semibold text-white">{codeToDelete.code} - {codeToDelete.title}</span>?
              </p>
              <p className="text-red-400 text-xs mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={confirmDelete}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// SOP Tab Component
function SOPTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [sops, setSOPs] = useState<SOP[]>([
    {
      id: '1',
      title: 'Traffic Stop Procedures',
      category: 'Patrol',
      content: 'Standard operating procedures for conducting traffic stops including officer safety, positioning, communication protocols, and proper documentation requirements.',
      lastUpdated: '2024-10-10',
      updatedBy: 'Capt. Johnson'
    },
    {
      id: '2',
      title: 'Use of Force Policy',
      category: 'General',
      content: 'Guidelines for appropriate use of force including de-escalation techniques, use of force continuum, and reporting requirements.',
      lastUpdated: '2024-10-08',
      updatedBy: 'Chief Williams'
    },
    {
      id: '3',
      title: 'Evidence Collection',
      category: 'Investigations',
      content: 'Procedures for proper collection, handling, and storage of evidence at crime scenes.',
      lastUpdated: '2024-10-05',
      updatedBy: 'Det. Martinez'
    },
    {
      id: '4',
      title: 'Pursuit Guidelines',
      category: 'Patrol',
      content: 'Department policy on vehicle pursuits including authorization, termination criteria, and supervisor involvement.',
      lastUpdated: '2024-10-01',
      updatedBy: 'Sgt. Chen'
    }
  ])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSOP, setEditingSOP] = useState<SOP | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sopToDelete, setSOPToDelete] = useState<SOP | null>(null)

  // Fetch SOPs (currently using mock data, ready for NUI integration)
  const fetchSOPs = React.useCallback(async () => {
    setLoading(true)
    try {
      // TODO: Implement NUI callback when backend is ready
      // const response = await fetchNui<{ data: SOP[] }>('getSOPs', {})
      // if (response && response.data && Array.isArray(response.data)) {
      //   setSOPs(response.data)
      // }
      
      // For now, using mock data (already set in state)
      setError(false)
    } catch (err) {
      console.error('Failed to fetch SOPs:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSOPs()
  }, [])

  // Get unique categories
  const categories = React.useMemo(() => {
    if (!sops || sops.length === 0) return ['All']
    const uniqueCategories = Array.from(new Set(sops.map((sop: SOP) => sop.category)))
    return ['All', ...uniqueCategories.sort()]
  }, [sops])

  // Filter SOPs
  const filteredSOPs = React.useMemo(() => {
    if (!sops) return []
    return sops.filter((sop: SOP) => {
      const matchesSearch = sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           sop.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           sop.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || sop.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [sops, searchQuery, selectedCategory])

  const handleAddSOP = () => {
    setEditingSOP({
      id: '',
      title: '',
      category: '',
      content: '',
      lastUpdated: new Date().toISOString().split('T')[0],
      updatedBy: 'Current User' // TODO: Get from app state
    })
    setShowEditModal(true)
  }

  const handleEditSOP = (sop: SOP) => {
    setEditingSOP({ ...sop })
    setShowEditModal(true)
  }

  const handleDeleteSOP = (sop: SOP) => {
    setSOPToDelete(sop)
    setShowDeleteConfirm(true)
  }

  const handleSaveSOP = async () => {
    if (!editingSOP) return

    try {
      // TODO: Implement NUI callback when backend is ready
      // const action = editingSOP.id ? 'updateSOP' : 'createSOP'
      // await fetchNui(action, editingSOP)
      
      // For now, update local state
      if (editingSOP.id) {
        setSOPs(sops.map(s => s.id === editingSOP.id ? { ...editingSOP, lastUpdated: new Date().toISOString().split('T')[0] } : s))
      } else {
        const newSOP = { ...editingSOP, id: Date.now().toString(), lastUpdated: new Date().toISOString().split('T')[0] }
        setSOPs([...sops, newSOP])
      }
      
      setShowEditModal(false)
      setEditingSOP(null)
      fetchSOPs()
    } catch (err) {
      console.error('Failed to save SOP:', err)
    }
  }

  const confirmDelete = async () => {
    if (!sopToDelete) return

    try {
      // TODO: Implement NUI callback when backend is ready
      // await fetchNui('deleteSOP', { id: sopToDelete.id })
      
      // For now, update local state
      setSOPs(sops.filter(s => s.id !== sopToDelete.id))
      
      setShowDeleteConfirm(false)
      setSOPToDelete(null)
      fetchSOPs()
    } catch (err) {
      console.error('Failed to delete SOP:', err)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Standard Operating Procedures</h3>
            <p className="text-xs text-gray-400">{filteredSOPs.length} SOPs found</p>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleAddSOP}
            icon={<i className="fa-solid fa-plus" />}
          >
            New SOP
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3 mb-4">
          <Input
            placeholder="Search SOPs by title, category, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<i className="fa-solid fa-magnifying-glass" />}
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === category
                    ? 'badge-theme'
                    : 'bg-gray-800/30 border border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner-theme w-10 h-10 mr-3" />
            <p className="text-white">Loading SOPs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-exclamation-triangle text-3xl text-red-400 mb-3" />
            <p className="text-red-400">Failed to load SOPs</p>
          </div>
        ) : filteredSOPs.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-search text-3xl text-gray-500 mb-3" />
            <p className="text-gray-500">No SOPs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSOPs.map((sop) => (
              <div
                key={sop.id}
                className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 hover:border-active transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{sop.title}</h4>
                      <Badge variant="info">{sop.category}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleEditSOP(sop)}
                      className="!p-1.5 !min-w-0"
                    >
                      <i className="fa-solid fa-pen text-xs" />
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleDeleteSOP(sop)}
                      className="!p-1.5 !min-w-0"
                    >
                      <i className="fa-solid fa-trash text-xs" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs text-gray-400 mb-2 line-clamp-2">{sop.content}</p>

                {/* Footer */}
                <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                  <span className="flex items-center gap-1">
                    <i className="fa-solid fa-clock" />
                    Last updated: {sop.lastUpdated}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fa-solid fa-user" />
                    By: {sop.updatedBy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Reference */}
      <Card title="Common Categories">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-car text-blue-400" />
              <span className="text-sm font-semibold text-white">Patrol</span>
            </div>
            <p className="text-[10px] text-gray-400">
              Field operations and traffic enforcement
            </p>
          </div>
          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-search text-purple-400" />
              <span className="text-sm font-semibold text-white">Investigations</span>
            </div>
            <p className="text-[10px] text-gray-400">
              Detective work and case management
            </p>
          </div>
          <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/30">
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-shield-halved text-green-400" />
              <span className="text-sm font-semibold text-white">General</span>
            </div>
            <p className="text-[10px] text-gray-400">
              Department-wide policies and conduct
            </p>
          </div>
          <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-graduation-cap text-yellow-400" />
              <span className="text-sm font-semibold text-white">Training</span>
            </div>
            <p className="text-[10px] text-gray-400">
              Academy and certification procedures
            </p>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      {showEditModal && editingSOP && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-xl border-2 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'rgba(var(--theme-accent-rgb), 0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="border-b p-4 sticky top-0 bg-gray-900 z-10"
              style={{ 
                backgroundImage: 'linear-gradient(to right, rgba(var(--theme-accent-rgb), 0.2), rgba(var(--theme-primary-rgb), 0.1))',
                borderBottomColor: 'rgba(var(--theme-accent-rgb), 0.3)'
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingSOP.id ? 'Edit SOP' : 'Add SOP'}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-times text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Title</label>
                <Input
                  value={editingSOP.title}
                  onChange={(e) => setEditingSOP({ ...editingSOP, title: e.target.value })}
                  placeholder="Traffic Stop Procedures"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Category</label>
                <select
                  value={editingSOP.category}
                  onChange={(e) => setEditingSOP({ ...editingSOP, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-active"
                >
                  <option value="">Select Category</option>
                  <option value="Patrol">Patrol</option>
                  <option value="Investigations">Investigations</option>
                  <option value="General">General</option>
                  <option value="Training">Training</option>
                  <option value="Admin">Administrative</option>
                  <option value="Special Operations">Special Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Content</label>
                <textarea
                  value={editingSOP.content}
                  onChange={(e) => setEditingSOP({ ...editingSOP, content: e.target.value })}
                  placeholder="Enter the full SOP content here..."
                  rows={10}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-active resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Updated By</label>
                  <Input
                    value={editingSOP.updatedBy}
                    onChange={(e) => setEditingSOP({ ...editingSOP, updatedBy: e.target.value })}
                    placeholder="Officer Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Last Updated</label>
                  <Input
                    type="date"
                    value={editingSOP.lastUpdated}
                    onChange={(e) => setEditingSOP({ ...editingSOP, lastUpdated: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 flex justify-end gap-2" style={{ borderTopColor: 'rgba(var(--theme-accent-rgb), 0.3)' }}>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveSOP}>
                {editingSOP.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && sopToDelete && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-gray-900 rounded-xl border-2 border-red-500/30 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-trash text-3xl text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete SOP</h2>
              <p className="text-gray-400 text-sm">
                Are you sure you want to delete <span className="font-semibold text-white">{sopToDelete.title}</span>?
              </p>
              <p className="text-red-400 text-xs mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={confirmDelete}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Quote of the Day Tab Component
function QOTDTab() {
  const [quotes, setQuotes] = useState<Quote[]>([
    {
      id: '1',
      text: 'Courage is not the absence of fear, but the triumph over it.',
      author: 'Nelson Mandela',
      addedBy: 'Chief Williams',
      dateAdded: '2024-10-15',
      isActive: true
    },
    {
      id: '2',
      text: 'The only thing necessary for the triumph of evil is for good men to do nothing.',
      author: 'Edmund Burke',
      addedBy: 'Chief Williams',
      dateAdded: '2024-10-10',
      isActive: false
    },
    {
      id: '3',
      text: 'In the end, we will remember not the words of our enemies, but the silence of our friends.',
      author: 'Martin Luther King Jr.',
      addedBy: 'Capt. Johnson',
      dateAdded: '2024-10-08',
      isActive: false
    },
    {
      id: '4',
      text: 'To serve and protect is not just a motto, it\'s a way of life.',
      author: 'Unknown',
      addedBy: 'Lt. Martinez',
      dateAdded: '2024-10-05',
      isActive: false
    }
  ])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null)

  const activeQuote = quotes.find(q => q.isActive)

  const handleAddQuote = () => {
    setEditingQuote({
      id: '',
      text: '',
      author: '',
      addedBy: 'Current User', // TODO: Get from app state
      dateAdded: new Date().toISOString().split('T')[0],
      isActive: false
    })
    setShowAddModal(true)
  }

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote({ ...quote })
    setShowEditModal(true)
  }

  const handleDeleteQuote = (quote: Quote) => {
    setQuoteToDelete(quote)
    setShowDeleteConfirm(true)
  }

  const handleSaveQuote = () => {
    if (!editingQuote) return

    if (editingQuote.id) {
      // Update existing quote
      setQuotes(quotes.map(q => q.id === editingQuote.id ? editingQuote : q))
    } else {
      // Add new quote
      const newQuote = { ...editingQuote, id: Date.now().toString() }
      setQuotes([...quotes, newQuote])
    }

    setShowAddModal(false)
    setShowEditModal(false)
    setEditingQuote(null)
  }

  const confirmDelete = () => {
    if (!quoteToDelete) return

    // If deleting the active quote, activate another one
    if (quoteToDelete.isActive && quotes.length > 1) {
      const remainingQuotes = quotes.filter(q => q.id !== quoteToDelete.id)
      if (remainingQuotes.length > 0) {
        remainingQuotes[0].isActive = true
      }
      setQuotes(remainingQuotes)
    } else {
      setQuotes(quotes.filter(q => q.id !== quoteToDelete.id))
    }

    setShowDeleteConfirm(false)
    setQuoteToDelete(null)
  }

  const setActiveQuote = (quoteId: string) => {
    setQuotes(quotes.map(q => ({ ...q, isActive: q.id === quoteId })))
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Quote of the Day</h3>
            <p className="text-xs text-gray-400">Manage inspirational quotes for department display</p>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleAddQuote}
            icon={<i className="fa-solid fa-plus" />}
          >
            Add Quote
          </Button>
        </div>

        {/* Active Quote Display */}
        {activeQuote && (
          <div 
            className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-6 border-l-4 mb-6"
            style={{ borderLeftColor: 'var(--theme-accent)' }}
          >
            <div className="flex items-start gap-3 mb-4">
              <i className="fa-solid fa-quote-left text-3xl text-theme-accent opacity-50 mt-1" />
              <div className="flex-1">
                <p className="text-lg text-white font-medium leading-relaxed mb-3">{activeQuote.text}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">— {activeQuote.author}</p>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 border-t border-gray-700/50 pt-3 mt-3">
              Added by {activeQuote.addedBy} on {activeQuote.dateAdded}
            </div>
          </div>
        )}

        {/* Quote List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400">Quote Rotation ({quotes.length})</h4>
          {quotes.length === 0 ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-quote-left text-3xl text-gray-500 mb-3" />
              <p className="text-gray-500">No quotes added yet</p>
            </div>
          ) : (
            quotes.map((quote) => (
              <div
                key={quote.id}
                className={`p-4 rounded-lg border transition-all ${
                  quote.isActive 
                    ? 'bg-theme-accent/10 border-theme-accent' 
                    : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-quote-left text-theme-icon opacity-50 mt-1 text-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white mb-2 line-clamp-2">{quote.text}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-gray-400">— {quote.author}</p>
                      {quote.isActive && <Badge variant="success" className="!text-[10px] !px-1.5 !py-0.5">Active</Badge>}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Added by {quote.addedBy} • {quote.dateAdded}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!quote.isActive && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setActiveQuote(quote.id)}
                        className="!p-1.5 !min-w-0"
                        title="Set as active"
                      >
                        <i className="fa-solid fa-star text-xs" />
                      </Button>
                    )}
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleEditQuote(quote)}
                      className="!p-1.5 !min-w-0"
                    >
                      <i className="fa-solid fa-pen text-xs" />
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleDeleteQuote(quote)}
                      className="!p-1.5 !min-w-0"
                      disabled={quotes.length === 1}
                    >
                      <i className="fa-solid fa-trash text-xs" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Quick Tips */}
      <Card title="Quote Rotation Tips">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <div className="flex items-start gap-2 mb-2">
              <i className="fa-solid fa-star text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Active Quote</p>
                <p className="text-xs text-gray-400">Only one quote can be active at a time. Click the star to set a quote as active.</p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
            <div className="flex items-start gap-2 mb-2">
              <i className="fa-solid fa-rotate text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Rotation</p>
                <p className="text-xs text-gray-400">Maintain a library of quotes and rotate them regularly to keep officers inspired.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Add Quote Modal */}
      {showAddModal && editingQuote && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-xl border-2 max-w-2xl w-full"
            style={{ borderColor: 'rgba(var(--theme-accent-rgb), 0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="border-b p-4"
              style={{ 
                backgroundImage: 'linear-gradient(to right, rgba(var(--theme-accent-rgb), 0.2), rgba(var(--theme-primary-rgb), 0.1))',
                borderBottomColor: 'rgba(var(--theme-accent-rgb), 0.3)'
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Add Quote</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-times text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Quote Text</label>
                <textarea
                  value={editingQuote.text}
                  onChange={(e) => setEditingQuote({ ...editingQuote, text: e.target.value })}
                  placeholder="Enter the inspirational quote..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-active resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Author</label>
                <Input
                  value={editingQuote.author}
                  onChange={(e) => setEditingQuote({ ...editingQuote, author: e.target.value })}
                  placeholder="Unknown"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="setActive"
                  checked={editingQuote.isActive}
                  onChange={(e) => setEditingQuote({ ...editingQuote, isActive: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700"
                />
                <label htmlFor="setActive" className="text-sm text-white">Set as active quote</label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 flex justify-end gap-2" style={{ borderTopColor: 'rgba(var(--theme-accent-rgb), 0.3)' }}>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveQuote}>
                Add Quote
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quote Modal */}
      {showEditModal && editingQuote && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-xl border-2 max-w-2xl w-full"
            style={{ borderColor: 'rgba(var(--theme-accent-rgb), 0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="border-b p-4"
              style={{ 
                backgroundImage: 'linear-gradient(to right, rgba(var(--theme-accent-rgb), 0.2), rgba(var(--theme-primary-rgb), 0.1))',
                borderBottomColor: 'rgba(var(--theme-accent-rgb), 0.3)'
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Edit Quote</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-times text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Quote Text</label>
                <textarea
                  value={editingQuote.text}
                  onChange={(e) => setEditingQuote({ ...editingQuote, text: e.target.value })}
                  placeholder="Enter the inspirational quote..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-active resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Author</label>
                <Input
                  value={editingQuote.author}
                  onChange={(e) => setEditingQuote({ ...editingQuote, author: e.target.value })}
                  placeholder="Unknown"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="setActiveEdit"
                  checked={editingQuote.isActive}
                  onChange={(e) => setEditingQuote({ ...editingQuote, isActive: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700"
                />
                <label htmlFor="setActiveEdit" className="text-sm text-white">Set as active quote</label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 flex justify-end gap-2" style={{ borderTopColor: 'rgba(var(--theme-accent-rgb), 0.3)' }}>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveQuote}>
                Update Quote
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && quoteToDelete && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-gray-900 rounded-xl border-2 border-red-500/30 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-trash text-3xl text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete Quote</h2>
              <p className="text-gray-400 text-sm mb-2">
                Are you sure you want to delete this quote?
              </p>
              <div className="bg-gray-800/50 rounded-lg p-3 mb-2">
                <p className="text-sm text-white italic">"{quoteToDelete.text}"</p>
                <p className="text-xs text-gray-400 mt-1">— {quoteToDelete.author}</p>
              </div>
              <p className="text-red-400 text-xs">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={confirmDelete}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Settings Tab Component
function SettingsTab() {
  const [settingsTab, setSettingsTab] = useState<'general' | 'ranks' | 'permissions'>('general')
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  
  const [deptConfig, setDeptConfig] = useState<DepartmentConfig>({
    name: theme.departmentName,
    abbreviation: 'LSPD',
    themeColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    motto: 'To Protect and Serve',
    logo: theme.logoImage || ''
  })
  const [deptSubtext, setDeptSubtext] = useState(theme.departmentSubtitle)
  const [logoType, setLogoType] = useState<'icon' | 'image'>(theme.logoType)
  const [logoIcon, setLogoIcon] = useState(theme.logoIcon)
  const [logoImage, setLogoImage] = useState<string | null>(theme.logoImage)
  const [accentColor, setAccentColor] = useState(theme.accentColor)
  const [buttonHighlight, setButtonHighlight] = useState(theme.buttonHighlight)
  const [iconColor, setIconColor] = useState(theme.iconColor)
  const [borderColor, setBorderColor] = useState(theme.borderColor)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  // Color presets
  const colorPresets = [
    { name: 'LSPD Blue', primary: '#3b82f6', secondary: '#1e40af', accent: '#38bdf8', button: '#38bdf8', icon: '#38bdf8', border: '#2448b0' },
    { name: 'BCSO Green', primary: '#22c55e', secondary: '#16a34a', accent: '#4ade80', button: '#4ade80', icon: '#4ade80', border: '#15803d' },
    { name: 'SAHP Gold', primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24', button: '#fbbf24', icon: '#fbbf24', border: '#b45309' },
    { name: 'FBI Navy', primary: '#1e3a8a', secondary: '#1e40af', accent: '#3b82f6', button: '#3b82f6', icon: '#3b82f6', border: '#1e3a8a' },
    { name: 'Fire Red', primary: '#ef4444', secondary: '#dc2626', accent: '#f87171', button: '#f87171', icon: '#f87171', border: '#b91c1c' },
    { name: 'EMS Purple', primary: '#a855f7', secondary: '#9333ea', accent: '#c084fc', button: '#c084fc', icon: '#c084fc', border: '#7e22ce' },
    { name: 'DOJ Gray', primary: '#6b7280', secondary: '#4b5563', accent: '#9ca3af', button: '#9ca3af', icon: '#9ca3af', border: '#374151' },
    { name: 'Custom', primary: deptConfig.themeColor, secondary: deptConfig.secondaryColor, accent: accentColor, button: buttonHighlight, icon: iconColor, border: borderColor }
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.match(/image\/(png|jpg|jpeg)/)) {
        alert('Please upload a PNG or JPG image')
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be smaller than 2MB')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        setLogoImage(imageUrl)
        setDeptConfig({ ...deptConfig, logo: imageUrl })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveSettings = () => {
    // Update global theme
    setTheme({
      primaryColor: deptConfig.themeColor,
      secondaryColor: deptConfig.secondaryColor,
      accentColor: accentColor,
      buttonHighlight: buttonHighlight,
      iconColor: iconColor,
      borderColor: borderColor,
      departmentName: deptConfig.name,
      departmentSubtitle: deptSubtext,
      logoType: logoType,
      logoIcon: logoIcon,
      logoImage: logoImage,
    })
    
    // TODO: Save to backend when ready
    // fetchNui('saveDepartmentSettings', { ...deptConfig, logoType, logo: logoType === 'icon' ? logoIcon : logoImage })
    alert('Department settings saved and applied!')
  }

  const handleResetSettings = () => {
    const defaults = {
      name: 'Project Sloth',
      abbreviation: 'LSPD',
      themeColor: '#3b82f6',
      secondaryColor: '#1e40af',
      motto: 'To Protect and Serve',
      logo: ''
    }
    setDeptConfig(defaults)
    setDeptSubtext('Mobile Data Terminal')
    setLogoType('icon')
    setLogoIcon('fa-shield-halved')
    setLogoImage(null)
    setAccentColor('#38bdf8')
    setButtonHighlight('#38bdf8')
    setIconColor('#38bdf8')
    setBorderColor('#2448b0')
    if (fileInputRef.current) fileInputRef.current.value = ''
    
    // Reset global theme
    setTheme({
      primaryColor: defaults.themeColor,
      secondaryColor: defaults.secondaryColor,
      accentColor: '#38bdf8',
      buttonHighlight: '#38bdf8',
      iconColor: '#38bdf8',
      borderColor: '#2448b0',
      departmentName: defaults.name,
      departmentSubtitle: 'Mobile Data Terminal',
      logoType: 'icon',
      logoIcon: 'fa-shield-halved',
      logoImage: null,
    })
  }
  
  // Rank structure matching qbx_core/shared/jobs.lua (police/bcso/sasp grades 0-4)
  const [ranks, setRanks] = useState<Rank[]>([
    { id: 0, name: 'Recruit', abbreviation: 'RCT', pay: 50, permissions: ['create_reports', 'search'] },
    { id: 1, name: 'Officer', abbreviation: 'OFC', pay: 75, permissions: ['create_reports', 'search', 'edit_profiles'] },
    { id: 2, name: 'Sergeant', abbreviation: 'SGT', pay: 100, permissions: ['create_reports', 'search', 'edit_profiles', 'manage_bolos', 'approve_applications'] },
    { id: 3, name: 'Lieutenant', abbreviation: 'LT', pay: 125, permissions: ['all_except_chief'] },
    { id: 4, name: 'Chief', abbreviation: 'CHIEF', pay: 150, permissions: ['all', 'isboss', 'bankAuth'] }
  ])

  const settingsTabs = [
    { id: 'general' as const, label: 'General', icon: 'building', color: 'blue' },
    { id: 'ranks' as const, label: 'Rank Structure', icon: 'ranking-star', color: 'purple' },
    { id: 'permissions' as const, label: 'Permissions', icon: 'shield-halved', color: 'green' }
  ]

  const getSettingsTabClasses = (isActive: boolean, color: string) => {
    if (isActive) {
      switch (color) {
        case 'blue': return 'bg-blue-500/20 border-blue-500 text-blue-400'
        case 'purple': return 'bg-purple-500/20 border-purple-500 text-purple-400'
        case 'green': return 'bg-green-500/20 border-green-500 text-green-400'
        default: return 'bg-blue-500/20 border-blue-500 text-blue-400'
      }
    }
    return 'bg-gray-800/30 border-gray-700/50 text-gray-400 hover:bg-gray-700/40 hover:border-gray-600'
  }

  return (
    <>
      {/* Sub-navigation - More Compact */}
      <div className="flex gap-2">
        {settingsTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSettingsTab(tab.id)}
            className={`
              px-3 py-2 rounded-lg border-2 font-semibold text-xs
              transition-all duration-200 flex items-center gap-1.5
              ${getSettingsTabClasses(settingsTab === tab.id, tab.color)}
            `}
          >
            <i className={`fa-solid fa-${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings - Department Configuration - More Compact */}
      {settingsTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Column - Department Info */}
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <i className="fa-solid fa-building text-blue-400 text-xs" />
                </div>
                Department Identity
              </h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      <i className="fa-solid fa-signature mr-1" />
                      Department Name
                    </label>
                    <Input
                      value={deptConfig.name}
                      onChange={(e) => setDeptConfig({ ...deptConfig, name: e.target.value })}
                      placeholder="Los Santos Police Department"
                      className="text-sm h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      <i className="fa-solid fa-tag mr-1" />
                      Abbreviation
                    </label>
                    <Input
                      value={deptConfig.abbreviation}
                      onChange={(e) => setDeptConfig({ ...deptConfig, abbreviation: e.target.value })}
                      placeholder="LSPD"
                      maxLength={6}
                      className="text-sm h-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    <i className="fa-solid fa-align-left mr-1" />
                    Department Subtext
                  </label>
                  <Input
                    value={deptSubtext}
                    onChange={(e) => setDeptSubtext(e.target.value)}
                    placeholder="Serving the community with honor and integrity"
                    className="text-sm h-9"
                  />
                  <p className="text-xs text-gray-500 mt-1">Appears below department name</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    <i className="fa-solid fa-quote-left mr-1" />
                    Department Motto
                  </label>
                  <Input
                    value={deptConfig.motto}
                    onChange={(e) => setDeptConfig({ ...deptConfig, motto: e.target.value })}
                    placeholder="To Protect and Serve"
                    className="text-sm h-9"
                  />
                  <p className="text-xs text-gray-500 mt-1">Official department motto</p>
                </div>
              </div>
            </Card>

            <Card>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <i className="fa-solid fa-palette text-purple-400 text-xs" />
                </div>
                Color Scheme & Branding
              </h4>
              
              {/* Color Presets */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-400 mb-2">Color Presets</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        if (preset.name !== 'Custom') {
                          setDeptConfig({
                            ...deptConfig,
                            themeColor: preset.primary,
                            secondaryColor: preset.secondary
                          })
                          setAccentColor(preset.accent)
                          setButtonHighlight(preset.button)
                          setIconColor(preset.icon)
                          setBorderColor(preset.border)
                        }
                      }}
                      className={`p-2 rounded-lg border transition-all ${
                        deptConfig.themeColor === preset.primary && deptConfig.secondaryColor === preset.secondary
                          ? 'border-blue-400 bg-blue-500/20'
                          : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                      }`}
                      title={preset.name}
                    >
                      <div className="flex gap-1 mb-1.5">
                        <div className="flex-1 h-4 rounded" style={{ background: preset.primary }} />
                        <div className="flex-1 h-4 rounded" style={{ background: preset.secondary }} />
                      </div>
                      <p className="text-[0.65rem] text-gray-400 truncate">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={deptConfig.themeColor}
                      onChange={(e) => setDeptConfig({ ...deptConfig, themeColor: e.target.value })}
                      className="w-10 h-9 rounded-lg cursor-pointer border-2 border-gray-700"
                    />
                    <Input
                      value={deptConfig.themeColor}
                      onChange={(e) => setDeptConfig({ ...deptConfig, themeColor: e.target.value })}
                      className="flex-1 text-sm h-9"
                      placeholder="#3b82f6"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Main header & gradient color</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={deptConfig.secondaryColor}
                      onChange={(e) => setDeptConfig({ ...deptConfig, secondaryColor: e.target.value })}
                      className="w-10 h-9 rounded-lg cursor-pointer border-2 border-gray-700"
                    />
                    <Input
                      value={deptConfig.secondaryColor}
                      onChange={(e) => setDeptConfig({ ...deptConfig, secondaryColor: e.target.value })}
                      className="flex-1 text-sm h-9"
                      placeholder="#1e40af"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Supporting gradient color</p>
                </div>
              </div>

              {/* Additional Color Customization */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Accent Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-9 rounded-lg cursor-pointer border-2 border-gray-700"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 text-sm h-9"
                      placeholder="#38bdf8"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Cards & general accents</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Button Highlight</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={buttonHighlight}
                      onChange={(e) => setButtonHighlight(e.target.value)}
                      className="w-10 h-9 rounded-lg cursor-pointer border-2 border-gray-700"
                    />
                    <Input
                      value={buttonHighlight}
                      onChange={(e) => setButtonHighlight(e.target.value)}
                      className="flex-1 text-sm h-9"
                      placeholder="#38bdf8"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Hover & active button color</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Icon Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={iconColor}
                      onChange={(e) => setIconColor(e.target.value)}
                      className="w-10 h-9 rounded-lg cursor-pointer border-2 border-gray-700"
                    />
                    <Input
                      value={iconColor}
                      onChange={(e) => setIconColor(e.target.value)}
                      className="flex-1 text-sm h-9"
                      placeholder="#38bdf8"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Active icon & indicator color</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Border Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="w-10 h-9 rounded-lg cursor-pointer border-2 border-gray-700"
                    />
                    <Input
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="flex-1 text-sm h-9"
                      placeholder="#2448b0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Active borders & outlines</p>
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-400 mb-2">Department Logo</label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setLogoType('icon')}
                    className={`flex-1 p-2 rounded-lg border transition-all text-xs ${
                      logoType === 'icon'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <i className="fa-solid fa-icons mr-1" />
                    Icon
                  </button>
                  <button
                    onClick={() => setLogoType('image')}
                    className={`flex-1 p-2 rounded-lg border transition-all text-xs ${
                      logoType === 'image'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <i className="fa-solid fa-image mr-1" />
                    Custom
                  </button>
                </div>

                {logoType === 'icon' ? (
                  <Input
                    value={logoIcon}
                    onChange={(e) => setLogoIcon(e.target.value)}
                    placeholder="fa-shield-halved"
                    className="text-sm h-9"
                  />
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {logoImage ? (
                      <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg border border-gray-700">
                        <img src={logoImage} alt="Logo" className="w-8 h-8 object-contain rounded" />
                        <span className="text-xs text-gray-400 flex-1">Custom logo uploaded</span>
                        <button
                          onClick={() => {
                            setLogoImage(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-3 rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/30 hover:border-blue-500 transition-all text-xs text-gray-400"
                      >
                        <i className="fa-solid fa-upload mr-2" />
                        Upload Logo (PNG/JPG, max 2MB)
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Color Preview */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-700">
                <p className="text-xs text-gray-400 mb-2 font-semibold">Color Preview</p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="h-10 rounded-lg border-2" style={{ background: deptConfig.themeColor, borderColor: deptConfig.themeColor }} />
                  <div className="h-10 rounded-lg border-2" style={{ background: deptConfig.secondaryColor, borderColor: deptConfig.secondaryColor }} />
                  <div className="h-10 rounded-lg border-2" style={{ background: `linear-gradient(135deg, ${deptConfig.themeColor}, ${deptConfig.secondaryColor})`, borderColor: deptConfig.themeColor }} />
                  <div className="h-10 rounded-lg border-2 flex items-center justify-center" style={{ background: `${deptConfig.themeColor}20`, borderColor: deptConfig.themeColor }}>
                    {logoType === 'image' && logoImage ? (
                      <img src={logoImage} alt="Logo" className="w-6 h-6 object-contain" />
                    ) : (
                      <i className={`fa-solid ${logoIcon} text-white`} />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Preview & Actions */}
          <div className="space-y-3">
            <Card>
              <h4 className="text-xs font-semibold text-gray-400 mb-2">Live Preview</h4>
              <div 
                className="relative rounded-lg p-4 border-2 overflow-hidden"
                style={{ 
                  borderColor: deptConfig.themeColor,
                  background: `linear-gradient(135deg, ${deptConfig.themeColor}15, ${deptConfig.secondaryColor}10)`
                }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ background: deptConfig.themeColor }} />
                <div className="relative flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden border-2"
                    style={{ 
                      background: `linear-gradient(135deg, ${deptConfig.themeColor}, ${deptConfig.secondaryColor})`,
                      borderColor: deptConfig.themeColor
                    }}
                  >
                    {logoType === 'image' && logoImage ? (
                      <img src={logoImage} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <i className={`fa-solid ${logoIcon} text-white text-xl`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-gray-400 mb-0.5">{deptConfig.abbreviation}</div>
                    <div className="text-base font-bold text-white mb-0.5">{deptConfig.name}</div>
                    <div className="text-xs text-gray-400 mb-1">{deptSubtext}</div>
                    <div className="text-xs italic" style={{ color: deptConfig.themeColor }}>"{deptConfig.motto}"</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="space-y-2">
                <Button 
                  variant="primary" 
                  className="w-full text-xs py-2" 
                  icon={<i className="fa-solid fa-save text-xs" />}
                  onClick={handleSaveSettings}
                >
                  Save Changes
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full text-xs py-2" 
                  icon={<i className="fa-solid fa-rotate-left text-xs" />}
                  onClick={handleResetSettings}
                >
                  Reset to Default
                </Button>
                <Button variant="secondary" className="w-full text-xs py-2" icon={<i className="fa-solid fa-file-export text-xs" />}>
                  Export Config
                </Button>
              </div>
            </Card>

            <Card>
              <h4 className="text-xs font-semibold text-gray-400 mb-2">
                <i className="fa-solid fa-circle-info mr-1.5" />
                Information
              </h4>
              <div className="space-y-1.5 text-xs text-gray-400">
                <p>• Changes take effect immediately for all officers</p>
                <p>• Color scheme applies to badges, alerts, and UI elements</p>
                <p>• Motto appears in login screen and reports</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Ranks Settings - More Compact */}
      {settingsTab === 'ranks' && (
        <Card>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <i className="fa-solid fa-ranking-star text-purple-400 text-xs" />
            </div>
            Rank Structure
          </h4>
          <div className="space-y-1.5">
            {ranks.map((rank) => (
              <div key={rank.id} className="bg-gray-800/30 rounded-lg p-2.5 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Badge variant="info" className="text-xs">LV{rank.id}</Badge>
                  <div>
                    <div className="font-semibold text-white text-sm">{rank.name}</div>
                    <div className="text-xs text-gray-400">${rank.pay.toLocaleString()}/hr</div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="secondary" size="sm" className="h-7 w-7 p-0">
                    <i className="fa-solid fa-pen text-xs" />
                  </Button>
                  <Button variant="danger" size="sm" className="h-7 w-7 p-0">
                    <i className="fa-solid fa-trash text-xs" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="primary" className="mt-3 text-xs py-2" icon={<i className="fa-solid fa-plus text-xs" />}>
            Add Rank
          </Button>
        </Card>
      )}

      {/* Permissions Settings - More Compact */}
      {settingsTab === 'permissions' && (
        <Card>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
              <i className="fa-solid fa-shield-halved text-green-400 text-xs" />
            </div>
            Permission System
          </h4>
            <div className="text-xs text-gray-400 mb-3">
              Set the minimum grade level required for each permission. Supervisors (grade 4+) typically have access to most features.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {['Create Reports', 'Edit Reports', 'Delete Reports', 'Create Profiles', 'Edit Profiles', 'Manage BOLOs', 'Manage Warrants', 'Access Evidence', 'Chief Menu Access'].map((perm, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-800/30 rounded-lg">
                  <span className="text-xs text-white">{perm}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Grade:</span>
                    <input
                      type="number"
                      min="0"
                      max="9"
                      defaultValue={idx < 3 ? 1 : idx < 6 ? 3 : 4}
                      className="w-14 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="primary" className="mt-3 text-xs py-2" icon={<i className="fa-solid fa-save text-xs" />}>
              Save Permissions
            </Button>
        </Card>
      )}
    </>
  )
}

// About Tab Component
function AboutTab() {
  return (
    <div className="space-y-6">
      {/* System Information */}
      <Card title="System Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-gray-800/30 rounded-lg">
            <p className="text-xs text-gray-400 uppercase mb-1">Version</p>
            <p className="text-sm text-white font-medium">PS-MDT v2.0.0</p>
          </div>
          <div className="p-3 bg-gray-800/30 rounded-lg">
            <p className="text-xs text-gray-400 uppercase mb-1">Last Updated</p>
            <p className="text-sm text-white font-medium">January 15, 2025</p>
          </div>
          <div className="p-3 bg-gray-800/30 rounded-lg">
            <p className="text-xs text-gray-400 uppercase mb-1">Department</p>
            <p className="text-sm text-white font-medium">Los Santos Police Department</p>
          </div>
          <div className="p-3 bg-gray-800/30 rounded-lg">
            <p className="text-xs text-gray-400 uppercase mb-1">Server</p>
            <p className="text-sm text-white font-medium">NightDriveRP</p>
          </div>
          <div className="p-3 bg-gray-800/30 rounded-lg">
            <p className="text-xs text-gray-400 uppercase mb-1">Framework</p>
            <p className="text-sm text-white font-medium">QBX Core</p>
          </div>
          <div className="p-3 bg-gray-800/30 rounded-lg">
            <p className="text-xs text-gray-400 uppercase mb-1">Resource Name</p>
            <p className="text-sm text-white font-medium">ps-mdt</p>
          </div>
        </div>
      </Card>

      {/* About MDT */}
      <Card title="About">
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-900/20 border-2 border-blue-500/50 flex items-center justify-center">
            <i className="fa-solid fa-shield-halved text-4xl text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Project Sloth MDT</h3>
          <p className="text-sm text-gray-400 mb-6">
            Modern Mobile Data Terminal System
          </p>
          <div className="flex justify-center gap-4 text-xs text-gray-500 mb-6">
            <span className="flex items-center gap-2">
              <i className="fa-brands fa-react text-blue-400" />
              React 18
            </span>
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-code text-blue-400" />
              TypeScript
            </span>
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-wind text-cyan-400" />
              Tailwind CSS
            </span>
          </div>
          <div className="border-t border-gray-700 pt-6 mt-6">
            <p className="text-xs text-gray-500 mb-4">
              Designed for law enforcement roleplay servers
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="secondary" size="sm">
                <i className="fa-brands fa-github mr-2" />
                Documentation
              </Button>
              <Button variant="secondary" size="sm">
                <i className="fa-solid fa-heart mr-2" />
                Support
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Administrative Actions */}
      <Card title="Administrative Actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="secondary" className="w-full justify-start">
            <i className="fa-solid fa-download mr-2" />
            Export System Data
          </Button>
          <Button variant="secondary" className="w-full justify-start">
            <i className="fa-solid fa-database mr-2" />
            Backup Database
          </Button>
          <Button variant="secondary" className="w-full justify-start">
            <i className="fa-solid fa-chart-line mr-2" />
            View Analytics
          </Button>
          <Button variant="secondary" className="w-full justify-start">
            <i className="fa-solid fa-file-contract mr-2" />
            Generate Reports
          </Button>
          <Button variant="secondary" className="w-full justify-start">
            <i className="fa-solid fa-clock-rotate-left mr-2" />
            Audit Logs
          </Button>
          <Button variant="secondary" className="w-full justify-start">
            <i className="fa-solid fa-server mr-2" />
            System Health
          </Button>
        </div>
      </Card>

      {/* License & Credits */}
      <Card title="License & Credits">
        <div className="space-y-4 text-sm text-gray-400">
          <div>
            <p className="font-semibold text-white mb-2">Development Team</p>
            <p>Project Sloth • NightDrive RP Development Team</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Special Thanks</p>
            <p>Community contributors, beta testers, and all server administrators who provided feedback during development.</p>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-500">
              © 2025 Project Sloth MDT. All rights reserved.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ChiefMenu
