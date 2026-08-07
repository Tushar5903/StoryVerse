import { memo, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit3, FiMoreHorizontal, FiTrash2 } from 'react-icons/fi'
import UserAvatar from '../../common/UserAvatar/UserAvatar'
import VerdictBadge from '../../common/VerdictBadge/VerdictBadge'
import VerifiedBadge from '../VerifiedBadge/VerifiedBadge'
import { formatReviewDate } from '../../../utils/dates'
import './ReviewItem.css'

export const TRUNCATE_AT = 280
const CLAMP_HEIGHT = 100
const ANIMATION_MS = 300

const paragraphs = message => String(message || '').split(/\n+/).filter(Boolean)

function ReviewItemInner({ review, user, timestampMode = 'relative', onEdit, onDelete, defaultExpanded = false }) {
  const message = String(review.message || '').trim()
  const long = message.length > TRUNCATE_AT
  const [expanded, setExpanded] = useState(defaultExpanded)
  const bodyRef = useRef(null)
  const rafRef = useRef(0)
  const animTokenRef = useRef(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const close = event => { if (!menuRef.current?.contains(event.target)) setMenuOpen(false) }
    const onKey = event => { if (event.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('click', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', onKey)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const toggle = () => {
    const element = bodyRef.current
    const token = ++animTokenRef.current
    if (element) {
      cancelAnimationFrame(rafRef.current)
      if (!expanded) {
        element.style.maxHeight = `${element.scrollHeight}px`
        rafRef.current = requestAnimationFrame(() => {
          setTimeout(() => { if (animTokenRef.current === token) element.style.maxHeight = 'none' }, ANIMATION_MS)
        })
        setExpanded(true)
      } else {
        element.style.maxHeight = `${element.scrollHeight}px`
        rafRef.current = requestAnimationFrame(() => {
          element.style.maxHeight = `${CLAMP_HEIGHT}px`
        })
        setExpanded(false)
      }
    } else {
      setExpanded(value => !value)
    }
  }

  const isOwn = Boolean(user && review.userId === user.id)
  const canDelete = Boolean(user && (isOwn || user.role === 'ADMIN'))
  const profileUrl = review.username ? `/users/${review.username}` : `/users/${review.userId}`

  return (
    <article className={`review-item${long ? ' review-item-long' : ''}`}>
      <div className="review-item-head">
        <Link className="review-author" to={profileUrl} aria-label={`View ${review.name || review.username || 'user'} profile`}>
          <UserAvatar user={review} size={48} />
          <span className="review-author-info">
            <span className="review-author-name">{review.name || review.username || 'reader'}<VerifiedBadge visible={!!review.verified} /></span>
            <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt, timestampMode)}</time>
          </span>
        </Link>
        <VerdictBadge verdict={review.verdict} />
      </div>
      <div className="review-item-body" ref={bodyRef} style={long && !expanded ? { maxHeight: `${CLAMP_HEIGHT}px`, overflow: 'hidden', maskImage: 'linear-gradient(#000 calc(100% - 26px), transparent)' } : undefined}>
        {paragraphs(message).map((part, index) => <p key={index}>{part}</p>)}
      </div>
      <div className="review-item-foot">
        {long && <button type="button" className="review-expand" onClick={toggle} aria-expanded={expanded}>{expanded ? 'Show less' : '… more'}</button>}
        {(isOwn && onEdit) || canDelete ? (
          <span className="review-more" ref={menuRef}>
            <button type="button" className="review-more-btn" aria-label="More options" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}><FiMoreHorizontal size={18} /></button>
            {menuOpen && <div className="review-more-drop" role="menu">
              {isOwn && onEdit && <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onEdit(review) }}><FiEdit3 size={14} /> Edit Review</button>}
              {canDelete && onDelete && <button type="button" role="menuitem" className="danger" onClick={() => { setMenuOpen(false); onDelete(review) }}><FiTrash2 size={14} /> Delete Review</button>}
            </div>}
          </span>
        ) : null}
      </div>
    </article>
  )
}

const ReviewItem = memo(ReviewItemInner)
export default ReviewItem
