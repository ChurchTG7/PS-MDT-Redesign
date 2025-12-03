import React from 'react'
import ErrorBoundary from './ErrorBoundary'

interface Options {
  scopeName?: string
  fullScreen?: boolean
}

export default function withErrorBoundary<P extends Record<string, unknown>>(Component: React.ComponentType<P>, options: Options = {}) {
  const { scopeName, fullScreen = false } = options
  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary fullScreen={fullScreen} scopeName={scopeName}>
      <Component {...props} />
    </ErrorBoundary>
  )
  const name = Component.displayName || Component.name || 'Component'
  Wrapped.displayName = `withErrorBoundary(${name})`
  return Wrapped
}
