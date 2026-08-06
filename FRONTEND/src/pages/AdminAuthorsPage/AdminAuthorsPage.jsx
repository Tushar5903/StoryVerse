import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiArrowRight, FiArrowUpRight, FiPlus, FiSearch, FiX } from 'react-icons/fi'
import { createAuthor } from '../../services/authorsApi'
import { listAllAuthors } from '../../services/adminApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import './AdminAuthorsPage.css'

const emptyForm = { name: '', profileImage: '', dateOfBirth: '', placeOfBirth: '', biography: '' }

export default function AdminAuthorsPage() {
  const [searchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(() => searchParams.get('create') === '1')
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const load = () => {
    listAllAuthors('?size=100')
      .then(page => { setAuthors(page.content || []); setError('') })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = query.trim()
    ? authors.filter(author => [author.name, author.username, author.placeOfBirth, author.biography]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query.trim().toLowerCase())))
    : authors

  const set = key => event => setForm(value => ({ ...value, [key]: event.target.value }))

  const onSubmit = async event => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await createAuthor({
        name: form.name,
        biography: form.biography || null,
        placeOfBirth: form.placeOfBirth || null,
        dateOfBirth: form.dateOfBirth || null,
        profileImage: form.profileImage || null
      })
      toast.success('Author created.')
      setForm(emptyForm)
      setCreateOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <>
    <SharedNav />
    <main className="admin-authors">
      <div className="admin-authors-head">
        <div>
          <div className="eyebrow">ADMIN DIRECTORY</div>
          <h1>Authors.</h1>
          <p>Every voice in the archive, on record. Create a new author or open a profile to see their published work.</p>
        </div>
        <button className="button" onClick={() => setCreateOpen(value => !value)}>{createOpen ? <><FiX /> Close</> : <><FiPlus /> Create author</>}</button>
      </div>

      {createOpen && <section className="aa-create">
        <div className="eyebrow">NEW ENTRY</div>
        <h2>Create an author.</h2>
        <form onSubmit={onSubmit}>
          <div className="aa-form-grid">
            <label>Author name<input value={form.name} onChange={set('name')} placeholder="The name readers will remember" required /></label>
            <label>Profile image URL<input value={form.profileImage} onChange={set('profileImage')} placeholder="https://…" /></label>
            <label>Place of birth<input value={form.placeOfBirth} onChange={set('placeOfBirth')} placeholder="e.g. Kolkata, India" /></label>
            <label>Date of birth<input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} /></label>
          </div>
          <label>Biography<textarea rows="4" value={form.biography} onChange={set('biography')} placeholder="A short introduction to the author…" /></label>
          <div className="aa-form-actions">
            <button className="button" disabled={submitting}>{submitting ? 'Creating…' : 'Create author'} <FiArrowUpRight /></button>
            <button type="button" className="aa-cancel" onClick={() => setCreateOpen(false)}>Cancel</button>
          </div>
        </form>
      </section>}

      {error && <div className="error-box">{error}</div>}

      <section className="aa-directory">
        <div className="aa-directory-head">
          <div>
            <div className="eyebrow">THE ARCHIVE</div>
            <h2>All authors</h2>
          </div>
          <label className="aa-search"><FiSearch /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search authors…" /></label>
        </div>
        {loading ? <div className="aa-empty">Loading the directory…</div>
          : !authors.length ? <div className="aa-empty"><strong>The directory is empty.</strong><p>Create the first author to open the archive.</p></div>
            : !filtered.length ? <div className="aa-empty"><strong>No matches.</strong><p>No author matches “{query}”.</p></div>
              : <div className="aa-grid">{filtered.map(author => <article className="aa-card" key={author.id}>
                <Link className="aa-avatar" to={`/authors/${author.id}`}>{author.profileImage ? <img src={author.profileImage} alt="" /> : (author.name || 'A').slice(0, 1)}</Link>
                <h3><Link to={`/authors/${author.id}`}>{author.name}</Link></h3>
                {author.username && <span className="aa-handle">@{author.username}</span>}
                <p>{author.biography || 'A voice in the StoryVerse archive.'}</p>
                <div className="aa-card-meta">
                  <span>{author.authorType === 'ADMIN' ? 'Staff author' : 'Author'}</span>
                  <Link to={`/authors/${author.id}`}>View profile <FiArrowRight /></Link>
                </div>
              </article>)}
            </div>}
      </section>
    </main>
    <Footer />
  </>
}
