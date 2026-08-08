import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiAward, FiArrowLeft, FiArrowRight, FiBookOpen, FiTrendingUp, FiUsers } from 'react-icons/fi'
import { listBooks } from '../../services/booksApi'
import { listReviews } from '../../services/reviewsApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import './ExplorePage.css'

const TYPE_LABEL = { REVIEW_BOOK: 'For Review', USER_BOOK: 'User Book' }
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
const yearOf = book => book.publicationDate ? String(book.publicationDate).slice(0, 4) : '—'

const VIEWS = {
  talk: { title: 'Talk Of The Town', fetch: () => listBooks('?size=40&sort=createdAt,desc').then(pageBooks).then(books => books.map(book => ({ book }))) },
  users: { title: "User's Books", fetch: () => listBooks('?size=40&type=USER_BOOK').then(pageBooks).then(books => books.map(book => ({ book }))) },
  review: { title: 'Books For Review', fetch: () => listBooks('?size=40&type=REVIEW_BOOK').then(pageBooks).then(books => books.map(book => ({ book }))) },
  famous: { title: 'Most Famous Books', fetch: () => listBooks('?size=30&sort=createdAt,desc').then(pageBooks).then(books => Promise.all(books.map(book => listReviews(book.id, '&size=200').then(page => ({ book, count: (page?.content || []).length })).catch(() => ({ book, count: 0 })))).then(famous => famous.sort((a, b) => b.count - a.count || new Date(b.book.createdAt) - new Date(a.book.createdAt)))) },
}

function BookCard({ book, count, index }) {
  const cover = book.coverImage || book.thumbnailUrl
  const meta = count != null ? `${count} review${count === 1 ? '' : 's'}` : `${TYPE_LABEL[book.bookType] || book.bookType || 'Story'} · ${yearOf(book)}`
  return <motion.div className="discover-motion" role="listitem" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: index * .05 }}>
    <Link className="discover-card" to={`/books/${book.id}`}>
      <div className="discover-poster">{cover ? <img src={cover} alt={book.title} loading="lazy" /> : <div className="discover-fallback">SV</div>}</div>
      <div className="discover-info"><h3 className="discover-card-title">{book.title}</h3><p className="discover-meta">{meta}</p></div>
    </Link>
  </motion.div>
}

const SKELETON_CARDS = Array.from({ length: 5 })
function SkeletonGrid() {
  return <div className="discover-grid discover-grid--skeleton" aria-hidden="true">{SKELETON_CARDS.map((_, i) => <div className="skeleton-card" key={i} />)}</div>
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
  const [state, setState] = useState({ books: [], loading: true })
  useEffect(() => {
    let active = true
    VIEWS[view].fetch().then(books => { if (active) setState({ books, loading: false }) }).catch(() => { if (active) setState({ books: [], loading: false }) })
    return () => { active = false }
  }, [view])
  const title = VIEWS[view].title
  return <div className="explore-shell explore-shell--full"><header className="discover-head"><Link className="discover-back" to="/explore"><FiArrowLeft /> Back to Explore</Link><div className="eyebrow">THE DIGITAL LITERARY ARCHIVE</div><h1>{title}</h1></header>{state.loading ? <SkeletonGrid /> : state.books.length ? <div className="discover-grid">{state.books.map(({ book, count }, index) => <BookCard key={book.id} book={book} count={count} index={index} />)}</div> : <div className="discover-empty">Nothing on this shelf yet.</div>}</div>
}

function SearchResults({ query }) {
  const [state, setState] = useState({ books: [], loading: true })
  useEffect(() => {
    let active = true
    listBooks(`?q=${encodeURIComponent(query)}&size=40`).then(page => { if (active) setState({ books: pageBooks(page), loading: false }) }).catch(() => { if (active) setState({ books: [], loading: false }) })
    return () => { active = false }
  }, [query])
  return <div className="explore-shell explore-shell--full"><header className="discover-head"><Link className="discover-back" to="/explore"><FiArrowLeft /> Back to Explore</Link><div className="eyebrow">SEARCH</div><h1>Results for “{query}”</h1></header>{state.loading ? <SkeletonGrid /> : state.books.length ? <div className="discover-grid">{state.books.map((book, index) => <BookCard key={book.id} book={book} index={index} />)}</div> : <div className="discover-empty">No books match “{query}”. Try another word.</div>}</div>
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
      settle(listBooks('?size=20&sort=createdAt,desc')),
    ]).then(([talk, users, review, famousPool]) => {
      if (!active) return
      Promise.all(famousPool.map(book => listReviews(book.id, '&size=200').then(page => ({ book, count: (page?.content || []).length })).catch(() => ({ book, count: 0 }))))
        .then(famous => {
          if (!active) return
          const topFamous = famous.sort((a, b) => b.count - a.count || new Date(b.book.createdAt) - new Date(a.book.createdAt)).slice(0, 8)
          setSections({
            talk: { books: talk.slice(0, 8).map(book => ({ book })), loading: false },
            users: { books: pickRandom(users).map(book => ({ book })), loading: false },
            review: { books: pickRandom(review).map(book => ({ book })), loading: false },
            famous: { books: topFamous, loading: false },
          })
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
