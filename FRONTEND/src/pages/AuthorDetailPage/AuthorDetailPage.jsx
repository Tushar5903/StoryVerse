import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { FiBookOpen, FiCalendar, FiChevronLeft, FiChevronRight, FiEdit3, FiPlus } from 'react-icons/fi'
import { getAuthor, getAuthorBooks, updateAuthor } from '../../services/authorsApi'
import { listReviews } from '../../services/reviewsApi'
import { cloudinaryUrl } from '../../utils/cloudinary'
import useScrollRow from '../../hooks/useScrollRow'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import './AuthorDetailPage.css'

const roleOf = author => (author.authorType === 'ADMIN' ? 'Staff Author' : 'Writer')

export default function AuthorDetailPage({ authorId }) {
  const user = useSelector(state => state.auth.user)
  const isAdmin = user?.role === 'ADMIN'
  const { ref: booksRef, canPrev, canNext, scrollPrev, scrollNext } = useScrollRow()
  const [author, setAuthor] = useState(null)
  const [books, setBooks] = useState([])
  const [reviewCounts, setReviewCounts] = useState({})
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    let active = true
    getAuthor(authorId)
      .then(profile => {
        if (!active) return
        setAuthor(profile)
        getAuthorBooks(authorId, '?size=50&sort=publicationDate,desc')
          .then(list => {
            if (!active) return
            const works = list?.content || []
            setBooks(works)
            Promise.allSettled(works.map(book => listReviews(book.id, '&size=1').then(page => ({ id: book.id, count: page?.totalElements || 0 }))))
              .then(results => {
                if (!active) return
                const counts = {}
                results.forEach(result => {
                  if (result.status === 'fulfilled' && result.value.count > 0) counts[result.value.id] = result.value.count
                })
                setReviewCounts(counts)
              })
          })
          .catch(() => { })
      })
      .catch(issue => { if (active) { setNotFound(true); setError(issue.message) } })
    return () => { active = false }
  }, [authorId])

  const canEdit = !!(author && user && ((isAdmin && !author.userId) || author.userId === user.id))

  const openEditor = () => {
    setEditForm({
      name: author.name || '',
      profileImage: author.profileImage || '',
      placeOfBirth: author.placeOfBirth || '',
      dateOfBirth: author.dateOfBirth ? String(author.dateOfBirth).slice(0, 10) : '',
      biography: author.biography || '',
    })
    setEditing(true)
  }

  const setField = key => event => setEditForm(current => ({ ...current, [key]: event.target.value }))

  const saveEdit = async event => {
    event.preventDefault()
    setSavingEdit(true)
    try {
      await updateAuthor(authorId, {
        name: editForm.name,
        profileImage: editForm.profileImage || null,
        placeOfBirth: editForm.placeOfBirth || null,
        dateOfBirth: editForm.dateOfBirth || null,
        biography: editForm.biography || null,
      })
      toast.success('Author profile updated.')
      setEditing(false)
      setEditForm(null)
      getAuthor(authorId).then(profile => setAuthor(profile)).catch(() => { })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  if (notFound) {
    return <><SharedNav /><main className="author-page"><div className="author-empty"><div className="eyebrow">THE PAGE LEFT THE ARCHIVE</div><h1>Author not found.</h1><p>{error}</p><Link className="button ghost" to="/explore">Back to explore</Link></div></main><Footer /></>
  }

  return <><SharedNav /><main className="author-page">
    <header className="author-hero">
      <div className="author-avatar">{author?.profileImage ? <img src={cloudinaryUrl(author.profileImage, { width: 200, height: 200, crop: 'fill' })} alt={author?.name || 'Author'} /> : <span className="author-initial">{(author?.name || 'A').slice(0, 1)}</span>}</div>
      <div className="eyebrow">THE ARCHIVE · AUTHOR</div>
      <h1>{author?.name || 'Loading author…'}</h1>
      <p className="author-role">{author ? roleOf(author) : 'Author'}</p>
      {(author?.username || author?.placeOfBirth) && <p className="author-meta">{author?.username && <Link className="author-handle" to={`/users/${author.username}`}>@{author.username}</Link>}{author?.username && author?.placeOfBirth && <span className="author-meta-sep">·</span>}{author?.placeOfBirth && <span className="author-place"><FiCalendar /> {author.placeOfBirth}</span>}</p>}
      {canEdit && <div className="author-hero-actions">
        {isAdmin && <Link className="button ghost author-add" to={`/books/new?authorId=${authorId}`}><FiPlus /> Add book</Link>}
        <button className="button ghost author-add" onClick={editing ? () => setEditing(false) : openEditor}><FiEdit3 /> {editing ? 'Cancel editing' : 'Edit profile'}</button>
      </div>}
      {author?.biography && !editing && <blockquote className="author-tagline">{author.biography}</blockquote>}
    </header>
    {editing && editForm && <section className="author-edit">
      <div className="eyebrow">EDIT PROFILE</div>
      <h2>Edit author profile</h2>
      <form onSubmit={saveEdit}>
        <div className="author-edit-grid">
          <label>Author name<input value={editForm.name} onChange={setField('name')} required maxLength="160" placeholder="The name readers will remember" /></label>
          <label>Profile image URL<input value={editForm.profileImage} onChange={setField('profileImage')} placeholder="https://…" /></label>
          <label>Place of birth<input value={editForm.placeOfBirth} onChange={setField('placeOfBirth')} placeholder="e.g. Kolkata, India" /></label>
          <label>Date of birth<input type="date" value={editForm.dateOfBirth} onChange={setField('dateOfBirth')} /></label>
        </div>
        <label>Biography<textarea rows="4" value={editForm.biography} onChange={setField('biography')} placeholder="A short introduction to the author…" /></label>
        <div className="author-edit-actions">
          <button className="button" disabled={savingEdit}>{savingEdit ? 'Saving…' : 'Save changes'}</button>
          <button type="button" className="ghost" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    </section>}
    <section className="author-section">
      <div className="author-section-head">
        <div className="author-section-title"><div className="eyebrow">THEIR WORKS</div><h2>Published Works</h2></div>
        {books.length > 0 && <div className="ab-nav">
          <button className="ab-nav-btn" onClick={scrollPrev} disabled={!canPrev} aria-label="Previous works"><FiChevronLeft /></button>
          <button className="ab-nav-btn" onClick={scrollNext} disabled={!canNext} aria-label="Next works"><FiChevronRight /></button>
        </div>}
      </div>
      {books.length ? <div className="author-books-outer"><div className="author-books" ref={booksRef} tabIndex={0} aria-label="Published works">{books.map(book => <Link className="ab-card" to={`/books/${book.id}`} key={book.id}><span className="ab-cover">{book.coverImage || book.thumbnailUrl ? <img src={cloudinaryUrl(book.coverImage || book.thumbnailUrl, { width: 300 })} alt={book.title} loading="lazy" /> : <span className="ab-fallback">SV</span>}</span><span className="ab-title">{book.title}</span><span className="ab-meta">{book.genre || 'Story'} · {book.publicationDate ? String(book.publicationDate).slice(0, 4) : '—'}</span>{reviewCounts[book.id] ? <span className="ab-reviews">{reviewCounts[book.id]} review{reviewCounts[book.id] === 1 ? '' : 's'}</span> : null}</Link>)}</div>{canPrev && <div className="ab-fade ab-fade--left" aria-hidden="true" />}{canNext && <div className="ab-fade ab-fade--right" aria-hidden="true" />}</div> : !author ? null : <div className="author-empty"><div><FiBookOpen /></div><h3>No published works yet.</h3><p>This author hasn't published any stories yet.</p></div>}
    </section>
    
  </main><Footer /></>
}
