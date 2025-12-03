import React, { useEffect, useRef, useState, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Input from '../components/Input'
import ErrorBoundary from '../components/ErrorBoundary'
import { fetchNui } from '../utils/nui'
import { useNuiListener, useFetchNui, useAutoRefresh, useRealtimeUpdate } from '../utils/hooks'
import { useAppStore } from '../store/useAppStore'

// Helper function to escape HTML in tooltips to prevent XSS
const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

interface DispatchCall {
  id: string
  message: string
  coords: { x: number; y: number }
  time: string
  code: string
  priority: 'low' | 'medium' | 'high'
  type: 'robbery' | 'pursuit' | 'traffic' | 'assault' | 'shooting' | 'suspicious' | 'medical' | 'fire' | 'other'
}

interface ActiveUnit {
  id: string
  officer: string
  status: 'available' | 'busy' | 'responding' | 'offline'
  location: string
  coords?: { x: number; y: number }
  heading?: number  // Vehicle heading/direction in degrees
  inVehicle?: boolean  // Whether the officer is in a vehicle
}

export default function MapPage() {
  const officer = useAppStore((s) => s.officer)
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})
  const markerLayerRef = useRef<L.LayerGroup | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCall, setSelectedCall] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [legendExpanded, setLegendExpanded] = useState(false)

  // Mock data for dispatch calls
  // Fetch active dispatch calls via NUI
  const { data: callsRaw, refetch: refetchCalls } = useFetchNui<any[]>('getDispatchCalls', [])

  // Map server call shape to UI DispatchCall
  const dispatchCalls: DispatchCall[] = useMemo(() => {
    const calls = callsRaw || []
    return calls.map((c: any) => ({
      id: String(c.id || c.callId || Date.now()),
      message: String(c.description || c.title || 'Dispatch update'),
      coords: c.coords ? { x: c.coords.x, y: c.coords.y } : { x: -1500, y: -300 },
      time: new Date((c.timestamp ? c.timestamp * 1000 : Date.now())).toISOString(),
      code: String(c.dispatchCode || c.code || '10-00'),
      priority: (String(c.priority || '').toLowerCase() as any) === 'high' ? 'high' : (String(c.priority || '').toLowerCase() as any) === 'low' ? 'low' : 'medium',
      type: 'other'
    }))
  }, [callsRaw])

  // Mock data for active units
  // Fetch active unit locations via NUI
  const { data: unitsRaw, refetch: refetchUnits } = useFetchNui<any[]>('getActiveUnits', [])

  const activeUnits: ActiveUnit[] = useMemo(() => {
    const units = unitsRaw || []
    return units.map((u: any) => ({
      id: String(u.id || u.callsign || u.name || Math.random()),
      officer: String(u.officer || u.name || 'Unknown'),
      status: (String(u.status || '').toLowerCase() as any) === 'busy' ? 'busy' : (String(u.status || '').toLowerCase() as any) === 'responding' ? 'responding' : 'available',
      location: u.location || '',
      coords: u.coords ? { x: u.coords.x, y: u.coords.y } : undefined,
      heading: u.heading !== undefined ? Number(u.heading) : undefined,
      inVehicle: u.inVehicle === true || u.inVehicle === 1
    }))
  }, [unitsRaw])

  // Auto-refresh map data - more frequent for real-time location tracking
  useAutoRefresh(() => {
    refetchCalls()
    refetchUnits()
  }, 2000, true) // Update every 2 seconds for smooth real-time tracking

  // Near-real-time updates: refetch when pushes arrive
  useNuiListener('unitLocations', () => {
    refetchUnits()
  })

  useRealtimeUpdate('unitStatusChanged', () => {
    refetchUnits()
  })

  useRealtimeUpdate('unitLocationUpdated', () => {
    refetchUnits()
  })

  // Listen for normalized dispatch call pushes and refetch
  useNuiListener('call', () => {
    refetchCalls()
  })

  // Toast display effect
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message)
    setToastType(type)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success'
      case 'busy': return 'warning'
      case 'responding': return 'danger'
      case 'offline': return 'secondary'
      default: return 'secondary'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'secondary'
    }
  }

  const getTimeSince = (timeString: string) => {
    const minutes = Math.round((new Date().getTime() - new Date(timeString).getTime()) / 60000)
    return `${minutes}m ago`
  }

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'robbery':
        return 'fa-sack-dollar'
      case 'pursuit':
        return 'fa-car-burst'
      case 'traffic':
        return 'fa-car-side'
      case 'assault':
        return 'fa-hand-fist'
      case 'shooting':
        return 'fa-gun'
      case 'suspicious':
        return 'fa-user-secret'
      case 'medical':
        return 'fa-truck-medical'
      case 'fire':
        return 'fa-fire-flame-curved'
      default:
        return 'fa-circle-exclamation'
    }
  }

  const getCallTypeColor = (type: string) => {
    switch (type) {
      case 'robbery':
        return '#dc2626' // red-600
      case 'pursuit':
        return '#ea580c' // orange-600
      case 'shooting':
        return '#b91c1c' // red-700
      case 'traffic':
        return '#f59e0b' // amber-500
      case 'assault':
        return '#dc2626' // red-600
      case 'suspicious':
        return '#6366f1' // indigo-500
      case 'medical':
        return '#ec4899' // pink-500
      case 'fire':
        return '#f97316' // orange-500
      default:
        return '#3b82f6' // blue-500
    }
  }

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Add a small delay to ensure the container is fully rendered
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return

      try {
        // Custom CRS for GTA V map
        const customCRS = L.extend({}, L.CRS.Simple, {
          projection: L.Projection.LonLat,
          scale: function(zoom: number) {
            return Math.pow(2, zoom)
          },
          zoom: function(scale: number) {
            return Math.log(scale) / 0.6931471805599453
          },
          distance: function(pos1: L.LatLng, pos2: L.LatLng) {
            const x_difference = pos2.lng - pos1.lng
            const y_difference = pos2.lat - pos1.lat
            return Math.sqrt(x_difference * x_difference + y_difference * y_difference)
          },
          transformation: new L.Transformation(0.02072, 117.3, -0.0205, 172.8),
          infinite: false
        })

        // Initialize map
        const map = L.map(mapContainerRef.current, {
          crs: customCRS as any,
          minZoom: 3,
          maxZoom: 5,
          zoom: 4,
          preferCanvas: true,
          center: [-300, -1500] as L.LatLngExpression,
          maxBoundsViscosity: 1.0,
          zoomControl: true,
          attributionControl: false
        })

        // GTA V map image
        const customImageUrl = 'https://files.fivemerr.com/images/60c68fc9-1a7f-4e5a-800a-f760a74186ca.jpeg'
        
        // Use correct bounds from old implementation
        const sw = map.unproject([0, 1024], 3 - 1)
        const ne = map.unproject([1024, 0], 3 - 1)
        const mapBounds = new L.LatLngBounds(sw, ne)
        
        map.setView([-300, -1500], 4)
        map.setMaxBounds(mapBounds)
        L.imageOverlay(customImageUrl, mapBounds).addTo(map)

        // Prevent dragging outside bounds
        map.on('dragend', function() {
          if (!mapBounds.contains(map.getCenter())) {
            map.panTo(mapBounds.getCenter(), { animate: false })
          }
        })

        // Create marker layer group
        markerLayerRef.current = L.layerGroup().addTo(map)
        mapRef.current = map

        // Force map to recalculate size
        setTimeout(() => {
          map.invalidateSize()
          setMapLoaded(true)
          if (import.meta?.env?.DEV) {
            console.log('[Map] Initialized successfully')
          }
        }, 100)
      } catch (error) {
        console.error('Error initializing map:', error)
        setMapLoaded(false)
      }
    }, 100)

    // Cleanup
    return () => {
      clearTimeout(timer)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Auto-center map on current officer's location
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !officer || activeUnits.length === 0) {
      return
    }

    // Find the current officer in the active units array
    const currentUnit = activeUnits.find(unit => {
      // Match by officer name or citizenid
      const unitOfficerName = unit.officer.toLowerCase()
      const currentOfficerName = `${officer.firstname} ${officer.lastname}`.toLowerCase()
      return unitOfficerName.includes(currentOfficerName) || 
             unitOfficerName.includes(officer.callsign?.toLowerCase() || '') ||
             unit.id === officer.citizenid
    })

    // If we found the officer and they have coordinates, center the map on them
    if (currentUnit && currentUnit.coords) {
      const { x, y } = currentUnit.coords
      // Convert GTA coords to Leaflet coords (y, x order for lat, lng)
      mapRef.current.setView([y, x], mapRef.current.getZoom())
      
      if (import.meta?.env?.DEV) {
        console.log('[Map] Auto-centered on officer:', currentUnit.officer, 'at', currentUnit.coords)
      }
    }
  }, [mapLoaded, activeUnits, officer])

  // Add dispatch markers
  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current || !mapLoaded) {
      // Map not ready yet - this is normal during initialization
      return
    }

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      if (markerLayerRef.current) {
        markerLayerRef.current.removeLayer(marker)
      }
    })
    markersRef.current = {}

    // Add new markers for dispatch calls
    let markersAdded = 0
    dispatchCalls.forEach(call => {
      if (!call.coords) {
        return
      }

      const icon = getCallIcon(call.type)
      const iconColor = getCallTypeColor(call.type)
      
      const escapeHtml = (s: string) =>
        String(s || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')
      const dispatchIcon = L.divIcon({
        html: `
          <div class="dispatch-marker ${escapeHtml(call.priority)}">
            <i class="fa ${escapeHtml(icon)} fa-2x" style="color: ${escapeHtml(iconColor)};"></i>
          </div>
        `,
        className: 'custom-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 48]
      })

      const marker = L.marker([call.coords.y, call.coords.x], { icon: dispatchIcon })
      
      marker.bindTooltip(
        `<div style="text-align: center;">
          <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px;">${escapeHtml(call.message)}</div>
          <div style="font-size: 11px; color: #94a3b8;">Code: ${escapeHtml(call.code)} | ${getTimeSince(call.time)}</div>
        </div>`,
        {
          direction: 'top',
          permanent: false,
          offset: [0, -30],
          opacity: 0.95,
          className: 'custom-tooltip'
        }
      )

      marker.on('click', () => {
        setSelectedCall(call.id)
        fetchNui('setWaypoint', { id: call.id })
          .then((res) => {
            if (res.success) {
              showToast('Waypoint set successfully', 'success')
            } else {
              showToast(res.error || 'Failed to set waypoint', 'error')
            }
          })
          .catch((err) => {
            console.warn('Failed to set waypoint:', err)
            showToast('Failed to set waypoint', 'error')
          })
      })

      if (markerLayerRef.current) {
        markerLayerRef.current.addLayer(marker)
        markersRef.current[call.id] = marker
        markersAdded++
      }
    })

    // Only log if there are actually markers to add
    if (dispatchCalls.length > 0) {
      console.log(`[Map] Added ${markersAdded} of ${dispatchCalls.length} dispatch markers`)
    }
  }, [dispatchCalls, mapLoaded])

  // Add unit markers (officers)
  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current || !mapLoaded) {
      return
    }

    // Remove old unit markers (they have 'unit-' prefix)
    Object.keys(markersRef.current).forEach(key => {
      if (key.startsWith('unit-')) {
        const marker = markersRef.current[key]
        if (markerLayerRef.current) {
          markerLayerRef.current.removeLayer(marker)
        }
        delete markersRef.current[key]
      }
    })

    // Add new unit markers
    let unitsAdded = 0
    activeUnits.forEach(unit => {
      if (!unit.coords) {
        return
      }

      // Get color based on status
      const statusColorMap: Record<string, string> = {
        available: '#22c55e',    // green
        busy: '#eab308',         // yellow
        responding: '#ef4444',   // red
        offline: '#6b7280'       // gray
      }
      const unitColor = statusColorMap[unit.status] || '#3b82f6'
      
      // Calculate rotation for heading (convert game heading to CSS rotation)
      // GTA heading: 0 = North, 90 = West, 180 = South, 270 = East
      // CSS rotate: 0 = Right, 90 = Down, 180 = Left, 270 = Up
      // Convert: CSS rotation = 90 - GTA heading
      const rotation = unit.heading !== undefined ? 90 - unit.heading : 0
      
      // Determine movement icon
      const movementIcon = unit.inVehicle ? 'fa-car' : 'fa-person-walking'
      const movementColor = unit.inVehicle ? '#3b82f6' : '#10b981' // Blue for vehicle, green for walking

      const unitIcon = L.divIcon({
        html: `
          <div class="unit-marker ${unit.status}" style="position: relative;">
            <!-- Direction Arrow -->
            <div style="
              width: 28px;
              height: 28px;
              background: ${unitColor};
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              transform: rotate(${rotation}deg);
              transition: transform 0.3s ease-out;
            ">
              <i class="fa-solid fa-arrow-up" style="color: white; font-size: 14px;"></i>
              </div>
            </ErrorBoundary>
            <!-- Movement Type Indicator -->
            <div style="
              position: absolute;
              top: -6px;
              right: -6px;
              width: 18px;
              height: 18px;
              background: ${movementColor};
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 1px 4px rgba(0,0,0,0.5);
              z-index: 10;
            ">
              <i class="fa-solid ${movementIcon}" style="color: white; font-size: 8px;"></i>
            </div>
            <!-- Callsign Label -->
            <div style="
              position: absolute;
              bottom: -18px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(0,0,0,0.85);
              color: white;
              padding: 2px 5px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: 600;
              white-space: nowrap;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              border: 1px solid rgba(255,255,255,0.2);
            ">${unit.id}</div>
          </div>
        `,
        className: 'custom-unit-marker',
        iconSize: [28, 46],
        iconAnchor: [14, 46]
      })

      const marker = L.marker([unit.coords.y, unit.coords.x], { icon: unitIcon })
      
      marker.bindTooltip(
        `<div style="text-align: center;">
            <div style="font-weight: bold; font-size: 12px; margin-bottom: 3px;">${escapeHtml(unit.id)} - ${escapeHtml(unit.officer)}</div>
          <div style="font-size: 10px; color: #94a3b8;">Status: ${unit.status.toUpperCase()}</div>
          ${unit.location ? `<div style="font-size: 10px; color: #94a3b8;">${escapeHtml(unit.location)}</div>` : ''}
          ${unit.heading !== undefined ? `<div style="font-size: 10px; color: #94a3b8;">Heading: ${Math.round(unit.heading)}°</div>` : ''}
        </div>`,
        {
          direction: 'top',
          permanent: false,
          offset: [0, -30],
          opacity: 0.95,
          className: 'custom-tooltip'
        }
      )

      if (markerLayerRef.current) {
        markerLayerRef.current.addLayer(marker)
        markersRef.current[`unit-${unit.id}`] = marker
        unitsAdded++
      }
    })

    // Log unit markers if any were added
    if (activeUnits.length > 0 && import.meta?.env?.DEV) {
      console.log(`[Map] Added ${unitsAdded} of ${activeUnits.length} unit markers`)
    }
  }, [activeUnits, mapLoaded])

  const handleClearMap = () => {
    if (!markerLayerRef.current) return
    
    Object.values(markersRef.current).forEach(marker => {
      if (markerLayerRef.current) {
        markerLayerRef.current.removeLayer(marker)
      }
    })
    markersRef.current = {}
    refetchCalls()
    setSelectedCall(null)
  }

  const handlePanToCall = (call: DispatchCall) => {
    if (!mapRef.current || !call.coords) return
    mapRef.current.setView([call.coords.y, call.coords.x], 4, { animate: true })
    setSelectedCall(call.id)
  }

  const filteredCalls = dispatchCalls.filter(call =>
    call.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Top Bar - Search and Quick Stats */}
      <div className="flex gap-3 flex-shrink-0">
        <div className="flex-1">
          <Input
            placeholder="Search dispatch calls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<i className="fa-solid fa-search" />}
          />
        </div>
        <div className="flex gap-3">
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg px-4 py-2 flex items-center gap-2">
            <i className="fa-solid fa-radio text-theme-icon" />
            <span className="text-sm text-gray-400">Calls:</span>
            <span className="text-sm font-bold text-white">{filteredCalls.length}</span>
          </div>
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg px-4 py-2 flex items-center gap-2">
            <i className="fa-solid fa-badge-check text-theme-icon" />
            <span className="text-sm text-gray-400">Units:</span>
            <span className="text-sm font-bold text-white">{activeUnits.length}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0">
        {/* Sidebar - Compact Layout */}
        <div className="lg:col-span-1 flex flex-col gap-3 min-h-0">
          {/* Dispatch Calls - Takes 60% of sidebar height */}
          <Card title="Dispatch Calls" className="flex-[3] flex flex-col min-h-0">
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="space-y-2 overflow-y-auto pr-2 flex-1">
                {filteredCalls.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fa-solid fa-radio text-3xl mb-2 block" />
                    <p className="text-sm">No active dispatch calls</p>
                  </div>
                ) : (
                  filteredCalls.map(call => (
                    <div
                      key={call.id}
                      onClick={() => handlePanToCall(call)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        selectedCall === call.id
                          ? 'badge-theme'
                          : 'bg-gray-800/30 border-gray-700 hover:border-active'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <Badge variant={getPriorityColor(call.priority)} className="text-xs">
                          {call.code}
                        </Badge>
                        <span className="text-xs text-gray-400">{getTimeSince(call.time)}</span>
                      </div>
                      <p className="text-sm text-white font-medium mb-1.5 line-clamp-2">{call.message}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          fetchNui('setWaypoint', { id: call.id })
                            .then((res) => {
                              if (res.success) {
                                showToast('Waypoint set successfully', 'success')
                              } else {
                                showToast(res.error || 'Failed to set waypoint', 'error')
                              }
                            })
                            .catch((err) => {
                              console.warn('Failed to set waypoint:', err)
                              showToast('Failed to set waypoint', 'error')
                            })
                        }}
                        className="text-xs text-theme-icon hover:brightness-125 flex items-center gap-1"
                      >
                        <i className="fa-solid fa-route" />
                        Set Waypoint
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Active Units - Takes 40% of sidebar height */}
          <Card title="Active Units" subtitle={`${activeUnits.length} on duty`} className="flex-[2] flex flex-col min-h-0">
            <div className="flex-1 overflow-hidden">
              <div className="space-y-2 overflow-y-auto pr-2 h-full">
                {activeUnits.map(unit => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg border border-gray-700"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm truncate">{unit.id}</span>
                        <Badge variant={getStatusColor(unit.status)} className="text-xs flex-shrink-0">
                          {unit.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{unit.officer}</p>
                      <p className="text-xs text-gray-500 truncate">{unit.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Map Container - Takes remaining space */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="bg-[rgba(15,23,42,0.82)] border rounded-2xl shadow-xl backdrop-blur-xl flex-1 flex flex-col min-h-0 p-4" style={{ borderColor: `rgba(var(--theme-border-rgb), 0.2)` }}>
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-map text-theme-icon" />
                Dispatch Map
              </h3>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleClearMap}
                icon={<i className="fa-solid fa-broom" />}
              >
                Clear Map
              </Button>
            </div>
            
            <ErrorBoundary fullScreen={false} scopeName="LeafletMap">
              <div 
                ref={mapContainerRef} 
                className="flex-1 rounded-lg border-2 border-gray-700 overflow-hidden relative min-h-0"
                style={{ background: '#0a0f1a' }}
              >
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-[1000]">
                <div className="text-center">
                  <i className="fa-solid fa-spinner fa-spin text-4xl spinner-theme mb-3" />
                  <p className="text-sm text-gray-400">Loading map...</p>
                </div>
              </div>
            )}

            {/* Collapsible Legend Overlay */}
            <div className="absolute top-3 right-3 z-[500] max-w-[300px]">
              <div className="bg-gray-900/95 border-2 border-gray-700 rounded-lg shadow-xl backdrop-blur-sm">
                {/* Legend Header */}
                <button
                  onClick={() => setLegendExpanded(!legendExpanded)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-800/50 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-list text-theme-icon" />
                    <span className="text-sm font-semibold text-white">Call Types Legend</span>
                  </div>
                  <i className={`fa-solid fa-chevron-${legendExpanded ? 'up' : 'down'} text-gray-400 text-xs transition-transform`} />
                </button>

                {/* Legend Content */}
                {legendExpanded && (
                  <div className="p-3 pt-0 border-t border-gray-700">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-2 p-1.5 bg-gray-800/40 rounded">
                        <i className="fa fa-sack-dollar" style={{ color: '#dc2626' }} />
                        <span className="text-xs text-gray-300">Robbery</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 bg-gray-800/40 rounded">
                        <i className="fa fa-car-burst" style={{ color: '#ea580c' }} />
                        <span className="text-xs text-gray-300">Pursuit</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 bg-gray-800/40 rounded">
                        <i className="fa fa-gun" style={{ color: '#b91c1c' }} />
                        <span className="text-xs text-gray-300">Shooting</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 bg-gray-800/40 rounded">
                        <i className="fa fa-car-side" style={{ color: '#f59e0b' }} />
                        <span className="text-xs text-gray-300">Traffic</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 bg-gray-800/40 rounded">
                        <i className="fa fa-truck-medical" style={{ color: '#ec4899' }} />
                        <span className="text-xs text-gray-300">Medical</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 bg-gray-800/40 rounded">
                        <i className="fa fa-user-secret" style={{ color: '#6366f1' }} />
                        <span className="text-xs text-gray-300">Suspicious</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 bg-gray-800/40 rounded">
                        <i className="fa fa-hand-fist" style={{ color: '#dc2626' }} />
                        <span className="text-xs text-gray-300">Assault</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 bg-gray-800/40 rounded">
                        <i className="fa fa-fire-flame-curved" style={{ color: '#f97316' }} />
                        <span className="text-xs text-gray-300">Fire</span>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-2 font-semibold">Priority Levels:</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-xs text-gray-300">High Priority - Pulsing Red</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-xs text-gray-300">Medium - Pulsing Yellow</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-400" />
                          <span className="text-xs text-gray-300">Low Priority - Static Blue</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </div>

      <style>{`
        .custom-marker {
          background: transparent;
          border: none;
        }

        .dispatch-marker {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.9);
          border-radius: 50%;
          border: 2px solid rgba(56, 189, 248, 0.4);
          box-shadow: 0 0 12px rgba(0, 0, 0, 0.6);
          transition: all 0.2s ease;
        }

        .dispatch-marker:hover {
          transform: scale(1.15);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
        }

        .dispatch-marker.high {
          animation: pulse-red 2s infinite;
          border-color: rgba(239, 68, 68, 0.8);
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.5);
        }

        .dispatch-marker.medium {
          animation: pulse-yellow 2s infinite;
          border-color: rgba(251, 191, 36, 0.8);
          box-shadow: 0 0 14px rgba(251, 191, 36, 0.5);
        }

        .dispatch-marker.low {
          border-color: rgba(156, 163, 175, 0.4);
        }

        .dispatch-marker i {
          filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.9));
        }

        @keyframes pulse-red {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }

        @keyframes pulse-yellow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .custom-tooltip {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(56, 189, 248, 0.3) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }

        .custom-tooltip::before {
          border-top-color: rgba(15, 23, 42, 0.95) !important;
        }

        .leaflet-container {
          background: #0a0f1a !important;
          font-family: inherit;
        }

        .leaflet-control-zoom {
          border: 2px solid rgba(56, 189, 248, 0.3) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }

        .leaflet-control-zoom a {
          background: rgba(15, 23, 42, 0.9) !important;
          color: #38bdf8 !important;
          border: none !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
        }

        .leaflet-control-zoom a:hover {
          background: rgba(56, 189, 248, 0.2) !important;
          color: white !important;
        }
      `}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg border transition-all z-50 ${
            toastType === 'success'
              ? 'bg-green-500/90 border-green-400 text-white'
              : 'bg-red-500/90 border-red-400 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`fa-solid ${toastType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}
