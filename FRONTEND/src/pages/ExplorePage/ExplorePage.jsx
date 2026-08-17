import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiAward, FiArrowLeft, FiArrowRight, FiBookOpen, FiTrendingUp, FiUsers } from 'react-icons/fi'
import { getLeaderboard, listBooks } from '../../services/booksApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import BookCard, { SkeletonGrid } from '../../components/common/BookCard/BookCard'
import InfiniteLoader from '../../components/common/InfiniteLoader/InfiniteLoader'
import useInfiniteScroll from '../../hooks/useInfiniteScroll'
import './ExplorePage.css'

const rand = max => Math.floor(Math.random() * max)
const shuffle = list => {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(i + 1);[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
const pageBooks = page => page?.content || []
const pickRandom = (books, min = 6, max = 10) => shuffle(books).slice(0, min + rand(max - min + 1))

const VIEWS = {
  talk: { title: 'Talk Of The Town', params: 'sort=createdAt,desc' },
  users: { title: "User's Books", params: 'type=USER_BOOK' },
  review: { title: 'Books For Review', params: 'type=REVIEW_BOOK' },
  famous: { title: 'Most Famous Books', rank: true },
}

// Resolves one paginated batch (page, size) into display items. The backend page
// metadata (content / last / totalPages) flows through untouched so the hook can
// decide whether more batches exist — the database only ever returns `size` rows.
const fetchViewPage = (view, page, size, signal) => {
  if (view.rank) {
    // Most Famous reuses the aggregate leaderboard endpoint (exact per-verdict
    // counts in one request) instead of firing a listReviews call per book.
    return getLeaderboard(`?limit=${size}`, { signal }).then(entries => {
      const content = (entries || [])
        .map(entry => ({ book: entry.book, count: entry.votes ?? 0 }))
        .sort((a, b) => b.count - a.count || new Date(b.book.createdAt) - new Date(a.book.createdAt))
      return { content, last: true, totalPages: 1, totalElements: content.length }
    })
  }
  const params = view.params ? `&${view.params}` : ''
  return listBooks(`?size=${size}&page=${page}${params}`, { signal }).then(pageData => ({
    ...pageData,
    content: (pageData.content || []).map(book => ({ book })),
  }))
}

function Section({ title, subtitle, icon, state, view }) {
  return <section className="discover-section" aria-label={title}>
    <div className="discover-head-row">
      <div className="discover-heading">{icon ? <span className="section-icon">{icon}</span> : null}<div><h2>{title}</h2><p>{subtitle}</p></div></div>
      <Link className="discover-viewall" to={`/search?view=${view}`}>View All <FiArrowRight /></Link>
    </div>
    {state.loading ? <SkeletonGrid /> : state.books.length
      ? <div className="discover-grid" role="list" aria-label={title}>{state.books.map(({ book, count }, index) => <BookCard key={book.id} book={book} count={count} index={index} />)}</div>
      : <div className="discover-empty">Nothing on this shelf yet — check back soon.</div>}
  </section>
}

function AllBooks({ view }) {
  const viewDef = VIEWS[view]
  const { items, initialLoading, loadingMore, hasMore, error, sentinelRef } = useInfiniteScroll({
    enabled: !!viewDef,
    resetKey: view,
    fetchPage: (page, size, signal) => fetchViewPage(viewDef, page, size, signal),
  })
  const title = viewDef?.title
  return <div className="explore-shell explore-shell--full"><header className="discover-head"><Link className="discover-back" to="/explore"><FiArrowLeft /> Back to Explore</Link><div className="eyebrow">THE DIGITAL LITERARY ARCHIVE</div><h1>{title}</h1></header>
    {initialLoading ? <SkeletonGrid /> : items.length
      ? <><div className="discover-grid">{items.map(({ book, count }, index) => <BookCard key={book.id} book={book} count={count} index={index} />)}</div><div ref={sentinelRef} aria-hidden="true" /><InfiniteLoader loading={loadingMore} hasMore={hasMore} error={error} /></>
      : <div className="discover-empty">{error || 'Nothing on this shelf yet.'}</div>}
  </div>
}

function SearchResults({ query }) {
  const { items, initialLoading, loadingMore, hasMore, error, sentinelRef } = useInfiniteScroll({
    resetKey: query,
    fetchPage: (page, size, signal) => listBooks(`?q=${encodeURIComponent(query)}&size=${size}&page=${page}`, { signal }),
  })
  return <div className="explore-shell explore-shell--full"><header className="discover-head"><Link className="discover-back" to="/explore"><FiArrowLeft /> Back to Explore</Link><div className="eyebrow">SEARCH</div><h1>Results for “{query}”</h1></header>
    {initialLoading ? <SkeletonGrid /> : items.length
      ? <><div className="discover-grid">{items.map((book, index) => <BookCard key={book.id} book={book} index={index} />)}</div><div ref={sentinelRef} aria-hidden="true" /><InfiniteLoader loading={loadingMore} hasMore={hasMore} error={error} /></>
      : <div className="discover-empty">{error || `No books match “${query}”. Try another word.`}</div>}
  </div>
}

function ExploreContent({ initialGenre = '' }) {
  const [searchParams] = useSearchParams()
  const [sections, setSections] = useState({ talk: { books: [], loading: true }, users: { books: [], loading: true }, review: { books: [], loading: true }, famous: { books: [], loading: true } })
  const view = searchParams.get('view')
  const query = searchParams.get('q')
  useEffect(() => {
    let active = true
    const settle = promise => promise.then(pageBooks).catch(() => [])
    Promise.all([
      settle(listBooks('?size=8&sort=createdAt,desc')),
      settle(listBooks('?size=20&type=USER_BOOK')),
      settle(listBooks('?size=20&type=REVIEW_BOOK')),
      // Most Famous: ONE aggregate request (exact verdict counts from the leaderboard
      // endpoint) instead of a listReviews count call per book.
      getLeaderboard('?limit=20').then(entries => (entries || []).map(entry => ({ book: entry.book, count: entry.votes ?? 0 }))).catch(() => []),
    ]).then(([talk, users, review, famousPool]) => {
      if (!active) return
      const topFamous = famousPool.sort((a, b) => b.count - a.count || new Date(b.book.createdAt) - new Date(a.book.createdAt)).slice(0, 8)
      setSections({
        talk: { books: talk.slice(0, 8).map(book => ({ book })), loading: false },
        users: { books: pickRandom(users).map(book => ({ book })), loading: false },
        review: { books: pickRandom(review).map(book => ({ book })), loading: false },
        famous: { books: topFamous, loading: false },
      })
    })
    return () => { active = false }
  }, [])
  if (query) return <SearchResults key={query} query={query} />
  if (view && VIEWS[view]) return <AllBooks view={view} />
  return <div className="explore-shell"><main className="explore-main">
    <header className="discover-head"><div className="eyebrow">THE DIGITAL LITERARY ARCHIVE</div><h1>Explore.</h1>{initialGenre ? <Link className="discover-genre-chip" to="/explore" title="Clear genre filter">{initialGenre}<span aria-hidden="true">×</span></Link> : null}</header>
    <Section title="Talk Of The Town" subtitle="The latest books everyone is discovering." icon={<FiTrendingUp />} state={sections.talk} view="talk" />
    <Section title="User's Books" subtitle="Fresh stories shared by our community." icon={<FiUsers />} state={sections.users} view="users" />
    <Section title="Books For Review" subtitle="Read, review, and help others discover great books." icon={<FiBookOpen />} state={sections.review} view="review" />
    <Section title="Most Famous Books" subtitle="The books loved most by our readers." icon={<FiAward />} state={sections.famous} view="famous" />
  </main></div>
}
export default function ExplorePage(props) { return <><SharedNav /><ExploreContent {...props} /><Footer /></> }
