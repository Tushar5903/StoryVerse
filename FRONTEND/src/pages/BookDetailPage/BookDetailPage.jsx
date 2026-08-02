import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { FiArrowLeft } from 'react-icons/fi'
import { getBook } from '../../services/booksApi'
import { listChapters } from '../../services/chaptersApi'
import { createReview, listReviews } from '../../services/reviewsApi'
import UserHandle from '../../components/common/UserHandle/UserHandle'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import './BookDetailPage.css'

const verdicts = [['SKIP', 'Skip', '#FF5F7D'], ['TIMEPASS', 'Timepass', '#F4B400'], ['GO_FOR_IT', 'Go for it', '#00D084'], ['PERFECTION', 'Perfection', '#A855F7']]
const gaugePoint = (degree, cx, cy, radius) => [cx + radius * Math.cos(degree * Math.PI / 180), cy - radius * Math.sin(degree * Math.PI / 180)]
const gaugeArc = (from, to, cx, cy, radius) => { const [x1, y1] = gaugePoint(from, cx, cy, radius); const [x2, y2] = gaugePoint(to, cx, cy, radius); return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}` }
function useCountUp(target, duration = 300) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let frame
    const start = performance.now()
    const step = now => {
      const t = Math.min(1, (now - start) / duration)
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      setValue(Math.round(target * eased))
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}
export function Meter({ reviews, compact = false }) {
  const gaugeCx = compact ? 100 : 200, gaugeCy = compact ? 100 : 200, gaugeRadius = compact ? 85 : 170, gaugeStroke = compact ? 8 : 14, gapAngle = 6
  const counts = verdicts.map(([key]) => reviews.filter(review => review.verdict === key).length)
  const total = counts.reduce((sum, value) => sum + value, 0)
  const peak = total ? Math.max(...counts) : 0
  const percentage = total ? Math.round((peak / total) * 100) : 0
  const [hovered, setHovered] = useState(null)
  const animated = useCountUp(hovered === null ? percentage : (total ? Math.round((counts[hovered] / total) * 100) : 0), compact ? 200 : 300)
  const shares = verdicts.map((_, index) => counts[index] / total)
  const visible = shares.map((share, index) => ({ share, index })).filter(entry => entry.share > 0)
  const available = total ? 180 - (visible.length - 1) * gapAngle : 180
  const segments = visible.reduce((list, entry, position) => {
    const previousVisible = list.reduce((sum, segment) => sum + segment.share, 0)
    const from = previousVisible * available + position * gapAngle
    const [key, , color] = verdicts[entry.index]
    return [...list, { key, color, index: entry.index, share: entry.share, from, to: from + entry.share * available }]
  }, [])
  const activeColor = hovered === null ? (total ? verdicts[counts.indexOf(peak)][2] : '') : verdicts[hovered][2]
  return (
    <div className={compact ? 'review-meter compact' : 'review-meter'}>
      <div className={compact ? 'meter-gauge compact' : 'meter-gauge'}>
        <svg viewBox={compact ? '0 0 200 115' : '0 0 400 230'} className="meter-svg">
          <path d={gaugeArc(180, 0, gaugeCx, gaugeCy, gaugeRadius)} className="meter-track" />
          {segments.map(segment => (
            <path key={`${segment.key}-${Math.round(segment.from)}-${Math.round(segment.to)}`} d={gaugeArc(180 - segment.from, 180 - segment.to, gaugeCx, gaugeCy, gaugeRadius)} className="meter-segment"
              style={{
                stroke: segment.color,
                strokeWidth: gaugeStroke,
                opacity: hovered === null || hovered === segment.index ? 1 : 0.5,
                filter: hovered === segment.index ? `drop-shadow(0 0 6px ${segment.color}) brightness(1.25)` : 'none'
              }} />
          ))}
        </svg>
        <div className="meter-center">
          <strong style={{ color: activeColor || undefined }}>{total ? `${animated}%` : '—'}</strong>
          <span>{total ? `${peak}/${total} Votes` : 'No reviews yet'}</span>
        </div>
      </div>
      {!compact && <div className="meter-legend">{verdicts.map(([key, label, color], index) => (
        <span key={key} className={hovered === index ? 'hovered' : ''} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)}><i style={{ background: color }} />{label} <b style={{ color }}>{total ? `${Math.round((counts[index] / total) * 100)}%` : '0%'}</b></span>
      ))}</div>}
    </div>
  )
}
function ReviewComposer({ bookId, onPosted }) { const user = useSelector(state => state.auth.user); const [verdict, setVerdict] = useState('TIMEPASS'); const [message, setMessage] = useState(''); const [status, setStatus] = useState(''); const submit = async event => { event.preventDefault(); if (!user) { setStatus('Log in to write a review.'); return } try { await createReview({ bookId: Number(bookId), verdict, message }); setMessage(''); setStatus(''); toast.success('Review posted. Thank you for your verdict!'); onPosted() } catch (error) { setStatus(error.message); toast.error(error.message) } }; return <section className="review-composer"><h2>Write a Review</h2>{!user && <p className="login-review-note"><Link to="/login">Log in</Link> to share your verdict.</p>}<form onSubmit={submit}><div className="review-composer-top"><div className="review-user-avatar">{(user?.name || 'U').slice(0, 1)}</div><strong>@{user?.username || 'guest_reader'}</strong><div className="verdict-picker">{verdicts.map(([key, label]) => <button type="button" className={verdict === key ? `selected ${key.toLowerCase()}` : ''} onClick={() => setVerdict(key)} key={key}>{label}</button>)}</div></div><textarea maxLength="1000" value={message} onChange={event => setMessage(event.target.value)} placeholder="Write your review here…" /><div className="review-composer-bottom"><small>{message.length}/1000</small><button className="button" disabled={!user}>Post</button></div>{status && <p className="review-status">{status}</p>}</form></section> }
export default function BookDetailPage({ bookId }) { const [book, setBook] = useState(null); const [chapters, setChapters] = useState([]); const [reviews, setReviews] = useState([]); const [error, setError] = useState(''); const loadReviews = () => listReviews(bookId).then(page => setReviews(page?.content || [])).catch(() => setReviews([])); useEffect(() => { Promise.all([getBook(bookId), listChapters(bookId)]).then(([currentBook, currentChapters]) => { setBook(currentBook); setChapters(currentBook.bookType === 'REVIEW_BOOK' ? [] : currentChapters); loadReviews() }).catch(error => setError(error.message)) }, [bookId]) // eslint-disable-line react-hooks/exhaustive-deps
  const sortedReviews = useMemo(() => [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [reviews]); const showChapters = book && book.bookType !== 'REVIEW_BOOK'; return <><SharedNav /><main className="detail-page"><Link to="/explore" className="detail-back"><FiArrowLeft /> Back to explore</Link>{error ? <div className="error-box">{error}</div> : book ? <><div className="detail-layout"><div className="detail-cover">{book.coverImage || book.thumbnailUrl ? <img src={book.coverImage || book.thumbnailUrl} alt="" /> : <span>SV</span>}</div><div><div className="eyebrow">{book.genre || 'MANUSCRIPT'} · {book.language || 'EN'}</div><h1>{book.title}</h1>{book.authorId ? <Link className="detail-author" to={`/authors/${book.authorId}`}>By {book.authorName || 'Unknown author'}</Link> : <p className="detail-author">By {book.authorName || 'Unknown author'}</p>}<p>{book.description || 'No description has been added yet.'}</p>{showChapters && <div className="chapter-list"><h2>Chapters</h2>{chapters.length ? chapters.map(chapter => <Link to={`/reader?bookId=${book.id}`} key={chapter.id}>Chapter {chapter.chapterNumber}: {chapter.chapterTitle}</Link>) : <span>No chapters published yet.</span>}</div>}</div></div><Meter reviews={reviews} /><ReviewComposer bookId={bookId} onPosted={loadReviews} /><section className="detail-reviews"><h2>Reviews</h2>{sortedReviews.length ? sortedReviews.map(review => <article key={review.id}><div className="review-line"><UserHandle userId={review.userId} user={review} size={32} /><span className={`review-verdict ${String(review.verdict).toLowerCase().replace(/_/g, '')}`}>{String(review.verdict).replace(/_/g, ' ')}</span></div><p>{review.message || 'No written note.'}</p></article>) : <div className="detail-empty">No reviews yet. Be the first to leave a verdict.</div>}</section></> : <div>Loading manuscript…</div>}</main></> }
