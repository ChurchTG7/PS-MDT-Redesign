import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'
import Input from './Input'
import { fetchNui, onNuiMessage, isEnvBrowser, isDebugEnabled } from '../utils/nui'
import ErrorBoundary from './ErrorBoundary'
import { useAppStore } from '../store/useAppStore'

interface ChatMessage {
  id: number
  officerId: string
  officerName: string
  callsign: string
  message: string
  timestamp: string
  recipientId?: string // For DMs
  recipientName?: string // For DMs
}

interface Officer {
  citizenid: string
  callsign: string
  firstname: string
  lastname: string
  rank: string
}

type ChatTab = 'department' | 'dispatch' | 'dm'

interface DepartmentChatProps {
  isOpen: boolean
  onToggle: () => void
}

export default function DepartmentChat({ isOpen, onToggle }: DepartmentChatProps) {
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
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Load chat history when opened or tab changes
  useEffect(() => {
    if (isOpen) {
      loadChatHistory()
      if (activeTab === 'dm') {
        loadOfficerList()
      }
    }
  }, [isOpen, activeTab])

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
        // Filter out current officer
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
      // Mock data for debug mode
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
    
    // Require officer selection for DMs
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
      // Filter DMs for selected officer
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
    <ErrorBoundary fullScreen={false} scopeName="DepartmentChat">
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-[1.5vh] md:right-[2vh] lg:right-[2.5vh] top-[1.5vh] md:top-[2vh] lg:top-[2.5vh] h-[calc(100%-3vh)] md:h-[calc(100%-4vh)] lg:h-[calc(100%-5vh)] w-[35%] min-w-[280px] max-w-[400px] bg-[rgba(15,23,42,0.98)] border-l shadow-2xl backdrop-blur-xl flex flex-col rounded-l-xl"
          style={{ 
            borderColor: 'rgba(var(--theme-border-rgb), 0.3)',
            zIndex: 100,
            pointerEvents: 'auto'
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'rgba(var(--theme-border-rgb), 0.2)' }}
          >
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-comments text-lg text-theme-icon" />
              <h3 className="text-base font-bold text-white">Communications</h3>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'dm' && (
                <button
                  onClick={() => setShowOfficerSelect(!showOfficerSelect)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[rgba(56,189,248,0.15)] transition-colors"
                  title="Select Officer"
                  aria-label="Select officer to message"
                >
                  <i className="fa-solid fa-user-plus" />
                </button>
              )}
              <button
                onClick={onToggle}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-[rgba(56,189,248,0.15)] transition-colors"
                aria-label="Close chat"
              >
                <i className="fa-solid fa-times" />
              </button>
            </div>
          </div>

          {/* Manila-style Tabs */}
          <div className="flex px-3 pt-2 gap-1">
            <button
              onClick={() => setActiveTab('department')}
              className={`relative px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                activeTab === 'department'
                  ? 'bg-[rgba(15,23,42,1)] text-white border-t-2 border-x border-[rgba(var(--theme-accent-rgb),0.6)] -mb-[1px] z-10'
                  : 'bg-[rgba(11,19,34,0.4)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(11,19,34,0.6)] border border-[rgba(var(--theme-border-rgb),0.2)]'
              }`}
              style={{
                borderBottom: activeTab === 'department' ? '2px solid rgba(15,23,42,1)' : undefined,
              }}
            >
              <i className="fa-solid fa-shield-halved mr-2" />
              Department
            </button>
            <button
              onClick={() => setActiveTab('dispatch')}
              className={`relative px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                activeTab === 'dispatch'
                  ? 'bg-[rgba(15,23,42,1)] text-white border-t-2 border-x border-[rgba(var(--theme-accent-rgb),0.6)] -mb-[1px] z-10'
                  : 'bg-[rgba(11,19,34,0.4)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(11,19,34,0.6)] border border-[rgba(var(--theme-border-rgb),0.2)]'
              }`}
              style={{
                borderBottom: activeTab === 'dispatch' ? '2px solid rgba(15,23,42,1)' : undefined,
              }}
            >
              <i className="fa-solid fa-tower-broadcast mr-2" />
              Dispatch
            </button>
            <button
              onClick={() => setActiveTab('dm')}
              className={`relative px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                activeTab === 'dm'
                  ? 'bg-[rgba(15,23,42,1)] text-white border-t-2 border-x border-[rgba(var(--theme-accent-rgb),0.6)] -mb-[1px] z-10'
                  : 'bg-[rgba(11,19,34,0.4)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(11,19,34,0.6)] border border-[rgba(var(--theme-border-rgb),0.2)]'
              }`}
              style={{
                borderBottom: activeTab === 'dm' ? '2px solid rgba(15,23,42,1)' : undefined,
              }}
            >
              <i className="fa-solid fa-envelope mr-2" />
              Direct
            </button>
          </div>

          {/* Tab content border */}
          <div
            className="border-b"
            style={{ borderColor: 'rgba(var(--theme-border-rgb), 0.2)' }}
          />

          {/* Officer Selection for DMs */}
          {activeTab === 'dm' && showOfficerSelect && (
            <div className="px-4 py-3 bg-[rgba(11,19,34,0.8)] border-b border-[rgba(var(--theme-border-rgb),0.2)] max-h-[200px] overflow-y-auto">
              <p className="text-xs text-[rgba(255,255,255,0.6)] mb-2">Select Officer:</p>
              <div className="space-y-1">
                {availableOfficers.map((off) => (
                  <button
                    key={off.citizenid}
                    onClick={() => {
                      setSelectedOfficer(off)
                      setShowOfficerSelect(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedOfficer?.citizenid === off.citizenid
                        ? 'bg-[rgba(56,189,248,0.2)] border border-[rgba(56,189,248,0.4)] text-white'
                        : 'bg-[rgba(11,19,34,0.6)] border border-[rgba(36,72,176,0.2)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(11,19,34,0.8)]'
                    }`}
                  >
                    <span className="font-semibold text-theme-accent">{off.callsign}</span>
                    <span className="text-[rgba(255,255,255,0.6)] ml-2">
                      {off.firstname} {off.lastname}
                    </span>
                    <span className="text-xs text-[rgba(255,255,255,0.4)] ml-2">({off.rank})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DM Selected Officer Info */}
          {activeTab === 'dm' && selectedOfficer && (
            <div className="px-4 py-2 bg-[rgba(11,19,34,0.6)] border-b border-[rgba(var(--theme-border-rgb),0.2)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-user text-theme-accent text-xs" />
                <span className="text-sm text-white">
                  <span className="font-semibold text-theme-accent">{selectedOfficer.callsign}</span>
                  <span className="text-[rgba(255,255,255,0.7)] ml-2">
                    {selectedOfficer.firstname} {selectedOfficer.lastname}
                  </span>
                </span>
              </div>
              <button
                onClick={() => setSelectedOfficer(null)}
                className="text-xs text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
              >
                <i className="fa-solid fa-times" />
              </button>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-[rgba(255,255,255,0.5)]">
                <i
                  className={`fa-solid ${
                    activeTab === 'department'
                      ? 'fa-shield-halved'
                      : activeTab === 'dispatch'
                      ? 'fa-tower-broadcast'
                      : 'fa-envelope'
                  } text-4xl mb-3 opacity-30`}
                />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">
                  {activeTab === 'dm' && !selectedOfficer
                    ? 'Select an officer to start a conversation'
                    : `Start a conversation in ${activeTab}`}
                </p>
              </div>
            ) : (
              currentMessages.map((msg) => {
                const isOwnMessage = officer && msg.officerId === officer.citizenid
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-[rgba(56,189,248,0.25)] to-[rgba(59,130,246,0.3)] border border-[rgba(56,189,248,0.4)]'
                          : 'bg-[rgba(11,19,34,0.6)] border border-[rgba(36,72,176,0.2)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-theme-accent">
                          {msg.callsign}
                        </span>
                        <span className="text-xs text-[rgba(255,255,255,0.7)]">
                          {msg.officerName}
                        </span>
                        <span className="text-xs text-[rgba(255,255,255,0.4)] ml-auto">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-white leading-relaxed break-words">
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
          <div
            className="px-4 py-3 border-t"
            style={{ borderColor: 'rgba(var(--theme-border-rgb), 0.2)' }}
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-[rgba(11,19,34,0.6)] border border-[rgba(36,72,176,0.3)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[rgba(255,255,255,0.4)] focus:outline-none focus:border-[rgba(56,189,248,0.6)] focus:ring-2 focus:ring-[rgba(56,189,248,0.2)] transition-all"
                disabled={isSending || !officer}
                maxLength={500}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending || !officer}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: !newMessage.trim() || isSending
                    ? 'rgba(100,116,139,0.3)'
                    : 'linear-gradient(to right, rgba(var(--theme-accent-rgb), 0.4), rgba(var(--theme-primary-rgb), 0.5))',
                }}
                aria-label="Send message"
              >
                {isSending ? (
                  <i className="fa-solid fa-spinner fa-spin" />
                ) : (
                  <i className="fa-solid fa-paper-plane" />
                )}
              </button>
            </div>
            <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
              Press Enter to send • {newMessage.length}/500
            </p>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </ErrorBoundary>
  )
}
