import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

// Global error handlers to capture non-React errors and unhandled rejections.
// These log to console and keep the app from silently failing.
window.addEventListener('error', (ev) => {
  try {
    // eslint-disable-next-line no-console
    console.error('[MDT][Global Error]', ev.error || ev.message || ev)
    // Send to server
    try { (window as any).psReportClientError ? (window as any).psReportClientError(ev.error || { message: ev.message }) : null } catch (e) {}
  } catch (e) {}
})

window.addEventListener('unhandledrejection', (ev) => {
  try {
    // eslint-disable-next-line no-console
    console.error('[MDT][Unhandled Rejection]', ev.reason)
    // Send to server
    try { (window as any).psReportClientError ? (window as any).psReportClientError(ev.reason || { message: 'Unhandled rejection' }) : null } catch (e) {}
  } catch (e) {}
})
