import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft } from 'react-icons/fi'
import { listBooks } from '../../services/booksApi'
import { fadeInUp } from '../../animations/variants'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
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
  </>
}

function GenreResults({ name }) {
  const [state, setState] = useState({ books: [], loading: true, error: '' })
  useEffect(() => {
    let active = true
    listBooks(`?size=24&genre=${encodeURIComponent(name)}`)
      .then(page => active && setState({ books: page.content || [], loading: false, error: '' }))
      .catch(err => active && setState({ books: [], loading: false, error: err.message }))
    return () => { active = false }
  }, [name])
  return <>
    {!state.loading && !state.error && <span className="genre-detail-count">{state.books.length} {state.books.length === 1 ? 'story' : 'stories'} in the archive</span>}
    {state.loading ? <div className="genre-detail-empty">Searching the stacks…</div>
      : state.error ? <div className="error-box">{state.error}</div>
      : state.books.length ? <div className="genre-detail-grid">{state.books.map(book => <motion.div {...fadeInUp} className="genre-detail-card" key={book.id}><Link to={`/books/${book.id}`}><div className="genre-detail-cover">{book.coverImage || book.thumbnailUrl ? <img src={book.coverImage || book.thumbnailUrl} alt="" /> : <span>SV</span>}</div><h2>{book.title}</h2><p>{book.bookType || 'Story'} · {book.publicationDate ? String(book.publicationDate).slice(0, 4) : '—'}</p></Link></motion.div>)}</div>
      : <div className="genre-detail-empty">No {name} stories in the archive yet. Check back soon.</div>}
  </>
}
