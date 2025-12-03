import React, { useState, useEffect } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Input from '../components/Input'
import { fetchNui, isDebugEnabled, setDebugEnabled } from '../utils/nui'
import { useFetchNui } from '../utils/hooks'
import { useAppStore } from '../store/useAppStore'
import type { Settings } from '../types/api'

export default function SettingsPage() {
  const officer = useAppStore((s) => s.officer)
  const setOfficerInStore = useAppStore((s) => s.setOfficer)
  const canAccessChief = useAppStore((s) => s.canAccessChief)
  
  // Fetch current settings
  const {
    data: settings,
    loading: loadingSettings,
    error: settingsError,
    refetch: refetchSettings,
  } = useFetchNui<Settings>('getSettings', null)

  // Local state for settings (synced with server data)
  const [notifications, setNotifications] = useState(false)
  const [sounds, setSounds] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const [showMugshots, setShowMugshots] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light' | 'blue'>('dark')
  const [debugMode, setDebugMode] = useState(isDebugEnabled())
  const [isSaving, setIsSaving] = useState(false)
  
  // Officer Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profilePhone, setProfilePhone] = useState(officer?.phone || '')
  const [profileImage, setProfileImage] = useState(officer?.image || '')
  const [profileBio, setProfileBio] = useState(officer?.bio || '')
  const [profilePreferredName, setProfilePreferredName] = useState(officer?.preferredName || '')
  const [profileEmail, setProfileEmail] = useState(officer?.email || '')
  const [profileCallsign, setProfileCallsign] = useState(officer?.callsign || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Sync local state with server data when settings load
  useEffect(() => {
    if (settings) {
      setNotifications(settings.notifications)
      setSounds(settings.soundEnabled)
      setAutoRefresh(settings.autoRefresh)
      setRefreshInterval(settings.refreshInterval || 30)
      setShowMugshots(settings.showMugshots)
      setCompactMode(settings.compactMode)
      setTheme(settings.theme)
    }
  }, [settings])
  
  // Sync officer profile data when officer changes
  useEffect(() => {
    if (officer) {
      setProfilePhone(officer.phone || '')
      setProfileImage(officer.image || '')
      setProfileBio(officer.bio || '')
      setProfilePreferredName(officer.preferredName || '')
      setProfileEmail(officer.email || '')
      setProfileCallsign(officer.callsign || '')
    }
  }, [officer])

  const handleUpdateSettings = async (updates: Partial<Settings>) => {
    setIsSaving(true)
    try {
      const response = await fetchNui('updateSettings', updates)
      if (response.success) {
        refetchSettings() // Refresh settings from server
      } else {
        alert(`Failed to update settings: ${response.error}`)
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      alert('Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleNotifications = () => {
    const newValue = !notifications
    setNotifications(newValue)
    handleUpdateSettings({ notifications: newValue })
  }

  const handleToggleSounds = () => {
    const newValue = !sounds
    setSounds(newValue)
    handleUpdateSettings({ soundEnabled: newValue })
  }

  const handleToggleAutoRefresh = () => {
    const newValue = !autoRefresh
    setAutoRefresh(newValue)
    handleUpdateSettings({ autoRefresh: newValue })
  }

  const handleToggleShowMugshots = () => {
    const newValue = !showMugshots
    setShowMugshots(newValue)
    handleUpdateSettings({ showMugshots: newValue })
  }

  const handleToggleCompactMode = () => {
    const newValue = !compactMode
    setCompactMode(newValue)
    handleUpdateSettings({ compactMode: newValue })
  }

  const handleChangeRefreshInterval = (value: number) => {
    setRefreshInterval(value)
    handleUpdateSettings({ refreshInterval: value })
  }

  const handleChangeTheme = (newTheme: 'dark' | 'light' | 'blue') => {
    setTheme(newTheme)
    handleUpdateSettings({ theme: newTheme })
  }

  const handleToggleDebugMode = () => {
    const newValue = !debugMode
    setDebugMode(newValue)
    setDebugEnabled(newValue)
    // Notify about debug mode change (notifications handled by server if not in browser)
    if (!isDebugEnabled()) {
      fetchNui('notifyDebugMode', { enabled: newValue }).catch(() => {})
    }
  }
  
  const handleSaveProfile = async () => {
    if (!officer) return
    
    setIsSavingProfile(true)
    try {
      const updatedProfile = {
        phone: profilePhone,
        image: profileImage,
        bio: profileBio,
        preferredName: profilePreferredName,
        email: profileEmail,
        callsign: profileCallsign,
      }
      
      const response = await fetchNui('updateOfficerProfile', updatedProfile)
      
      if (response.success) {
        // Update officer in store with new data
        setOfficerInStore({
          ...officer,
          ...updatedProfile,
        })
        setIsEditingProfile(false)
        // Success notification handled by server
      } else {
        // Error notification handled by server
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      // Error notification handled by server
    } finally {
      setIsSavingProfile(false)
    }
  }
  
  const handleCancelEdit = () => {
    // Reset form to current officer data
    if (officer) {
      setProfilePhone(officer.phone || '')
      setProfileImage(officer.image || '')
      setProfileBio(officer.bio || '')
      setProfilePreferredName(officer.preferredName || '')
      setProfileEmail(officer.email || '')
      setProfileCallsign(officer.callsign || '')
    }
    setIsEditingProfile(false)
  }

  return (
    <div className="space-y-6">
      {/* Officer Profile */}
      <Card 
        title="Officer Profile"
        subtitle="Manage your personal information and profile details"
        headerAction={
          !isEditingProfile ? (
            <Button 
              size="sm" 
              variant="primary"
              onClick={() => setIsEditingProfile(true)}
              disabled={!officer}
            >
              <i className="fa-solid fa-pen" />
              Edit Profile
            </Button>
          ) : null
        }
      >
        {!officer ? (
          <div className="flex items-center justify-center py-12">
            <i className="fa-solid fa-spinner fa-spin text-2xl spinner-theme mr-2" />
            <p className="text-white">Loading officer data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="flex items-center gap-6 p-4 bg-[rgba(11,19,34,0.4)] rounded-lg">
              <div className="relative">
                {isEditingProfile ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[rgba(56,189,248,0.3)] bg-gradient-to-br from-[rgba(56,189,248,0.15)] to-[rgba(30,58,138,0.15)]">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover bg-[rgba(15,23,42,0.8)]"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const icon = document.createElement('div');
                            icon.className = 'fallback-icon w-full h-full flex items-center justify-center bg-gradient-to-br from-[rgba(56,189,248,0.15)] to-[rgba(30,58,138,0.15)]';
                            icon.innerHTML = '<i class="fa-solid fa-user-shield text-5xl text-white opacity-35"></i>';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fa-solid fa-user-shield text-5xl text-white opacity-35" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[rgba(56,189,248,0.3)] bg-gradient-to-br from-[rgba(56,189,248,0.15)] to-[rgba(30,58,138,0.15)]">
                    {officer.image ? (
                      <img 
                        src={officer.image} 
                        alt="Profile" 
                        className="w-full h-full object-cover bg-[rgba(15,23,42,0.8)]"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const icon = document.createElement('div');
                            icon.className = 'fallback-icon w-full h-full flex items-center justify-center bg-gradient-to-br from-[rgba(56,189,248,0.15)] to-[rgba(30,58,138,0.15)]';
                            icon.innerHTML = '<i class="fa-solid fa-user-shield text-5xl text-white opacity-35"></i>';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fa-solid fa-user-shield text-5xl text-white opacity-35" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-white">
                    {officer.firstname} {officer.lastname}
                  </h3>
                  <Badge variant="info">{isEditingProfile ? profileCallsign : officer.callsign}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-[rgba(255,255,255,0.7)]">
                    <i className="fa-solid fa-shield text-theme-icon" />
                    <span>{officer.rank}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[rgba(255,255,255,0.7)]">
                    <i className="fa-solid fa-building text-theme-icon" />
                    <span>{officer.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[rgba(255,255,255,0.7)]">
                    <i className="fa-solid fa-id-badge text-theme-icon" />
                    <span>Badge #{officer.badgeNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[rgba(255,255,255,0.7)]">
                    <i className="fa-solid fa-fingerprint text-theme-icon" />
                    <span>{officer.citizenid}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Callsign"
                    placeholder="e.g., 1-A-12"
                    value={profileCallsign}
                    onChange={(e) => setProfileCallsign(e.target.value)}
                    icon={<i className="fa-solid fa-radio" />}
                  />
                  <Input
                    label="Preferred Name"
                    placeholder="How you'd like to be called"
                    value={profilePreferredName}
                    onChange={(e) => setProfilePreferredName(e.target.value)}
                    icon={<i className="fa-solid fa-user" />}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    placeholder="555-0123"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    icon={<i className="fa-solid fa-phone" />}
                  />
                  <Input
                    label="Email Address"
                    placeholder="officer@department.gov"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    icon={<i className="fa-solid fa-envelope" />}
                    type="email"
                  />
                </div>
                
                <div>
                  <Input
                    label="Profile Image URL"
                    placeholder="Leave blank to use default officer silhouette"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    icon={<i className="fa-solid fa-id-card" />}
                  />
                  <div className="text-xs text-[rgba(255,255,255,0.5)] mt-1 ml-1 space-y-1">
                    <p>
                      <i className="fa-solid fa-shield-halved mr-1 text-theme-icon" />
                      <strong className="text-[rgba(255,255,255,0.7)]">Recommended:</strong> Use your official ID card photo URL
                    </p>
                    <p>
                      <i className="fa-solid fa-circle-info mr-1" />
                      Leave blank to display a professional officer silhouette icon
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[rgba(255,255,255,0.9)]">
                    Bio / Notes
                  </label>
                  <textarea
                    className="w-full bg-[rgba(11,19,34,0.6)] border border-[rgba(36,72,176,0.3)] rounded-lg px-4 py-2 text-white placeholder:text-[rgba(255,255,255,0.4)] focus:outline-none focus:border-[rgba(56,189,248,0.6)] focus:ring-2 focus:ring-[rgba(56,189,248,0.2)] transition-all resize-none"
                    placeholder="Enter a brief bio or notes about yourself..."
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <span className="text-xs text-[rgba(255,255,255,0.5)]">
                    {profileBio.length}/500 characters
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-[rgba(36,72,176,0.2)]">
                  <Button
                    variant="success"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="flex-1"
                  >
                    {isSavingProfile ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={isSavingProfile}
                    className="flex-1"
                  >
                    <i className="fa-solid fa-times" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Contact Information */}
                <div className="p-4 bg-[rgba(11,19,34,0.4)] rounded-lg">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-address-book text-theme-icon" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {officer.preferredName && (
                      <div>
                        <p className="text-xs text-[rgba(255,255,255,0.5)] mb-1">Preferred Name</p>
                        <p className="text-sm text-white">{officer.preferredName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-[rgba(255,255,255,0.5)] mb-1">Phone</p>
                      <p className="text-sm text-white">{officer.phone || 'Not set'}</p>
                    </div>
                    {officer.email && (
                      <div>
                        <p className="text-xs text-[rgba(255,255,255,0.5)] mb-1">Email</p>
                        <p className="text-sm text-white">{officer.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {officer.bio && (
                  <div className="p-4 bg-[rgba(11,19,34,0.4)] rounded-lg">
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <i className="fa-solid fa-file-lines text-theme-icon" />
                      Bio
                    </h4>
                    <p className="text-sm text-[rgba(255,255,255,0.8)] leading-relaxed">
                      {officer.bio}
                    </p>
                  </div>
                )}
                
                {!officer.bio && !officer.preferredName && !officer.email && (
                  <div className="p-6 text-center text-[rgba(255,255,255,0.5)]">
                    <i className="fa-solid fa-circle-info text-2xl mb-2" />
                    <p className="text-sm">No additional profile information set.</p>
                    <p className="text-xs mt-1">Click "Edit Profile" to add more details.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Preferences */}
      <Card title="Preferences">
        {loadingSettings ? (
                    <div className="flex items-center justify-center py-12">
            <i className="fa-solid fa-spinner fa-spin text-2xl spinner-theme mr-2" />
            <p className="text-white">Loading settings...</p>
          </div>
        ) : settingsError ? (
          <div className="text-center py-8 text-red-400">
            <i className="fa-solid fa-exclamation-triangle text-2xl mb-2" />
            <p>Failed to load settings</p>
            <Button size="sm" variant="primary" onClick={() => refetchSettings()} className="mt-3">
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Notifications */}
            <div className="flex items-center justify-between p-4 bg-[rgba(11,19,34,0.4)] rounded-lg">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-bell text-xl text-theme-icon" />
                <div>
                  <p className="font-semibold text-white">Notifications</p>
                  <p className="text-xs text-[rgba(255,255,255,0.6)]">
                    Receive alerts for new incidents and BOLOs
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleNotifications}
                disabled={isSaving}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  notifications ? 'bg-green-500' : 'bg-gray-600'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Sound Effects */}
            <div className="flex items-center justify-between p-4 bg-[rgba(11,19,34,0.4)] rounded-lg">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-volume-high text-xl text-theme-icon" />
                <div>
                  <p className="font-semibold text-white">Sound Effects</p>
                  <p className="text-xs text-[rgba(255,255,255,0.6)]">
                    Play sounds for alerts and notifications
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleSounds}
                disabled={isSaving}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  sounds ? 'bg-green-500' : 'bg-gray-600'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    sounds ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto Refresh */}
            <div className="flex items-center justify-between p-4 bg-[rgba(11,19,34,0.4)] rounded-lg">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-arrows-rotate text-xl text-theme-icon" />
                <div>
                  <p className="font-semibold text-white">Auto Refresh</p>
                  <p className="text-xs text-[rgba(255,255,255,0.6)]">
                    Automatically update data every {refreshInterval} seconds
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleAutoRefresh}
                disabled={isSaving}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  autoRefresh ? 'bg-green-500' : 'bg-gray-600'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    autoRefresh ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Refresh Interval */}
            {autoRefresh && (
              <div className="flex items-center justify-between p-4 bg-[rgba(11,19,34,0.4)] rounded-lg">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-clock text-xl text-theme-icon" />
                  <div>
                    <p className="font-semibold text-white">Refresh Interval</p>
                    <p className="text-xs text-[rgba(255,255,255,0.6)]">
                      How often to refresh data
                    </p>
                  </div>
                </div>
                <select
                  value={refreshInterval}
                  onChange={(e) => handleChangeRefreshInterval(Number(e.target.value))}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-[rgba(11,19,34,0.6)] border-2 border-[rgba(36,72,176,0.2)] text-white focus:outline-none focus:border-[#38BDF8] transition-colors"
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>
            )}

            {/* Show Mugshots */}
            <div className="flex items-center justify-between p-4 bg-[rgba(11,19,34,0.4)] rounded-lg">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-image text-xl text-theme-icon" />
                <div>
                  <p className="font-semibold text-white">Show Mugshots</p>
                  <p className="text-xs text-[rgba(255,255,255,0.6)]">
                    Display profile photos in search results
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleShowMugshots}
                disabled={isSaving}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  showMugshots ? 'bg-green-500' : 'bg-gray-600'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    showMugshots ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Compact Mode */}
            <div className="flex items-center justify-between p-4 bg-[rgba(11,19,34,0.4)] rounded-lg">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-compress text-xl text-theme-icon" />
                <div>
                  <p className="font-semibold text-white">Compact Mode</p>
                  <p className="text-xs text-[rgba(255,255,255,0.6)]">
                    Reduce spacing for more content on screen
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleCompactMode}
                disabled={isSaving}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  compactMode ? 'bg-green-500' : 'bg-gray-600'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    compactMode ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Developer Settings - Admin Only */}
      {canAccessChief && (
        <Card title="Developer Settings">
          <div className="space-y-4">
            {/* Debug Mode */}
            <div className="flex items-center justify-between p-4 bg-[rgba(11,19,34,0.4)] rounded-lg border-2 border-[rgba(255,193,7,0.3)]">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-bug text-xl text-yellow-400" />
                <div>
                  <p className="font-semibold text-white">Debug Mode</p>
                  <p className="text-xs text-[rgba(255,255,255,0.6)]">
                    Enable all pages with mock data for development and testing
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleDebugMode}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  debugMode ? 'bg-yellow-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    debugMode ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {debugMode && (
              <div className="p-4 bg-[rgba(255,193,7,0.1)] border border-[rgba(255,193,7,0.3)] rounded-lg">
                <div className="flex items-start gap-2 text-yellow-400">
                  <i className="fa-solid fa-info-circle text-lg mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold mb-1">Debug Mode Active</p>
                    <ul className="list-disc list-inside space-y-1 text-[rgba(255,255,255,0.7)]">
                      <li>All navigation pages are enabled (including Chief Menu)</li>
                      <li>Mock data is used instead of real server data</li>
                      <li>NUI calls are intercepted and return sample data</li>
                      <li>Perfect for testing UI without a FiveM server</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Appearance */}
      <Card title="Appearance">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleChangeTheme('dark')}
            disabled={isSaving}
            className={`p-4 rounded-xl text-left transition-all ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-[rgba(56,189,248,0.2)] to-[rgba(30,58,138,0.15)] border-2 border-[rgba(56,189,248,0.5)]'
                : 'bg-[rgba(11,19,34,0.4)] border border-[rgba(36,72,176,0.2)] hover:border-[rgba(56,189,248,0.3)]'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <i className="fa-solid fa-moon text-xl text-theme-icon" />
              {theme === 'dark' && <i className="fa-solid fa-check text-green-400" />}
            </div>
            <p className="font-semibold text-white">Dark Theme</p>
            <p className="text-xs text-[rgba(255,255,255,0.6)]">
              {theme === 'dark' ? 'Current theme' : 'Classic dark'}
            </p>
          </button>
          <button
            onClick={() => handleChangeTheme('blue')}
            disabled={isSaving}
            className={`p-4 rounded-xl text-left transition-all ${
              theme === 'blue'
                ? 'bg-gradient-to-br from-[rgba(56,189,248,0.2)] to-[rgba(30,58,138,0.15)] border-2 border-[rgba(56,189,248,0.5)]'
                : 'bg-[rgba(11,19,34,0.4)] border border-[rgba(36,72,176,0.2)] hover:border-[rgba(56,189,248,0.3)]'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <i className="fa-solid fa-droplet text-xl text-blue-500" />
              {theme === 'blue' && <i className="fa-solid fa-check text-green-400" />}
            </div>
            <p className="font-semibold text-white">Blue Theme</p>
            <p className="text-xs text-[rgba(255,255,255,0.6)]">
              {theme === 'blue' ? 'Current theme' : 'Ocean blue'}
            </p>
          </button>
          <button
            disabled
            className="p-4 bg-[rgba(11,19,34,0.4)] border border-[rgba(36,72,176,0.2)] rounded-xl text-left opacity-50 cursor-not-allowed"
          >
            <i className="fa-solid fa-sun text-xl text-yellow-400 mb-2" />
            <p className="font-semibold text-white">Light Theme</p>
            <p className="text-xs text-[rgba(255,255,255,0.6)]">Coming soon</p>
          </button>
        </div>
      </Card>

      {/* Save Status */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2" style={{ backgroundColor: 'var(--theme-primary)' }}>
          <i className="fa-solid fa-spinner fa-spin" />
          <span>Saving settings...</span>
        </div>
      )}
    </div>
  )
}
