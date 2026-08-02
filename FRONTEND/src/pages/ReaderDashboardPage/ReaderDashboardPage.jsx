import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowUpRight, FiBookOpen, FiCheckCircle, FiStar } from 'react-icons/fi'
import { getProgress, markRead } from '../../services/progressApi'
import { listMyReviews } from '../../services/reviewsApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import './ReaderDashboardPage.css'

const readingKey = key => key.startsWith('sv_reading_')

async function importLegacyProgress() {
  const entries = []
  for (const key of Object.keys(localStorage)) {
    if (!readingKey(key)) continue
    const bookId = Number(key.slice('sv_reading_'.length))
    try {
      const map = JSON.parse(localStorage.getItem(key) || '{}')
      for (const [chapterId, value] of Object.entries(map)) {
        if (typeof value === 'number' && value > 0 && Number.isFinite(Number(chapterId))) {
          entries.push({ bookId, chapterId: Number(chapterId) })
        }
      }
    } catch { /* ignore corrupt entries */ }
  }
  if (!entries.length) return
  await Promise.all(entries.map(entry => markRead(entry.bookId, entry.chapterId).catch(() => {})))
  for (const key of Object.keys(localStorage)) {
    if (readingKey(key)) localStorage.removeItem(key)
  }
}

export default function ReaderDashboardPage() {
  const [books, setBooks] = useState([])
  const [reviewsCount, setReviewsCount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    importLegacyProgress()
      .then(() => Promise.all([getProgress(), listMyReviews('?size=1')]))
      .then(([progress, page]) => {
        if (cancelled) return
        setBooks(progress)
        setReviewsCount(page.totalElements ?? 0)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const streak = useMemo(() => {
    const days = new Set()
    for (const book of books) {
      for (const item of book.chapters || []) {
        if (item.markedAt) days.add(new Date(item.markedAt).toDateString())
      }
    }
    const list = [...days].map(day => new Date(day).getTime()).sort((a, b) => b - a)
    if (!list.length) return 0
    const dayMs = 24 * 60 * 60 * 1000
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const last = list[0]
    const start = last === today.getTime() ? last : last === today.getTime() - dayMs ? last : null
    if (start === null) return 0
    let count = 0
    let cursor = start
    while (list.includes(cursor)) { count += 1; cursor -= dayMs }
    return count
  }, [books])

  return <>
    <SharedNav />
    <main className="reader-dashboard">
      <div className="reader-head">
        <div>
          <div className="eyebrow">READER DASHBOARD</div>
          <h1>Pick up where you left off.</h1>
          <p>Your reading progress, your reviews, and the stories still waiting for you — all in one place.</p>
        </div>
        <Link className="button" to="/explore">Find a story <FiArrowUpRight /></Link>
      </div>
      <div className="reader-stats">
        <div className="reader-stat"><FiBookOpen /><span>Stories read</span><strong>{books.length}</strong></div>
        <div className="reader-stat"><FiCheckCircle /><span>Reviews given</span><strong>{reviewsCount === null ? '—' : reviewsCount}</strong></div>
        <div className="reader-stat"><FiStar /><span>Reading streak</span><strong>{streak} {streak === 1 ? 'day' : 'days'}</strong></div>
      </div>
      <section className="reader-continue">
        <div className="eyebrow">YOUR LIBRARY</div>
        <h2>Continue reading</h2>
        {loading ? <div className="reader-empty">Checking the shelves…</div>
          : !books.length ? <div className="reader-empty"><strong>Your reading shelf is ready.</strong><p>Open a story and mark chapters as read — your progress will show up here.</p><Link className="button" to="/explore">Start reading <FiArrowUpRight /></Link></div>
            : <div className="continue-grid">{books.map(entry => {
              const read = (entry.chapters || []).length
              const total = entry.totalChapters || 0
              const pct = total ? Math.round((read / total) * 100) : 0
              return <Link className="continue-card" to={`/reader?bookId=${entry.bookId}`} key={entry.bookId}>
                <div className="continue-cover">{entry.coverImage || entry.thumbnailUrl ? <img src={entry.coverImage || entry.thumbnailUrl} alt="" /> : <span>SV</span>}</div>
                <div className="continue-copy">
                  <h3>{entry.title}</h3>
                  <p>{entry.authorName || 'Unknown author'} · {entry.genre || 'Story'}</p>
                  <div className="continue-progress"><span style={{ width: `${pct}%` }} /></div>
                  <small>{read}/{total} chapters · {pct}%</small>
                </div>
              </Link>
            })}</div>}
      </section>
    </main>
  </>
}
