import { useEffect } from 'react'
import { FiCheckCircle, FiX } from 'react-icons/fi'
import './CompletionModal.css'

export default function CompletionModal({ bookTitle, onExplore, onCancel }) {
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return <div className="completion-overlay" onClick={onCancel}>
    <div className="completion-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
      <button className="completion-close" onClick={onCancel} aria-label="Close"><FiX /></button>
      <div className="completion-icon"><FiCheckCircle /></div>
      <h3>Congratulations!</h3>
      <p>You finished reading {bookTitle ? <strong>{bookTitle}</strong> : 'this book'}. A quiet triumph — what should you explore next?</p>
      <div className="completion-actions">
        <button className="completion-cancel" onClick={onCancel}>Cancel</button>
        <button className="completion-explore" onClick={onExplore}>Explore</button>
      </div>
    </div>
  </div>
}
