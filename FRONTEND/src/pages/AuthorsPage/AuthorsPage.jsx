import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi'
import { listAuthors } from '../../services/authorsApi'
import useScrollRow from '../../hooks/useScrollRow'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import './AuthorsPage.css'

const roleOf = author => (author.authorType === 'ADMIN' ? 'Author' : 'Writer')

const SKELETON_CIRCLES = Array.from({ length: 6 })
function AuthorSkeleton() {
  return <div className="ap-row" aria-hidden="true">{SKELETON_CIRCLES.map((_, i) => <div className="ap-item ap-item--skeleton" key={i}><span className="ap-avatar" /><span className="ap-skel-name" /><span className="ap-skel-role" /></div>)}</div>
}

function AuthorItem({ author }) {
  return <Link className="ap-item" to={`/authors/${author.id}`}>
    <span className="ap-avatar">{author.profileImage ? <img src={author.profileImage} alt={author.name} loading="lazy" /> : <span className="ap-initial">{(author.name || 'A').slice(0, 1)}</span>}</span>
    <span className="ap-name">{author.name}</span>
    <span className="ap-role">{roleOf(author)}</span>
  </Link>
}

export default function AuthorsPage() {
  const [state, setState] = useState({ authors: [], loading: true, error: '' })
  const [query, setQuery] = useState('')
  useEffect(() => {
    let active = true
    listAuthors('?size=100')
      .then(page => active && setState({ authors: page.content || [], loading: false, error: '' }))
      .catch(err => active && setState({ authors: [], loading: false, error: err.message }))
    return () => { active = false }
  }, [])
  const { ref, canPrev, canNext, scrollPrev, scrollNext } = useScrollRow()
  const q = query.trim().toLowerCase()
  const filtered = q ? state.authors.filter(author => (author.name || '').toLowerCase().includes(q)) : state.authors
  return <>
    <SharedNav />
    <main className="ap-page">
      <header className="ap-hero">
        <div className="eyebrow">THE ARCHIVE</div>
        <h1>All authors</h1>
        <p>Discover the writers and creators behind the stories of StoryVerse.</p>
        <div className="ap-search"><FiSearch /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search authors…" aria-label="Search authors" /></div>
      </header>
      <section className="ap-section">
        <div className="ap-head">
          <div className="ap-title">
            <div className="eyebrow">THE DIRECTORY</div>
            <h2>All Authors</h2>
          </div>
          <div className="ap-nav">
            <button className="ap-nav-btn" onClick={scrollPrev} disabled={!canPrev} aria-label="Previous authors"><FiChevronLeft /></button>
            <button className="ap-nav-btn" onClick={scrollNext} disabled={!canNext} aria-label="Next authors"><FiChevronRight /></button>
          </div>
        </div>
        {state.loading ? <AuthorSkeleton />
          : state.error ? <div className="ap-empty"><div className="eyebrow">THE DIRECTORY IS DARK</div><h2>Authors unavailable.</h2><p>{state.error}</p></div>
          : filtered.length ? <div className="ap-row-outer">
            <div className="ap-row" ref={ref} tabIndex={0} aria-label="All authors">
              {filtered.map(author => <AuthorItem key={author.id} author={author} />)}
            </div>
            {canPrev && <div className="ap-fade ap-fade--left" aria-hidden="true" />}
            {canNext && <div className="ap-fade ap-fade--right" aria-hidden="true" />}
          </div>
          : <div className="ap-empty"><div className="eyebrow">THE SEARCH CAME UP EMPTY</div><h2>No authors found.</h2><p>{query ? 'Try a different name — every voice in the archive is indexed.' : 'The first voice could be yours.'}</p></div>}
      </section>
    </main>
    <Footer />
  </>
}