import React, { useState, useEffect } from 'react'
import TabletFrame from './components/TabletFrame'
import ErrorBoundary from './components/ErrorBoundary'
import NavItem from './components/NavItem'
import DashboardPage from './pages/Dashboard'
import IncidentsPage from './pages/Incidents'
import BolosPage from './pages/Bolos'
import ProfilePage from './pages/Profile'
import PenalCodePage from './pages/PenalCode'
import DMVPage from './pages/DMV'
import MapPage from './pages/Map'
import SettingsPage from './pages/Settings'
import EvidencePage from './pages/Evidence'
import ChiefMenuPage from './pages/ChiefMenu'
import ChatPage from './pages/ChatPage'
import ClientErrorsPage from './pages/ClientErrors'
import ToastNotification from './components/ToastNotification'
import { onNuiMessage, fetchNui, isEnvBrowser, isDebugEnabled, setDebugEnabled, type OfficerData } from './utils/nui'
import { useAppStore } from './store/useAppStore'
import { mockOfficer } from './utils/mockData'

type PageType = 'dashboard' | 'incidents' | 'bolos' | 'profile' | 'penalcode' | 'dmv' | 'map' | 'settings' | 'evidence' | 'chief' | 'chat' | 'clientErrors'

export default function App() {
  // UI State - Always open in debug/browser mode
  const [isOpen, setIsOpen] = useState(() => {
    const isBrowser = isEnvBrowser()
    const isDebug = isDebugEnabled()
    const shouldOpen = isBrowser || isDebug
    console.log('[MDT] App initializing:', { isBrowser, isDebug, shouldOpen })
    return shouldOpen
  })
  const [isPreloaded, setIsPreloaded] = useState(false) // Track if UI has been preloaded
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
  
  // Officer Data - Initialize with mock data in debug/browser mode
  const [officer, setOfficer] = useState<OfficerData | null>(
    isEnvBrowser() || isDebugEnabled() ? mockOfficer : null
  )
  const [officerStatus, setOfficerStatus] = useState<'available' | 'busy' | 'responding' | 'off-duty'>('available')
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const setOfficerInStore = useAppStore((s) => s.setOfficer)
  const setCanAccessChief = useAppStore((s) => s.setCanAccessChief)
  const canAccessChief = useAppStore((s) => s.canAccessChief)
  const theme = useAppStore((s) => s.theme)

  // Initialize store with mock data in debug/browser mode
  useEffect(() => {
    if (isEnvBrowser() || isDebugEnabled()) {
      setOfficerInStore(mockOfficer)
      setCanAccessChief(true) // Enable Chief Menu in debug mode
    }
  }, [])

  // Monitor isOpen state changes
  useEffect(() => {
    console.log('[MDT] isOpen state changed to:', isOpen)
  }, [isOpen])

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (statusDropdownOpen && !target.closest('.status-dropdown-container')) {
        setStatusDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [statusDropdownOpen])

  // Inject theme colors as CSS variables
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--theme-primary', theme.primaryColor)
    root.style.setProperty('--theme-secondary', theme.secondaryColor)
    root.style.setProperty('--theme-accent', theme.accentColor)
    root.style.setProperty('--theme-button-highlight', theme.buttonHighlight)
    root.style.setProperty('--theme-icon', theme.iconColor)
    root.style.setProperty('--theme-border', theme.borderColor)
    
    // Convert hex to RGB for alpha variants
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246'
    }
    
    root.style.setProperty('--theme-primary-rgb', hexToRgb(theme.primaryColor))
    root.style.setProperty('--theme-secondary-rgb', hexToRgb(theme.secondaryColor))
    root.style.setProperty('--theme-accent-rgb', hexToRgb(theme.accentColor))
    root.style.setProperty('--theme-button-highlight-rgb', hexToRgb(theme.buttonHighlight))
    root.style.setProperty('--theme-icon-rgb', hexToRgb(theme.iconColor))
    root.style.setProperty('--theme-border-rgb', hexToRgb(theme.borderColor))
  }, [theme])

  // Listen for NUI messages from Lua
  useEffect(() => {
    // Optional debug log of all window messages
    const debugListener = (event: MessageEvent) => {
      if (isDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.debug('[MDT Debug] Received message:', event.data)
      }
    }
    window.addEventListener('message', debugListener)

    // Listen for preload trigger - renders UI in background without showing
    const cleanupPreload = onNuiMessage<boolean>('preload', (shouldPreload) => {
      if (isDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.log('[MDT] Preload triggered - rendering UI in background')
      }
      setIsPreloaded(true)
      // Don't set isOpen, just mark as preloaded
    })

    // Listen for visibility changes
    const cleanupVisible = onNuiMessage<boolean>('setVisible', (visible) => {
      if (isDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.log('[MDT] setVisible received:', visible, '- Setting isOpen to:', visible)
      }
      // In browser/debug mode, always keep it open regardless of messages
      if (isEnvBrowser() || isDebugEnabled()) {
        setIsOpen(true)
      } else {
        setIsOpen(visible)
      }
      
      // Check Chief Menu access every time MDT opens
      if (visible && !isEnvBrowser() && !isDebugEnabled()) {
        fetchNui<{ allowed: boolean }>('ps-mdt:chief:canAccess')
          .then((res) => {
            if (res.success) {
              const allowed = !!(res.data as any)?.allowed
              setCanAccessChief(allowed)
              if (isDebugEnabled()) {
                // eslint-disable-next-line no-console
                console.log('[MDT] Chief Menu access check:', allowed)
              }
            }
          })
          .catch((err) => {
            console.error('[MDT] Failed to check Chief Menu access:', err)
          })
      }
    })

    // Listen for officer data
    const cleanupOfficer = onNuiMessage<OfficerData>('setOfficer', (data) => {
      if (isDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.log('[MDT] setOfficer received:', JSON.stringify(data, null, 2))
      }
      setOfficer(data)
      setOfficerInStore(data)
      // Ask server if officer can access Chief Menu
      fetchNui<{ allowed: boolean }>('ps-mdt:chief:canAccess')
        .then((res) => {
          if (res.success) setCanAccessChief(!!(res.data as any)?.allowed)
        })
    })

    // Listen for debug mode changes from server
    const cleanupDebugMode = onNuiMessage<boolean>('setDebugMode', (debugMode) => {
      setDebugEnabled(debugMode)
      if (isDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.log('[MDT] Debug mode set from server:', debugMode)
      }
    })

    // Listen for normalized dashboard config and dept chat messages (log-only for now)
    const cleanupDashCfg = onNuiMessage<any>('dashboardConfig', (cfg) => {
      if (isDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.debug('[MDT] dashboardConfig received:', cfg)
      }
    })

    const cleanupDeptMsg = onNuiMessage<any>('deptChatMessage', (msg) => {
      if (isDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.debug('[MDT] deptChatMessage:', msg)
      }
    })

    const cleanupDeptHist = onNuiMessage<any>('deptChatHistory', (rows) => {
      if (isDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.debug('[MDT] deptChatHistory rows:', rows)
      }
    })

    const cleanupDeptRejected = onNuiMessage<any>('deptChatRejected', (info) => {
      if (isDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.debug('[MDT] deptChatRejected:', info)
      }
    })

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('message', debugListener)
      cleanupPreload()
      cleanupVisible()
      cleanupOfficer()
      cleanupDebugMode()
      cleanupDashCfg()
      cleanupDeptMsg()
      cleanupDeptHist()
      cleanupDeptRejected()
    }
  }, [])

  // Handle ESC key to close (disabled in debug/browser mode)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isEnvBrowser() && !isDebugEnabled()) {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleClose = async () => {
    // Don't allow closing in debug/browser mode
    if (isEnvBrowser() || isDebugEnabled()) {
      console.log('[MDT] Close prevented - Debug/Browser mode active')
      return
    }
    setIsOpen(false)
    await fetchNui('close')
  }

  const handleStatusChange = (status: 'available' | 'busy' | 'responding' | 'off-duty') => {
    setOfficerStatus(status)
    setStatusDropdownOpen(false)
    // TODO: Send status update to server when backend is ready
    // fetchNui('updateOfficerStatus', { status })
  }

  const getStatusColor = (status?: 'available' | 'busy' | 'responding' | 'off-duty') => {
    const s = status || officerStatus
    switch (s) {
      case 'available': return '#22C55E' // green
      case 'busy': return '#EF4444' // red
      case 'responding': return '#3B82F6' // blue
      case 'off-duty': return '#6B7280' // gray
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status?: 'available' | 'busy' | 'responding' | 'off-duty') => {
    const s = status || officerStatus
    switch (s) {
      case 'available': return 'Available'
      case 'busy': return 'Busy'
      case 'responding': return 'Responding'
      case 'off-duty': return 'Off-Duty'
      default: return 'Unknown'
    }
  }

  const statusOptions: Array<'available' | 'busy' | 'responding' | 'off-duty'> = [
    'available',
    'busy', 
    'responding',
    'off-duty'
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <ErrorBoundary fullScreen={false} scopeName="Dashboard">
            <DashboardPage onNavigate={setCurrentPage} />
          </ErrorBoundary>
        )
      case 'incidents':
        return (
          <ErrorBoundary fullScreen={false} scopeName="Incidents">
            <IncidentsPage />
          </ErrorBoundary>
        )
      case 'bolos':
        return (
          <ErrorBoundary fullScreen={false} scopeName="BOLOs">
            <BolosPage />
          </ErrorBoundary>
        )
      case 'profile':
        return (
          <ErrorBoundary fullScreen={false} scopeName="Profile">
            <ProfilePage />
          </ErrorBoundary>
        )
      case 'penalcode':
        return (
          <ErrorBoundary fullScreen={false} scopeName="PenalCode">
            <PenalCodePage />
          </ErrorBoundary>
        )
      case 'dmv':
        return (
          <ErrorBoundary fullScreen={false} scopeName="DMV">
            <DMVPage />
          </ErrorBoundary>
        )
      case 'map':
        return (
          <ErrorBoundary fullScreen={false} scopeName="Map">
            <MapPage />
          </ErrorBoundary>
        )
      case 'chat':
        return (
          <ErrorBoundary fullScreen={false} scopeName="Chat">
            <ChatPage />
          </ErrorBoundary>
        )
      case 'settings':
        return (
          <ErrorBoundary fullScreen={false} scopeName="Settings">
            <SettingsPage />
          </ErrorBoundary>
        )
      case 'evidence':
        return (
          <ErrorBoundary fullScreen={false} scopeName="Evidence">
            <EvidencePage />
          </ErrorBoundary>
        )
      case 'chief':
        return (
          <ErrorBoundary fullScreen={false} scopeName="Chief Menu">
            <ChiefMenuPage />
          </ErrorBoundary>
        )
      case 'clientErrors':
        return (
          <ErrorBoundary fullScreen={false} scopeName="Client Errors">
            <ClientErrorsPage />
          </ErrorBoundary>
        )
      default:
        return (
          <ErrorBoundary fullScreen={false} scopeName="DashboardFallback">
            <DashboardPage onNavigate={setCurrentPage} />
          </ErrorBoundary>
        )
    }
  }

  return (
    <>
      <TabletFrame forcedOpen={isOpen}>
        <div className="w-full h-full flex flex-col p-[1.5vh] md:p-[2vh] lg:p-[2.5vh] relative">
        <div 
          className="header flex items-center mb-[1.5vh] md:mb-[2vh] px-[1vh] py-[0.8vh] md:px-[1.5vh] md:py-[1vh] rounded-xl md:rounded-2xl border relative flex-shrink-0"
          style={{
            background: `linear-gradient(to bottom right, rgba(15,23,42,0.92), rgba(10,16,30,0.82))`,
            borderColor: `${theme.primaryColor}40`
          }}
        >
          <div className="flex items-center gap-[1vh] md:gap-[1.5vh] flex-1 min-w-0">
            <div 
              className="badge-logo w-[4vh] h-[4vh] md:w-[5vh] md:h-[5vh] rounded-lg shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{
                background: `linear-gradient(to bottom right, ${theme.primaryColor}, ${theme.secondaryColor})`
              }}
            >
              {theme.logoType === 'image' && theme.logoImage ? (
                <img src={theme.logoImage} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <i className={`fa-solid ${theme.logoIcon} text-white text-[1.8vh] md:text-[2vh]`} />
              )}
            </div>
            <div className="min-w-0 overflow-hidden">
              <div className="header-title uppercase text-[1.2vh] md:text-[1.4vh] font-bold tracking-wider truncate">{theme.departmentName}</div>
              <div className="text-[1vh] md:text-[1.2vh] text-[rgba(255,255,255,0.7)] truncate">{theme.departmentSubtitle}</div>
            </div>
          </div>
          <div className="header-middle text-center px-[1.5vh] md:px-[2vh] py-[0.5vh] md:py-[0.8vh] rounded-lg md:rounded-xl bg-[rgba(18,25,43,0.6)] border border-[rgba(36,72,176,0.25)] absolute left-1/2 transform -translate-x-1/2 pointer-events-none hidden sm:block">
            <div className="text-[1vh] md:text-[1.2vh] opacity-75 whitespace-nowrap">January 15, 2025</div>
            <div className="text-[1.8vh] md:text-[2vh] font-semibold tracking-wide whitespace-nowrap">12:34</div>
          </div>
          <div className="header-right text-right relative flex-1 min-w-0 flex justify-end items-center gap-[1.5vh]">
            <div>
              <div className="text-[1.3vh] md:text-[1.5vh] font-semibold">
                {officer ? (
                  <>
                    <span className="text-[#FACC15]">{officer.callsign}</span>
                    {' '}
                    <span className="text-white">{officer.firstname} {officer.lastname}</span>
                  </>
                ) : (
                  <span className="text-[rgba(255,255,255,0.5)]">Loading...</span>
                )}
              </div>
              <div className="relative mt-[0.3vh] status-dropdown-container">
                <button
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="text-[1.1vh] md:text-[1.2vh] transition-all duration-200 hover:scale-105 cursor-pointer flex items-center justify-end gap-[0.5vh]"
                  style={{ color: getStatusColor() }}
                  title="Click to change status"
                >
                  <i className="fa-solid fa-circle text-[0.8vh]" style={{ color: getStatusColor() }} />
                  <span className="font-medium">{getStatusLabel()}</span>
                  <i className={`fa-solid fa-chevron-${statusDropdownOpen ? 'up' : 'down'} text-[0.9vh] ml-[0.3vh]`} />
                </button>
                {statusDropdownOpen && (
                  <div className="absolute right-0 top-full mt-[0.8vh] bg-[rgba(15,23,42,0.95)] border border-[rgba(36,72,176,0.3)] rounded-lg shadow-xl backdrop-blur-xl z-50 min-w-[12vh] overflow-hidden">
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className="w-full px-[1.2vh] py-[0.8vh] text-[1.1vh] md:text-[1.2vh] flex items-center gap-[0.8vh] transition-colors duration-150 hover:bg-[rgba(56,189,248,0.15)]"
                        style={{ 
                          color: officerStatus === status ? getStatusColor(status) : 'rgba(255,255,255,0.8)',
                          backgroundColor: officerStatus === status ? 'rgba(56,189,248,0.1)' : 'transparent'
                        }}
                      >
                        <i className="fa-solid fa-circle text-[0.8vh]" style={{ color: getStatusColor(status) }} />
                        <span className="font-medium">{getStatusLabel(status)}</span>
                        {officerStatus === status && (
                          <i className="fa-solid fa-check text-[0.9vh] ml-auto" style={{ color: getStatusColor(status) }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="main-container flex gap-[1.5vh] md:gap-[2vh] flex-1 overflow-hidden min-h-0">
          <nav 
            className="nav-menu flex flex-col gap-[0.8vh] w-[12vh] sm:w-[14vh] md:w-[16vh] lg:min-w-[18vh] bg-[rgba(15,23,42,0.86)] rounded-xl md:rounded-2xl border p-[1.2vh] md:p-[1.5vh] shadow-xl backdrop-blur-xl overflow-y-auto flex-shrink-0"
            style={{ borderColor: `rgba(var(--theme-border-rgb), 0.18)` }}
          >
            <div onClick={() => setCurrentPage('dashboard')}>
              <NavItem 
                label="Dashboard" 
                icon={<i className="fa-solid fa-chart-line" />}
                active={currentPage === 'dashboard'} 
              />
            </div>
            <div onClick={() => setCurrentPage('incidents')}>
              <NavItem 
                label="Incidents" 
                icon={<i className="fa-solid fa-clipboard-list" />} // Changed from fa-file-lines
                active={currentPage === 'incidents'} 
              />
            </div>
            <div onClick={() => setCurrentPage('bolos')}>
              <NavItem 
                label="BOLOs" 
                icon={<i className="fa-solid fa-bell" />}
                active={currentPage === 'bolos'} 
              />
            </div>
            <div onClick={() => setCurrentPage('profile')}>
              <NavItem 
                label="Profiles" 
                icon={<i className="fa-solid fa-id-card" />}
                active={currentPage === 'profile'} 
              />
            </div>
            <div onClick={() => setCurrentPage('penalcode')}>
              <NavItem 
                label="Penal Code" 
                icon={<i className="fa-solid fa-gavel" />}
                active={currentPage === 'penalcode'} 
              />
            </div>
            <div onClick={() => setCurrentPage('dmv')}>
              <NavItem 
                label="DMV" 
                icon={<i className="fa-solid fa-car-side" />}
                active={currentPage === 'dmv'} 
              />
            </div>
            <div onClick={() => setCurrentPage('evidence')}>
              <NavItem 
                label="Evidence" 
                icon={<i className="fa-solid fa-box" />}
                active={currentPage === 'evidence'} 
              />
            </div>
            <div onClick={() => setCurrentPage('map')}>
              <NavItem 
                label="Map" 
                icon={<i className="fa-solid fa-map" />}
                active={currentPage === 'map'} 
              />
            </div>
            <div onClick={() => setCurrentPage('chat')}>
              <NavItem 
                label="Chat" 
                icon={<i className="fa-solid fa-comments" />}
                active={currentPage === 'chat'} 
              />
            </div>
            {(canAccessChief || isDebugEnabled() || isEnvBrowser()) && (
              <div onClick={() => setCurrentPage('chief')}>
                <NavItem 
                  label="Chief Menu" 
                  icon={<i className="fa-solid fa-star" />}
                  active={currentPage === 'chief'} 
                />
              </div>
            )}
            {(canAccessChief || isDebugEnabled() || isEnvBrowser()) && (
              <div onClick={() => setCurrentPage('clientErrors')}>
                <NavItem
                  label="Client Errors"
                  icon={<i className="fa-solid fa-bug" />}
                  active={currentPage === 'clientErrors'}
                />
              </div>
            )}
            <div onClick={() => setCurrentPage('settings')}>
              <NavItem 
                label="Settings" 
                icon={<i className="fa-solid fa-gear" />}
                active={currentPage === 'settings'} 
              />
            </div>
          </nav>

          <section className="flex-1 overflow-auto pr-[0.8vh] min-w-0">
            {renderPage()}
          </section>
        </div>
      </div>
    </TabletFrame>

    {/* Toast notifications - shown outside MDT, always visible */}
    <ToastNotification visible={true} />
    </>
  )
}
