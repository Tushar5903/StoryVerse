import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderboard } from '../../services/booksApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import { Meter } from '../BookDetailPage/BookDetailPage'
import SortDropdown from '../../components/reviews/SortDropdown/SortDropdown'
import { VERDICT_SCORE } from '../../utils/verdicts'
import { CATEGORIES } from '../../components/review-meter/constants'
import { cloudinaryUrl } from '../../utils/cloudinary'
import './LeaderboardPage.css'

const filters = [['ALL', 'All', 'violet'], ['PERFECTION', 'Perfection', 'violet'], ['GO_FOR_IT', 'Go For It', 'teal'], ['TIMEPASS', 'Timepass', 'amber'], ['SKIP', 'Skip', 'coral']]

const SORTS = [['votes', 'Most reviewed'], ['score', 'Highest rated']]

const TYPE_TABS = [['ALL', 'All'], ['USER_BOOK', 'Stories'], ['REVIEW_BOOK', 'Review Books']]

const TYPE_LABEL = { REVIEW_BOOK: 'Review Book', USER_BOOK: 'Story' }

const scoreOfCounts = counts => {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  if (!total) return 0
  const weighted = Object.entries(counts).reduce((sum, [verdict, n]) => sum + (VERDICT_SCORE[verdict] ?? 0) * n, 0)
  return weighted / total
}

const expandVerdicts = verdicts => Object.entries(verdicts || {}).flatMap(([verdict, count]) => Array.from({ length: count }, () => ({ verdict })))

function MeterBar({ reviews }) {
  const total = reviews.length
  const counts = reviews.reduce((map, review) => { map[review.verdict] = (map[review.verdict] || 0) + 1; return map }, {})
  const segments = total > 0
    ? CATEGORIES.map(category => ({ ...category, width: ((counts[category.key] || 0) / total) * 100 }))
    : []
  const label = total > 0 ? segments.map(segment => `${segment.label} ${Math.round(segment.width)}%`).join(', ') : 'No reviews yet'
  return <div className="lb-meter" role="img" aria-label={`Verdict distribution: ${label}`}>{segments.map(segment => <span key={segment.key} style={{ background: segment.color, flexBasis: `${segment.width}%` }} />)}</div>
}

function LeaderboardRow({ item, index }) {
  const rankClass = index === 0 ? ' r1' : index === 1 ? ' r2' : index === 2 ? ' r3' : ''
  return (
    <div className="lb-item">
      <span className={`lb-rank${rankClass}`}>{index + 1}</span>
      <Link className="lb-poster" to={`/books/${item.book.id}`} aria-label={`Open ${item.book.title}`}>
        {item.book.coverImage || item.book.thumbnailUrl
          ? <img src={cloudinaryUrl(item.book.coverImage || item.book.thumbnailUrl, { width: 200 })} alt={item.book.title} loading="lazy" />
          : <span>SV</span>}
      </Link>
      <div className="lb-info">
        <h3><Link to={`/books/${item.book.id}`}>{item.book.title}</Link></h3>
        <p>{TYPE_LABEL[item.book.bookType] || 'Story'} · {item.book.publicationDate ? String(item.book.publicationDate).slice(0, 4) : '—'}</p>
      </div>
      <MeterBar reviews={item.reviews} />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="lb-item lb-skeleton-row">
      <span className="lb-rank sk" />
      <span className="lb-poster sk" />
      <span className="lb-info sk" />
      <span className="lb-meter sk" />
    </div>
  )
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [type, setType] = useState('ALL')
  const [sort, setSort] = useState('votes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fetchRows = useCallback(() => getLeaderboard('?limit=100')
    .then(entries => (entries || []).map(entry => ({ book: entry.book, votes: entry.votes ?? 0, verdicts: entry.verdicts || {} }))), [])
  useEffect(() => {
    let active = true
    fetchRows()
      .then(all => { if (active) { setRows(all); setLoading(false) } })
      .catch(issue => { if (active) { setError(issue.message); setLoading(false) } })
    return () => { active = false }
  }, [fetchRows])
  const retry = () => {
    setLoading(true)
    setError('')
    fetchRows()
      .then(all => { setRows(all); setLoading(false) })
      .catch(issue => { setError(issue.message); setLoading(false) })
  }
  const ranked = useMemo(() => {
    const withStats = rows
      .map(({ book, votes, verdicts }) => ({ book, votes, counts: verdicts, score: scoreOfCounts(verdicts) }))
      .filter(item => item.votes > 0)
    const verdictPool = filter === 'ALL' ? withStats : withStats.filter(item => (item.counts[filter] || 0) > 0)
    const pool = type === 'ALL' ? verdictPool : verdictPool.filter(item => item.book.bookType === type)
    const sorted = [...pool].sort((a, b) => sort === 'votes'
      ? b.votes - a.votes || b.score - a.score || new Date(b.book.updatedAt) - new Date(a.book.updatedAt)
      : b.score - a.score || b.votes - a.votes || new Date(b.book.updatedAt) - new Date(a.book.updatedAt))
    return sorted.slice(0, 10).map(item => ({ ...item, reviews: expandVerdicts(item.counts) }))
  }, [rows, filter, sort, type])
  return <>
    <SharedNav />
    <main className="leaderboard-page">
      <div className="lb-desktop">
        <aside>
          <div className="eyebrow">FILTER BY</div>
          {filters.map(([key, label, color]) => <button className={`verdict-filter ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)} key={key}><i className={color} />{label}</button>)}
          <div className="eyebrow sort-label">CONTENT TYPE</div>
          {TYPE_TABS.map(([key, label]) => <button className={`verdict-filter${type === key ? ' active' : ''}`} onClick={() => setType(key)} key={key}>{label}</button>)}
          <div className="eyebrow sort-label">SORT BY</div>
          <select className="leader-sort" value={sort} onChange={event => setSort(event.target.value)}>
            <option value="votes">Most reviewed</option>
            <option value="score">Highest rated</option>
          </select>
        </aside>

        <section>
          <div className="eyebrow">THE PEOPLE'S VERDICT</div>
          <h1>Top 10 books.</h1>
          {error ? <div className="leader-error">{error}</div>
            : loading ?
              <div className="leader-error">Counting the votes…</div>
              : <div className="ranked-list">{ranked.map((item, index) => <div className="ranked-row" key={item.book.id}>
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                <div className="rank-cover">
                  {item.book.coverImage || item.book.thumbnailUrl ? <img src={cloudinaryUrl(item.book.coverImage || item.book.thumbnailUrl, { width: 300 })} alt="" /> : <span>SV</span>}
                </div>
                <div className="rank-copy">
                  <Link to={`/books/${item.book.id}`}>
                    <h2>{item.book.title}</h2>
                  </Link>
                  <p>{item.book.authorName || 'Unknown author'} · {item.votes} review{item.votes === 1 ? '' : 's'}</p>
                </div>
                <Meter reviews={item.reviews} compact /></div>)}</div>}{!error && !loading && !ranked.length &&
                  <div className="leader-error">No ranking records found for this filter yet. Be the first to leave a verdict.</div>}
        </section>
      </div>
      <div className="lb-mobile">
        <div className="eyebrow">THE PEOPLE'S VERDICT</div>
        <h1>Top 10 books.</h1>
        <div className="lb-filter-bar">
          <div className="lb-pill-strip" role="group" aria-label="Filter by verdict">
            {filters.map(([key, label, color]) => <button type="button" className={`lb-pill${filter === key ? ' active' : ''}`} aria-pressed={filter === key} onClick={() => setFilter(key)} key={key}><i className={color} />{label}</button>)}
          </div>
          <SortDropdown variant="panel" prefix="" value={sort} onChange={setSort} options={SORTS} />
        </div>
        <div className="lb-tabs" role="tablist" aria-label="Content type">{TYPE_TABS.map(([key, label]) => <button type="button" role="tab" className={`lb-tab${type === key ? ' active' : ''}`} aria-selected={type === key} onClick={() => setType(key)} key={key}>{label}</button>)}
        </div>
        {error ? <div className="lb-state"><p>Unable to load leaderboard.</p>
          <button type="button" className="lb-retry" onClick={retry}>Try Again</button>
        </div> : loading ? <div className="lb-list">{[...Array(5)].map((_, index) => <SkeletonRow key={index} />)}</div> : ranked.length ? <div className="lb-list">{ranked.map((item, index) => <LeaderboardRow item={item} index={index} key={item.book.id} />)}
        </div>
          :
          <div className="lb-state">
            <p>No rankings available for this filter yet. Be the first to leave a verdict.</p>
          </div>}
      </div>
    </main>
    <Footer />
  </>
}
