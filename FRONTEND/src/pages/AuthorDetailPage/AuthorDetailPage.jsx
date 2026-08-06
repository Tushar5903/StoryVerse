import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiBookOpen, FiCalendar, FiPlus } from 'react-icons/fi'
import { getAuthor, getAuthorBooks } from '../../services/authorsApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import './AuthorDetailPage.css'

export default function AuthorDetailPage({ authorId }) {
  const isAdmin = useSelector(state => state.auth.user)?.role === 'ADMIN'
  const [author, setAuthor] = useState(null)
  const [books, setBooks] = useState([])
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    getAuthor(authorId)
      .then(profile => {
        if (!active) return
        setAuthor(profile)
        getAuthorBooks(authorId).then(list => active && setBooks(list || [])).catch(() => {})
      })
      .catch(issue => { if (active) { setNotFound(true); setError(issue.message) } })
    return () => { active = false }
  }, [authorId])

  if (notFound) {
    return <><SharedNav /><main className="author-page"><div className="author-empty"><div className="eyebrow">THE PAGE LEFT THE ARCHIVE</div><h1>Author not found.</h1><p>{error}</p><Link className="button ghost" to="/explore">Back to explore</Link></div></main><Footer /></>
  }

  return <><SharedNav /><main className="author-page"><div className="author-head"><div className="author-avatar">{author?.profileImage ? <img src={author.profileImage} alt="" /> : (author?.name || 'A').slice(0, 1)}</div><div><div className="eyebrow">{author?.authorType === 'USER' ? 'USER AUTHOR' : 'AUTHOR'} · {books.length} BOOK{books.length === 1 ? '' : 'S'}</div><h1>{author?.name || 'Loading author…'}</h1>{author?.user ? <Link className="author-handle" to={`/users/${author.username}`}>@{author.username}</Link> : null}{author?.placeOfBirth && <p className="author-place"><FiCalendar /> {author.placeOfBirth}</p>}</div>{isAdmin && <Link className="button author-add-book" to={`/books/new?authorId=${authorId}`}><FiPlus /> Add book</Link>}</div>{author?.biography && <p className="author-bio">{author.biography}</p>}<section className="author-books"><div className="eyebrow">THEIR WORKS</div><h2>Book collection</h2>{books.length ? <div className="author-book-grid">{books.map(book => <Link className="author-book-card" to={`/books/${book.id}`} key={book.id}>{book.coverImage || book.thumbnailUrl ? <img src={book.coverImage || book.thumbnailUrl} alt="" /> : <span className="author-book-fallback">SV</span>}<h3>{book.title}</h3><p>{book.genre || 'Story'} · {book.publicationDate ? String(book.publicationDate).slice(0, 4) : '—'}</p></Link>)}</div> : <div className="author-empty"><div><FiBookOpen /></div><h3>No published works yet.</h3><p>This author hasn't published any stories yet.</p></div>}</section></main><Footer /></>
}
