import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { FiArrowRight, FiArrowUpRight, FiCheck } from 'react-icons/fi'
import SharedNav from '../../components/layout/SharedNav/SharedNav'
import Footer from '../../components/layout/Footer/Footer'
import { VERDICT_LABELS, VERDICT_COLORS } from '../../components/review-meter/constants'
import './LandingPage.css'

const VERDICT_SECTIONS = [
  { key: 'SKIP', label: VERDICT_LABELS.SKIP, color: VERDICT_COLORS.SKIP, start: 0, angle: 45, meaning: 'Not worth your night.' },
  { key: 'TIMEPASS', label: VERDICT_LABELS.TIMEPASS, color: VERDICT_COLORS.TIMEPASS, start: 90, angle: 135, meaning: 'Fine when you are bored.' },
  { key: 'GO_FOR_IT', label: VERDICT_LABELS.GO_FOR_IT, color: VERDICT_COLORS.GO_FOR_IT, start: 180, angle: 225, meaning: 'Worth your night.' },
  { key: 'PERFECTION', label: VERDICT_LABELS.PERFECTION, color: VERDICT_COLORS.PERFECTION, start: 270, angle: 315, meaning: 'Clear your weekend.' },
]

const VERDICT_JOURNEY = [
  { num: '01', label: VERDICT_LABELS.SKIP, color: VERDICT_COLORS.SKIP, description: 'Not worth your time.', x: 245, y: 125, side: 'right', delay: 0.6 },
  { num: '02', label: VERDICT_LABELS.TIMEPASS, color: VERDICT_COLORS.TIMEPASS, description: 'Fine when you have time.', x: 205, y: 270, side: 'left', delay: 1.2 },
  { num: '03', label: VERDICT_LABELS.GO_FOR_IT, color: VERDICT_COLORS.GO_FOR_IT, description: 'Worth your night.', x: 375, y: 345, side: 'right', delay: 1.9 },
  { num: '04', label: VERDICT_LABELS.PERFECTION, color: VERDICT_COLORS.PERFECTION, description: 'An unforgettable read.', x: 350, y: 435, side: 'left', delay: 2.6 },
]
const JOURNEY_POINTS = [[95, 45], [245, 125], [205, 270], [375, 345], [350, 435], [485, 490]]
const catmullRomPath = points => {
  const prev = i => points[i - 1] || [points[0][0] * 2 - points[1][0], points[0][1] * 2 - points[1][1]]
  const next = i => points[i + 1] || [points[points.length - 1][0] * 2 - points[points.length - 2][0], points[points.length - 1][1] * 2 - points[points.length - 2][1]]
  const controls = points.map((p, i) => ({
    p1: [p[0] + (next(i)[0] - prev(i)[0]) / 6, p[1] + (next(i)[1] - prev(i)[1]) / 6],
    p2: [p[0] - (next(i)[0] - prev(i)[0]) / 6, p[1] - (next(i)[1] - prev(i)[1]) / 6],
  }))
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    d += ` C ${controls[i].p1[0].toFixed(1)} ${controls[i].p1[1].toFixed(1)}, ${controls[i + 1].p2[0].toFixed(1)} ${controls[i + 1].p2[1].toFixed(1)}, ${points[i + 1][0]} ${points[i + 1][1]}`
  }
  return d
}
const VERDICT_PATH_D = catmullRomPath(JOURNEY_POINTS)
const VERDICT_PATH_VIEWBOX = '0 0 560 520'
const PATH_DRAW_MS = 2800
const PATH_REST_MS = 2000

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } }

function Reveal({ children, delay = 0, className = '' }) {
  return <motion.div className={className}
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-70px' }}
    transition={{ duration: 0.55, ease: 'easeOut', delay }}>
    {children}
  </motion.div>
}

function VerdictJourney() {
  const rootRef = useRef(null)
  const inView = useInView(rootRef, { once: true, margin: '-60px' })
  const reducedMotion = useReducedMotion()
  const [drawCycle, setDrawCycle] = useState(0)
  useEffect(() => {
    if (!inView || reducedMotion) return
    const id = setTimeout(() => setDrawCycle(cycle => cycle + 1), PATH_DRAW_MS + PATH_REST_MS)
    return () => clearTimeout(id)
  }, [inView, drawCycle, reducedMotion])
  return (
    <div className={`vj${inView ? ' vj-visible' : ''}`} ref={rootRef}>
      <div className="vj-desktop">
        <svg className="vj-svg" viewBox={VERDICT_PATH_VIEWBOX} aria-hidden="true">
          <defs>
            <linearGradient id="vjGrad" gradientUnits="userSpaceOnUse" x1="95" y1="45" x2="485" y2="490">
              <stop offset="0" stopColor={VERDICT_COLORS.SKIP} />
              <stop offset="0.34" stopColor={VERDICT_COLORS.TIMEPASS} />
              <stop offset="0.66" stopColor={VERDICT_COLORS.GO_FOR_IT} />
              <stop offset="1" stopColor={VERDICT_COLORS.PERFECTION} />
            </linearGradient>
          </defs>
          <path key={drawCycle} className="vj-path" pathLength="100" d={VERDICT_PATH_D} />
        </svg>
        {VERDICT_JOURNEY.map(step => (
          <div key={step.num} className={`vj-anchor vj-anchor--${step.side}`} style={{ '--vjx': `${(step.x / 560) * 100}%`, '--vjy': `${(step.y / 520) * 100}%`, '--vj-delay': `${step.delay}s`, '--vj-color': step.color }}>
            <span className="vj-tick" />
            <span className="vj-dot" />
            <span className="vj-label">
              <span className="vj-num">{step.num}</span>
              <span className="vj-name">{step.label}</span>
              <span className="vj-desc">{step.description}</span>
            </span>
          </div>
        ))}
      </div>
      <ol className="vj-mobile" aria-hidden="true">
        {VERDICT_JOURNEY.map(step => (
          <li key={step.num} className="vj-step" style={{ '--vj-color': step.color }}>
            <span className="vj-step-dot" />
            <span className="vj-step-text">
              <span className="vj-num">{step.num}</span>
              <span className="vj-step-name">{step.label}</span>
              <span className="vj-step-desc">{step.description}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Manuscript() {
  return <div className="manuscript" aria-hidden="true">
    <span className="manuscript-drop" />
    <span className="manuscript-line" />
    <span className="manuscript-line" />
    <span className="manuscript-line" />
    <span className="manuscript-line" />
  </div>
}

function MiniBook() {
  const PAGE_ANGLES = [4.5, 6.6, 8.7, 10.8, 12.9]
  return <div className="book3d book3d--mini" aria-hidden="true">
    <div className="book3d-scene">
      <div className="book3d-book">
        <div className="book3d-cover book3d-cover--back" />
        <div className="book3d-pages book3d-pages--left">{PAGE_ANGLES.map((angle, index) => <i key={index} style={{ '--tilt': `${angle}deg` }} />)}</div>
        <div className="book3d-pages book3d-pages--right">{PAGE_ANGLES.map((angle, index) => <i key={index} style={{ '--tilt': `-${angle}deg` }} />)}</div>
        <div className="book3d-text book3d-text--left"><i /><i /><i /><i /></div>
        <div className="book3d-text book3d-text--right"><i /><i /><i /><i /></div>
        <div className="book3d-cover book3d-cover--front" />
        <div className="book3d-spine" />
        <div className="book3d-light" />
      </div>
    </div>
  </div>
}

function VerdictSeal() {
  return <div className="seal3d" aria-hidden="true">
    <div className="seal3d-scene">
      <div className="seal3d-shadow" />
      <div className="seal3d-object">
        <div className="seal3d-back" />
        <div className="seal3d-face">
          <span className="seal3d-ring" />
          <span className="seal3d-mark"><FiCheck /></span>
          <span className="seal3d-word">Verdict</span>
        </div>
        <div className="seal3d-rim" />
        <div className="seal3d-light" />
      </div>
    </div>
  </div>
}

export default function LandingPage() {
  const user = useSelector(state => state.auth.user)
  return (
    <>
      <SharedNav />
      <main className="lp-page">
        <section className="lp-hero">
          <motion.div className="lp-hero-copy" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}>
            <motion.p variants={fadeUp} className="lp-kicker">The reading community</motion.p>
            <motion.h1 variants={fadeUp}>Stories worth reading.<br /><em>Opinions worth sharing.</em></motion.h1>
            <motion.p variants={fadeUp} className="lp-hero-lead">Discover stories, read what the community thinks, and leave your own verdict.</motion.p>
            <motion.div variants={fadeUp} className="lp-actions">
              {user ? (
                <>
                  <Link className="button lp-btn-primary" to="/reader-dashboard">Reader Dashboard <FiArrowUpRight /></Link>
                  <Link className="lp-text-link" to="/dashboard">Writer Dashboard <FiArrowRight /></Link>
                </>
              ) : (
                <>
                  <Link className="button lp-btn-primary" to="/explore">Explore Stories <FiArrowUpRight /></Link>
                  <Link className="lp-text-link" to="/register">Start Writing <FiArrowRight /></Link>
                </>
              )}
            </motion.div>
          </motion.div>
          <motion.div className="lp-hero-visual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.2 }}>
            <VerdictJourney />
          </motion.div>
        </section>

        <section className="lp-journey">
          <Reveal>
            <div className="journey-head"><h2>Read. Feel. Decide.</h2></div>
            <div className="journey-track">
              <div className="journey-stage">
                <span className="stage-num">01</span>
                <div className="stage-visual"><Manuscript /></div>
                <h3>Discover</h3>
                <p>Find a story that catches you.</p>
              </div>
              <div className="journey-stage">
                <span className="stage-num">02</span>
                <div className="stage-visual"><MiniBook /></div>
                <h3>Read</h3>
                <p>Read it at your own pace.</p>
              </div>
              <div className="journey-stage">
                <span className="stage-num">03</span>
                <div className="stage-visual"><VerdictSeal /></div>
                <h3>Verdict</h3>
                <p>Leave one honest opinion.</p>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="lp-community">
          <Reveal className="community-inner">
            <h2>Every story deserves<br />an honest reader.</h2>
            <div className="verdict-tokens">
              {VERDICT_SECTIONS.map((section, index) => (
                <span className="token" key={section.key} style={{ '--float-delay': `${index * 0.7}s`, color: section.color }}><i />{section.label}</span>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="lp-cta">
          <Reveal className="cta-inner">
            <h2>Your next story is waiting.</h2>
            <p className="lp-cta-sub">Read something new. Leave something honest.</p>
            <div className="lp-actions cta-actions">
              <Link className="button lp-btn-primary" to="/explore">Explore Stories <FiArrowUpRight /></Link>
              {user ? <Link className="lp-text-link" to="/dashboard">Writer Dashboard <FiArrowRight /></Link> : <Link className="lp-text-link" to="/register">Start Writing <FiArrowRight /></Link>}
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  )
}
