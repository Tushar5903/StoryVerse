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
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50
  const FETCH_SIZE = 100

  const load = () => {
    const fetchAll = async () => {
      const all = []
      let index = 0
      while (index < 50) {
        const res = await listMyBooks(`?page=${index}&size=${FETCH_SIZE}`)
        all.push(...(res.content || []))
        if (!res.content || !res.content.length || all.length >= (res.totalElements ?? 0)) break
        index += 1
      }
      return all
    }
    Promise.all([getMe(), fetchAll()])
      .then(([profile, all]) => { setUser(profile); setBooks(all); setPage(p => Math.min(p, Math.max(0, Math.ceil(all.length / PAGE_SIZE) - 1))); setError('') })
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

  const totalPages = Math.max(1, Math.ceil(books.length / PAGE_SIZE))
  const curPage = Math.min(page, totalPages - 1)
  const visible = books.slice(curPage * PAGE_SIZE, (curPage + 1) * PAGE_SIZE)
  const pageNumbers = totalPages <= 12 ? Array.from({ length: totalPages }, (_, i) => i) : []

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
            : <><div className="writer-list">{visible.map(book => <div className="writer-row" key={book.id}>
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
              </div>
              {totalPages > 1 && <div className="writer-pagination">
                <button disabled={curPage === 0} onClick={() => setPage(curPage - 1)}>Prev</button>
                {pageNumbers.map(n => <button key={n} className={n === curPage ? 'active' : ''} onClick={() => setPage(n)}>{n + 1}</button>)}
                <button disabled={curPage === totalPages - 1} onClick={() => setPage(curPage + 1)}>Next</button>
                <span className="writer-pagination-info">Page {curPage + 1} of {totalPages}</span>
              </div>}
              </>}
      </section>
      <p className="writer-account">Publishing as <strong>@{user?.username || 'writer'}</strong> — your author profile updates automatically.</p>
    </main>
    {pendingDelete && <ConfirmModal title="Delete this story?" message={`“${pendingDelete.title}” and all its chapters will be permanently deleted. This action cannot be undone.`} pending={deleting} onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />}
    <Footer />
  </>
}
