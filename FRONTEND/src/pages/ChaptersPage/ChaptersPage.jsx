import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { getBook, listMyBooks, publishBook } from '../../services/booksApi'
import { createChapter, deleteChapter, listChapters, updateChapter } from '../../services/chaptersApi'
import RichTextEditor from '../../components/rich-editor/RichTextEditor'
import ConfirmModal from '../../components/common/ConfirmModal/ConfirmModal'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import './ChaptersPage.css'

const plainWords = html => String(html || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length

export default function ChaptersPage() {
  const [params] = useSearchParams()
  const bookId = params.get('bookId')

  return <><SharedNav />{bookId ? <ChapterEditor bookId={bookId} /> : <BookPicker />}<Footer /></>
}

function BookPicker() {
  const [books, setBooks] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { listMyBooks('?size=50').then(page => setBooks(page.content || [])).catch(err => setError(err.message)) }, [])
  return <main className="chapters-page"><div className="chapters-head"><div className="eyebrow">WRITER STUDIO</div><h1>Choose a story.</h1><p>Pick the story you want to write chapters for, or create a new one.</p></div>
    {error ? <div className="error-box">{error}</div> : <div className="book-picker">{books.map(book => <Link className="book-picker-row" to={`/write?bookId=${book.id}`} key={book.id}><span className={`picker-dot ${book.published ? 'published' : ''}`} />{book.title}<small>{book.published ? 'Published' : 'Draft'}</small></Link>)}
      {!books.length && <div className="writer-empty">No stories yet. <Link to="/books/new">Create one <FiArrowRight /></Link></div>}</div>}</main>
}

function ChapterEditor({ bookId }) {
  const [book, setBook] = useState(null)
  const [chapters, setChapters] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ chapterNumber: 1, chapterTitle: '', chapterContent: '' })
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => Promise.all([getBook(bookId), listChapters(bookId)])
    .then(([currentBook, currentChapters]) => { setBook(currentBook); setChapters(currentChapters) })
    .catch(err => setError(err.message))
  useEffect(() => { load() }, [bookId]) // eslint-disable-line react-hooks/exhaustive-deps

  const nextNumber = useMemo(() => chapters.reduce((max, chapter) => Math.max(max, chapter.chapterNumber || 0), 0) + 1, [chapters])
  const set = field => event => setForm(current => ({ ...current, [field]: field === 'chapterNumber' ? (Number(event.target.value) || 1) : event.target.value }))

  const startNew = () => { setEditingId(null); setForm({ chapterNumber: nextNumber, chapterTitle: '', chapterContent: '' }) }
  const startEdit = chapter => { setEditingId(chapter.id); setForm({ chapterNumber: chapter.chapterNumber, chapterTitle: chapter.chapterTitle || chapter.title || '', chapterContent: chapter.chapterContent || chapter.content || '' }) }

  const save = async event => {
    event.preventDefault()
    setError('')
    if (plainWords(form.chapterContent) === 0) {
      setError('Chapter content is required.')
      return
    }
    try {
      if (editingId) await updateChapter(bookId, editingId, form)
      else await createChapter(bookId, form)
      toast.success(editingId ? 'Chapter updated.' : 'Chapter saved.')
      await load()
      startNew()
    } catch (err) { setError(err.message); toast.error(err.message) }
  }

  const remove = chapter => setPendingDelete(chapter)
  const confirmDelete = async () => {
    setDeleting(true)
    setError('')
    try { await deleteChapter(bookId, pendingDelete.id); toast.success('Chapter deleted.'); await load() } catch (err) { setError(err.message); toast.error(err.message) } finally { setDeleting(false); setPendingDelete(null) }
  }

  const onPublish = async () => {
    setError('')
    try { await publishBook(bookId); toast.success('Story published. It is now live in the archive.'); await load() } catch (err) { setError(err.message); toast.error(err.message) }
  }

  return <main className="chapters-page">
    <div className="chapters-head">
      <Link to="/dashboard" className="chapters-back"><FiArrowLeft /> Back to dashboard</Link>
      <div className="eyebrow">WRITER STUDIO · {book?.genre || 'MANUSCRIPT'}</div>
      <h1>Write your story.</h1>
      <p>“{book?.title || 'Untitled manuscript'}” — add, edit, and reorder chapters. A story needs a description and at least one chapter before it can be published.</p>
    </div>

    {error && <div className="error-box">{error}</div>}

    <div className="chapters-layout">
      <section className="chapter-list">
        <div className="eyebrow">CHAPTERS</div>
        {chapters.length ? chapters.map(chapter => <div className={`chapter-row ${editingId === chapter.id ? 'active' : ''}`} key={chapter.id}>
          <span className="chapter-number">{String(chapter.chapterNumber).padStart(2, '0')}</span>
          <div className="chapter-row-main">
            <strong>{chapter.chapterTitle || chapter.title}</strong>
            <small>{plainWords(chapter.chapterContent || chapter.content)} words</small>
          </div>
          <div className="chapter-row-actions">
            <button onClick={() => startEdit(chapter)}>Edit</button>
            <button className="danger" onClick={() => remove(chapter)}>Delete</button>
          </div>
        </div>) : <div className="writer-empty">No chapters yet. Write the first one on the right <FiArrowRight /></div>}
      </section>

      <section className="chapter-editor">
        <form onSubmit={save}>
          <div className="eyebrow">{editingId ? 'EDIT CHAPTER' : 'NEW CHAPTER'}</div>
          <div className="chapter-form-grid">
            <label>Chapter number<input type="number" min="1" value={form.chapterNumber} onChange={set('chapterNumber')} required title="You can reorder chapters by editing their numbers" /></label>
            <label>Chapter title<input value={form.chapterTitle} onChange={set('chapterTitle')} required maxLength="240" placeholder="Chapter One" /></label>
          </div>
          <label>Content<RichTextEditor key={editingId || 'new'} value={form.chapterContent} onChange={html => setForm(current => ({ ...current, chapterContent: html }))} /></label>
          <p className="chapter-count">{plainWords(form.chapterContent) ? `${plainWords(form.chapterContent)} words · ${Math.max(1, Math.ceil(plainWords(form.chapterContent) / 200))} min read` : 'Start typing…'}</p>
          <div className="chapter-form-actions">
            {editingId && <button type="button" className="ghost" onClick={startNew}>Cancel edit</button>}
            <button className="button" type="submit">{editingId ? 'Update chapter' : 'Add chapter'}</button>
          </div>
        </form>
      </section>
    </div>

    <div className="publish-bar">
      <span>{book?.published ? 'This story is live in the archive.' : `${chapters.length} chapter${chapters.length === 1 ? '' : 's'} — publish when it is ready.`}</span>
      {!book?.published && <button className="button" onClick={onPublish}>Publish story</button>}
    </div>

    {pendingDelete && <ConfirmModal title="Delete this chapter?" message={`Chapter ${pendingDelete.chapterNumber} (“${pendingDelete.chapterTitle || pendingDelete.title}”) will be permanently removed. This action cannot be undone.`} pending={deleting} onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />}
  </main>
}
