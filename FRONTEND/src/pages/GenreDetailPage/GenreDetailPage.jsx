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


export default function GenreDetailPage({ genre }) {
  const name = DEFAULT_GENRES.find(value => value.toLowerCase() === String(genre).toLowerCase()) || String(genre).replaceAll('-', ' ')
  return <>
    <SharedNav />
    <main className="genre-detail">
      <header className="genre-detail-hero">
        <Link to="/genres" className="genre-detail-back"><FiArrowLeft /> All genres</Link>
        <div className="eyebrow">THE ARCHIVE · GENRE</div>
        <h1>{name}</h1>
        <p>Stories that live and breathe this genre.</p>
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
