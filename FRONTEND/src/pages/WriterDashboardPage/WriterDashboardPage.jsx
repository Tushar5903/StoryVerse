import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiArrowUpRight } from 'react-icons/fi'
import { deleteBook, listMyBooks, publishBook } from '../../services/booksApi'
import { getMe } from '../../services/usersApi'
import ConfirmModal from '../../components/common/ConfirmModal/ConfirmModal'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import './WriterDashboardPage.css'

export default function WriterDashboardPage() {
  const [user, setUser] = useState(null)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    Promise.all([getMe(), listMyBooks('?size=50')])
      .then(([profile, page]) => { setUser(profile); setBooks(page.content || []); setError('') })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const onPublish = async id => {
    try { await publishBook(id); toast.success('Story published. It is now live in the archive.'); load() } catch (err) { setError(err.message); toast.error(err.message) }
  }
  const onDelete = book => setPendingDelete(book)
  const confirmDelete = async () => {
    setDeleting(true)
    setError('')
    try { await deleteBook(pendingDelete.id); toast.success('Story deleted.'); await load() } catch (err) { setError(err.message); toast.error(err.message) } finally { setDeleting(false); setPendingDelete(null) }
  }

  const published = books.filter(book => book.published).length
  const drafts = books.length - published

  return <>
    <SharedNav />
    <main className="writer-dashboard">
      <div className="writer-head">
        <div>
          <div className="eyebrow">WRITER DASHBOARD</div>
          <h1>Your stories, in motion.</h1>
          <p>Shape the next page of your publishing journey. Create a draft, write its chapters, then publish when it is ready.</p>
        </div>
        <Link className="button" to="/books/new">New story <FiArrowUpRight /></Link>
      </div>

      <div className="writer-stats">
        <div className="writer-stat"><span>Stories published</span><strong>{published}</strong></div>
        <div className="writer-stat"><span>Drafts in progress</span><strong>{drafts}</strong></div>
        <div className="writer-stat"><span>Total works</span><strong>{books.length}</strong></div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <section className="writer-works">
        <div className="eyebrow">YOUR WORK</div>
        <h2>Your stories</h2>
        {loading ? <div className="writer-empty">Loading your archive…</div>
          : !books.length ? <div className="writer-empty"><strong>Your shelf is empty.</strong><p>Create a manuscript to begin publishing.</p><Link className="button" to="/books/new">Start writing <FiArrowUpRight /></Link></div>
            : <div className="writer-list">{books.map(book => <div className="writer-row" key={book.id}>
              <Link className="writer-cover" to={`/books/${book.id}/edit`}>{book.coverImage || book.thumbnailUrl ? <img src={book.coverImage || book.thumbnailUrl} alt="" /> : <span>SV</span>}</Link>
              <div className="writer-row-main">
                <h3><Link to={`/books/${book.id}/edit`}>{book.title}</Link></h3>
                <p>{book.genre ?
                  <span className="writer-genre">{book.genre}</span>
                  : null}
                  {book.language || 'Story'} · {book.bookType === 'REVIEW_BOOK' ? 'Review book' : 'Story'} · {book.publicationDate ? String(book.publicationDate).slice(0, 4) : 'No year yet'}
                </p>
                <div className="writer-actions">
                  <Link to={`/books/${book.id}/edit`}>Edit details</Link>
                  {book.bookType !== 'REVIEW_BOOK' && <Link to={`/write?bookId=${book.id}`}>Chapters</Link>}
                  {!book.published && <button onClick={() => onPublish(book.id)}>Publish</button>}
                  <button className="danger" onClick={() => onDelete(book)}>Delete</button>
                </div>
              </div>
              <span className={`writer-status ${book.published ? 'published' : 'draft'}`}>{book.published ? 'Published' : 'Draft'}</span>
            </div>)}
            </div>}
      </section>
      <p className="writer-account">Publishing as <strong>@{user?.username || 'writer'}</strong> — your author profile updates automatically.</p>
    </main>
    {pendingDelete && <ConfirmModal title="Delete this story?" message={`“${pendingDelete.title}” and all its chapters will be permanently deleted. This action cannot be undone.`} pending={deleting} onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />}
    <Footer />
  </>
}
