import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'
import './BookCard.css'

const TYPE_LABEL = { REVIEW_BOOK: 'For Review', USER_BOOK: 'User Book' }
const yearOf = book => book.publicationDate ? String(book.publicationDate).slice(0, 4) : '—'

export default function BookCard({ book, count, index = 0 }) {
  const cover = book.coverImage || book.thumbnailUrl
  const meta = count != null ? `${count} review${count === 1 ? '' : 's'}` : `${TYPE_LABEL[book.bookType] || book.bookType || 'Story'} · ${yearOf(book)}`
  return <motion.div className="discover-motion" role="listitem" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: index * .05 }}>
    <Link className="discover-card" to={`/books/${book.id}`}>
      <div className="discover-poster">{cover ? <img src={cover} alt={book.title} loading="lazy" /> : <div className="discover-fallback">SV</div>}<span className="discover-read">Read story <FiArrowRight /></span></div>
      <div className="discover-info"><h3 className="discover-card-title">{book.title}</h3><p className="discover-meta">{meta}</p></div>
    </Link>
  </motion.div>
}

const SKELETON_CARDS = Array.from({ length: 5 })
export function SkeletonGrid() {
  return <div className="discover-grid discover-grid--skeleton" aria-hidden="true">{SKELETON_CARDS.map((_, i) => <div className="skeleton-card" key={i} />)}</div>
}
