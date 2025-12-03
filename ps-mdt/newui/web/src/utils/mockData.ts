/**
 * Mock data for development and debug mode
 * This file provides sample data for all MDT pages when running in browser/debug mode
 */

import type { OfficerData } from './nui'

// Mock Officer Data
export const mockOfficer: OfficerData = {
  citizenid: 'ABC12345',
  firstname: 'John',
  lastname: 'Mitchell',
  callsign: '1A-12',
  rank: 'Sergeant',
  department: 'LSPD',
  badgeNumber: '1247',
  phone: '555-0123',
  image: 'https://i.pravatar.cc/300?img=12',
  bio: 'Veteran officer with 8 years of service. Specialized in traffic enforcement and community policing.',
  preferredName: 'Mitch',
  email: 'j.mitchell@lspd.gov',
}

// Mock Dashboard Stats
export const mockDashboardStats = {
  activeUnits: 12,
  activeWarrants: 8,
  activeCalls: 5,
  openReports: 23,
  recentIncidents: 15,
  openCases: 31,
  onDutyOfficers: 18,
  criticalBolos: 3,
}

// Mock Recent Activity - matches ActivityLogEntry type
export const mockRecentActivity = [
  {
    id: 1,
    officerName: 'Officer J. Mitchell',
    action: 'Created traffic report - Speeding violation',
    actionType: 'report' as const,
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    details: 'Traffic Stop - Speeding on Route 68',
  },
  {
    id: 2,
    officerName: 'Officer S. Rodriguez',
    action: 'Logged incident - Vehicle pursuit',
    actionType: 'incident' as const,
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    details: '10-80 - Vehicle Pursuit on Del Perro Freeway',
  },
  {
    id: 3,
    officerName: 'Detective M. Hayes',
    action: 'Created BOLO - Vehicle',
    actionType: 'bolo' as const,
    timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
    details: 'BOLO - Stolen Red Sedan, ABC 123',
  },
  {
    id: 4,
    officerName: 'Judge Williams',
    action: 'Warrant issued',
    actionType: 'warrant' as const,
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    details: 'Warrant for Robert Johnson - Armed Robbery',
  },
  {
    id: 5,
    officerName: 'Officer T. Chen',
    action: 'Created arrest report',
    actionType: 'report' as const,
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    details: 'Arrest Report - Robbery at Innocence Blvd',
  },
  {
    id: 6,
    officerName: 'Evidence Tech K. Williams',
    action: 'Logged evidence',
    actionType: 'evidence' as const,
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
    details: 'Evidence Log - Glock 19 9mm handgun from case LSPD-2025-002',
  },
]

// Mock Active Warrants - matches ActiveWarrant type
export const mockActiveWarrants = [
  {
    id: 1,
    citizenid: 'DEF67890',
    name: 'Robert Johnson',
    charges: 'Armed Robbery, Assault with Deadly Weapon',
    issueDate: '2025-01-10T14:30:00',
    issuedBy: 'Judge Williams',
    priority: 'high' as const,
    lastSeen: '2025-01-14T18:45:00',
    status: 'active' as const,
  },
  {
    id: 2,
    citizenid: 'GHI11223',
    name: 'Sarah Martinez',
    charges: 'Grand Theft Auto, Evading Police',
    issueDate: '2025-01-12T09:15:00',
    issuedBy: 'Judge Thompson',
    priority: 'high' as const,
    lastSeen: '2025-01-13T22:00:00',
    status: 'active' as const,
  },
  {
    id: 3,
    citizenid: 'JKL44556',
    name: 'Michael Brown',
    charges: 'Drug Trafficking, Possession with Intent',
    issueDate: '2025-01-14T11:00:00',
    issuedBy: 'Judge Williams',
    priority: 'medium' as const,
    lastSeen: '2025-01-15T16:20:00',
    status: 'active' as const,
  },
]

// Mock Reports
// Consolidated Mock Incidents (includes both incident and report types)
export const mockIncidents = [
  // Report-type incidents
  {
    id: 'R-001',
    type: 'report',
    caseNumber: 'LSPD-2025-001',
    title: 'Traffic Stop - Speeding Violation',
    reportType: 'traffic',
    status: 'closed',
    priority: 'low',
    officerName: 'Officer J. Mitchell',
    officerBadge: '1247',
    date: '2025-01-15T10:30:00',
    location: 'Route 68 & Sandy Shores',
    code: '10-50',
    description: 'Vehicle was clocked at 95 MPH in a 65 MPH zone. Driver was cooperative and issued citation.',
    suspects: ['Jane Smith'],
    witnesses: [],
    charges: ['Speeding'],
    evidence: [],
    notes: 'Driver has clean record, issued warning.',
  },
  {
    id: 'R-002',
    type: 'report',
    caseNumber: 'LSPD-2025-002',
    title: 'Armed Robbery at 24/7 Store',
    reportType: 'incident',
    status: 'active',
    priority: 'high',
    officerName: 'Detective M. Hayes',
    officerBadge: '0892',
    date: '2025-01-15T14:22:00',
    location: 'Innocence Blvd 24/7',
    code: '10-32',
    description: 'Suspect entered store with handgun, demanded cash from register. Fled on foot northbound.',
    suspects: ['Unknown Male'],
    witnesses: ['Store Clerk - Ahmed Hassan', 'Customer - Lisa Wong'],
    charges: ['Armed Robbery', 'Brandishing a Firearm'],
    evidence: ['Security Footage', 'Shell Casings'],
    notes: 'Suspect approximately 6ft, wearing black hoodie and mask.',
    units: [],
    civilians: [],
  },
  {
    id: 'R-003',
    type: 'report',
    caseNumber: 'LSPD-2025-003',
    title: 'Domestic Disturbance',
    reportType: 'incident',
    status: 'pending',
    priority: 'medium',
    officerName: 'Officer S. Rodriguez',
    officerBadge: '1456',
    date: '2025-01-15T20:15:00',
    location: '1234 Grove Street',
    code: '10-25',
    description: 'Called to residence for noise complaint. Found couple arguing, no violence observed.',
    suspects: [],
    witnesses: ['Neighbor - Tom Anderson'],
    charges: [],
    evidence: [],
    notes: 'Both parties calmed down, no further action needed.',
    units: [],
    civilians: ['Resident 1', 'Resident 2'],
  },
  // Incident-type items
  {
    id: 'I-001',
    type: 'incident',
    caseNumber: 'LSPD-INC-2025-001',
    title: '10-80 Vehicle Pursuit',
    date: '2025-01-15T16:45:00',
    officerName: 'Officer S. Rodriguez',
    location: 'Del Perro Freeway',
    code: '10-80',
    priority: 'high',
    status: 'resolved',
    description: 'Pursuit of stolen vehicle began on Del Perro Freeway, ended after suspect crashed near Vespucci Beach. Suspect apprehended.',
    units: ['1A-12', '1A-15', '1B-20'],
    suspects: ['Mark Williams'],
    civilians: [],
    outcome: 'Suspect arrested for GTA and evading',
    charges: ['Grand Theft Auto', 'Evading Police'],
    evidence: [],
    witnesses: [],
  },
  {
    id: 'I-002',
    type: 'incident',
    caseNumber: 'LSPD-INC-2025-002',
    title: '10-31 Burglary in Progress',
    date: '2025-01-15T22:10:00',
    officerName: 'Officer T. Chen',
    location: 'Rockford Hills - Residential',
    code: '10-31',
    priority: 'critical',
    status: 'active',
    description: 'Silent alarm triggered at luxury residence. Units responding code 3.',
    units: ['1A-10', '1A-12', 'K9-1'],
    suspects: [],
    civilians: [],
    outcome: null,
    charges: [],
    evidence: [],
    witnesses: [],
  },
  {
    id: 'I-003',
    type: 'incident',
    caseNumber: 'LSPD-INC-2025-003',
    title: '10-53 Traffic Accident',
    date: '2025-01-15T11:30:00',
    officerName: 'Officer J. Mitchell',
    location: 'Legion Square',
    code: '10-53',
    priority: 'medium',
    status: 'closed',
    description: 'Two-vehicle collision at intersection. Minor injuries, no fatalities.',
    units: ['1A-12'],
    suspects: [],
    civilians: ['Driver 1', 'Driver 2'],
    outcome: 'Citations issued for failure to yield',
    charges: [],
    evidence: [],
    witnesses: [],
  },
]

// Kept for backwards compatibility - aliases to mockIncidents
export const mockReports = mockIncidents.filter((i) => i.type === 'report')

// Mock BOLOs
export const mockBolos = [
  {
    id: 'B-001',
    type: 'vehicle',
    title: 'Stolen Red Sedan',
    description: 'Red 4-door sedan, last seen heading north on Great Ocean Highway. Suspect is armed and dangerous.',
    issuedBy: 'Detective M. Hayes',
    date: '2025-01-15T12:00:00',
    lastSeen: 'Great Ocean Highway near Paleto Bay',
    priority: 'high',
    status: 'active',
    details: {
      plate: 'ABC 123',
      model: 'Vapid Stanier',
      color: 'Red',
      distinguishingFeatures: 'Broken rear left tail light, dent on driver side door',
    },
  },
  {
    id: 'B-002',
    type: 'person',
    title: 'Robbery Suspect',
    description: 'Male suspect wanted in connection with multiple store robberies. Considered armed and dangerous.',
    issuedBy: 'Detective R. Harrison',
    date: '2025-01-14T09:30:00',
    lastSeen: 'Downtown Los Santos',
    priority: 'critical',
    status: 'active',
    details: {
      name: 'Unknown',
      distinguishingFeatures: 'Approximately 6ft tall, athletic build, black hoodie, red shoes, distinctive dragon tattoo on left forearm',
    },
  },
  {
    id: 'B-003',
    type: 'vehicle',
    title: 'Hit and Run Vehicle',
    description: 'White SUV involved in hit and run on Elgin Avenue. Driver fled scene.',
    issuedBy: 'Officer K. Park',
    date: '2025-01-13T18:45:00',
    lastSeen: 'Elgin Avenue, heading towards Vinewood',
    priority: 'medium',
    status: 'expired',
    details: {
      plate: 'XYZ 789',
      model: 'Dundreary Landstalker',
      color: 'White',
      distinguishingFeatures: 'Front bumper damage, missing passenger side mirror',
    },
  },
]

// Mock Profile Data
export const mockProfiles = [
  {
    citizenid: 'DEF67890',
    firstname: 'Robert',
    lastname: 'Johnson',
    dob: '1985-03-15',
    gender: 'Male',
    nationality: 'American',
    phone: '555-0198',
    image: 'https://i.pravatar.cc/300?img=33',
    fingerprint: 'FP-67890',
    licenses: {
      driver: false,
      weapon: false,
      business: true,
    },
    charges: [
      {
        charge: 'Armed Robbery',
        date: '2025-01-10',
        officer: 'Detective M. Hayes',
        fine: 15000,
        sentence: 180,
      },
      {
        charge: 'Assault with Deadly Weapon',
        date: '2025-01-10',
        officer: 'Detective M. Hayes',
        fine: 10000,
        sentence: 120,
      },
    ],
    vehicles: [
      {
        plate: 'DEF 456',
        model: 'Bravado Buffalo',
        color: 'Black',
        status: 'Registered',
      },
    ],
    notes: 'Known associate of criminal organizations. Approach with caution.',
    flags: ['Armed', 'Dangerous', 'Flight Risk'],
  },
  {
    citizenid: 'GHI11223',
    firstname: 'Sarah',
    lastname: 'Martinez',
    dob: '1992-07-22',
    gender: 'Female',
    nationality: 'American',
    phone: '555-0234',
    image: 'https://i.pravatar.cc/300?img=47',
    fingerprint: 'FP-11223',
    licenses: {
      driver: true,
      weapon: false,
      business: false,
    },
    charges: [
      {
        charge: 'Grand Theft Auto',
        date: '2025-01-12',
        officer: 'Officer S. Rodriguez',
        fine: 8000,
        sentence: 90,
      },
    ],
    vehicles: [],
    notes: 'Multiple traffic violations on record.',
    flags: ['Traffic Violations'],
  },
]

// Mock Evidence
export const mockEvidence = [
  {
    id: 'E-001',
    type: 'Weapon',
    description: 'Glock 19 9mm handgun recovered from suspect vehicle',
    location: 'Evidence Locker A-15',
    officer: 'Detective M. Hayes',
    date: '2025-01-15T14:30:00',
    associatedCase: 'LSPD-2025-002',
    status: 'stored',
    images: [],
    chain: [
      {
        officer: 'Detective M. Hayes',
        date: '2025-01-15T14:30:00',
        action: 'Collected from scene',
      },
      {
        officer: 'Evidence Tech K. Williams',
        date: '2025-01-15T15:00:00',
        action: 'Logged into evidence system',
      },
    ],
  },
  {
    id: 'E-002',
    type: 'Digital',
    description: 'Security camera footage from 24/7 store',
    location: 'Digital Evidence Server',
    officer: 'Officer T. Chen',
    date: '2025-01-15T14:45:00',
    associatedCase: 'LSPD-2025-002',
    status: 'analyzed',
    images: [],
    chain: [
      {
        officer: 'Officer T. Chen',
        date: '2025-01-15T14:45:00',
        action: 'Downloaded from store system',
      },
      {
        officer: 'Detective M. Hayes',
        date: '2025-01-15T16:00:00',
        action: 'Reviewed footage',
      },
    ],
  },
  {
    id: 'E-003',
    type: 'Drug',
    description: '2.5kg of cocaine seized during traffic stop',
    location: 'Evidence Locker B-08',
    officer: 'Officer J. Mitchell',
    date: '2025-01-14T10:15:00',
    associatedCase: 'LSPD-2025-005',
    status: 'stored',
    images: [],
    chain: [
      {
        officer: 'Officer J. Mitchell',
        date: '2025-01-14T10:15:00',
        action: 'Seized during traffic stop',
      },
      {
        officer: 'Evidence Tech K. Williams',
        date: '2025-01-14T11:00:00',
        action: 'Processed and stored',
      },
    ],
  },
]

// Mock logs - small sample for client errors page
export const mockLogs = [
  { id: 5001, text: 'Client-side error: Cannot read property "foo" of undefined', time: new Date().toISOString() },
  { id: 5002, text: "Uncaught TypeError: Failed to fetch", time: new Date().toISOString() },
  { id: 5003, text: 'Camera viewer crashed due to invalid feed id', time: new Date().toISOString() },
]

// Mock DMV - Licenses
export const mockLicenses = [
  {
    citizenid: 'DEF67890',
    name: 'Robert Johnson',
    type: 'driver',
    status: 'suspended',
    issueDate: '2020-05-10',
    expiryDate: '2025-05-10',
    points: 12,
  },
  {
    citizenid: 'GHI11223',
    name: 'Sarah Martinez',
    type: 'driver',
    status: 'valid',
    issueDate: '2019-07-22',
    expiryDate: '2026-07-22',
    points: 3,
  },
  {
    citizenid: 'ABC12345',
    name: 'John Mitchell',
    type: 'weapon',
    status: 'valid',
    issueDate: '2021-03-15',
    expiryDate: '2026-03-15',
    points: 0,
  },
]

// Mock DMV - Vehicle Registrations
export const mockVehicleRegistrations = [
  {
    plate: 'ABC 123',
    owner: 'Robert Johnson',
    citizenid: 'DEF67890',
    model: 'Vapid Stanier',
    color: 'Red',
    class: 'Sedan',
    registrationDate: '2023-01-15',
    expiryDate: '2026-01-15',
    status: 'stolen',
    insurance: 'Expired',
  },
  {
    plate: 'XYZ 789',
    owner: 'Sarah Martinez',
    citizenid: 'GHI11223',
    model: 'Dundreary Landstalker',
    color: 'White',
    class: 'SUV',
    registrationDate: '2022-06-20',
    expiryDate: '2025-06-20',
    status: 'registered',
    insurance: 'Active',
  },
  {
    plate: 'DEF 456',
    owner: 'Robert Johnson',
    citizenid: 'DEF67890',
    model: 'Bravado Buffalo',
    color: 'Black',
    class: 'Sport',
    registrationDate: '2024-02-10',
    expiryDate: '2027-02-10',
    status: 'registered',
    insurance: 'Active',
  },
]

// Mock Penal Codes
export const mockPenalCodes = [
  {
    id: '1',
    code: '(1)01',
    title: 'Murder',
    description: 'The unlawful killing of another human being with malice aforethought.',
    class: 'Felony',
    category: 'Crimes Against Persons',
    fine: 50000,
    jail: 300,
  },
  {
    id: '2',
    code: '(1)02',
    title: 'Manslaughter',
    description: 'The unlawful killing of another human being without malice.',
    class: 'Felony',
    category: 'Crimes Against Persons',
    fine: 30000,
    jail: 180,
  },
  {
    id: '3',
    code: '(1)03',
    title: 'Assault with a Deadly Weapon',
    description: 'An assault committed with any deadly weapon or instrument.',
    class: 'Felony',
    category: 'Crimes Against Persons',
    fine: 10000,
    jail: 120,
  },
  {
    id: '4',
    code: '(2)01',
    title: 'Armed Robbery',
    description: 'Taking property from another through force or threat with a weapon.',
    class: 'Felony',
    category: 'Crimes Against Property',
    fine: 15000,
    jail: 180,
  },
  {
    id: '5',
    code: '(2)02',
    title: 'Grand Theft Auto',
    description: 'The unlawful taking of a motor vehicle.',
    class: 'Felony',
    category: 'Crimes Against Property',
    fine: 8000,
    jail: 90,
  },
  {
    id: '6',
    code: '(3)01',
    title: 'Speeding',
    description: 'Operating a vehicle in excess of posted speed limits.',
    class: 'Infraction',
    category: 'Vehicle Code',
    fine: 250,
    jail: 0,
  },
  {
    id: '7',
    code: '(3)02',
    title: 'Reckless Driving',
    description: 'Operating a vehicle with willful disregard for safety.',
    class: 'Misdemeanor',
    category: 'Vehicle Code',
    fine: 1500,
    jail: 15,
  },
  {
    id: '8',
    code: '(4)01',
    title: 'Drug Possession',
    description: 'Possession of controlled substances without prescription.',
    class: 'Misdemeanor',
    category: 'Drug Offenses',
    fine: 2000,
    jail: 30,
  },
]

// Mock Chief Menu - Officer Roster
export const mockOfficerRoster = [
  {
    id: '1',
    name: 'John Mitchell',
    callsign: '1A-12',
    rank: 'Sergeant',
    badge: '1247',
    department: 'LSPD',
    status: 'active',
    onDuty: true,
    incidents: 156,
    arrests: 89,
    warnings: 234,
  },
  {
    id: '2',
    name: 'Sarah Rodriguez',
    callsign: '1A-15',
    rank: 'Officer II',
    badge: '1456',
    department: 'LSPD',
    status: 'active',
    onDuty: true,
    incidents: 98,
    arrests: 54,
    warnings: 178,
  },
  {
    id: '3',
    name: 'Michael Hayes',
    callsign: 'Det-01',
    rank: 'Detective',
    badge: '0892',
    department: 'LSPD',
    status: 'active',
    onDuty: false,
    incidents: 234,
    arrests: 167,
    warnings: 89,
  },
  {
    id: '4',
    name: 'Thomas Chen',
    callsign: '1A-10',
    rank: 'Officer III',
    badge: '1389',
    department: 'LSPD',
    status: 'active',
    onDuty: true,
    incidents: 145,
    arrests: 76,
    warnings: 201,
  },
]

// Mock Chief Menu - Applications
export const mockApplications = [
  {
    id: '1',
    name: 'James Wilson',
    appliedDate: '2025-01-10',
    status: 'pending',
    experience: '5 years private security',
    reason: 'Want to serve and protect the community',
  },
  {
    id: '2',
    name: 'Emily Davis',
    appliedDate: '2025-01-12',
    status: 'pending',
    experience: 'Military Police - 3 years',
    reason: 'Transition from military to civilian law enforcement',
  },
]

// Mock Chief Menu - Discipline Records
export const mockDisciplineRecords = [
  {
    id: '1',
    officer: 'Officer K. Park',
    action: 'Written Warning',
    reason: 'Failed to follow proper evidence handling procedures',
    severity: 'Minor',
    date: '2025-01-05',
  },
  {
    id: '2',
    officer: 'Officer L. Thompson',
    action: '3-Day Suspension',
    reason: 'Excessive force complaint - sustained after investigation',
    severity: 'Major',
    date: '2024-12-20',
  },
]

// Mock Chief Menu - Clock Audit
export const mockClockAudit = [
  {
    officer: 'John Mitchell',
    callsign: '1A-12',
    clockIn: '2025-01-15T08:00:00',
    clockOut: '2025-01-15T16:00:00',
    duration: '8h 0m',
    date: '2025-01-15',
  },
  {
    officer: 'Sarah Rodriguez',
    callsign: '1A-15',
    clockIn: '2025-01-15T08:30:00',
    clockOut: '2025-01-15T16:30:00',
    duration: '8h 0m',
    date: '2025-01-15',
  },
  {
    officer: 'Thomas Chen',
    callsign: '1A-10',
    clockIn: '2025-01-15T09:00:00',
    clockOut: null,
    duration: 'On Duty',
    date: '2025-01-15',
  },
]

// Mock Map - Camera Locations
export const mockCameras = [
  {
    id: 'CAM-001',
    label: 'Legion Square North',
    location: 'Legion Square',
    coords: { x: 215.98, y: -804.74, z: 30.72 },
    heading: 180.0,
    status: 'online',
    type: 'security',
  },
  {
    id: 'CAM-002',
    label: 'MRPD Front Entrance',
    location: 'Mission Row PD',
    coords: { x: 425.13, y: -979.55, z: 30.71 },
    heading: 90.0,
    status: 'online',
    type: 'security',
  },
  {
    id: 'CAM-003',
    label: 'Vinewood Blvd Intersection',
    location: 'Vinewood',
    coords: { x: 374.89, y: 327.65, z: 103.57 },
    heading: 270.0,
    status: 'online',
    type: 'traffic',
  },
  {
    id: 'CAM-004',
    label: 'Del Perro Pier',
    location: 'Del Perro',
    coords: { x: -1826.89, y: -1221.23, z: 13.02 },
    heading: 0.0,
    status: 'offline',
    type: 'security',
  },
]

// Mock Map - Unit Locations
export const mockUnitLocations = [
  {
    callsign: '1A-12',
    officer: 'J. Mitchell',
    coords: { x: 425.13, y: -979.55 },
    heading: 180.0,
    status: 'available',
    lastUpdate: '2025-01-15T12:34:00',
  },
  {
    callsign: '1A-15',
    officer: 'S. Rodriguez',
    coords: { x: -1826.89, y: -1221.23 },
    heading: 90.0,
    status: 'responding',
    lastUpdate: '2025-01-15T12:33:00',
  },
  {
    callsign: '1A-10',
    officer: 'T. Chen',
    coords: { x: 215.98, y: -804.74 },
    heading: 270.0,
    status: 'busy',
    lastUpdate: '2025-01-15T12:35:00',
  },
]

// Mock Settings
export const mockSettings = {
  notifications: true,
  soundEnabled: true,
  autoRefresh: true,
  refreshInterval: 30,
  showMugshots: true,
  compactMode: false,
  theme: 'dark' as const,
}

// Mock Department Stats for Chief Menu
export const mockDepartmentStats = {
  totalOfficers: 45,
  onDutyOfficers: 18,
  activeUnits: 12,
  totalIncidents: 1247,
  totalArrests: 892,
  totalWarnings: 2341,
  openCases: 31,
  solvedCases: 876,
  averageResponseTime: '4.2 minutes',
}

// Mock Incident Codes Database
// Standard police 10-codes for dispatch and incident classification
export const mockIncidentCodes = [
  // Civilian/Support Codes
  { code: '10-1', title: 'Unable to Copy' },
  { code: '10-4', title: 'Acknowledged' },
  { code: '10-7', title: 'Out of Service' },
  { code: '10-8', title: 'In Service' },
  
  // Citizen Assistance & Community
  { code: '10-10', title: 'Civilian Dispute' },
  { code: '10-15', title: 'Citizen Assist' },
  { code: '10-20', title: 'Suspicious Person' },
  
  // Disturbance & Welfare
  { code: '10-25', title: 'Domestic Disturbance' },
  { code: '10-27', title: 'Welfare Check' },
  { code: '10-28', title: 'Abandoned Vehicle' },
  
  // Property Crimes
  { code: '10-31', title: 'Burglary in Progress' },
  { code: '10-32', title: 'Armed Robbery' },
  { code: '10-33', title: 'Officer Needs Assistance' },
  { code: '10-34', title: 'Robbery in Progress' },
  { code: '10-35', title: 'Major Crime Scene' },
  { code: '10-36', title: 'Assault in Progress' },
  { code: '10-37', title: 'Grand Theft Auto' },
  { code: '10-38', title: 'Assault with Weapon' },
  
  // Traffic & Patrol
  { code: '10-50', title: 'Traffic Stop' },
  { code: '10-51', title: 'Escort/Transport' },
  { code: '10-52', title: 'Alarm Investigation' },
  { code: '10-53', title: 'Traffic Accident' },
  { code: '10-54', title: 'Reckless Driving' },
  { code: '10-55', title: 'Speeding' },
  { code: '10-56', title: 'Driving Under Influence' },
  
  // Criminal Activity
  { code: '10-71', title: 'Prowler' },
  { code: '10-72', title: 'Narcotics Activity' },
  { code: '10-73', title: 'Gang Activity' },
  { code: '10-74', title: 'Illegal Fireworks' },
  { code: '10-75', title: 'Shots Fired' },
  { code: '10-76', title: 'Officer Down' },
  
  // Pursuits & High-Risk
  { code: '10-80', title: 'Vehicle Pursuit' },
  { code: '10-81', title: 'Foot Pursuit' },
  { code: '10-82', title: 'Foot Patrol' },
  { code: '10-83', title: 'Surveillance' },
  { code: '10-84', title: 'Dispatch Assistance' },
  
  // Special Operations
  { code: '10-91', title: 'Silent Alarm' },
  { code: '10-92', title: 'Officer Welfare' },
  { code: '10-93', title: 'Bomb Threat' },
  { code: '10-94', title: 'Homicide' },
  { code: '10-95', title: 'Firearms Discharge' },
  { code: '10-96', title: 'Mental Health Crisis' },
  { code: '10-97', title: 'Hazmat Incident' },
  { code: '10-98', title: 'Prison Escape' },
  { code: '10-99', title: 'Officer Down - Emergency' },
]

export {}
