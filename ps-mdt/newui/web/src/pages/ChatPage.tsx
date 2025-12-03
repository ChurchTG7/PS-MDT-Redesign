import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { fetchNui, onNuiMessage, isEnvBrowser, isDebugEnabled } from '../utils/nui'
import ErrorBoundary from '../components/ErrorBoundary'
import { useAppStore } from '../store/useAppStore'

interface ChatMessage {
  id: number
  officerId: string
  officerName: string
  callsign: string
  message: string
  timestamp: string
  recipientId?: string
  recipientName?: string
}

interface Officer {
  citizenid: string
  callsign: string
  firstname: string
  lastname: string
  rank: string
}

type ChatTab = 'department' | 'dispatch' | 'dm'

export default function ChatPage() {
  const officer = useAppStore((s) => s.officer)
  const [activeTab, setActiveTab] = useState<ChatTab>('department')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [dispatchMessages, setDispatchMessages] = useState<ChatMessage[]>([])
  const [dmMessages, setDmMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showOfficerSelect, setShowOfficerSelect] = useState(false)
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null)
  const [availableOfficers, setAvailableOfficers] = useState<Officer[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, dispatchMessages, dmMessages])

  // Focus input when tab changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeTab])

  // Load chat history when tab changes
  useEffect(() => {
    loadChatHistory()
    if (activeTab === 'dm') {
      loadOfficerList()
    }
  }, [activeTab])

  // Listen for new chat messages
  useEffect(() => {
    const cleanupDept = onNuiMessage<ChatMessage>('deptChatMessage', (msg) => {
      if (!msg.recipientId) {
        setMessages((prev) => [...prev, msg])
      }
    })

    const cleanupDispatch = onNuiMessage<ChatMessage>('dispatchChatMessage', (msg) => {
      setDispatchMessages((prev) => [...prev, msg])
    })

    const cleanupDm = onNuiMessage<ChatMessage>('dmChatMessage', (msg) => {
      if (msg.recipientId) {
        setDmMessages((prev) => [...prev, msg])
      }
    })

    const cleanupHistory = onNuiMessage<ChatMessage[]>('deptChatHistory', (history) => {
      setMessages(history || [])
    })

    const cleanupDispatchHistory = onNuiMessage<ChatMessage[]>('dispatchChatHistory', (history) => {
      setDispatchMessages(history || [])
    })

    const cleanupDmHistory = onNuiMessage<ChatMessage[]>('dmChatHistory', (history) => {
      setDmMessages(history || [])
    })

    return () => {
      cleanupDept()
      cleanupDispatch()
      cleanupDm()
      cleanupHistory()
      cleanupDispatchHistory()
      cleanupDmHistory()
    }
  }, [])

  // Load officer list for DMs
  const loadOfficerList = async () => {
    if (isEnvBrowser() || isDebugEnabled()) {
      setAvailableOfficers([
        { citizenid: 'ABC12345', callsign: '1A-12', firstname: 'John', lastname: 'Mitchell', rank: 'Officer' },
        { citizenid: 'DEF67890', callsign: '1A-15', firstname: 'Sarah', lastname: 'Rodriguez', rank: 'Sergeant' },
        { citizenid: 'GHI13579', callsign: '2A-01', firstname: 'Michael', lastname: 'Hayes', rank: 'Lieutenant' },
      ])
      return
    }

    try {
      const response = await fetchNui<Officer[]>('getOnlineOfficers')
      if (response.success && response.data) {
        const others = response.data.filter((o) => o.citizenid !== officer?.citizenid)
        setAvailableOfficers(others)
      }
    } catch (error) {
      console.error('[MDT] Failed to load officers:', error)
    }
  }

  // Load chat history from server
  const loadChatHistory = async () => {
    if (isEnvBrowser() || isDebugEnabled()) {
      setMessages([
        {
          id: 1,
          officerId: 'ABC12345',
          officerName: 'J. Mitchell',
          callsign: '1A-12',
          message: 'All units, be advised - traffic stop on Route 68',
          timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        },
        {
          id: 2,
          officerId: 'DEF67890',
          officerName: 'S. Rodriguez',
          callsign: '1A-15',
          message: '10-4, responding to backup',
          timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
        },
        {
          id: 3,
          officerId: 'GHI13579',
          officerName: 'M. Hayes',
          callsign: '2A-01',
          message: 'Dispatch, show me 10-7 for Code 7',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        },
      ])
      setDispatchMessages([
        {
          id: 1,
          officerId: 'dispatch',
          officerName: 'Dispatch',
          callsign: 'DISP',
          message: '10-15 - Robbery in progress at 24/7 on Grove Street',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        },
      ])
      return
    }

    try {
      let response
      if (activeTab === 'department') {
        response = await fetchNui<ChatMessage[]>('getDepartmentChat')
        if (response.success && response.data) {
          setMessages(response.data)
        }
      } else if (activeTab === 'dispatch') {
        response = await fetchNui<ChatMessage[]>('getDispatchChat')
        if (response.success && response.data) {
          setDispatchMessages(response.data)
        }
      } else if (activeTab === 'dm' && selectedOfficer) {
        response = await fetchNui<ChatMessage[]>('getDMChat', { recipientId: selectedOfficer.citizenid })
        if (response.success && response.data) {
          setDmMessages(response.data)
        }
      }
    } catch (error) {
      console.error('[MDT] Failed to load chat history:', error)
    }
  }

  // Send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !officer) return
    
    if (activeTab === 'dm' && !selectedOfficer) {
      alert('Please select an officer to message')
      return
    }

    const messageText = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    try {
      let response
      if (activeTab === 'department') {
        response = await fetchNui('sendDepartmentChat', { message: messageText })
      } else if (activeTab === 'dispatch') {
        response = await fetchNui('sendDispatchChat', { message: messageText })
      } else if (activeTab === 'dm' && selectedOfficer) {
        response = await fetchNui('sendDMChat', {
          message: messageText,
          recipientId: selectedOfficer.citizenid,
        })
      }

      if (response && !response.success) {
        setNewMessage(messageText)
        alert('Failed to send message')
      }
    } catch (error) {
      console.error('[MDT] Failed to send message:', error)
      setNewMessage(messageText)
      alert('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  // Handle Enter key to send
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  // Get current messages based on active tab
  const getCurrentMessages = () => {
    if (activeTab === 'department') return messages
    if (activeTab === 'dispatch') return dispatchMessages
    if (activeTab === 'dm') {
      return selectedOfficer
        ? dmMessages.filter(
            (m) =>
              (m.officerId === officer?.citizenid && m.recipientId === selectedOfficer.citizenid) ||
              (m.officerId === selectedOfficer.citizenid && m.recipientId === officer?.citizenid)
          )
        : []
    }
    return []
  }

  const currentMessages = getCurrentMessages()

  return (
    <div className="w-full h-full flex gap-0 overflow-hidden">
      {/* Left Sidebar - Discord-style Channels */}
      <div className="w-[240px] flex-shrink-0 bg-[rgba(11,19,34,0.9)] border-r flex flex-col"
        style={{ borderColor: 'rgba(var(--theme-border-rgb),0.3)' }}
      >
        {/* Server Header */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(var(--theme-border-rgb),0.2)' }}>
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <i className="fa-solid fa-tower-cell text-theme-accent" />
            Police Communications
          </h2>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Text Channels Header */}
          <div className="px-2 py-1 mb-1">
            <p className="text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
              Text Channels
            </p>
          </div>

          {/* Department Channel */}
          <button
            onClick={() => setActiveTab('department')}
            className={`w-full px-2 py-2 mb-1 rounded flex items-center gap-2 text-left transition-all ${
              activeTab === 'department'
                ? 'bg-[rgba(var(--theme-accent-rgb),0.2)] text-white'
                : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
            }`}
          >
            <i className="fa-solid fa-hashtag text-sm" />
            <span className="text-sm font-medium">department</span>
          </button>

          {/* Dispatch Channel */}
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`w-full px-2 py-2 mb-1 rounded flex items-center gap-2 text-left transition-all ${
              activeTab === 'dispatch'
                ? 'bg-[rgba(var(--theme-accent-rgb),0.2)] text-white'
                : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
            }`}
          >
            <i className="fa-solid fa-hashtag text-sm" />
            <span className="text-sm font-medium">dispatch</span>
          </button>

          {/* Direct Messages Header */}
          <div className="px-2 py-1 mt-4 mb-1">
            <p className="text-xs font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
              Direct Messages
            </p>
          </div>

          {/* Add DM Button */}
          <button
            onClick={() => {
              setActiveTab('dm')
              setShowOfficerSelect(true)
            }}
            className="w-full px-2 py-2 mb-2 rounded flex items-center gap-2 text-left transition-all text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
          >
            <i className="fa-solid fa-plus text-sm" />
            <span className="text-sm font-medium">New Message</span>
          </button>

          {/* Active DM Conversations */}
          {selectedOfficer && (
            <button
              onClick={() => setActiveTab('dm')}
              className={`w-full px-2 py-2 mb-1 rounded flex items-center gap-2 text-left transition-all ${
                activeTab === 'dm'
                  ? 'bg-[rgba(var(--theme-accent-rgb),0.2)] text-white'
                  : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-[rgba(var(--theme-accent-rgb),0.3)] flex items-center justify-center text-xs font-bold">
                {selectedOfficer.firstname[0]}{selectedOfficer.lastname[0]}
              </div>
              <span className="text-sm font-medium truncate">
                {selectedOfficer.firstname} {selectedOfficer.lastname}
              </span>
            </button>
          )}
        </div>

        {/* Current User Info */}
        <div className="p-3 bg-[rgba(0,0,0,0.2)] border-t" style={{ borderColor: 'rgba(var(--theme-border-rgb),0.2)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[rgba(var(--theme-accent-rgb),0.4)] to-[rgba(var(--theme-primary-rgb),0.5)] flex items-center justify-center text-xs font-bold text-white">
              {officer?.firstname?.[0]}{officer?.lastname?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {officer?.firstname} {officer?.lastname}
              </p>
              <p className="text-xs text-[rgba(255,255,255,0.5)] truncate">
                {officer?.callsign}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Officer Selection Modal */}
      {activeTab === 'dm' && showOfficerSelect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-50"
          onClick={() => setShowOfficerSelect(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[rgba(15,23,42,0.98)] border rounded-lg p-6 max-w-2xl w-full mx-4"
            style={{ borderColor: 'rgba(var(--theme-border-rgb),0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Select Officer</h3>
              <button
                onClick={() => setShowOfficerSelect(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-all"
              >
                <i className="fa-solid fa-times" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
              {availableOfficers.map((off) => (
                <button
                  key={off.citizenid}
                  onClick={() => {
                    setSelectedOfficer(off)
                    setShowOfficerSelect(false)
                  }}
                  className="text-left px-4 py-3 rounded-lg text-sm transition-all bg-[rgba(11,19,34,0.6)] border text-[rgba(255,255,255,0.8)] hover:bg-[rgba(var(--theme-accent-rgb),0.2)] hover:border-[rgba(var(--theme-accent-rgb),0.5)]"
                  style={{ borderColor: 'rgba(var(--theme-border-rgb),0.2)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[rgba(var(--theme-accent-rgb),0.3)] flex items-center justify-center text-sm font-bold">
                      {off.firstname[0]}{off.lastname[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        <span className="text-theme-accent">{off.callsign}</span>
                        <span className="ml-2">{off.firstname} {off.lastname}</span>
                      </p>
                      <p className="text-xs text-[rgba(255,255,255,0.5)]">{off.rank}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Main Chat Area - Discord-style */}
      <ErrorBoundary fullScreen={false} scopeName="ChatArea">
        <div className="flex-1 flex flex-col bg-[rgba(15,23,42,0.5)]">
        {/* Channel Header */}
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'rgba(var(--theme-border-rgb),0.2)' }}>
          {activeTab === 'dm' && selectedOfficer ? (
            <>
              <div className="w-8 h-8 rounded-full bg-[rgba(var(--theme-accent-rgb),0.3)] flex items-center justify-center text-sm font-bold">
                {selectedOfficer.firstname[0]}{selectedOfficer.lastname[0]}
              </div>
              <div>
                <h3 className="text-white font-bold text-base">
                  {selectedOfficer.firstname} {selectedOfficer.lastname}
                </h3>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">
                  {selectedOfficer.callsign} • {selectedOfficer.rank}
                </p>
              </div>
            </>
          ) : (
            <>
              <i className={`fa-solid ${activeTab === 'department' ? 'fa-hashtag' : 'fa-hashtag'} text-[rgba(255,255,255,0.6)]`} />
              <div>
                <h3 className="text-white font-bold text-base">{activeTab}</h3>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">
                  {activeTab === 'department' ? 'Department communications' : 'All LEO dispatch channel'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-[rgba(255,255,255,0.5)]">
              <div className="w-16 h-16 rounded-full bg-[rgba(var(--theme-accent-rgb),0.1)] flex items-center justify-center mb-4">
                <i
                  className={`fa-solid ${
                    activeTab === 'department'
                      ? 'fa-hashtag'
                      : activeTab === 'dispatch'
                      ? 'fa-hashtag'
                      : 'fa-at'
                  } text-2xl text-[rgba(255,255,255,0.3)]`}
                />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                Welcome to #{activeTab}
              </h4>
              <p className="text-sm">
                {activeTab === 'dm' && !selectedOfficer
                  ? 'Select an officer to start a conversation'
                  : 'This is the beginning of your conversation'}
              </p>
            </div>
          ) : (
            currentMessages.map((msg, index) => {
              const prevMsg = index > 0 ? currentMessages[index - 1] : null
              const showAvatar = !prevMsg || prevMsg.officerId !== msg.officerId
              const isOwnMessage = officer && msg.officerId === officer.citizenid
              
              return (
                <div key={msg.id} className={`flex gap-3 hover:bg-[rgba(255,255,255,0.02)] -mx-2 px-2 py-1 rounded ${!showAvatar && 'mt-0'}`}>
                  {showAvatar ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgba(var(--theme-accent-rgb),0.3)] to-[rgba(var(--theme-primary-rgb),0.4)] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {msg.officerName.split(' ').map(n => n[0]).join('')}
                    </div>
                  ) : (
                    <div className="w-10 flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs text-[rgba(255,255,255,0.3)] opacity-0 group-hover:opacity-100">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {showAvatar && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">
                          {msg.officerName}
                        </span>
                        <span className="text-xs font-semibold text-theme-accent">
                          {msg.callsign}
                        </span>
                        <span className="text-xs text-[rgba(255,255,255,0.4)]">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-[rgba(255,255,255,0.9)] leading-relaxed break-words">
                      {msg.message}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4">
          <div className="flex gap-2 items-center bg-[rgba(11,19,34,0.6)] border rounded-lg px-3 py-2"
            style={{ borderColor: 'rgba(var(--theme-border-rgb),0.3)' }}
          >
            <button className="text-[rgba(255,255,255,0.5)] hover:text-white transition-all p-2">
              <i className="fa-solid fa-plus text-lg" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                activeTab === 'dm' && !selectedOfficer
                  ? 'Select an officer to start chatting'
                  : `Message ${activeTab === 'dm' ? selectedOfficer?.firstname : '#' + activeTab}`
              }
              className="flex-1 bg-transparent text-sm text-white placeholder:text-[rgba(255,255,255,0.4)] focus:outline-none"
              disabled={isSending || !officer || (activeTab === 'dm' && !selectedOfficer)}
              maxLength={500}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending || !officer || (activeTab === 'dm' && !selectedOfficer)}
              className="text-[rgba(255,255,255,0.5)] hover:text-theme-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed p-2"
            >
              {isSending ? (
                <i className="fa-solid fa-spinner fa-spin text-lg" />
              ) : (
                <i className="fa-solid fa-paper-plane text-lg" />
              )}
            </button>
          </div>
          <p className="text-xs text-[rgba(255,255,255,0.4)] mt-2 px-1">
            {newMessage.length}/500
          </p>
        </div>
      </div>
    </ErrorBoundary>
    </div>
  )
}
