import React, { useState, useEffect } from 'react'
import Button from './Button'
import Badge from './Badge'
import type { SecurityCamera } from '../types/api'
import { fetchNui } from '../utils/nui'
import withErrorBoundary from './withErrorBoundary'

interface CameraViewerProps {
  camera: SecurityCamera
  onClose: () => void
  incidentId?: number | string
}

export function CameraViewer({ camera, onClose, incidentId }: CameraViewerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  useEffect(() => {
    if (camera.status === 'hacked' && camera.disabledUntil) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, camera.disabledUntil! - Date.now())
        setTimeRemaining(remaining)
        
        if (remaining <= 0) {
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [camera.disabledUntil, camera.status])

  const handleViewLiveFeed = async () => {
    try {
      // Trigger 3D camera view in-game
      await fetchNui('viewCameraFeed', { 
        cameraId: camera.id,
        coords: camera.coords,
        rotation: camera.rotation,
        canRotate: camera.canRotate ?? false
      })
      // Close the MDT UI when viewing live feed
      onClose()
    } catch (error) {
      console.error('Failed to open camera feed:', error)
    }
  }

  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success'
      case 'offline': return 'secondary'
      case 'hacked': return 'danger'
      default: return 'secondary'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bank': return 'building-columns'
      case 'store': return 'store'
      case 'jewelry': return 'gem'
      default: return 'video'
    }
  }

  const isSafeImageUrl = (url?: string) => {
    if (!url || typeof url !== 'string') return false
    try {
      const u = new URL(url)
      return ['https:', 'http:', 'data:', 'blob:'].includes(u.protocol)
    } catch {
      return false
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[rgba(15,23,42,0.98)] border-2 border-[rgba(56,189,248,0.3)] rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg icon-bg-theme flex items-center justify-center">
                <i className={`fa-solid fa-${getCategoryIcon(camera.category)} text-theme-icon text-lg`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{camera.label}</h2>
                <p className="text-[rgba(255,255,255,0.6)] text-sm">
                  <i className="fa-solid fa-location-dot mr-1" />
                  {camera.location}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(camera.status)}>
                {camera.status === 'online' && <i className="fa-solid fa-circle-dot fa-fade mr-1" />}
                {camera.status === 'offline' && <i className="fa-solid fa-circle-xmark mr-1" />}
                {camera.status === 'hacked' && <i className="fa-solid fa-triangle-exclamation mr-1" />}
                {camera.status.toUpperCase()}
              </Badge>
              {camera.status === 'hacked' && timeRemaining > 0 && (
                <Badge variant="warning">
                  <i className="fa-solid fa-clock mr-1" />
                  Back online in {formatTimeRemaining(timeRemaining)}
                </Badge>
              )}
              {camera.disabledBy && (
                <Badge variant="secondary">
                  <i className="fa-solid fa-user-secret mr-1" />
                  Disabled by: {camera.disabledBy}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-times text-2xl" />
          </button>
        </div>

        {/* Camera Feed */}
        <div className="mb-6">
          {camera.status === 'online' ? (
            <div className="relative">
              {isSafeImageUrl(camera.image) ? (
                <img
                  src={camera.image!}
                  alt={camera.label}
                  className="w-full h-auto rounded-lg border-2 border-active/30"
                />
              ) : (
                <div className="w-full h-64 rounded-lg bg-gray-900 flex items-center justify-center">
                  <i className="fa-solid fa-image text-gray-500 text-4xl" />
                </div>
              )}
              {/* Recording indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-2 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-sm font-bold">REC</span>
              </div>
              {/* Timestamp */}
              <div className="absolute top-4 right-4 bg-black/70 px-3 py-2 rounded-lg">
                <span className="text-white text-sm font-mono">
                  {new Date().toLocaleString()}
                </span>
              </div>
              {/* Camera ID */}
              <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded-lg">
                <span className="text-white text-sm font-mono">CAM #{camera.id}</span>
              </div>
            </div>
          ) : camera.status === 'hacked' ? (
            <div className="w-full aspect-video bg-black rounded-lg border-2 border-red-500/30 flex items-center justify-center relative overflow-hidden">
              {/* Static/noise effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black opacity-50 animate-pulse" />
              <div className="text-center z-10">
                <i className="fa-solid fa-triangle-exclamation text-6xl text-red-400 mb-4 animate-pulse" />
                <h3 className="text-2xl font-bold text-red-400 mb-2">CAMERA DISABLED</h3>
                <p className="text-red-300 text-lg">Security system compromised</p>
                {timeRemaining > 0 && (
                  <p className="text-white mt-4 text-xl font-mono">
                    Restoring in {formatTimeRemaining(timeRemaining)}
                  </p>
                )}
                {camera.disabledBy && (
                  <p className="text-gray-400 mt-2 text-sm">
                    Disabled by: {camera.disabledBy}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video bg-black rounded-lg border-2 border-gray-700 flex items-center justify-center">
              <div className="text-center">
                <i className="fa-solid fa-video-slash text-6xl text-gray-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-400 mb-2">CAMERA OFFLINE</h3>
                <p className="text-gray-500">No signal detected</p>
              </div>
            </div>
          )}
        </div>

        {/* Camera Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[rgba(11,19,34,0.6)] rounded-lg p-4 border border-[rgba(36,72,176,0.2)]">
            <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase block mb-1">Camera ID</span>
            <p className="text-white font-bold">#{camera.id}</p>
          </div>
          <div className="bg-[rgba(11,19,34,0.6)] rounded-lg p-4 border border-[rgba(36,72,176,0.2)]">
            <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase block mb-1">Category</span>
            <p className="text-white font-bold capitalize">{camera.category}</p>
          </div>
          <div className="bg-[rgba(11,19,34,0.6)] rounded-lg p-4 border border-[rgba(36,72,176,0.2)]">
            <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase block mb-1">Coordinates</span>
            <p className="text-white font-mono text-sm">
              {camera.coords.x.toFixed(1)}, {camera.coords.y.toFixed(1)}
            </p>
          </div>
          <div className="bg-[rgba(11,19,34,0.6)] rounded-lg p-4 border border-[rgba(36,72,176,0.2)]">
            <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase block mb-1">Status</span>
            <Badge variant={getStatusColor(camera.status)}>
              {camera.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-[rgba(36,72,176,0.2)]">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {camera.status === 'online' && (
            <>
              <Button variant="success" onClick={handleViewLiveFeed}>
                <i className="fa-solid fa-eye mr-2" />
                View Live Feed
              </Button>
              <Button variant="primary">
                <i className="fa-solid fa-download mr-2" />
                Download Footage
              </Button>
              <Button variant="secondary">
                <i className="fa-solid fa-file-export mr-2" />
                Add to Evidence
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface CameraGridProps {
  cameras: SecurityCamera[]
  onCameraSelect: (camera: SecurityCamera) => void
  incidentLocation?: string
}

export function CameraGrid({ cameras, onCameraSelect, incidentLocation }: CameraGridProps) {
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCameras = cameras.filter(camera => {
    const matchesFilter = filter === 'all' || camera.status === filter || camera.category === filter
    const matchesSearch = 
      camera.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camera.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success'
      case 'offline': return 'secondary'
      case 'hacked': return 'danger'
      default: return 'secondary'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bank': return 'building-columns'
      case 'store': return 'store'
      case 'jewelry': return 'gem'
      default: return 'video'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
            filter === 'all'
              ? 'badge-theme'
              : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
          }`}
        >
          All ({cameras.length})
        </button>
        <button
          onClick={() => setFilter('online')}
          className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
            filter === 'online'
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
          }`}
        >
          <i className="fa-solid fa-circle-dot mr-1" />
          Online ({cameras.filter(c => c.status === 'online').length})
        </button>
        <button
          onClick={() => setFilter('hacked')}
          className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
            filter === 'hacked'
              ? 'bg-red-500/20 border-red-500 text-red-400'
              : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
          }`}
        >
          <i className="fa-solid fa-triangle-exclamation mr-1" />
          Hacked ({cameras.filter(c => c.status === 'hacked').length})
        </button>
        <button
          onClick={() => setFilter('bank')}
          className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
            filter === 'bank'
              ? 'badge-theme'
              : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
          }`}
        >
          <i className="fa-solid fa-building-columns mr-1" />
          Banks
        </button>
        <button
          onClick={() => setFilter('store')}
          className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
            filter === 'store'
              ? 'badge-theme'
              : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
          }`}
        >
          <i className="fa-solid fa-store mr-1" />
          Stores
        </button>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCameras.map((camera) => (
          <button
            key={camera.id}
            onClick={() => onCameraSelect(camera)}
            className="text-left bg-[rgba(11,19,34,0.4)] rounded-xl border border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.3)] transition-all p-3 group"
          >
            {/* Camera Preview */}
            <div className="relative mb-3 overflow-hidden rounded-lg">
              {isSafeImageUrl(camera.image) ? (
                <img
                  src={camera.image!}
                  alt={camera.label}
                  className={`w-full h-32 object-cover ${
                    camera.status !== 'online' ? 'grayscale opacity-50' : ''
                  }`}
                />
              ) : (
                <div className={`w-full h-32 flex items-center justify-center ${camera.status !== 'online' ? 'opacity-50' : ''}`}>
                  <i className="fa-solid fa-image text-gray-600 text-2xl" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={getStatusColor(camera.status)} className="text-xs">
                  {camera.status === 'online' && <i className="fa-solid fa-circle-dot fa-fade mr-1" />}
                  {camera.status.toUpperCase()}
                </Badge>
              </div>
              <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white font-mono">
                CAM #{camera.id}
              </div>
            </div>

            {/* Camera Info */}
            <div className="flex items-start gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg icon-bg-theme flex items-center justify-center flex-shrink-0">
                <i className={`fa-solid fa-${getCategoryIcon(camera.category)} text-theme-icon`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm truncate group-hover:text-theme-icon transition-colors">
                  {camera.label}
                </h4>
                <p className="text-gray-400 text-xs truncate">
                  <i className="fa-solid fa-location-dot mr-1" />
                  {camera.location}
                </p>
              </div>
            </div>

            {/* Additional Status */}
            {camera.status === 'hacked' && camera.disabledUntil && (
              <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                <p className="text-red-400 text-xs">
                  <i className="fa-solid fa-clock mr-1" />
                  Restoring...
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {filteredCameras.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <i className="fa-solid fa-video-slash text-4xl mb-4 block" />
          No cameras found matching filters
        </div>
      )}
    </div>
  )
}

// Wrapped safe versions for usage throughout the app
export const CameraViewerSafe = withErrorBoundary(CameraViewer, { scopeName: 'CameraViewer', fullScreen: false })
export const CameraGridSafe = withErrorBoundary(CameraGrid, { scopeName: 'CameraGrid', fullScreen: false })
