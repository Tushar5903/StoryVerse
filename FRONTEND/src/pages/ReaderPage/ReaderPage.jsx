import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiBookOpen, FiCheck, FiChevronDown, FiMoon, FiSun } from 'react-icons/fi'
import DOMPurify from 'dompurify'
import { getBook } from '../../services/booksApi'
import { getChapter, listChapters } from '../../services/chaptersApi'
import { getBookProgress, markRead, unmarkRead } from '../../services/progressApi'
import { paginateChapter } from '../../utils/paginate'
import CompletionModal from '../../components/common/CompletionModal/CompletionModal'
import './ReaderPage.css'

// Defense-in-depth: never trust the regex heuristic alone - sanitize on the read path with
// the same allowlist the backend applies at write time.
const sanitizeHtml = value => DOMPurify.sanitize(value, {
  ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'br', 'em', 'strong', 'u', 's', 'del', 'blockquote', 'ul', 'ol', 'li', 'a', 'span', 'sup', 'sub'],
  ALLOWED_ATTR: ['href', 'title'],
})

export default function ReaderPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const bookId = params.get('bookId')
  const [book, setBook] = useState(null)
  const [chapters, setChapters] = useState([])
  const [active, setActive] = useState(0)
  const [theme, setTheme] = useState('dark')
  const [readMap, setReadMap] = useState({})
  const [error, setError] = useState('')
  const [chaptersOpen, setChaptersOpen] = useState(false)
  const [bodies, setBodies] = useState({})
  const [showComplete, setShowComplete] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(() => {
    if (!bookId) return
    const progressRequest = localStorage.getItem('sv_token')
      ? getBookProgress(bookId).catch(() => [])
      : Promise.resolve([])
    let cancelled = false
    Promise.all([
      getBook(bookId),
      listChapters(bookId),
      progressRequest
    ])
      .then(([currentBook, currentChapters, progress]) => {
        if (cancelled) return
        setBook(currentBook)
        setChapters(currentChapters)
        setActive(0)
        setPageIndex(0)
        setBodies({})
        setReadMap(Object.fromEntries(progress.map(item => [item.chapterId, item.markedAt])))
      })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [bookId])

  const chapter = chapters[active]
  const chapterBody = chapter ? (chapter.chapterContent || chapter.content || bodies[chapter.id]) : null
  const pages = useMemo(() => paginateChapter(chapterBody), [chapterBody])
  const page = Math.min(pageIndex, Math.max(pages.length - 1, 0))
  const isLastPage = page >= pages.length - 1

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [pageIndex, active])
  useEffect(() => {
    if (!chapter) return
    const inline = chapter.chapterContent || chapter.content
    if (inline || bodies[chapter.id]) return
    getChapter(bookId, chapter.id)
      .then(fetched => {
        const body = fetched.chapterContent || fetched.content || ''
        setBodies(current => {
          if (current[chapter.id] !== undefined) return current
          return { ...current, [chapter.id]: body }
        })
      })
      .catch(() => {})
    const nextChapter = chapters[active + 1]
    if (nextChapter && !bodies[nextChapter.id] && !(nextChapter.chapterContent || nextChapter.content)) {
      getChapter(bookId, nextChapter.id)
        .then(fetched => {
          const body = fetched.chapterContent || fetched.content || ''
          setBodies(current => (current[nextChapter.id] !== undefined ? current : { ...current, [nextChapter.id]: body }))
        })
        .catch(() => {})
    }
  }, [active, chapters, bodies, bookId, chapter])

  const go = index => { if (index >= 0 && index < chapters.length) { setActive(index); setPageIndex(0) } }
  const goPage = index => setPageIndex(Math.max(0, Math.min(index, pages.length - 1)))
  const toggleRead = id => {
    const marked = !!readMap[id]
    const previous = readMap[id]
    setReadMap(map => ({ ...map, [id]: marked ? null : new Date().toISOString() }))
    const rollback = () => setReadMap(map => ({ ...map, [id]: previous }))
    if (marked) unmarkRead(id).catch(rollback)
    else {
      markRead(bookId, id).catch(rollback)
      if (id === chapters[chapters.length - 1]?.id) setShowComplete(true)
    }
  }
  const next = () => {
    const id = chapters[active].id
    if (!readMap[id]) {
      const previous = readMap[id]
      setReadMap(map => ({ ...map, [id]: new Date().toISOString() }))
      markRead(bookId, id).catch(() => setReadMap(map => ({ ...map, [id]: previous })))
    }
    if (active >= chapters.length - 1) {
      setShowComplete(true)
      return
    }
    setActive(active + 1)
    setPageIndex(0)
  }
  const readCount = chapters.filter(item => readMap[item.id]).length
  const progress = chapters.length ? Math.round((readCount / chapters.length) * 100) : 0

  if (!bookId) return <main className={`reader reader-${theme}`}><div className="reader-bar"><Link to="/explore"><FiArrowLeft /> Back to explore</Link></div><article className="reading-column"><div className="eyebrow">READER</div><h1>Open a manuscript.</h1><p className="reader-empty-copy">Pick a story from the <Link to="/explore">Explore page</Link> to read its chapters here.</p></article></main>

  return <div className={`reader reader-${theme}`}>
    <div className="reader-bar">
      <Link to={`/books/${bookId}`}><FiArrowLeft /> <span className="reader-back-full">Back to story</span><span className="reader-back-short">Back</span></Link>
      <div className="reader-brand">STORY<span>VERSE</span></div>
      <div className="theme-switch">
        <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')} title="Dark"><FiMoon /></button>
        <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')} title="Light"><FiSun /></button>
        <button className={theme === 'sepia' ? 'active' : ''} onClick={() => setTheme('sepia')} title="Sepia"><FiBookOpen /></button>
      </div>
    </div>
    {error ? <div className="reader-error">{error}</div> : chapters.length > 0 && chapter ? <>
      <button className={`chapters-toggle${chaptersOpen ? ' open' : ''}`} aria-expanded={chaptersOpen} aria-controls="reader-chapters" onClick={() => setChaptersOpen(value => !value)}><span>CHAPTERS · {chapters.length}</span><FiChevronDown size={16} /></button>
      <div className="reader-body">
      <nav className={`chapter-index${chaptersOpen ? ' open' : ''}`} id="reader-chapters">
        <div className="eyebrow">{book?.title || 'THE ARCHIVE'}</div>
        <div className="reader-progress">
          <div className="reader-progress-head"><span>READ PROGRESS</span><b>{readCount}/{chapters.length}</b></div>
          <div className="reader-progress-bar"><span style={{ width: `${progress}%` }} /></div>
        </div>
        {chapters.map((item, index) => <div className="chapter-item" key={item.id}><input type="checkbox" checked={!!readMap[item.id]} onChange={() => toggleRead(item.id)} aria-label={`Mark chapter ${item.chapterNumber} as read`} /><button className={index === active ? 'active' : ''} onClick={() => { go(index); setChaptersOpen(false) }}>Chapter {item.chapterNumber}: {item.chapterTitle || item.title}</button></div>)}
      </nav>
      <article className="reading-column">
        <div className="eyebrow">{book?.genre || 'MANUSCRIPT'} · PART ONE</div>
        <h1>{chapter.chapterTitle || chapter.title}</h1>
        {chapterBody ? <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(pages[page]) }} /> : <p className="dropcap">This chapter is still being written.</p>}
        {chapterBody && <div className="reader-nav">
          <button onClick={page > 0 ? () => goPage(page - 1) : () => go(active - 1)} disabled={page === 0 && active === 0}><FiArrowLeft /> {page > 0 ? 'Prev page' : 'Prev chapter'}</button>
          <span>Page {page + 1} / {pages.length}</span>
          <button onClick={isLastPage ? next : () => goPage(page + 1)}>{isLastPage ? (active === chapters.length - 1 ? <>Finish <FiCheck /></> : <>Next chapter <FiArrowRight /></>) : <>Next page <FiArrowRight /></>}</button>
        </div>}
      </article>
    </div>
    </> : <article className="reading-column">
      <div className="eyebrow">{book?.genre || 'MANUSCRIPT'}</div>
      <h1>{book?.title || 'A story waiting to be opened'}</h1>
      <p className="dropcap">There is a particular silence that arrives just before a story begins. It is not empty. It is an invitation — a held breath, a page turned in the dark.</p>
      <p>This manuscript has not published its chapters yet. Check back soon, or explore the rest of the archive.</p>
    </article>}
    {showComplete && <CompletionModal
      bookTitle={book?.title}
      onExplore={() => navigate('/explore')}
      onCancel={() => setShowComplete(false)}
    />}
  </div>
}
