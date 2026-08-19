import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiArrowUpRight, FiPlus, FiSearch, FiX } from 'react-icons/fi'
import { createAuthor } from '../../services/authorsApi'
import { listAllAuthors } from '../../services/adminApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import Pager from '../../components/common/Pager/Pager'
import './AdminAuthorsPage.css'

const emptyForm = { name: '', profileImage: '', dateOfBirth: '', placeOfBirth: '', biography: '' }
const PAGE_SIZE = 100

const SKELETON_ITEMS = Array.from({ length: 6 })
function DirectorySkeleton() {
  return <div className="admin-author-grid" aria-hidden="true">{SKELETON_ITEMS.map((_, i) => <div className="admin-author-item" key={i}><span className="admin-author-avatar admin-author-avatar--skeleton" /><span className="admin-author-skel" /><span className="admin-author-skel admin-author-skel--short" /></div>)}</div>
}

export default function AdminAuthorsPage() {
  const [searchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(() => searchParams.get('create') === '1')
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [refreshNonce, setRefreshNonce] = useState(0)
  const resetKey = `${debouncedQuery}#${refreshNonce}`

  const [session, setSession] = useState({ key: resetKey, page: 0, items: [], loading: true, error: '', totalPages: 0, totalElements: 0 })

  if (session.key !== resetKey) {
    setSession({ key: resetKey, page: 0, items: [], loading: true, error: '', totalPages: 0, totalElements: 0 })
  }

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    const key = resetKey
    const page = session.page
    let cancelled = false
    listAllAuthors(`?size=${PAGE_SIZE}&page=${page}&sort=createdAt,desc${debouncedQuery ? `&q=${encodeURIComponent(debouncedQuery)}` : ''}`)
      .then(res => {
        if (cancelled) return
        setSession(prev => prev.key === key && prev.page === page
          ? { ...prev, items: res.content || [], loading: false, error: '', totalPages: res.totalPages ?? 0, totalElements: res.totalElements ?? 0 }
          : prev)
      })
      .catch(() => {
        if (cancelled) return
        setSession(prev => prev.key === key && prev.page === page ? { ...prev, loading: false, error: 'Failed to load authors. Please try again.' } : prev)
      })
    return () => { cancelled = true }
  }, [resetKey, session.page, debouncedQuery])

  const goToPage = page => setSession(prev => prev.key === resetKey ? { ...prev, page, loading: true, error: '' } : prev)

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
      setRefreshNonce(value => value + 1)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const { items: authors, loading, error, page, totalPages, totalElements } = session

  return <>
    <SharedNav />
    <main className="admin-authors">
      <div className="admin-authors-head">
        <div>
          <div className="eyebrow">ADMIN DIRECTORY</div>
          <h1>Authors.</h1>
          <p>Every voice in the archive, on record. Create a new author or open a profile to see their published work.</p>
        </div>
        <div className="admin-authors-head-actions">
          <label className="aa-search"><FiSearch /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search authors…" aria-label="Search authors" /></label>
          <button className="button" onClick={() => setCreateOpen(value => !value)}>{createOpen ? <><FiX /> Close</> : <><FiPlus /> Create author</>}</button>
        </div>
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

      {error && !authors.length && <div className="error-box">{error}</div>}

      <section className="admin-authors-section">
        <div className="section-title">
          <div>
            <div className="eyebrow">THE ARCHIVE</div>
            <h2>All Authors</h2>
          </div>
          {totalPages > 1 && <span className="aa-pager-meta">{totalElements} authors · page {page + 1}/{totalPages} (newest first)</span>}
        </div>
        {loading ? <DirectorySkeleton />
          : !authors.length ? <div className="aa-empty"><strong>{debouncedQuery ? 'No matches.' : 'The directory is empty.'}</strong><p>{debouncedQuery ? `No author matches “${debouncedQuery}”.` : 'Create the first author to open the archive.'}</p></div>
            : <>
              <div className="admin-author-grid">
                {authors.map(author => <Link className="admin-author-item" to={`/authors/${author.id}`} key={author.id}>
                  <span className="admin-author-avatar">{author.profileImage ? <img src={author.profileImage} alt={author.name} loading="lazy" /> : <span>{(author.name || 'A').slice(0, 1)}</span>}</span>
                  <span className="admin-author-name">{author.name}</span>
                  <span className="admin-author-role">{author.authorType === 'ADMIN' ? 'Author' : 'Writer'}</span>
                </Link>)}
              </div>
              <Pager page={page} totalPages={totalPages} totalElements={totalElements} onPage={goToPage} />
            </>}
      </section>
    </main>
    <Footer />
  </>
}