import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBookOpen, FiCalendar, FiClock, FiFilm, FiGrid, FiList, FiMoreHorizontal, FiSearch, FiStar, FiUsers, FiX } from 'react-icons/fi'
import { getUser } from '../../services/usersApi'
import { getBook, listBooks } from '../../services/booksApi'
import { listUserReviews } from '../../services/reviewsApi'
import VerdictBadge from '../../components/common/VerdictBadge/VerdictBadge'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import { socialLinks } from '../../utils/socials'
import '../ReviewsPage/ReviewsPage.css'

const filterTabs = [['ALL', 'All'], ['SKIP', 'Skip'], ['TIMEPASS', 'Timepass'], ['GO_FOR_IT', 'Go For It'], ['PERFECTION', 'Perfection']]
const filterClass = key => key === 'ALL' ? '' : ` filter-${key.toLowerCase().replace(/_/g, '-')}`
const mediaType = book => book?.bookType === 'REVIEW_BOOK' ? 'Review Book' : 'Story'
const releaseYear = book => book?.publicationDate ? String(book.publicationDate).slice(0, 4) : '—'
const postedOn = value => new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export default function UserProfilePage({ username }) {
  const [user, setUser] = useState(null)
  const [reviews, setReviews] = useState([])
  const [booksById, setBooksById] = useState({})
  const [books, setBooks] = useState([])
  const [mode, setMode] = useState('reviews')
  const [filter, setFilter] = useState('ALL')
  const [view, setView] = useState('list')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuId, setMenuId] = useState(null)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    getUser(username)
      .then(profile => {
        if (!active) return
        setUser(profile)
        listUserReviews(profile.id, '&size=50').then(page => active && setReviews(page?.content || [])).catch(() => {})
        if (profile.authorId) listBooks(`?authorId=${profile.authorId}&size=50`).then(page => active && setBooks(page?.content || [])).catch(() => {})
      })
      .catch(issue => { if (active) { setNotFound(true); setError(issue.message) } })
    return () => { active = false }
  }, [username])

  useEffect(() => {
    let active = true
    const ids = [...new Set(reviews.map(review => review.bookId))]
    Promise.all(ids.map(id => getBook(id).then(book => [id, book]).catch(() => null)))
      .then(entries => { if (active) setBooksById(Object.fromEntries(entries.filter(Boolean))) })
    return () => { active = false }
  }, [reviews])

  useEffect(() => {
    if (!menuId) return
    const close = () => setMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuId])

  const visibleReviews = useMemo(() => {
    let list = reviews
    if (filter !== 'ALL') list = list.filter(review => review.verdict === filter)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter(review => (review.message || '').toLowerCase().includes(q) || (review.verdict || '').toLowerCase().includes(q))
    return list
  }, [reviews, filter, query])

  const joinedAt = useMemo(() => user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Recently', [user])

const socials = socialLinks(user)

  if (notFound) {
    return <><SharedNav /><main className="reviews-page"><div className="reviews-empty" style={{ gridColumn: '1 / -1' }}><div><FiStar /></div><h2>Reader not found.</h2><p>{error}</p><Link className="button ghost" to="/explore">Back to explore</Link></div></main><Footer /></>
  }

  return <><SharedNav /><main className="reviews-page"><aside className="review-profile-card"><div className="review-profile-avatar">{user?.profileImage ? <img src={user.profileImage} alt="" /> : (user?.name || 'U').slice(0, 1)}</div><h2>{user?.name || 'StoryVerse reader'}</h2><strong>@{user?.username || 'reader'}</strong><div className="review-profile-stats"><span><b>{reviews.length}</b>Reviews Posted</span><span><b>{books.length}</b>Collections</span></div><p>{user?.bio || 'I love stories, books, and thoughtful criticism.'}</p>{socials.length > 0 && <div className="review-socials">{socials.map(link => { const Icon = link.icon; return <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer" title={link.label} aria-label={link.label}><Icon size={15} /></a> })}</div>}<div className="review-follow"><FiCalendar /> Joined {joinedAt}</div></aside><section className="review-feed"><div className="review-mode"><button className={mode === 'reviews' ? 'active' : ''} onClick={() => setMode('reviews')}><FiStar /> Reviews</button><button className={mode === 'collection' ? 'active' : ''} onClick={() => setMode('collection')}><FiBookOpen /> Collections</button></div>{mode === 'reviews' ? <>
    <div className="review-toolbar"><div className="review-filter-tabs">{filterTabs.map(([key, label]) => <button className={filter === key ? `active${filterClass(key)}` : ''} onClick={() => setFilter(key)} key={key}>{label}</button>)}</div><div className="review-actions">{searchOpen && <input className="review-search" autoFocus placeholder="Search reviews…" value={query} onChange={e => setQuery(e.target.value)} />}<button className={`review-icon-btn ${view === 'list' ? 'active' : ''}`} title="List view" onClick={() => setView('list')}><FiList /></button><button className={`review-icon-btn ${view === 'grid' ? 'active' : ''}`} title="Grid view" onClick={() => setView('grid')}><FiGrid /></button><button className={`review-icon-btn ${searchOpen ? 'active' : ''}`} title="Search" onClick={() => { setSearchOpen(value => !value); setQuery('') }}>{searchOpen ? <FiX /> : <FiSearch />}</button></div></div>
    {error && <div className="reviews-empty"><div><FiStar /></div><h2>Feed unavailable.</h2><p>{error}</p></div>}
    {!error && !visibleReviews.length ? <div className="reviews-empty"><div><FiStar /></div><h2>No reviews to show yet.</h2><p>This reader hasn't shared a verdict so far.</p></div> : <div className={`review-list ${view === 'grid' ? 'grid' : ''}`}>{visibleReviews.map(review => { const book = booksById[review.bookId]; return <article className="review-card" key={review.id}><Link className="review-poster" to={`/books/${review.bookId}`}>{book?.coverImage || book?.thumbnailUrl ? <img src={book.coverImage || book.thumbnailUrl} alt="" /> : <span>SV</span>}</Link><div className="review-body"><div className="review-title-row"><div><h3><Link to={`/books/${review.bookId}`}>{book?.title || 'Untitled story'}</Link></h3><p className="review-meta"><span><FiFilm /> {mediaType(book)}</span><span className="dot" /><span>{releaseYear(book)}</span><span className="dot" /><span><FiClock /> {postedOn(review.createdAt)}</span></p></div><VerdictBadge verdict={review.verdict} /></div><p className="review-card-message">{review.message || 'No written note.'}</p><div className="review-card-foot"><div className="review-menu" onClick={e => e.stopPropagation()}><button className="review-menu-btn" title="More" onClick={() => setMenuId(menuId === review.id ? null : review.id)}><FiMoreHorizontal /></button>{menuId === review.id && <div className="review-menu-drop"><Link to={`/books/${review.bookId}`}><FiBookOpen /> View story</Link></div>}</div></div></div></article> })}</div>}
  </> : <>
    <div className="eyebrow">THEIR WORKS</div>
    <h2 className="collection-title">Books they wrote</h2>
    {books.length ? <div className="collection-list">{books.map(book => <div className="collection-row" key={book.id}><Link className="collection-cover" to={`/books/${book.id}`}>{book.coverImage || book.thumbnailUrl ? <img src={book.coverImage || book.thumbnailUrl} alt="" /> : <span>SV</span>}</Link><div className="collection-main"><h3><Link to={`/books/${book.id}`}>{book.title}</Link></h3><p>{book.genre || 'Story'} · {book.language || 'EN'} · {book.bookType === 'REVIEW_BOOK' ? 'Review book' : 'Story'}</p><div className="collection-actions"><Link to={`/books/${book.id}`}>View story</Link></div></div><span className={`collection-status ${book.published ? 'published' : 'draft'}`}>{book.published ? 'Published' : 'Draft'}</span></div>)}</div> : <div className="reviews-empty"><div><FiBookOpen /></div><h2>No collection yet.</h2><p>When this reader writes a story, it will live here.</p></div>}
  </>}</section><aside className="review-aside-right"><div className="review-widget"><FiUsers style={{ fontSize: 22, marginBottom: 10, color: 'var(--sv-violet)' }} /><br />More widgets<br />coming soon.</div></aside></main><Footer /></>
}
