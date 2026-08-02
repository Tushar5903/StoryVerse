import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listBooks } from '../../services/booksApi'
import { listReviews } from '../../services/reviewsApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import { Meter } from '../BookDetailPage/BookDetailPage'
import { scoreOf } from '../../utils/verdicts'
import './LeaderboardPage.css'

const filters = [['ALL', 'All', 'violet'], ['PERFECTION', 'Perfection', 'violet'], ['GO_FOR_IT', 'Go For It', 'teal'], ['TIMEPASS', 'Timepass', 'amber'], ['SKIP', 'Skip', 'coral']]

export default function LeaderboardPage() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [sort, setSort] = useState('votes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    listBooks('?size=100')
      .then(page => Promise.all((page.content || []).map(book =>
        listReviews(book.id, '&size=200').then(reviewPage => ({ book, reviews: reviewPage.content || [] })).catch(() => ({ book, reviews: [] }))
      )))
      .then(all => { if (active) { setRows(all); setLoading(false) } })
      .catch(issue => { if (active) { setError(issue.message); setLoading(false) } })
    return () => { active = false }
  }, [])
  const ranked = useMemo(() => {
    const withStats = rows.map(({ book, reviews }) => ({ book, reviews, votes: reviews.length, score: scoreOf(reviews) })).filter(item => item.votes > 0)
    const pool = filter === 'ALL' ? withStats : withStats.filter(item => item.reviews.some(review => review.verdict === filter))
    const sorted = [...pool].sort((a, b) => sort === 'votes'
      ? b.votes - a.votes || b.score - a.score || new Date(b.book.updatedAt) - new Date(a.book.updatedAt)
      : b.score - a.score || b.votes - a.votes || new Date(b.book.updatedAt) - new Date(a.book.updatedAt))
    return sorted.slice(0, 10)
  }, [rows, filter, sort])
  return <><SharedNav /><main className="leaderboard-page"><aside><div className="eyebrow">FILTER BY</div>{filters.map(([key, label, color]) => <button className={`verdict-filter ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)} key={key}><i className={color} />{label}</button>)}<div className="eyebrow sort-label">SORT BY</div><select className="leader-sort" value={sort} onChange={event => setSort(event.target.value)}><option value="votes">Most reviewed</option><option value="score">Highest rated</option></select></aside><section><div className="eyebrow">THE PEOPLE'S VERDICT</div><h1>Top 10 books.</h1>{error ? <div className="leader-error">{error}</div> : loading ? <div className="leader-error">Counting the votes…</div> : <div className="ranked-list">{ranked.map((item, index) => <div className="ranked-row" key={item.book.id}><strong>{String(index + 1).padStart(2, '0')}</strong><div className="rank-cover">{item.book.coverImage || item.book.thumbnailUrl ? <img src={item.book.coverImage || item.book.thumbnailUrl} alt="" /> : <span>SV</span>}</div><div className="rank-copy"><Link to={`/books/${item.book.id}`}><h2>{item.book.title}</h2></Link><p>{item.book.authorName || 'Unknown author'} · {item.votes} review{item.votes === 1 ? '' : 's'}</p></div><Meter reviews={item.reviews} compact /></div>)}</div>}{!error && !loading && !ranked.length && <div className="leader-error">No ranking records found for this filter yet. Be the first to leave a verdict.</div>}</section></main></>
}
