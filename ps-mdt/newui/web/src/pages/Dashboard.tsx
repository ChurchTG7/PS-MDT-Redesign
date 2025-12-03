import React, { useEffect } from 'react'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { useFetchNui, useRealtimeUpdate, useAutoRefresh, useNuiListener } from '../utils/hooks'
import { useAppStore } from '../store/useAppStore'
import type { DashboardStats, ActivityLogEntry, ActiveWarrant } from '../types/api'

type PageType = 'dashboard' | 'incidents' | 'bolos' | 'profile' | 'penalcode' | 'dmv' | 'map' | 'settings' | 'evidence' | 'chief'

interface DashboardPageProps {
  onNavigate: (page: PageType) => void
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const setNavigationContext = useAppStore((s) => s.setNavigationContext)
  
  // Handle warrant click - navigate to profile page with citizenid
  const handleWarrantClick = (warrant: ActiveWarrant) => {
    setNavigationContext({
      profileSearch: warrant.citizenid
    })
    onNavigate('profile')
  }
  
  // Fetch dashboard stats from server
  const {
    data: stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useFetchNui<DashboardStats>('getDashboardStats', {
    activeUnits: 0,
    activeWarrants: 0,
    activeCalls: 0,
    openReports: 0,
    recentIncidents: 0,
    openCases: 0,
    onDutyOfficers: 0,
    criticalBolos: 0,
  })

  // Fetch recent activity
  const {
    data: recentActivity,
    loading: activityLoading,
    refetch: refetchActivity,
  } = useFetchNui<ActivityLogEntry[]>('getRecentActivity', [])

  // Fetch active warrants
  const {
    data: activeWarrants,
    loading: warrantsLoading,
    refetch: refetchWarrants,
  } = useFetchNui<ActiveWarrant[]>('getActiveWarrants', [])

  // Listen for real-time updates
  useRealtimeUpdate('reportCreated', () => {
    refetchStats()
    refetchActivity()
  })

  useRealtimeUpdate('incidentCreated', () => {
    refetchStats()
    refetchActivity()
  })

  useRealtimeUpdate('boloCreated', () => {
    refetchStats()
    refetchActivity()
  })

  useRealtimeUpdate('warrantIssued', () => {
    refetchStats()
    refetchWarrants()
    refetchActivity()
  })

  useRealtimeUpdate('newActivity', (data: ActivityLogEntry) => {
    refetchActivity()
  })

  // Auto-refresh dashboard every 30 seconds
  useAutoRefresh(() => {
    refetchStats()
    refetchActivity()
    refetchWarrants()
  }, 30000, true)

  // Listen for normalized dashboard pushes and refetch relevant data
  useNuiListener('warrants', () => {
    refetchWarrants()
  })

  useNuiListener('reports', () => {
    refetchStats()
    refetchActivity()
  })

  useNuiListener('calls', () => {
    refetchStats()
    refetchActivity()
  })

  useNuiListener('bulletin', () => {
    refetchActivity()
  })

  useNuiListener('newBulletin', () => {
    refetchActivity()
  })

  useNuiListener('deleteBulletin', () => {
    refetchActivity()
  })

  // Format time ago helper
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Units"
          value={stats?.activeUnits || 0}
          icon={<i className="fa-solid fa-user-police" />}
          color="blue"
          trend={{ value: `${stats?.onDutyOfficers || 0} on duty`, isPositive: true }}
        />
        <StatCard
          title="Active Warrants"
          value={stats?.activeWarrants || 0}
          icon={<i className="fa-solid fa-gavel" />}
          color="red"
          trend={{ value: 'High priority', isPositive: false }}
        />
        <StatCard
          title="Recent Incidents"
          value={stats?.recentIncidents || 0}
          icon={<i className="fa-solid fa-siren-on" />}
          color="yellow"
        />
        <StatCard
          title="Open Cases"
          value={stats?.openCases || 0}
          icon={<i className="fa-solid fa-folder-open" />}
          color="green"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Warrants */}
        <Card
          title="Active Warrants"
          subtitle="High priority suspects"
          headerAction={
            <Button size="sm" variant="ghost">
              View All <i className="fa-solid fa-arrow-right text-xs" />
            </Button>
          }
        >
          {warrantsLoading ? (
            <div className="flex items-center justify-center py-8 text-[rgba(255,255,255,0.5)]">
              <i className="fa-solid fa-spinner fa-spin mr-2" />
              Loading warrants...
            </div>
          ) : activeWarrants && activeWarrants.length > 0 ? (
            <div className="space-y-3">
              {activeWarrants.slice(0, 5).map((warrant) => (
                <div
                  key={warrant.id}
                  onClick={() => handleWarrantClick(warrant)}
                  className="flex items-start justify-between p-3 bg-[rgba(11,19,34,0.4)] rounded-lg border border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.5)] hover:bg-[rgba(11,19,34,0.6)] transition-all cursor-pointer group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white group-hover:text-[rgba(56,189,248,1)] transition-colors">{warrant.name}</span>
                      <Badge variant={warrant.priority === 'high' ? 'danger' : 'warning'}>
                        {warrant.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-[rgba(255,255,255,0.6)] mb-1">
                      {warrant.charges}
                    </p>
                    <p className="text-xs text-[rgba(255,255,255,0.4)]">
                      <i className="fa-solid fa-clock mr-1" />
                      {warrant.lastSeen
                        ? `Last seen: ${formatTimeAgo(warrant.lastSeen)}`
                        : `Issued: ${formatTimeAgo(warrant.issueDate)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-[rgba(56,189,248,0.7)] group-hover:text-[rgba(56,189,248,1)] transition-colors">
                      View Profile
                    </div>
                    <i className="fa-solid fa-arrow-right text-[rgba(56,189,248,0.7)] group-hover:text-[rgba(56,189,248,1)] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-[rgba(255,255,255,0.5)]">
              <i className="fa-solid fa-inbox text-3xl mb-2" />
              <p>No active warrants</p>
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity" subtitle="Latest system updates">
          {activityLoading ? (
            <div className="flex items-center justify-center py-8 text-[rgba(255,255,255,0.5)]">
              <i className="fa-solid fa-spinner fa-spin mr-2" />
              Loading activity...
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.slice(0, 6).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[rgba(11,19,34,0.3)] transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-[rgba(56,189,248,0.15)] flex items-center justify-center flex-shrink-0">
                    <i
                      className={`fa-solid ${
                        activity.actionType === 'report'
                          ? 'fa-file-lines'
                          : activity.actionType === 'bolo'
                          ? 'fa-bell'
                          : activity.actionType === 'incident'
                          ? 'fa-siren'
                          : activity.actionType === 'warrant'
                          ? 'fa-gavel'
                          : activity.actionType === 'evidence'
                          ? 'fa-box'
                          : 'fa-circle-info'
                      } text-xs text-[#38BDF8]`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{activity.officerName}</p>
                    <p className="text-xs text-[rgba(255,255,255,0.6)] truncate">
                      {activity.action}
                    </p>
                    <p className="text-xs text-[rgba(255,255,255,0.4)] mt-0.5">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-[rgba(255,255,255,0.5)]">
              <i className="fa-solid fa-inbox text-3xl mb-2" />
              <p>No recent activity</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}