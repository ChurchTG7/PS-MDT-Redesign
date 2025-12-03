/**
 * Custom React hooks for ps-mdt
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchNui, onNuiMessage, type NuiMessageType, type NuiCallbackType } from './nui'
import type { NuiApiResponse } from '../types/api'

/**
 * Hook for fetching data from NUI with loading and error states
 * @param action The NUI handler to call
 * @param initialData Initial data value
 * @param autoFetch Whether to fetch on mount
 */
export function useFetchNui<T>(
  action: NuiCallbackType,
  initialData: T | null = null,
  autoFetch: boolean = true
) {
  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState<boolean>(autoFetch)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const fetch = useCallback(
    async (payload?: Record<string, unknown>) => {
      setLoading(true)
      setError(null)
      let response: NuiApiResponse<T> | undefined
      try {
        response = await fetchNui<T>(action, payload)
        if (response?.success && response.data) {
          setData(response.data)
          setError(null)
        } else {
          setError(response?.error || 'Failed to fetch data')
          console.error(`[ps-mdt] Error fetching ${action}:`, response?.error)
        }
      } catch (err) {
        console.error(`[ps-mdt] Unexpected error fetching ${action}:`, err)
        setError('Unexpected error occurred')
        response = { success: false, error: String(err) }
      }

      setLoading(false)
      return response
    },
    [action]
  )

  const refetch = useCallback((payload?: Record<string, unknown>) => {
    setRefetchTrigger((prev) => prev + 1)
    return fetch(payload)
  }, [fetch])

  useEffect(() => {
    if (autoFetch || refetchTrigger > 0) {
      fetch()
    }
  }, [autoFetch, refetchTrigger, fetch])

  return { data, loading, error, refetch, setData }
}

/**
 * Hook for listening to NUI messages from Lua
 * @param action The message type to listen for
 * @param handler Callback function when message is received
 */
export function useNuiListener<T = unknown>(
  action: NuiMessageType,
  handler: (data: T) => void
) {
  useEffect(() => {
    const cleanup = onNuiMessage<T>(action, handler)
    return cleanup
  }, [action, handler])
}

/**
 * Hook for handling real-time updates
 * @param updateType The type of update to listen for
 * @param handler Callback function when update is received
 */
export function useRealtimeUpdate<T = unknown>(
  updateType: string,
  handler: (data: T) => void
) {
  useEffect(() => {
    const cleanup = onNuiMessage<{ type: string; data: T; playSound?: boolean }>(
      'realtimeUpdate',
      (message) => {
        if (message.type === updateType) {
          handler(message.data)
          
          // Play notification sound if requested
          if (message.playSound) {
            playNotificationSound()
          }
        }
      }
    )
    return cleanup
  }, [updateType, handler])
}

/**
 * Hook for handling form submission with loading state
 * @param action The NUI handler to call
 * @param onSuccess Callback on success
 * @param onError Callback on error
 */
export function useNuiSubmit<TPayload = unknown, TResponse = unknown>(
  action: NuiCallbackType,
  onSuccess?: (data: TResponse) => void,
  onError?: (error: string) => void
) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(
    async (payload: TPayload) => {
      setSubmitting(true)
      setError(null)
      let response: NuiApiResponse<TResponse> | undefined
      try {
        response = await fetchNui<TResponse>(action, payload as Record<string, unknown>)

        if (response?.success && response.data) {
          onSuccess?.(response.data)
          setError(null)
        } else {
          const errorMsg = response?.error || 'Submission failed'
          setError(errorMsg)
          onError?.(errorMsg)
        }
      } catch (err) {
        console.error('[ps-mdt] Unexpected error in submit:', err)
        const msg = 'Unexpected error occurred'
        setError(msg)
        onError?.(msg)
        response = { success: false, error: String(err) }
      }

      setSubmitting(false)
      return response
    },
    [action, onSuccess, onError]
  )

  return { submit, submitting, error }
}

/**
 * Hook for periodic data refresh
 * @param fetchFn Function to call for refresh
 * @param interval Refresh interval in milliseconds
 * @param enabled Whether refresh is enabled
 */
export function useAutoRefresh(
  fetchFn: () => void | Promise<void>,
  interval: number = 30000,
  enabled: boolean = true
) {
  const savedCallback = useRef(fetchFn)

  useEffect(() => {
    savedCallback.current = fetchFn
  }, [fetchFn])

  useEffect(() => {
    if (!enabled) return

    const tick = () => {
      savedCallback.current()
    }

    const id = setInterval(tick, interval)
    return () => clearInterval(id)
  }, [interval, enabled])
}

/**
 * Hook for managing visibility state with ESC key handling
 */
export function useMdtVisibility() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const cleanup = onNuiMessage<boolean>('setVisible', (isVisible) => {
      setVisible(isVisible)
    })

    // Handle ESC key to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        fetchNui('close')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      cleanup()
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible])

  return visible
}

/**
 * Hook for search with debouncing
 * @param searchAction The NUI handler for search
 * @param debounceMs Debounce delay in milliseconds
 */
export function useSearch<T>(
  searchAction: NuiCallbackType,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<number>()

  const search = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        setResults([])
        return
      }

      setLoading(true)

      try {
        const response = await fetchNui<T[]>(searchAction, { query: searchQuery })
        if (response.success && response.data) {
          setResults(response.data)
        } else {
          setResults([])
        }
      } catch (err) {
        console.error('[ps-mdt] Unexpected error in search:', err)
        setResults([])
      }

      setLoading(false)
    },
    [searchAction]
  )

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (query) {
        search(query)
      } else {
        setResults([])
      }
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, search, debounceMs])

  return { query, setQuery, results, loading }
}

/**
 * Hook for pagination
 */
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = items.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  }
}

/**
 * Helper function to play notification sound
 */
function playNotificationSound() {
  // Create a simple beep sound using Web Audio API
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (error) {
    console.warn('[ps-mdt] Could not play notification sound:', error)
  }
}
