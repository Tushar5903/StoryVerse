import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiBookOpen, FiChevronDown, FiMoon, FiSun } from 'react-icons/fi'
import { getBook } from '../../services/booksApi'
import { listChapters } from '../../services/chaptersApi'
import { getBookProgress, markRead, unmarkRead } from '../../services/progressApi'
import './ReaderPage.css'

const looksLikeHtml = value => /<\/?[a-z][\s\S]*>/i.test(String(value || '').trim())
const renderContent = value => looksLikeHtml(value)
  ? <div className="prose" dangerouslySetInnerHTML={{ __html: value }} />
  : <div className="prose">{String(value).split('\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>

export default function ReaderPage() {
  const [params] = useSearchParams()
  const bookId = params.get('bookId')
  const [book, setBook] = useState(null)
  const [chapters, setChapters] = useState([])
  const [active, setActive] = useState(0)
  const [theme, setTheme] = useState('dark')
  const [readMap, setReadMap] = useState({})
  const [error, setError] = useState('')
  const [chaptersOpen, setChaptersOpen] = useState(false)

  useEffect(() => {
    if (!bookId) return
    Promise.all([
      getBook(bookId),
      listChapters(bookId),
      getBookProgress(bookId).catch(() => [])
    ])
      .then(([currentBook, currentChapters, progress]) => {
        setBook(currentBook)
        setChapters(currentChapters)
        setActive(0)
        setReadMap(Object.fromEntries(progress.map(item => [item.chapterId, item.markedAt])))
      })
      .catch(err => setError(err.message))
  }, [bookId])

  const chapter = chapters[active]
  const go = index => { if (index >= 0 && index < chapters.length) setActive(index) }
  const toggleRead = id => {
    const marked = !!readMap[id]
    setReadMap(map => ({ ...map, [id]: marked ? null : new Date().toISOString() }))
    if (marked) unmarkRead(id).catch(() => {})
    else markRead(bookId, id).catch(() => {})
  }
  const next = () => {
    if (active >= chapters.length - 1) return
    const id = chapters[active].id
    if (!readMap[id]) {
      setReadMap(map => ({ ...map, [id]: new Date().toISOString() }))
      markRead(bookId, id).catch(() => {})
    }
    setActive(active + 1)
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
        {chapters.map((item, index) => <div className="chapter-item" key={item.id}><input type="checkbox" checked={!!readMap[item.id]} onChange={() => toggleRead(item.id)} aria-label={`Mark chapter ${item.chapterNumber} as read`} /><button className={index === active ? 'active' : ''} onClick={() => { setActive(index); setChaptersOpen(false) }}>Chapter {item.chapterNumber}: {item.chapterTitle || item.title}</button></div>)}
      </nav>
      <article className="reading-column">
        <div className="eyebrow">{book?.genre || 'MANUSCRIPT'} · PART ONE</div>
        <h1>{chapter.chapterTitle || chapter.title}</h1>
        {chapter.chapterContent || chapter.content ? renderContent(chapter.chapterContent || chapter.content) : <p className="dropcap">This chapter is still being written.</p>}
        <div className="reader-nav">
          <button onClick={() => go(active - 1)} disabled={active === 0}><FiArrowLeft /> Previous</button>
          <span>{active + 1} / {chapters.length}</span>
          <button onClick={next} disabled={active === chapters.length - 1}>Next chapter <FiArrowRight /></button>
        </div>
      </article>
    </div>
    </> : <article className="reading-column">
      <div className="eyebrow">{book?.genre || 'MANUSCRIPT'}</div>
      <h1>{book?.title || 'A story waiting to be opened'}</h1>
      <p className="dropcap">There is a particular silence that arrives just before a story begins. It is not empty. It is an invitation — a held breath, a page turned in the dark.</p>
      <p>This manuscript has not published its chapters yet. Check back soon, or explore the rest of the archive.</p>
    </article>}
  </div>
}
