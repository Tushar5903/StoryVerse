import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiArrowLeft } from 'react-icons/fi'
import { getBook } from '../../services/booksApi'
import { listReviews } from '../../services/reviewsApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import ReviewList from '../../components/reviews/ReviewList/ReviewList'
import SortDropdown from '../../components/reviews/SortDropdown/SortDropdown'
import './AllReviewsPage.css'

const TABS = [['ALL', 'All'], ['SKIP', 'Skip'], ['TIMEPASS', 'Timepass'], ['GO_FOR_IT', 'Go For It'], ['PERFECTION', 'Perfection']]
const PAGE_SIZE = 30

export default function AllReviewsPage({ bookId }) {
  const user = useSelector(state => state.auth.user)
  const [book, setBook] = useState(null)
  const [bookError, setBookError] = useState('')
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [sort, setSort] = useState('createdAt,desc')
  const [tab, setTab] = useState('ALL')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const sentinelRef = useRef(null)
  const busyRef = useRef(false)

  useEffect(() => {
    getBook(bookId).then(setBook).catch(issue => setBookError(issue.message))
  }, [bookId])

  const load = useCallback(async (targetPage, replace, activeSort, activeTab) => {
    if (busyRef.current) return
    busyRef.current = true
    if (replace) setLoading(true)
    else setLoadingMore(true)
    const params = new URLSearchParams({ size: String(PAGE_SIZE), page: String(targetPage), sort: activeSort })
    if (activeTab !== 'ALL') params.set('verdict', activeTab)
    try {
      const result = await listReviews(bookId, `&${params}`)
      const items = result?.content || []
      setReviews(previous => replace ? items : [...previous, ...items])
      setHasMore(targetPage + 1 < (result?.totalPages ?? 1))
      setPage(targetPage)
      setError('')
    } catch (issue) {
      if (replace) setError(issue.message)
    } finally {
      busyRef.current = false
      setLoading(false)
      setLoadingMore(false)
    }
  }, [bookId])

  useEffect(() => {
    const timeout = setTimeout(() => load(0, true, sort, tab), 0)
    return () => clearTimeout(timeout)
  }, [sort, tab, load])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || loading || loadingMore) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) load(page + 1, false, sort, tab)
    }, { rootMargin: '320px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, page, sort, tab, load])

  return <><SharedNav /><main className="all-reviews-page">
    <header className="all-reviews-head">
      <Link to={`/books/${bookId}`} className="all-reviews-back" aria-label="Back to book details"><FiArrowLeft size={19} /></Link>
      <h1>All Reviews for <em>{book?.title || 'This Story'}</em></h1>
    </header>
    {bookError ? <div className="all-reviews-error"><p>Unable to load reviews.</p><Link className="button ghost" to={`/books/${bookId}`}>Back to story</Link></div> : <>
      <div className="all-reviews-toolbar">
        <div className="verdict-tabs" role="tablist" aria-label="Filter reviews by verdict">{TABS.map(([key, label]) => <button type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)} key={key}>{label}</button>)}</div>
        <SortDropdown value={sort} onChange={setSort} />
      </div>
      <ReviewList reviews={reviews} loading={loading} error={error} onRetry={() => load(0, true, sort, tab)} user={user} timestampMode="absolute" skeletonCount={6} emptyTitle={tab === 'ALL' ? 'No reviews yet' : 'No reviews with this verdict'} emptyText="Be the first to share your verdict." onDeleted={() => load(0, true, sort, tab)} />
      {loadingMore && <div className="all-reviews-loading">Loading more…</div>}
      <div className="all-reviews-sentinel" ref={sentinelRef} aria-hidden="true" />
    </>}
  </main></>
}
