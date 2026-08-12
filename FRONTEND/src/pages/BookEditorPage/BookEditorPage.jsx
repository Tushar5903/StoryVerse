import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiArrowLeft } from 'react-icons/fi'
import { createDraft, createReviewBook, getBook, updateBook, uploadBookCover } from '../../services/booksApi'
import { listAuthors } from '../../services/authorsApi'
import { getMe } from '../../services/usersApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import { DEFAULT_GENRES } from '../../data/genres'
import './BookEditorPage.css'

function toDate(value) { return value ? String(value).slice(0, 10) : '' }

export default function BookEditorPage({ id }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editing = Boolean(id)
  const presetAuthorId = searchParams.get('authorId')

  const [user, setUser] = useState(null)
  const [authors, setAuthors] = useState([])
  const [bookType, setBookType] = useState(presetAuthorId ? 'REVIEW_BOOK' : 'USER_BOOK')
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [coverFile, setCoverFile] = useState(null)

  const [form, setForm] = useState({ title: '', subtitle: '', description: '', language: 'English', genres: [], tags: '', publicationDate: '', coverImage: '', authorId: presetAuthorId || '' })
  const set = field => event => setForm(current => ({ ...current, [field]: event.target.value }))

  useEffect(() => {
    getMe().then(setUser).catch(() => { })
    listAuthors('?size=50').then(page => setAuthors(page.content || [])).catch(() => { })
    if (!editing) return
    getBook(id)
      .then(book => {
        setForm({
          title: book.title || '', subtitle: book.subtitle || '', description: book.description || '',
          language: book.language || 'English', genres: book.genres && book.genres.length ? book.genres : (book.genre ? [book.genre] : []), tags: (book.tags || []).join(', '),
          publicationDate: toDate(book.publicationDate), coverImage: book.coverImage || '', authorId: book.authorId || ''
        })
        setBookType(book.bookType || 'USER_BOOK')
        setError('')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, editing])

  const uploadCover = async () => {
    if (!coverFile) return ''
    try { const { imageUrl } = await uploadBookCover(coverFile); return imageUrl } catch (err) { throw new Error(`Cover upload failed: ${err.message}`, { cause: err }) }
  }

  const save = async event => {
    event.preventDefault()
    setSaving(true); setError('')
    try {
      const coverImage = await uploadCover()
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        language: form.language.trim() || null,
        genres: form.genres.length ? form.genres : null,
        tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        publicationDate: form.publicationDate || null,
        coverImage: coverImage || form.coverImage.trim() || null,
      }
      if (editing) {
        await updateBook(id, { ...payload, authorId: Number(form.authorId) })
        toast.success('Story details saved.')
      } else if (bookType === 'REVIEW_BOOK') {
        const created = await createReviewBook({ ...payload, authorId: Number(form.authorId) })
        toast.success('Review book created.')
        navigate(`/books/${created.id}/edit`)
      } else {
        const created = await createDraft({ title: form.title.trim() })
        toast.success('Story created. Add your chapters next.')
        navigate(`/books/${created.id}/edit`)
      }
    } catch (err) { setError(err.message); toast.error(err.message) } finally { setSaving(false) }
  }

  const pickCover = event => { setCoverFile(event.target.files[0]); setForm(current => ({ ...current, coverImage: '' })) }

  const toggleGenre = genre => setForm(current => ({ ...current, genres: current.genres.includes(genre) ? current.genres.filter(value => value !== genre) : [...current.genres, genre] }))

  const isAdmin = user?.role === 'ADMIN'
  const preview = coverFile ? URL.createObjectURL(coverFile) : form.coverImage

  return <>
    <SharedNav />
    <main className="book-editor">
      <div className="editor-head">
        <Link to={presetAuthorId ? `/authors/${presetAuthorId}` : '/dashboard'} className="editor-back"><FiArrowLeft /> Back to {presetAuthorId ? 'author' : 'dashboard'}</Link>
        <div>
          <div className="eyebrow">{editing ? 'MANUSCRIPT CONFIGURATION' : bookType === 'REVIEW_BOOK' ? 'ADMIN REVIEW BOOK' : 'NEW MANUSCRIPT'}</div>
          <h1>{editing ? 'Give it a shape.' : form.title ? `Drafting “${form.title}”.` : 'Start a new story.'}</h1>
          <p>{editing ? 'Fine-tune the details readers see before and after publishing.' : 'Give your story a title first — details and chapters come next.'}</p>
        </div>
        <button className="button" form="book-editor-form" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save details' : 'Create story'}</button>
      </div>

      {isAdmin && !editing && <div className="editor-mode">
        <span className="editor-mode-label">Book type</span>
        <button className={bookType === 'USER_BOOK' ? 'active' : ''} onClick={() => setBookType('USER_BOOK')}>Story (user book)</button>
        <button className={bookType === 'REVIEW_BOOK' ? 'active' : ''} onClick={() => setBookType('REVIEW_BOOK')}>Review book (admin)</button>
      </div>}

      {error && <div className="error-box">{error}</div>}

      {loading ? <div className="editor-empty">Loading manuscript…</div>
        : <form id="book-editor-form" className="editor-layout" onSubmit={save}>
          <aside className="editor-sidebar">
            <div className="editor-cover">{preview ? <img src={preview} alt="" /> : <span>Cover<br />preview</span>}</div>
            {editing || bookType === 'REVIEW_BOOK' ? <><label className="editor-cover-input">Upload cover<input type="file" accept="image/*" onChange={pickCover} /></label>
              <label>…or paste an image URL<input value={form.coverImage} onChange={set('coverImage')} placeholder="https://…" /></label>
              <p className="editor-note">Covers are stored on Cloudinary and shown across the archive.</p></> : null}
          </aside>
          <section className="editor-main">
            <label>Story title<input value={form.title} onChange={set('title')} required maxLength="240" placeholder="The name readers will remember" /></label>
            {!editing && bookType === 'USER_BOOK' ? <p className="editor-hint">The story starts as a draft with just a title. After creating it you can add the description, genre, cover, and chapters.</p> : <>
              <label>Subtitle<input value={form.subtitle} onChange={set('subtitle')} maxLength="240" placeholder="A quiet promise of what is inside" /></label>
              <label>Description<textarea rows="5" value={form.description} onChange={set('description')} required maxLength="4000" placeholder="A short synopsis that invites readers in…" /></label>
              <div className="editor-grid">
                <label className="editor-genre-label">Genres<span className="editor-genre-hint">Pick one or more</span><div className="editor-genres">{DEFAULT_GENRES.map(genre => <button type="button" key={genre} className={form.genres.includes(genre) ? 'selected' : ''} onClick={() => toggleGenre(genre)}>{genre}</button>)}</div></label>
                <label>Language<select value={form.language} onChange={set('language')}><option>English</option><option>Hindi</option><option>Spanish</option></select></label>
                <label>Publication date<input type="date" value={form.publicationDate} onChange={set('publicationDate')} /></label>
                <label>Tags (comma separated)<input value={form.tags} onChange={set('tags')} placeholder="romance, slow-burn" /></label>
              </div>
              {isAdmin && (editing || bookType === 'REVIEW_BOOK') && <label>Author<select value={form.authorId} onChange={set('authorId')} required><option value="">Select an author</option>{authors.map(author => <option value={author.id} key={author.id}>{author.name}</option>)}</select></label>}
              {editing && bookType === 'USER_BOOK' && <div className="editor-hint">
                <strong>Next step:</strong> after saving, add chapters from the <Link to={`/write?bookId=${id}`}>chapters editor</Link> and publish the story when it has at least one chapter and a description.
              </div>}</>}
          </section>
        </form>}
    </main>
    <Footer />
  </>
}
