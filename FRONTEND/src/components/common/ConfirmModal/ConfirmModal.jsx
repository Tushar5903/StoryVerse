import { useEffect } from 'react'
import { FiAlertTriangle, FiX } from 'react-icons/fi'
import './ConfirmModal.css'

export default function ConfirmModal({ title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', pending = false, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return <div className="confirm-overlay" onClick={onCancel}>
    <div className="confirm-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
      <button className="confirm-close" onClick={onCancel} aria-label="Close"><FiX /></button>
      <div className="confirm-icon"><FiAlertTriangle /></div>
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="confirm-actions">
        <button className="confirm-cancel" onClick={onCancel} disabled={pending}>{cancelLabel}</button>
        <button className="confirm-danger" onClick={onConfirm} disabled={pending}>{pending ? 'Deleting…' : confirmLabel}</button>
      </div>
    </div>
  </div>
}
