import React, { Component, ErrorInfo, ReactNode } from 'react'
import { fetchNui, isDebugEnabled, reportClientError } from '../utils/nui'

interface Props {
  children: ReactNode
  /** When true, display full-screen overlay (default: true) */
  fullScreen?: boolean
  /** Small name used to label the scope when rendering inline fallback */
  scopeName?: string
  /** Optional callback for reporting the error back to the app */
  onError?: (error: Error, errorInfo?: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  // A key to force remount of children on retry to prevent persistent broken trees
  resetKey: number
}

/**
 * Error Boundary component to catch React errors and prevent full crash
 * Shows a recovery UI and allows reloading the MDT
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, resetKey: 0 }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MDT Error Boundary] Caught error:', error, errorInfo)
    // Call optional callback but make sure it can't throw
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo)
      } catch (e) {
        // ignore
      }
    }
    // Send error report back to server if possible
    try {
      reportClientError({ message: error.message, stack: (error as any).stack, extra: { scope: this.props.scopeName } })
    } catch (e) {
      // ignore sending errors
    }
  }

  handleReload = () => {
    this.setState((prev) => ({ hasError: false, error: null, resetKey: prev.resetKey + 1 }))
  }

  handleClose = async () => {
    await fetchNui('close')
  }

  render() {
    if (this.state.hasError) {
      const fullScreen = this.props.fullScreen ?? true
      const errorMessage = this.state.error?.message || 'Unknown error'

      if (fullScreen) {
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm z-50">
            <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <i className="fa-solid fa-triangle-exclamation text-red-400 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">MDT Error</h2>
                  <p className="text-sm text-slate-400">Something went wrong</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                The MDT encountered an unexpected error. You can try reloading or close the MDT.
              </p>
              {this.state.error && (
                <div className="bg-slate-900/50 rounded-lg p-3 mb-4 max-h-24 overflow-auto">
                  <code className="text-xs text-red-400 font-mono">
                    {errorMessage}
                  </code>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                >
                  <i className="fa-solid fa-rotate-right mr-2" />
                  Reload MDT
                </button>
                <button
                  onClick={this.handleClose}
                  className="py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      }

      // Inline fallback for per-page boundaries
      return (
        <div className="p-3 bg-[rgba(255,0,0,0.03)] border border-red-500/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-triangle-exclamation text-red-500" />
            <div>
              <div className="font-semibold text-white">{this.props.scopeName ? `${this.props.scopeName} Error` : 'Component Error'}</div>
              <div className="text-xs text-[rgba(255,255,255,0.6)]">An error occurred rendering this section.</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={this.handleReload}
              className="py-1 px-2 bg-blue-600 text-white rounded-md text-sm"
            >
              Retry
            </button>
            <button
              onClick={this.handleClose}
              className="py-1 px-2 bg-slate-700 text-white rounded-md text-sm"
            >
              Close
            </button>
            {isDebugEnabled() && (
              <div className="ml-auto text-xs font-mono text-red-400">{errorMessage}</div>
            )}
          </div>
        </div>
      )
    }

    return <div key={`error-boundary:${this.state.resetKey}`}>{this.props.children}</div>
  }
}
