import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode } from 'swiper/modules'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { FiArrowRight, FiArrowUpRight } from 'react-icons/fi'
import { listBooks } from '../../services/booksApi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import './LandingPage.css'
import 'swiper/css'
import 'swiper/css/free-mode'

const VERDICTS = [
  ['Skip', '#FF5F7D', 'Not worth your night.'],
  ['Timepass', '#F4B400', 'Fine when you are bored.'],
  ['Go for it', '#00D084', 'Worth your night.'],
  ['Perfection', '#A855F7', 'Clear your weekend.']
]
const gaugePoint = (degree, radius) => [100 + radius * Math.cos((degree * Math.PI) / 180), 100 - radius * Math.sin((degree * Math.PI) / 180)]
const gaugeArc = (from, to) => { const [x1, y1] = gaugePoint(from, 85); const [x2, y2] = gaugePoint(to, 85); return `M ${x1} ${y1} A 85 85 0 0 1 ${x2} ${y2}` }
const gaugeSegments = VERDICTS.map(([label, color], index) => ({ key: label, color, d: gaugeArc(180 - index * 46.5, 139.5 - index * 46.5) }))

const fadeUp = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } }

export default function LandingPage() {
  const user = useSelector(state => state.auth.user)
  const [books, setBooks] = useState([])
  useEffect(() => { listBooks('?size=20&sort=updatedAt,desc').then(page => setBooks(page.content || [])).catch(() => {}) }, [])
  return (
    <>
      <SharedNav />
      <main className="lp-page">
        <section className="lp-hero">
          <motion.div className="lp-hero-copy" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}>
            <motion.div variants={fadeUp} className="lp-eyebrow">A reader's verdict, on record</motion.div>
            <motion.h1 variants={fadeUp}>Every story deserves a <em>straight answer.</em></motion.h1>
            <motion.p variants={fadeUp}>Read a story, then say what it's worth — <strong>skip</strong>, <strong>timepass</strong>, <strong>go for it</strong>, <strong>perfection</strong>. Four honest words. No star ratings, no decimals, no fuss.</motion.p>
            <motion.div variants={fadeUp} className="lp-actions">
              {user ? (
                <>
                  <Link className="button" to="/reader-dashboard">Reader Dashboard <FiArrowUpRight /></Link>
                  <Link className="lp-text-link" to="/dashboard">Writer Dashboard <FiArrowRight /></Link>
                </>
              ) : (
                <>
                  <Link className="button" to="/explore">Start reading <FiArrowUpRight /></Link>
                  <Link className="lp-text-link" to="/register">Start writing <FiArrowRight /></Link>
                </>
              )}
            </motion.div>
          </motion.div>
          <motion.aside className="meter-card" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }}>
            <div className="meter-card-head">
              <span className="meter-card-title">The meter</span>
              <span className="meter-card-note">one of four words, every time</span>
            </div>
            <svg viewBox="0 0 200 115" className="meter-gauge" aria-hidden="true">
              {gaugeSegments.map(segment => <path key={segment.key} d={segment.d} stroke={segment.color} strokeWidth="8" fill="none" />)}
              <text x="100" y="90" textAnchor="middle" className="meter-center">4 words</text>
            </svg>
            <ul className="meter-rows">
              {VERDICTS.map(([label, color, meaning]) => (
                <li key={label}>
                  <span className="meter-dot" style={{ background: color }} />
                  <span className="meter-label">{label}</span>
                  <span className="meter-meaning">{meaning}</span>
                </li>
              ))}
            </ul>
            <p className="meter-foot">You read. You pick a word. The needle moves. That's the whole system.</p>
          </motion.aside>
        </section>

        <section className="lp-how">
          <div className="lp-eyebrow">How it works</div>
          <h2>Three moves, then you're set.</h2>
          <ol className="how-steps">
            <li>
              <span className="how-num">01</span>
              <h3>Read</h3>
              <p>Pick a story and read it at your own pace — chapters, cover to cover, whenever the mood strikes.</p>
            </li>
            <li>
              <span className="how-num">02</span>
              <h3>Leave a verdict</h3>
              <p>One tap for how it actually felt. No five-star math, no pressure to be clever about it.</p>
            </li>
            <li>
              <span className="how-num">03</span>
              <h3>Watch the meter</h3>
              <p>Every verdict nudges the needle. The meter shows what most readers think, at a glance.</p>
            </li>
          </ol>
        </section>

        <section className="lp-shelf">
          <div className="shelf-head">
            <div>
              <div className="lp-eyebrow">Fresh on the shelf</div>
              <h2>Trending manuscripts</h2>
            </div>
            <Link className="shelf-link" to="/explore">See the whole shelf <FiArrowRight /></Link>
          </div>
          <Swiper modules={[FreeMode]} freeMode spaceBetween={16} slidesPerView="auto">
            {books.map(book => (
              <SwiperSlide className="lp-slide" key={book.id}>
                <Link to={`/books/${book.id}`}>
                  <div className="lp-cover">{book.coverImage || book.thumbnailUrl ? <img src={book.coverImage || book.thumbnailUrl} alt="" /> : <span>SV</span>}</div>
                  <h3>{book.title}</h3>
                  <p>{book.bookType || 'Story'} · {book.publicationDate ? String(book.publicationDate).slice(0, 4) : '—'}</p>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>

        <section className="lp-closing">
          <h2>Your verdict is the missing one.</h2>
          <p>Books get better when readers actually say what they think.</p>
          {user ? <Link className="button" to="/explore">Keep reading <FiArrowUpRight /></Link> : <Link className="button" to="/register">Start writing <FiArrowUpRight /></Link>}
        </section>
      </main>
      <Footer />
    </>
  )
}
