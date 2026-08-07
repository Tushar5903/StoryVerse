import { FiStar } from 'react-icons/fi'
import './ReviewEmptyState.css'

export default function ReviewEmptyState({ title = 'No reviews yet', text = 'Be the first to share your verdict.', ctaLabel = '', onCta }) {
  return <div className="review-empty">
    <div className="review-empty-icon"><FiStar size={20} /></div>
    <h3>{title}</h3>
    <p>{text}</p>
    {ctaLabel && <button type="button" className="button" onClick={onCta}>{ctaLabel}</button>}
  </div>
}
