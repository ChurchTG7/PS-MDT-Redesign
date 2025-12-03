import React, { useEffect } from 'react'
import Button from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  footer?: React.ReactNode
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  className = '',
}: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={handleOverlayClick}
    >
      <div
        className={`
          relative w-full ${sizeClasses[size]}
          bg-[rgb(var(--surface-primary-rgb))]
          border border-[rgba(var(--outline-rgb),0.2)]
          rounded-lg shadow-2xl
          animate-slideIn
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(var(--outline-rgb),0.2)]">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                text-[rgba(255,255,255,0.6)] hover:text-white
                hover:bg-[rgba(255,255,255,0.05)]
                transition-colors"
            >
              <i className="fa-solid fa-times" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className={`p-6 overflow-y-auto ${size === 'full' ? 'max-h-[calc(95vh-180px)]' : 'max-h-[calc(90vh-180px)]'}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-[rgba(var(--outline-rgb),0.2)] bg-[rgba(11,19,34,0.4)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Confirmation Modal Component
export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}: ConfirmModalProps) {
  const iconClasses = {
    danger: 'fa-triangle-exclamation text-red-400',
    warning: 'fa-circle-exclamation text-yellow-400',
    info: 'fa-circle-info text-theme-icon',
  }

  const confirmVariant = variant === 'danger' ? 'danger' : 'primary'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={!isLoading}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      }
    >
      <div className="flex gap-4 items-start">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[rgba(var(--accent-rgb),0.1)] flex items-center justify-center">
          <i className={`fa-solid ${iconClasses[variant]} text-2xl`} />
        </div>
        <p className="text-[rgba(255,255,255,0.8)] leading-relaxed pt-2">{message}</p>
      </div>
    </Modal>
  )
}

// Form Modal Component (pre-styled for forms)
export interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  title: string
  children: React.ReactNode
  submitText?: string
  cancelText?: string
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Submit',
  cancelText = 'Cancel',
  isLoading = false,
  size = 'md',
}: FormModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(e)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      closeOnOverlayClick={!isLoading}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button type="submit" variant="primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check" />
                {submitText}
              </>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>{children}</form>
    </Modal>
  )
}

// Provide safe HOC wrapped versions for convenience
import withErrorBoundary from './withErrorBoundary'
export const ModalSafe = withErrorBoundary(Modal, { scopeName: 'Modal', fullScreen: false })
export const FormModalSafe = withErrorBoundary(FormModal, { scopeName: 'FormModal', fullScreen: false })
export const ConfirmModalSafe = withErrorBoundary(ConfirmModal, { scopeName: 'ConfirmModal', fullScreen: false })
