import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCalendar, FiClock, FiFilm, FiGrid, FiList, FiMoreHorizontal, FiSearch, FiStar, FiTrash2, FiUsers, FiX, FiBookOpen } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { getMe } from '../../services/usersApi'
import { getBook, listMyBooks } from '../../services/booksApi'
import { deleteReview, listMyReviews } from '../../services/reviewsApi'
import VerdictBadge from '../../components/common/VerdictBadge/VerdictBadge'
import ConfirmModal from '../../components/common/ConfirmModal/ConfirmModal'
import './ReviewsPage.css'

const filterTabs = [['ALL', 'All'], ['SKIP', 'Skip'], ['TIMEPASS', 'Timepass'], ['GO_FOR_IT', 'Go For It'], ['PERFECTION', 'Perfection']]
const filterClass = key => key === 'ALL' ? '' : ` filter-${key.toLowerCase().replace(/_/g, '-')}`
const mediaType = book => book?.bookType === 'REVIEW_BOOK' ? 'Review Book' : 'Story'
const releaseYear = book => book?.publicationDate ? String(book.publicationDate).slice(0, 4) : '—'
const postedOn = value => new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export default function ReviewsPage() {
  const [user, setUser] = useState(null)
  const [reviews, setReviews] = useState([])
  const [booksById, setBooksById] = useState({})
  const [collection, setCollection] = useState([])
  const [mode, setMode] = useState('reviews')
  const [filter, setFilter] = useState('ALL')
  const [view, setView] = useState('list')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuId, setMenuId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getMe().then(setUser).catch(() => {})
    listMyReviews('?size=50').then(page => setReviews(page?.content || [])).catch(issue => setError(issue.message))
    listMyBooks('?size=50').then(page => setCollection(page?.content || [])).catch(() => {})
  }, [])

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

  const removeReview = review => {
    setMenuId(null)
    setPendingDelete(review)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    setDeleting(true)
    deleteReview(pendingDelete.id)
      .then(() => { setReviews(list => list.filter(item => item.id !== pendingDelete.id)); setPendingDelete(null); toast.success('Review deleted.') })
      .catch(err => { setPendingDelete(null); toast.error(err.message) })
      .finally(() => setDeleting(false))
  }

  return <main className="reviews-page"><aside className="review-profile-card"><div className="review-profile-avatar">{user?.profileImage ? <img src={user.profileImage} alt="" /> : (user?.name || 'U').slice(0, 1)}</div><h2>{user?.name || 'StoryVerse reader'}</h2><strong>@{user?.username || 'reader'}</strong><div className="review-profile-stats"><span><b>{reviews.length}</b>Reviews Posted</span><span><b>{collection.length}</b>Collections</span></div><p>{user?.bio || 'I love stories, books, and thoughtful criticism.'}</p><div className="review-follow"><FiCalendar /> Joined recently</div><Link className="button ghost" to="/settings">Edit Profile</Link></aside><section className="review-feed"><div className="review-mode"><button className={mode === 'reviews' ? 'active' : ''} onClick={() => setMode('reviews')}><FiStar /> Reviews</button><button className={mode === 'collection' ? 'active' : ''} onClick={() => setMode('collection')}><FiBookOpen /> Collections</button></div>{mode === 'reviews' ? <>
    <div className="review-toolbar"><div className="review-filter-tabs">{filterTabs.map(([key, label]) => <button className={filter === key ? `active${filterClass(key)}` : ''} onClick={() => setFilter(key)} key={key}>{label}</button>)}</div><div className="review-actions">{searchOpen && <input className="review-search" autoFocus placeholder="Search reviews…" value={query} onChange={e => setQuery(e.target.value)} />}<button className={`review-icon-btn ${view === 'list' ? 'active' : ''}`} title="List view" onClick={() => setView('list')}><FiList /></button><button className={`review-icon-btn ${view === 'grid' ? 'active' : ''}`} title="Grid view" onClick={() => setView('grid')}><FiGrid /></button><button className={`review-icon-btn ${searchOpen ? 'active' : ''}`} title="Search" onClick={() => { setSearchOpen(value => !value); setQuery('') }}>{searchOpen ? <FiX /> : <FiSearch />}</button></div></div>
    {error && <div className="reviews-empty"><div><FiStar /></div><h2>Feed unavailable.</h2><p>{error}</p></div>}
    {!error && !visibleReviews.length ? <div className="reviews-empty"><div><FiStar /></div><h2>No reviews to show yet.</h2><p>Head to a story page and leave your first verdict.</p></div> : <div className={`review-list ${view === 'grid' ? 'grid' : ''}`}>{visibleReviews.map(review => { const book = booksById[review.bookId]; return <article className="review-card" key={review.id}><Link className="review-poster" to={`/books/${review.bookId}`}>{book?.coverImage || book?.thumbnailUrl ? <img src={book.coverImage || book.thumbnailUrl} alt="" /> : <span>SV</span>}</Link><div className="review-body"><div className="review-title-row"><div><h3><Link to={`/books/${review.bookId}`}>{book?.title || 'Untitled story'}</Link></h3><p className="review-meta"><span><FiFilm /> {mediaType(book)}</span><span className="dot" /><span>{releaseYear(book)}</span><span className="dot" /><span><FiClock /> {postedOn(review.createdAt)}</span></p></div><VerdictBadge verdict={review.verdict} /></div><p className="review-card-message">{review.message || 'No written note.'}</p><div className="review-card-foot"><div className="review-menu" onClick={e => e.stopPropagation()}><button className="review-menu-btn" title="More" onClick={() => setMenuId(menuId === review.id ? null : review.id)}><FiMoreHorizontal /></button>{menuId === review.id && <div className="review-menu-drop"><Link to={`/books/${review.bookId}`}><FiBookOpen /> View story</Link><button className="danger" onClick={() => removeReview(review)}><FiTrash2 /> Delete review</button></div>}</div></div></div></article> })}</div>}
  </> : <>
    <div className="eyebrow">YOUR COLLECTION</div>
    <h2 className="collection-title">Books you wrote</h2>
    {collection.length ? <div className="collection-list">{collection.map(book => <div className="collection-row" key={book.id}><Link className="collection-cover" to={`/books/${book.id}`}>{book.coverImage || book.thumbnailUrl ? <img src={book.coverImage || book.thumbnailUrl} alt="" /> : <span>SV</span>}</Link><div className="collection-main"><h3><Link to={`/books/${book.id}`}>{book.title}</Link></h3><p>{book.genre || 'Story'} · {book.language || 'EN'} · {book.bookType === 'REVIEW_BOOK' ? 'Review book' : 'Story'}</p><div className="collection-actions"><Link to={`/books/${book.id}/edit`}>Edit</Link><Link to={`/write?bookId=${book.id}`}>Chapters</Link></div></div><span className={`collection-status ${book.published ? 'published' : 'draft'}`}>{book.published ? 'Published' : 'Draft'}</span></div>)}</div> : <div className="reviews-empty"><div><FiBookOpen /></div><h2>No collection yet.</h2><p>When you write a story, it will live here.</p></div>}
  </>}</section><aside className="review-aside-right"><div className="review-widget"><FiUsers style={{ fontSize: 22, marginBottom: 10, color: 'var(--sv-violet)' }} /><br />More widgets<br />coming soon.</div></aside>{pendingDelete && <ConfirmModal title="Delete this review?" message={`Your ${String(pendingDelete.verdict).replace('_', ' ').toLowerCase()} verdict on this story will be permanently removed. This action cannot be undone.`} pending={deleting} onConfirm={confirmDelete} onCancel={() => { setPendingDelete(null); setDeleting(false) }} />}</main>
}
