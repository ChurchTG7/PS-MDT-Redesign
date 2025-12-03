import type { NuiApiResponse } from '../types/api'
import * as mockData from './mockData'

// NUI Message Types - Messages sent FROM Lua TO React
export type NuiMessageType =
  | 'setVisible'
  | 'preload'
  | 'setData'
  | 'updateData'
  | 'notify'
  | 'setOfficer'
  | 'setDebugMode'
  | 'updateOfficers'
  | 'updateReports'
  | 'updateIncidents'
  | 'updateBolos'
  | 'updateWarrants'
  | 'updateEvidence'
  | 'refreshData'
  | 'realtimeUpdate'
  | 'refreshCurrentPage'
  | 'forceRefresh'
  | 'showMaintenance'
  // Normalized from legacy { type, payload }
  | 'dashboardConfig'
  | 'deptChatMessage'
  | 'deptChatHistory'
  | 'deptChatRejected'
  | 'dispatchChatMessage'
  | 'dispatchChatHistory'
  | 'dmChatMessage'
  | 'dmChatHistory'
  | 'bulletin'
  | 'warrants'
  | 'reports'
  | 'calls'
  | 'newBulletin'
  | 'deleteBulletin'
  | 'profileData'
  | 'incidents'
  | 'incidentData'
  | 'incidentSearchPerson'
  | 'call'
  | 'themeUpdate'
  | 'unitLocations'

export interface NuiMessage<T = unknown> {
  action: NuiMessageType
  data: T
}

// Debug toggle (persisted to localStorage)
const DEBUG_KEY = 'ps-mdt:debug'
let debugEnabled = false

function readDebugFlag(): boolean {
  try {
    const v = localStorage.getItem(DEBUG_KEY)
    return v === '1' || v === 'true'
  } catch {
    return false
  }
}

function writeDebugFlag(v: boolean) {
  try {
    localStorage.setItem(DEBUG_KEY, v ? '1' : '0')
  } catch {}
}

export function setDebugEnabled(v: boolean) {
  debugEnabled = !!v
  writeDebugFlag(debugEnabled)
  // eslint-disable-next-line no-console
  console.info(`[ps-mdt] Debug ${debugEnabled ? 'ENABLED' : 'DISABLED'}`)
}

export function toggleDebug(): boolean {
  setDebugEnabled(!debugEnabled)
  return debugEnabled
}

export function isDebugEnabled(): boolean {
  // Always read from localStorage to ensure we have the current value
  debugEnabled = readDebugFlag()
  return debugEnabled
}

// Initialize from localStorage and expose helpers on window for quick toggling in console
debugEnabled = readDebugFlag()
;(window as any).psMdtDebug = {
  enable: () => setDebugEnabled(true),
  disable: () => setDebugEnabled(false),
  toggle: () => toggleDebug(),
  get: () => isDebugEnabled(),
}

// Convenience global helper so main.tsx and other error handlers can report easily
;(window as any).psReportClientError = async (payload: any) => {
  try {
    await reportClientError({ message: payload?.message || String(payload), stack: payload?.stack, extra: payload?.extra })
  } catch (err) {
    // no-op
  }
}

// Callback Types - Messages sent FROM React TO Lua (NUI Handlers)
export type NuiCallbackType =
  // Core
  | 'close'
  // Dashboard
  | 'getDashboardStats'
  | 'getRecentActivity'
  | 'getActiveWarrants'
  // Reports
  | 'getReports'
  | 'getReport'
  | 'createReport'
  | 'updateReport'
  | 'deleteReport'
  | 'searchReports'
  // Incidents
  | 'getIncidents'
  | 'getIncident'
  | 'createIncident'
  | 'updateIncident'
  // BOLOs
  | 'getBolos'
  | 'getBolo'
  | 'createBolo'
  | 'updateBolo'
  | 'cancelBolo'
  // Profiles
  | 'getPersonProfile'
  | 'getVehicleProfile'
  | 'searchPerson'
  | 'searchVehicle'
  | 'updateProfile'
  | 'addProfileNote'
  | 'updateProfileNote'
  | 'deleteProfileNote'
  | 'getMugshot'
  | 'addCharge'
  | 'getCharges'
  | 'updateCharge'
  | 'deleteCharge'
  | 'getAvailableVehicles'
  | 'linkVehicleToProfile'
  // Evidence
  | 'getEvidenceByCaseNumber'
  | 'createEvidence'
  | 'updateEvidenceStatus'
  | 'transferEvidence'
  | 'linkEvidenceToCase'
  // Warrants
  | 'createWarrant'
  | 'getActiveWarrants'
  | 'serveWarrant'
  // DMV
  | 'getAllLicenses'
  | 'issueLicense'
  | 'addLicensePoints'
  | 'getAllVehicleRegistrations'
  | 'searchVehicleRegistration'
  | 'updateVehicleRegistration'
  // Penal Codes
  | 'getPenalCodes'
  | 'searchPenalCodes'
  | 'createPenalCode'
  | 'updatePenalCode'
  | 'deletePenalCode'
  // Settings
  | 'getSettings'
  | 'updateSettings'
  | 'updateOfficerProfile'
  | 'notifyDebugMode'
  // Department Chat
  | 'getDepartmentChat'
  | 'sendDepartmentChat'
  | 'getDispatchChat'
  | 'sendDispatchChat'
  | 'getDMChat'
  | 'sendDMChat'
  | 'getOnlineOfficers'
  // Chief Menu
  | 'getDepartmentStats'
  | 'getOfficerRoster'
  | 'updateOfficer'
  | 'getApplications'
  | 'approveApplication'
  | 'rejectApplication'
  | 'getDisciplineRecords'
  | 'createDisciplineRecord'
  | 'ps-mdt:chief:canAccess'
  | 'ps-mdt:chief:getClockAudit'
  // Chief Actions
  | 'sendDepartmentAnnouncement'
  | 'sendEmergencyAlert'
  | 'sendAllUnitsRecall'
  | 'generateAuditReport'
  | 'callStaffMeeting'
  | 'issueCommendation'
  // Dispatch/Map
  | 'setWaypoint'
  | 'sendDispatch'
  | 'getDispatchCalls'
  | 'updateDispatchCall'
  | 'getUnitLocations'
  | 'getActiveUnits'
    // Admin / Debug
  | 'getClientErrors'
  // Cameras
  | 'getCameras'
  | 'getCamerasByLocation'
  | 'accessCamera'
  | 'disableCamera'
  | 'getCameraStatus'
  | 'viewCameraFeed' // Open 3D camera view in-game
  | 'closeCameraFeed' // Close 3D camera view
  | 'reportClientError'
  // Legacy (backwards compatibility)
  | 'ps-mdt:evidence:forensic'
  | 'ps-mdt:evidence:searchBallistics'
  | 'ps-mdt:evidence:searchFingerprints'
  | 'ps-mdt:evidence:updateStatus'
  | 'ps-mdt:profile:searchPerson'
  | 'ps-mdt:profile:getMugshot'

export interface NuiCallbackPayload {
  [key: string]: unknown
}

// Specific Data Types
export interface OfficerData {
  citizenid: string
  firstname: string
  lastname: string
  callsign: string
  rank: string
  department: string
  badgeNumber: string
  phone: string
  image?: string
  bio?: string
  preferredName?: string
  email?: string
}

export interface ReportData {
  id: string
  title: string
  date: string
  officer: string
  status: 'pending' | 'active' | 'closed'
  description: string
  suspects?: string[]
  charges?: string[]
  evidence?: string[]
}

export interface IncidentData {
  id: string
  title: string
  date: string
  officer: string
  location: string
  code: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'resolved' | 'closed'
  description: string
  units?: string[]
}

export interface BoloData {
  id: string
  type: 'person' | 'vehicle'
  title: string
  description: string
  issuedBy: string
  date: string
  lastSeen?: string
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'expired' | 'cancelled'
  details: {
    name?: string
    plate?: string
    model?: string
    color?: string
    distinguishingFeatures?: string
  }
}

export interface ProfileData {
  citizenid: string
  firstname: string
  lastname: string
  dob: string
  gender: string
  nationality: string
  phone: string
  image?: string
  fingerprint?: string
  licenses: {
    driver?: boolean
    weapon?: boolean
    business?: boolean
  }
  charges: Array<{
    charge: string
    date: string
    officer: string
    fine: number
    sentence: number
  }>
  vehicles: Array<{
    plate: string
    model: string
    color: string
    status: string
  }>
  notes?: string
  flags?: string[]
}

export interface EvidenceData {
  id: string
  type: string
  description: string
  location: string
  officer: string
  date: string
  associatedCase?: string
  images?: string[]
  chain: Array<{
    officer: string
    date: string
    action: string
  }>
}

/**
 * Helper function to return appropriate mock data based on action
 */
function getMockDataForAction(action: NuiCallbackType, payload: NuiCallbackPayload | undefined, mockData: any): NuiApiResponse<any> {
  // Map actions to mock data
  switch (action) {
    // Core
    case 'close':
      return { success: true, data: null }
    
    // Dashboard
    case 'getDashboardStats':
      return { success: true, data: mockData.mockDashboardStats }
    case 'getRecentActivity':
      // Format mock activity data to match ActivityLogEntry type
      return { 
        success: true, 
        data: mockData.mockRecentActivity.map((activity: any) => ({
          id: activity.id,
          officerName: activity.officerName,
          action: activity.action,
          actionType: activity.actionType,
          timestamp: activity.timestamp,
          details: activity.details,
        }))
      }
    case 'getActiveWarrants':
      // Format mock warrants to match ActiveWarrant type
      return { 
        success: true, 
        data: mockData.mockActiveWarrants.map((warrant: any) => ({
          id: warrant.id,
          citizenid: warrant.citizenid,
          name: warrant.name,
          charges: warrant.charges,
          priority: warrant.priority,
          issueDate: warrant.issueDate,
          issuedBy: warrant.issuedBy,
          lastSeen: warrant.lastSeen,
          status: warrant.status,
        }))
      }
    
    // Reports
    case 'getReports':
      return { success: true, data: mockData.mockIncidents.filter((i: any) => i.type === 'report') }
    case 'getReport':
      // Find specific report by ID from consolidated mockIncidents
      const report = mockData.mockIncidents.find((r: any) => r.id === payload?.reportId && r.type === 'report')
      return { success: true, data: report || mockData.mockIncidents.filter((i: any) => i.type === 'report')[0] }
    case 'createReport':
      return { success: true, data: { id: 'R-NEW', type: 'report', ...payload } }
    case 'updateReport':
      return { success: true, data: { ...payload } }
    case 'deleteReport':
      return { success: true, data: null }
    case 'searchReports':
      return { success: true, data: mockData.mockIncidents.filter((i: any) => i.type === 'report') }
    
    // Incidents
    case 'getIncidents':
      return { success: true, data: mockData.mockIncidents }
    case 'getIncident':
      const incident = mockData.mockIncidents.find((i: any) => i.id === payload?.incidentId)
      return { success: true, data: incident || mockData.mockIncidents[0] }
    case 'createIncident':
      return { success: true, data: { id: 'I-NEW', type: 'incident', ...payload } }
    case 'updateIncident':
      return { success: true, data: { ...payload } }
    
    // BOLOs
    case 'getBolos':
      return { success: true, data: mockData.mockBolos }
    case 'getBolo':
      const bolo = mockData.mockBolos.find((b: any) => b.id === payload?.boloId)
      return { success: true, data: bolo || mockData.mockBolos[0] }
    case 'createBolo':
      return { success: true, data: { id: 'B-NEW', ...payload } }
    case 'updateBolo':
      return { success: true, data: { ...payload } }
    case 'cancelBolo':
      return { success: true, data: null }
    
    // Profiles
    case 'getPersonProfile':
    case 'ps-mdt:profile:searchPerson':
    case 'searchPerson':
      const searchTerm = (payload?.search as string)?.toLowerCase() || ''
      const profile = mockData.mockProfiles.find((p: any) => 
        p.citizenid === payload?.citizenid ||
        p.firstname?.toLowerCase().includes(searchTerm) ||
        p.lastname?.toLowerCase().includes(searchTerm)
      )
      return { success: true, data: profile || mockData.mockProfiles[0] }
    case 'getVehicleProfile':
    case 'searchVehicle':
      const vehicle = mockData.mockVehicleRegistrations.find((v: any) => v.plate === payload?.plate)
      return { success: true, data: vehicle || mockData.mockVehicleRegistrations[0] }
    case 'updateProfile':
      return { success: true, data: { ...payload } }
    case 'addProfileNote':
    case 'updateProfileNote':
    case 'deleteProfileNote':
      return { success: true, data: null }
    case 'getMugshot':
    case 'ps-mdt:profile:getMugshot':
      return { success: true, data: { image: 'https://i.pravatar.cc/300?img=' + Math.floor(Math.random() * 70) } }
    case 'addCharge':
    case 'getCharges':
    case 'updateCharge':
    case 'deleteCharge':
      return { success: true, data: mockData.mockProfiles[0].charges }
    
    // Evidence
    case 'getEvidenceByCaseNumber':
      return { success: true, data: mockData.mockEvidence }
    case 'createEvidence':
      return { success: true, data: { id: 'E-NEW', ...payload } }
    case 'updateEvidenceStatus':
    case 'transferEvidence':
    case 'linkEvidenceToCase':
    case 'ps-mdt:evidence:forensic':
    case 'ps-mdt:evidence:searchBallistics':
    case 'ps-mdt:evidence:searchFingerprints':
    case 'ps-mdt:evidence:updateStatus':
      return { success: true, data: null }
    
    // Warrants
    case 'createWarrant':
      return { success: true, data: { id: 'W-NEW', ...payload } }
    case 'serveWarrant':
      return { success: true, data: null }
    
    // DMV
    case 'getAllLicenses':
      return { success: true, data: mockData.mockLicenses }
    case 'issueLicense':
    case 'addLicensePoints':
      return { success: true, data: null }
    case 'getAllVehicleRegistrations':
      return { success: true, data: mockData.mockVehicleRegistrations }
    case 'searchVehicleRegistration':
      const reg = mockData.mockVehicleRegistrations.find((v: any) => v.plate.includes(payload?.search))
      return { success: true, data: reg ? [reg] : mockData.mockVehicleRegistrations }
    case 'updateVehicleRegistration':
      return { success: true, data: { ...payload } }
    
    // Penal Codes
    case 'getPenalCodes':
    case 'searchPenalCodes':
      return { success: true, data: mockData.mockPenalCodes }
    case 'createPenalCode':
      return { success: true, data: { id: 'PC-NEW', ...payload } }
    case 'updatePenalCode':
    case 'deletePenalCode':
      return { success: true, data: null }
    
    // Settings
    case 'getSettings':
      return { success: true, data: mockData.mockSettings }
    case 'updateSettings':
      return { success: true, data: { ...mockData.mockSettings, ...payload } }
    
    // Chief Menu
    case 'ps-mdt:chief:canAccess':
      return { success: true, data: { allowed: true } }
    case 'getDepartmentStats':
      return { success: true, data: mockData.mockDepartmentStats }
    case 'getOfficerRoster':
      return { success: true, data: mockData.mockOfficerRoster }
    case 'updateOfficer':
      return { success: true, data: { ...payload } }
    case 'getApplications':
      return { success: true, data: mockData.mockApplications }
    case 'approveApplication':
    case 'rejectApplication':
      return { success: true, data: null }
    case 'getDisciplineRecords':
      return { success: true, data: mockData.mockDisciplineRecords }
    case 'createDisciplineRecord':
      return { success: true, data: { id: 'D-NEW', ...payload } }
    case 'ps-mdt:chief:getClockAudit':
      return { success: true, data: mockData.mockClockAudit }
    case 'sendDepartmentAnnouncement':
    case 'sendEmergencyAlert':
    case 'sendAllUnitsRecall':
    case 'generateAuditReport':
    case 'callStaffMeeting':
    case 'issueCommendation':
      return { success: true, data: null }
    
    // Dispatch/Map
    case 'setWaypoint':
    case 'sendDispatch':
    case 'updateDispatchCall':
      return { success: true, data: null }
    case 'getDispatchCalls':
      return { success: true, data: [] }
    case 'getUnitLocations':
      return { success: true, data: mockData.mockUnitLocations }
    case 'getActiveUnits':
      return { success: true, data: mockData.mockUnitLocations }
    
    // Cameras
    case 'getCameras':
    case 'getCamerasByLocation':
      return { success: true, data: mockData.mockCameras }
    case 'accessCamera':
    case 'disableCamera':
      return { success: true, data: null }
    case 'getCameraStatus':
      return { success: true, data: { status: 'online' } }
    case 'viewCameraFeed':
    case 'closeCameraFeed':
      return { success: true, data: null }
    
    // Default fallback
    default:
      case 'getClientErrors': {
        const page = (payload as any)?.page || 1
        const perPage = (payload as any)?.perPage || 25
        const searchTerm = ((payload as any)?.search || '').toLowerCase()
        const allLogs = mockData.mockLogs || [
          { id: 1, text: 'Client error reported by John Doe: Test error', time: new Date().toISOString() },
          { id: 2, text: 'Client error reported by Jane Smith: Unexpected token', time: new Date().toISOString() },
        ]
        const filtered = allLogs.filter((r: any) => !searchTerm || r.text.toLowerCase().includes(searchTerm))
        const total = filtered.length
        const start = (page - 1) * perPage
        const rows = filtered.slice(start, start + perPage)
        return { success: true, data: { rows, total, page, perPage } }
      }
      if (action === 'reportClientError') {
        console.warn('[ps-mdt][mockData] reportClientError:', payload)
        return { success: true, data: null }
      }
      console.warn('[ps-mdt][mockData] No mock data handler for action:', action)
      return { success: true, data: null }
  }
}

  // convenience helper for reporting client errors via NUI
  export async function reportClientError(payload: { message: string; stack?: string; extra?: Record<string, unknown> }) {
    try {
      if (isEnvBrowser()) {
        // log locally when running in browser
        console.warn('[ps-mdt] reportClientError (browser): ', payload)
        return { success: true }
      }
      return await fetchNui('reportClientError', payload)
    } catch (err) {
      try { console.error('[ps-mdt] Error reporting client error:', err) } catch (e) {}
      return { success: false }
    }
  }

/**
 * Send a message to the Lua client (fetchNui - Main API Function)
 * @param action The callback action type
 * @param data The payload to send
 * @returns Promise with the response from Lua
 */
export async function fetchNui<T = unknown>(
  action: NuiCallbackType,
  data?: NuiCallbackPayload
): Promise<NuiApiResponse<T>> {
  // In browser/dev mode or debug mode, return mock data
  if (isEnvBrowser() || debugEnabled) {
    if (debugEnabled) {
      // eslint-disable-next-line no-console
      console.log('[ps-mdt][fetchNui][DEBUG] Returning mock data for:', action)
    }
    
    // Import mock data to return appropriate data based on action
    // Using static import to avoid code-splitting issues with Vite
    return new Promise((resolve) => {
      // Simulate network delay for realism
      setTimeout(() => {
        const mockResponse = getMockDataForAction(action, data, mockData)
        resolve(mockResponse as NuiApiResponse<T>)
      }, 100 + Math.random() * 200) // 100-300ms delay
    })
  }

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(data || {}),
  }

  try {
    const resourceName = (window as any).GetParentResourceName
      ? (window as any).GetParentResourceName()
      : 'ps-mdt'
    const start = performance.now()
    if (debugEnabled) {
      // eslint-disable-next-line no-console
      console.debug('[ps-mdt][fetchNui] →', action, { payload: data })
    }
    const response = await fetch(`https://${resourceName}/${action}`, options)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    if (debugEnabled) {
      const ms = Math.round(performance.now() - start)
      // eslint-disable-next-line no-console
      console.debug('[ps-mdt][fetchNui] ←', action, { success: (result as any)?.success, error: (result as any)?.error, ms })
    }
    return result
  } catch (error) {
    // Only log error when running inside the FiveM environment to avoid noisy browser logs
    if (!isEnvBrowser()) {
      // eslint-disable-next-line no-console
      console.error(`[ps-mdt] Error calling NUI handler (${action}):`, error)
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Listen for NUI messages from Lua
 * @param action The action type to listen for
 * @param handler The callback function to handle the message
 * @returns Cleanup function to remove the listener
 */
export function onNuiMessage<T = unknown>(
  action: NuiMessageType,
  handler: (data: T) => void
): () => void {
  const listener = (event: MessageEvent<NuiMessage<T>>) => {
    // Basic validation to ensure we have an object with an action
    if (!event || typeof event !== 'object' || !event.data || typeof event.data !== 'object') return
    const { action: messageAction, data } = event.data as NuiMessage<T>

    if (messageAction === action) {
      if (debugEnabled) {
        // eslint-disable-next-line no-console
        console.debug('[ps-mdt][NUI message]', action, data)
      }
      try {
        handler(data as T)
      } catch (err) {
        try {
          // eslint-disable-next-line no-console
          console.error('[ps-mdt] Error in NUI handler callback for', action, err)
        } catch (e) {}
      }
    }
  }

  window.addEventListener('message', listener)

  // Return cleanup function
  return () => {
    window.removeEventListener('message', listener)
  }
}

/**
 * Listen for any NUI message
 * @param handler The callback function to handle any message
 * @returns Cleanup function to remove the listener
 */
export function onAnyNuiMessage(
  handler: (message: NuiMessage) => void
): () => void {
  const listener = (event: MessageEvent<NuiMessage>) => {
    if (!event || typeof event !== 'object' || !event.data || typeof event.data !== 'object') return
    if (event.data && event.data.action) {
      try {
        handler(event.data)
      } catch (err) {
        // Swallow errors from handlers to avoid bubbling to window
        try { console.error('[ps-mdt] Error in onAnyNuiMessage handler', err) } catch (e) {}
      }
    }
  }

  window.addEventListener('message', listener)

  return () => {
    window.removeEventListener('message', listener)
  }
}

/**
 * Helper to check if running in game (NUI context) or if mock data mode is enabled
 */
export function isEnvBrowser(): boolean {
  return !(window as any).invokeNative
}

