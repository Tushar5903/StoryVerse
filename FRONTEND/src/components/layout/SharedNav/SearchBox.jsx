import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiSearch } from 'react-icons/fi'
import { listBooks } from '../../../services/booksApi'
import './SearchBox.css'

const TYPE_LABEL = { REVIEW_BOOK: 'For Review', USER_BOOK: 'User Book' }
const yearOf = book => book.publicationDate ? String(book.publicationDate).slice(0, 4) : '—'

export default function SearchBox({ className = '' }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)
  const timerRef = useRef(null)
  useEffect(() => () => clearTimeout(timerRef.current), [])
  useEffect(() => {
    const onPointerDown = event => { if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])
  const onChange = event => {
    const value = event.target.value
    setQuery(value)
    clearTimeout(timerRef.current)
    const term = value.trim()
    if (!term) { setResults([]); setLoading(false); setOpen(false); return }
    setOpen(true)
    setLoading(true)
    timerRef.current = setTimeout(() => {
      listBooks(`?q=${encodeURIComponent(term)}&size=6`)
        .then(page => { setResults(page?.content || []); setLoading(false) })
        .catch(() => { setResults([]); setLoading(false) })
    }, 250)
  }
  const submit = event => {
    event.preventDefault()
    const term = query.trim()
    if (!term) return
    setOpen(false)
    document.activeElement?.blur()
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }
  const onKeyDown = event => { if (event.key === 'Escape') { setOpen(false); event.currentTarget.blur() } }
  const term = query.trim()
  return (
    <form className={className} role="search" ref={boxRef} onSubmit={submit}>
      <FiSearch />
      <input value={query} onChange={onChange} onKeyDown={onKeyDown} placeholder="Search books…" aria-label="Search books" autoComplete="off" />
      {open && (
        <div className="sb-dropdown">
          {loading ? <div className="sb-empty">Searching…</div>
            : results.length ? <>
                {results.map(book => (
                  <Link key={book.id} className="sb-result" to={`/books/${book.id}`} onClick={() => setOpen(false)}>
                    <span className="sb-thumb">{book.coverImage || book.thumbnailUrl ? <img src={book.coverImage || book.thumbnailUrl} alt="" /> : <span>SV</span>}</span>
                    <span className="sb-copy"><strong>{book.title}</strong><small>{TYPE_LABEL[book.bookType] || book.bookType || 'Story'} · {yearOf(book)}</small></span>
                  </Link>
                ))}
                <Link className="sb-seeall" to={`/search?q=${encodeURIComponent(term)}`} onClick={() => setOpen(false)}>See all results for “{term}” <FiArrowRight /></Link>
              </>
            : <div className="sb-empty">No books match “{term}”.</div>}
        </div>
      )}
    </form>
  )
}
