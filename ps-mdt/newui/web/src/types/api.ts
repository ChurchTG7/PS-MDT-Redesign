/**
 * API Type Definitions for ps-mdt NUI Handlers
 * Maps to server-side handlers in /server/nui_handlers.lua
 */

// ============================================
// DASHBOARD API TYPES
// ============================================

export interface DashboardStats {
  activeUnits: number
  activeWarrants: number
  activeCalls: number
  openReports: number
  recentIncidents: number
  openCases: number
  onDutyOfficers: number
  criticalBolos: number
}

export interface ActivityLogEntry {
  id: number
  officerName: string
  action: string
  actionType: 'report' | 'incident' | 'bolo' | 'evidence' | 'warrant' | 'profile' | 'dispatch' | 'other'
  timestamp: string
  details?: string
}

export interface ActiveWarrant {
  id: number
  citizenid: string
  name: string
  charges: string
  priority: 'low' | 'medium' | 'high'
  issueDate: string
  issuedBy: string
  lastSeen?: string
  status: 'active' | 'served' | 'expired'
}

// ============================================
// REPORTS API TYPES
// ============================================

export interface Report {
  id: number
  caseNumber: string
  title: string
  reportType: string
  status: 'draft' | 'submitted' | 'reviewed' | 'closed'
  priority: 'low' | 'medium' | 'high'
  date: string
  createdBy: string
  officerName: string
  description: string
  location?: string
  suspects?: string[]
  witnesses?: string[]
  charges?: string[]
  evidence?: string[]
  notes?: string
  lastModified?: string
}

export interface CreateReportPayload {
  title: string
  reportType: string
  description: string
  location?: string
  suspects?: string[]
  witnesses?: string[]
  charges?: string[]
  evidence?: string[]
  priority?: 'low' | 'medium' | 'high'
}

export interface UpdateReportPayload {
  reportId: number
  title?: string
  description?: string
  status?: string
  priority?: string
  location?: string
  suspects?: string[]
  witnesses?: string[]
  charges?: string[]
  evidence?: string[]
  notes?: string
}

// ============================================
// INCIDENTS API TYPES
// ============================================

export interface Incident {
  id: number | string
  type?: 'incident' | 'report' // Discriminator field for consolidated incidents/reports
  title: string
  code: string
  location: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'resolved' | 'closed' | 'pending'
  date: string
  time?: string
  createdBy?: string
  officerName: string
  officerBadge?: string
  units?: string[]
  civilians?: string[]
  suspects?: string[]
  witnesses?: string[]
  charges?: string[]
  evidence?: string[]
  notes?: string
  caseNumber?: string
  // Report-specific fields
  reportType?: string
  outcome?: string | null
}

export interface CreateIncidentPayload {
  title: string
  code: string
  location: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  units?: string[]
  civilians?: string[]
}

export interface UpdateIncidentPayload {
  incidentId: number
  title?: string
  description?: string
  status?: string
  priority?: string
  location?: string
  units?: string[]
  civilians?: string[]
  evidence?: string[]
  notes?: string
}

// ============================================
// BOLO API TYPES
// ============================================

export interface Bolo {
  id: number
  type: 'person' | 'vehicle'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'expired' | 'cancelled' | 'resolved'
  issuedBy: string
  officerName: string
  date: string
  lastSeen?: string
  expiryDate?: string
  details: {
    // Person BOLO
    name?: string
    gender?: string
    height?: string
    weight?: string
    hairColor?: string
    eyeColor?: string
    distinguishingFeatures?: string
    // Vehicle BOLO
    plate?: string
    model?: string
    color?: string
    vehicleType?: string
  }
}

export interface CreateBoloPayload {
  type: 'person' | 'vehicle'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  details: Bolo['details']
  lastSeen?: string
  expiryDate?: string
}

export interface UpdateBoloPayload {
  boloId: number
  status?: 'active' | 'expired' | 'cancelled' | 'resolved'
  title?: string
  description?: string
  priority?: string
  details?: Bolo['details']
  lastSeen?: string
}

// ============================================
// PROFILE API TYPES
// ============================================

export interface PersonProfile {
  citizenid: string
  firstname: string
  lastname: string
  fullName: string
  dob: string
  gender: string
  nationality: string
  phone: string
  email?: string
  address?: string
  image?: string
  fingerprint?: string
  licenses: {
    driver?: boolean | string
    weapon?: boolean | string
    business?: boolean | string
    hunting?: boolean | string
    pilot?: boolean | string
  }
  flags: string[]
  vehicles: VehicleProfile[]
  properties: PropertyRecord[]
  notes: ProfileNote[]
  charges: ChargeRecord[]
  warrants: ActiveWarrant[]
}

export interface VehicleProfile {
  plate: string
  model: string
  brand?: string
  color: string
  class?: string
  owner: string
  citizenid: string
  status: 'registered' | 'stolen' | 'impounded' | 'scrapped'
  registrationDate?: string
  lastSeen?: string
  flags?: string[]
  notes?: string
}

export interface PropertyRecord {
  id: number
  address: string
  propertyType: string
  owner: string
  citizenid: string
  purchaseDate?: string
}

export interface ProfileNote {
  id: number
  citizenid: string
  note: string
  author: string
  authorName: string
  date: string
  isImportant?: boolean
}

export interface ChargeRecord {
  id: number
  citizenid: string
  charge: string
  chargeCode: string
  description?: string
  date: string
  officer: string
  officerName: string
  fine: number
  sentence: number
  category: string
  notes?: string
}

export interface UpdateProfilePayload {
  citizenid: string
  flags?: string[]
  notes?: string
}

export interface AddProfileNotePayload {
  citizenid: string
  note: string
  isImportant?: boolean
}

export interface AddChargePayload {
  citizenid: string
  chargeCode: string
  fine: number
  sentence: number
  notes?: string
}

// ============================================
// EVIDENCE API TYPES
// ============================================

export interface Evidence {
  id: number
  evidenceId: string
  type: string
  description: string
  location: string
  officer: string
  officerName: string
  date: string
  status: 'pending' | 'processed' | 'archived' | 'destroyed'
  caseNumber?: string
  associatedReport?: number
  chainOfCustody: ChainOfCustodyEntry[]
  metadata?: {
    serialNumber?: string
    weight?: string
    quantity?: number
    images?: string[]
    forensicData?: {
      fingerprints?: string[]
      dna?: string[]
      ballistics?: string
    }
  }
}

export interface ChainOfCustodyEntry {
  id: number
  officer: string
  officerName: string
  action: string
  date: string
  notes?: string
}

export interface CreateEvidencePayload {
  type: string
  description: string
  location: string
  caseNumber?: string
  metadata?: Evidence['metadata']
}

export interface UpdateEvidenceStatusPayload {
  evidenceId: number
  status: 'pending' | 'processed' | 'archived' | 'destroyed'
  notes?: string
}

export interface TransferEvidencePayload {
  evidenceId: number
  toOfficer: string
  notes?: string
}

// ============================================
// DMV API TYPES
// ============================================

export interface LicenseRecord {
  citizenid: string
  firstname: string
  lastname: string
  dob: string
  licenses: {
    driver: boolean | string
    weapon: boolean | string
    business: boolean | string
    hunting: boolean | string
    pilot: boolean | string
  }
  points: number
  suspensions: SuspensionRecord[]
}

export interface SuspensionRecord {
  id: number
  licenseType: string
  reason: string
  startDate: string
  endDate: string
  issuedBy: string
}

export interface IssueLicensePayload {
  citizenid: string
  licenseType: 'driver' | 'weapon' | 'business' | 'hunting' | 'pilot'
  status: boolean | string
}

export interface AddLicensePointsPayload {
  citizenid: string
  points: number
  reason: string
}

export interface VehicleRegistration {
  id: number
  plate: string
  model: string
  brand: string
  color: string
  owner: string
  ownerCitizenid: string
  registrationDate: string
  expiryDate: string
  status: 'active' | 'expired' | 'suspended' | 'revoked'
  flags?: string[]
}

// ============================================
// PENAL CODE API TYPES
// ============================================

export interface PenalCode {
  id: number
  code: string
  title: string
  description: string
  category: string
  class: 'infraction' | 'misdemeanor' | 'felony'
  fine: number
  sentence: number
  points?: number
  isActive: boolean
  lastModified?: string
}

export interface CreatePenalCodePayload {
  code: string
  title: string
  description: string
  category: string
  class: 'infraction' | 'misdemeanor' | 'felony'
  fine: number
  sentence: number
  points?: number
}

export interface UpdatePenalCodePayload {
  penalCodeId: number
  title?: string
  description?: string
  category?: string
  class?: string
  fine?: number
  sentence?: number
  points?: number
  isActive?: boolean
}

// ============================================
// SETTINGS API TYPES
// ============================================

export interface Settings {
  id: number
  citizenid: string
  theme: 'dark' | 'light' | 'blue'
  notifications: boolean
  soundEnabled: boolean
  autoRefresh: boolean
  refreshInterval: number
  defaultView: string
  compactMode: boolean
  showMugshots: boolean
  preferences?: Record<string, unknown>
}

export interface UpdateSettingsPayload {
  theme?: string
  notifications?: boolean
  soundEnabled?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  defaultView?: string
  compactMode?: boolean
  showMugshots?: boolean
  preferences?: Record<string, unknown>
}

// ============================================
// CHIEF MENU API TYPES
// ============================================

export interface DepartmentStats {
  totalOfficers: number
  onDutyOfficers: number
  offDutyOfficers: number
  totalReports: number
  totalIncidents: number
  totalBolos: number
  totalWarrants: number
  monthlyReports: number
  monthlyIncidents: number
  monthlyArrests: number
}

export interface OfficerRoster {
  citizenid: string
  firstname: string
  lastname: string
  fullName: string
  callsign: string
  rank: string
  grade: number
  department: string
  badgeNumber: string
  phone: string
  hireDate: string
  status: 'active' | 'suspended' | 'terminated' | 'loa'
  dutyStatus: 'on-duty' | 'off-duty'
  image?: string
  stats?: {
    totalReports: number
    totalArrests: number
    totalIncidents: number
  }
}

export interface UpdateOfficerPayload {
  citizenid: string
  callsign?: string
  rank?: string
  grade?: number
  department?: string
  badgeNumber?: string
  status?: 'active' | 'suspended' | 'terminated' | 'loa'
}

export interface HiringApplication {
  id: number
  citizenid: string
  firstname: string
  lastname: string
  fullName: string
  phone: string
  email?: string
  dob: string
  appliedDate: string
  status: 'pending' | 'approved' | 'rejected' | 'interview'
  reviewedBy?: string
  reviewDate?: string
  notes?: string
  experience?: string
  reason?: string
}

export interface ApproveApplicationPayload {
  applicationId: number
  startingRank: string
  department: string
  callsign: string
  badgeNumber: string
  notes?: string
}

export interface RejectApplicationPayload {
  applicationId: number
  reason: string
  notes?: string
}

export interface DisciplineRecord {
  id: number
  officerCitizenid: string
  officerName: string
  infraction: string
  description: string
  severity: 'verbal' | 'written' | 'suspension' | 'termination'
  date: string
  issuedBy: string
  issuerName: string
  suspensionDays?: number
  notes?: string
}

export interface CreateDisciplineRecordPayload {
  officerCitizenid: string
  infraction: string
  description: string
  severity: 'verbal' | 'written' | 'suspension' | 'termination'
  suspensionDays?: number
  notes?: string
}

// ============================================
// DISPATCH / MAP API TYPES
// ============================================

export interface DispatchCall {
  id: number
  code: string
  title: string
  message: string
  location: string
  coords?: { x: number; y: number; z: number }
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'dispatched' | 'en-route' | 'on-scene' | 'resolved' | 'cancelled'
  caller?: string
  callerPhone?: string
  units: string[]
  createdAt: string
  updatedAt?: string
}

export interface UnitLocation {
  callsign: string
  name: string
  coords: { x: number; y: number; z: number }
  heading: number
  status: 'available' | 'busy' | 'en-route' | 'on-scene' | 'code-6'
  lastUpdate: string
}

// ============================================
// CAMERA API TYPES
// ============================================

export interface SecurityCamera {
  id: number
  label: string
  location: string
  coords: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number } // Camera rotation angles
  image: string
  status: 'online' | 'offline' | 'hacked'
  disabledUntil?: number // Timestamp when camera comes back online
  disabledBy?: string // Who hacked/disabled the camera
  category: 'bank' | 'store' | 'jewelry' | 'other'
  canRotate?: boolean // Whether the camera can be manually rotated
}

export interface CameraAccessPayload {
  incidentId: number
  cameraId: number
}

export interface DisableCameraPayload {
  cameraId: number
  duration: number // Duration in seconds
  disabledBy?: string // Optional identifier
}

// ============================================
// GENERAL API TYPES
// ============================================

export interface NuiApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SearchFilters {
  query?: string
  status?: string
  priority?: string
  dateFrom?: string
  dateTo?: string
  officer?: string
  type?: string
  category?: string
  limit?: number
  offset?: number
}
