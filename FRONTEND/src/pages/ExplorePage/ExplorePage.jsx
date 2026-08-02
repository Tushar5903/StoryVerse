import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode } from 'swiper/modules'
import { FiArrowRight, FiSearch } from 'react-icons/fi'
import 'swiper/css'
import 'swiper/css/free-mode'
import './Swiper.css'
import { listBooks } from '../../services/booksApi'
import { listReviews } from '../../services/reviewsApi'
import { fadeInUp } from '../../animations/variants'
import { scoreOf } from '../../utils/verdicts'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import { DEFAULT_GENRES } from '../../data/genres'
import './ExplorePage.css'

const tabs = { trending: ['Trending', 'updatedAt,desc'], recent: ['Recently Updated', 'createdAt,desc'], gems: ['Hidden Gems', null], forYou: ['For You', null] }

function Cover({ book }) { return book?.coverImage || book?.thumbnailUrl ? <img src={book.coverImage || book.thumbnailUrl} alt="" /> : <div className="explore-cover-fallback">SV</div> }
function Row({ title, books, note, loading }) { return <section className="explore-row"><div className="row-heading"><div><div className="eyebrow">{note}</div><h2>{title}</h2></div><Link to="/search">View all <FiArrowRight /></Link></div>{loading ? <div className="empty-row">Loading…</div> : books.length ? <Swiper modules={[FreeMode]} freeMode spaceBetween={15} slidesPerView="auto" className="swiper-row">{books.map(book => <SwiperSlide className="swiper-card" key={book.id}><motion.div {...fadeInUp}><Link className="slider-card" to={`/books/${book.id}`}><Cover book={book} /><h3>{book.title}</h3><p>{book.bookType || 'Story'} · {book.publicationDate ? String(book.publicationDate).slice(0, 4) : '—'}</p></Link></motion.div></SwiperSlide>)}</Swiper> : <div className="empty-row">No books returned by the archive.</div>}</section> }

function ExploreContent({ initialGenre = '' }) {
  const [tab, setTab] = useState('trending'); const [genre, setGenre] = useState(initialGenre || ''); const [status, setStatus] = useState('all'); const [language, setLanguage] = useState('all'); const [sort, setSort] = useState('updatedAt,desc'); const [query, setQuery] = useState(''); const [result, setResult] = useState({ books: [], loading: true, error: '' }); const [shelf, setShelf] = useState({ books: [], loading: true }); const [archive, setArchive] = useState({ books: [], loading: true })
  useEffect(() => {
    let active = true
    const tabSort = tabs[tab][1]
    const params = new URLSearchParams()
    params.set('size', '20')
    if (tab === 'trending') params.set('sort', sort)
    else if (tabSort) params.set('sort', tabSort)
    if (query) params.set('q', query)
    if (genre) params.set('genre', genre)
    listBooks(`?${params}`)
      .then(page => {
        const books = page.content || []
        if (tab !== 'gems' && tab !== 'forYou') return { books }
        return Promise.all(books.map(book => listReviews(book.id, '&size=200').then(reviewPage => ({ book, reviews: reviewPage.content || [] })).catch(() => ({ book, reviews: [] }))))
          .then(enriched => {
            const withStats = enriched.map(({ book, reviews }) => ({ book, votes: reviews.length, score: scoreOf(reviews) }))
            const ranked = tab === 'gems'
              ? withStats.filter(item => item.votes >= 1 && item.votes <= 5).sort((a, b) => b.score - a.score || a.votes - b.votes || new Date(b.book.updatedAt) - new Date(a.book.updatedAt))
              : withStats.filter(item => item.votes >= 2).sort((a, b) => b.score - a.score || b.votes - a.votes || new Date(b.book.updatedAt) - new Date(a.book.updatedAt))
            return { books: ranked.map(item => item.book) }
          })
      })
      .then(({ books }) => active && setResult({ books, loading: false, error: '' }))
      .catch(error => active && setResult({ books: [], loading: false, error: error.message }))
    return () => { active = false }
  }, [tab, sort, genre, query])
  useEffect(() => {
    listBooks('?size=12&type=REVIEW_BOOK').then(page => setShelf({ books: page.content || [], loading: false })).catch(() => setShelf({ books: [], loading: false }))
    listBooks('?size=12&type=USER_BOOK').then(page => setArchive({ books: page.content || [], loading: false })).catch(() => setArchive({ books: [], loading: false }))
  }, [])
  const filtered = useMemo(() => result.books.filter(book => (language === 'all' || book.language === language) && (status === 'all' || (status === 'published' ? book.published : !book.published))), [result.books, language, status])
  return <div className="explore-page"><div className="explore-heading"><div><div className="eyebrow">DISCOVER YOUR NEXT OBSESSION</div><h1>Explore the archive.</h1></div><div className="explore-search"><span><FiSearch /></span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search titles, authors, genres…" /></div></div><div className="explore-layout"><aside className="explore-filters"><div className="eyebrow">FILTERS</div><fieldset><legend>Genre</legend><label className="filter-check"><input type="radio" name="genre" checked={genre === ''} onChange={() => setGenre('')} />All genres</label>{DEFAULT_GENRES.map(value => <label className="filter-check" key={value}><input type="radio" name="genre" checked={genre === value} onChange={() => setGenre(value)} />{value}</label>)}</fieldset><fieldset><legend>Status</legend>{[['all', 'All stories'], ['published', 'Published'], ['draft', 'In progress']].map(([value, label]) => <label className="filter-check" key={value}><input type="radio" name="status" checked={status === value} onChange={() => setStatus(value)} />{label}</label>)}</fieldset><label>Language<select value={language} onChange={event => setLanguage(event.target.value)}><option value="all">All languages</option><option value="English">English</option></select></label><label>Sort by<select value={sort} onChange={event => { setSort(event.target.value); setTab('trending') }}><option value="updatedAt,desc">Recently updated</option><option value="createdAt,desc">Newest first</option><option value="title,asc">Title A–Z</option></select></label></aside><section className="explore-results"><div className="explore-tabs">{Object.entries(tabs).map(([key, [label]]) => <button className={tab === key ? 'active' : ''} onClick={() => setTab(key)} key={key}>{label}</button>)}</div>{result.loading ? <div className="empty-row">Searching the stacks…</div> : result.error ? <div className="error-box">{result.error}</div> : <><div className="result-grid">{filtered.map(book => <motion.div {...fadeInUp} key={book.id}><Link className="result-card" to={`/books/${book.id}`}><Cover book={book} /><div><div className="eyebrow">{book.genre || 'MANUSCRIPT'}</div><h3>{book.title}</h3><p>{book.authorName || 'Unknown author'}</p></div></Link></motion.div>)}</div>{!filtered.length && <div className="empty-row">No stories match these filters.</div>}<Row title="Books for Reading & Review" note="COMMUNITY SHELF" books={shelf.books} loading={shelf.loading} /><Row title="Professional Books" note="EDITORIAL ARCHIVE" books={archive.books} loading={archive.loading} /></>}</section></div></div>
}
export default function ExplorePage(props) { return <><SharedNav /><ExploreContent {...props} /></> }
