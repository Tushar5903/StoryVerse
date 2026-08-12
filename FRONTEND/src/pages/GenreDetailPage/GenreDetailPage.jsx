import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { listBooks } from '../../services/booksApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import BookCard, { SkeletonGrid } from '../../components/common/BookCard/BookCard'
import InfiniteLoader from '../../components/common/InfiniteLoader/InfiniteLoader'
import useInfiniteScroll from '../../hooks/useInfiniteScroll'
import { DEFAULT_GENRES } from '../../data/genres'
import './GenreDetailPage.css'

const blurbs = {
  Action: 'High stakes, higher heartbeats — adventures that never let you rest.',
  Comedy: 'Warm wit, sharp laughs, and the delightful chaos of being human.',
  Drama: 'Quiet power, tangled lives, and the weight of every hard decision.',
  Horror: 'Shadows that follow you off the page and into the dark.',
  Informative: 'Ideas worth keeping — knowledge, history, and how things work.',
  Mystery: 'A clue, a question, a wrong turn — and a truth waiting to surface.',
  Romance: 'Slow burns and stolen glances — stories that linger long after.',
  'Sci-Fi': 'Far futures and strange worlds that hold a mirror to our own.',
  Sports: 'Underdogs, comebacks, and the last second that changes everything.',
  Thriller: 'No safe corners. Turn the page at your own risk.',
}

export default function GenreDetailPage({ genre }) {
  const name = DEFAULT_GENRES.find(value => value.toLowerCase() === String(genre).toLowerCase()) || String(genre).replaceAll('-', ' ')
  return <>
    <SharedNav />
    <main className="genre-detail">
      <header className="genre-detail-hero">
        <Link to="/genres" className="genre-detail-back"><FiArrowLeft /> All genres</Link>
        <div className="eyebrow">THE ARCHIVE · GENRE</div>
        <h1>{name}</h1>
        <p>{blurbs[name] || 'Stories that live and breathe this genre.'}</p>
      </header>
      <GenreResults key={name} name={name} />
    </main>
    <Footer />
  </>
}

function GenreResults({ name }) {
  const { items, initialLoading, loadingMore, hasMore, error, totalElements, sentinelRef } = useInfiniteScroll({
    resetKey: name,
    fetchPage: (page, size, signal) => listBooks(`?genre=${encodeURIComponent(name)}&size=${size}&page=${page}`, { signal }),
  })
  const total = totalElements ?? items.length
  return <>
    {!initialLoading && !error && <span className="genre-detail-count">{total} {total === 1 ? 'story' : 'stories'} in the archive</span>}
    {initialLoading ? <SkeletonGrid />
      : !items.length ? (error ? <div className="error-box">{error}</div> : <div className="genre-detail-empty">No {name} stories in the archive yet. Check back soon.</div>)
      : <>
        <div className="discover-grid" role="list">{items.map((book, index) => <BookCard key={book.id} book={book} index={index} />)}</div>
        <div ref={sentinelRef} aria-hidden="true" />
        <InfiniteLoader loading={loadingMore} hasMore={hasMore} error={error} />
      </>}
  </>
}
