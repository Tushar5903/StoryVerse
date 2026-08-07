import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, useReducedMotion } from 'framer-motion'
import { apiClient } from './services/apiClient'
import { sendRegistrationOtp, verifyRegistrationOtp } from './services/authApi'
import { listBooks } from './services/booksApi'
import { listAuthors } from './services/authorsApi'
import { getMe } from './services/usersApi'
import { clearSession, setUser } from './store/authSlice'
import { fadeInUp } from './animations/variants'
import SharedNav from './components/layout/SharedNav/SharedNav'
import Footer from './components/layout/Footer/Footer'
import { listAllAuthors } from './services/adminApi'
import { toast } from 'react-toastify'
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiBookOpen, FiCheckCircle, FiCornerUpLeft, FiCornerUpRight, FiEye, FiEyeOff, FiLock, FiMoreHorizontal, FiMoon, FiPlus, FiSearch, FiStar, FiSun, FiTrendingUp } from 'react-icons/fi'
import { BsQuote } from 'react-icons/bs'
import { DEFAULT_GENRES, genrePath } from './data/genres'
import './App.css'

const verdicts = { SKIP: ['Skip', 'coral'], TIMEPASS: ['Time Pass', 'amber'], GO_FOR_IT: ['Go For It', 'teal'], PERFECTION: ['Perfection', 'violet'] }
const motionPresets = { page: fadeInUp, card: { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .12 }, transition: { duration: .35 } } }

const ExplorePage = lazy(() => import('./pages/ExplorePage/ExplorePage'))
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'))
const BookDetailPage = lazy(() => import('./pages/BookDetailPage/BookDetailPage'))
const AllReviewsPage = lazy(() => import('./pages/AllReviewsPage/AllReviewsPage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage/LeaderboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage/SettingsPage'))
const ReviewsPage = lazy(() => import('./pages/ReviewsPage/ReviewsPage'))
const LandingPage = lazy(() => import('./pages/LandingPage/LandingPage'))
const GenrePage = lazy(() => import('./pages/GenrePage/GenrePage'))
const WriterDashboardPage = lazy(() => import('./pages/WriterDashboardPage/WriterDashboardPage'))
const BookEditorPage = lazy(() => import('./pages/BookEditorPage/BookEditorPage'))
const ChaptersPage = lazy(() => import('./pages/ChaptersPage/ChaptersPage'))
const ReaderPage = lazy(() => import('./pages/ReaderPage/ReaderPage'))
const ReaderDashboardPage = lazy(() => import('./pages/ReaderDashboardPage/ReaderDashboardPage'))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage/UserProfilePage'))
const AuthorDetailPage = lazy(() => import('./pages/AuthorDetailPage/AuthorDetailPage'))
const GenreDetailPage = lazy(() => import('./pages/GenreDetailPage/GenreDetailPage'))
const AdminAuthorsPage = lazy(() => import('./pages/AdminAuthorsPage/AdminAuthorsPage'))

const api = apiClient

function useBooks(params = '') { const [state, setState] = useState({ data: [], loading: true, error: '' }); useEffect(() => { listBooks(params).then(x => setState({ data: x.content || [], loading: false, error: '' })).catch(e => setState({ data: [], loading: false, error: e.message })) }, [params]); return state }
function useAuthors() { const [state, setState] = useState({ data: [], loading: true, error: '' }); useEffect(() => { listAuthors('?size=24').then(x => setState({ data: x.content || [], loading: false, error: '' })).catch(e => setState({ data: [], loading: false, error: e.message })) }, []); return state }
function useAdminAuthors() { const [state, setState] = useState({ data: [], loading: true, error: '' }); useEffect(() => { listAllAuthors('?size=6').then(x => setState({ data: x.content || [], loading: false, error: '' })).catch(e => setState({ data: [], loading: false, error: e.message })) }, []); return state }
function Cover({ book, large = false }) { return book?.coverImage || book?.thumbnailUrl ? <img className={`cover ${large ? 'cover-large' : ''}`} src={book.coverImage || book.thumbnailUrl} alt="" /> : <div className={`cover cover-fallback ${large ? 'cover-large' : ''}`}><span>SV</span></div> }
function Verdict({ value }) { const item = verdicts[value] || verdicts.GO_FOR_IT; return <span className={`verdict ${item[1]}`}>{item[0]}</span> }
function BookCard({ book }) { return <motion.article {...motionPresets.card} className="book-card"><div className="cover-wrap"><Cover book={book} /><span className="score-ring">{book?.published ? 'GO' : 'DRAFT'}</span></div><div className="card-copy"><div className="eyebrow">{book?.genre || 'MANUSCRIPT'} · {book?.language || 'EN'}</div><h3>{book?.title || 'Untitled Manuscript'}</h3><p>{book?.authorName || 'Unknown author'}</p><div className="card-meta"><span>{book?.bookType || 'Story'}</span><span>{book?.published ? 'Published' : 'In progress'}</span></div></div></motion.article> }
function Empty({ title = 'Nothing in the archive yet.', detail = 'Connect your API or publish the first entry to see it here.' }) { return <div className="empty"><div className="empty-mark"><FiStar /></div><h3>{title}</h3><p>{detail}</p></div> }
function Shell({ children }) { return <><SharedNav /><main>{children}</main><footer><div className="brand">STORY<span>VERSE</span></div><p>Read the profound. Write the unforgettable.</p><span>© 2026 StoryVerse</span></footer></> }
function Page({ children, className = '' }) { const reduced = useReducedMotion(); return <motion.div className={`page ${className}`} initial={reduced ? false : motionPresets.page.initial} animate={reduced ? undefined : motionPresets.page.animate} transition={reduced ? undefined : motionPresets.page.transition}>{children}</motion.div> }
function SectionTitle({ kicker, title, text }) { return <div className="section-title"><div><div className="eyebrow">{kicker}</div><h2>{title}</h2></div>{text && <p>{text}</p>}</div> }
function RequireAuth({ children }) { const user = useSelector(state => state.auth.user); const dispatch = useDispatch(); const location = useLocation(); const [status, setStatus] = useState(() => (user ? 'ok' : localStorage.getItem('sv_token') ? 'pending' : 'missing')); useEffect(() => { if (status !== 'pending') return; getMe().then(profile => { dispatch(setUser(profile)); setStatus('ok') }).catch(() => { dispatch(clearSession()); setStatus('missing') }) }, [status, dispatch]); if (status === 'pending') return null; if (status === 'missing') return <Navigate to="/login" replace state={{ from: location.pathname }} />; return children }
function RequireAdmin({ children }) { const user = useSelector(state => state.auth.user); const dispatch = useDispatch(); const location = useLocation(); const [status, setStatus] = useState(() => (user ? (user.role === 'ADMIN' ? 'ok' : 'denied') : localStorage.getItem('sv_token') ? 'pending' : 'missing')); useEffect(() => { if (status !== 'pending') return; getMe().then(profile => { dispatch(setUser(profile)); setStatus(profile.role === 'ADMIN' ? 'ok' : 'denied') }).catch(() => { dispatch(clearSession()); setStatus('missing') }) }, [status, dispatch]); if (status === 'pending') return null; if (status === 'missing') return <Navigate to="/login" replace state={{ from: location.pathname }} />; if (status === 'denied') return <Navigate to="/" replace />; return children }

function Landing() { const books = useBooks('?size=6&sort=updatedAt,desc'); return <Shell><Page className="landing"><section className="hero"><div className="hero-copy"><div className="eyebrow">THE DIGITAL LITERARY ARCHIVE</div><h1>Read the <em>profound.</em><br />Write the unforgettable.</h1><p>A home for stories that linger. Discover thoughtful reviews, find your next obsession, and leave a little of yourself on the page.</p><div className="hero-actions"><a className="button" href="/explore">Start reading <FiArrowUpRight /></a><a className="text-link" href="/register">Start writing <FiArrowRight /></a></div></div><div className="ring-art"><div className="ring ring-outer"><div className="ring ring-mid"><div className="ring-core">SV<br /><small>ARCHIVE</small></div></div></div><span className="ring-note n1">READ · REVIEW · REPEAT</span><span className="ring-note n2">EST. 2026</span></div></section><section className="section"><SectionTitle kicker="CURATED FOR YOU" title="Trending manuscripts" text="Stories currently drawing the archive's attention." /><div className="book-grid">{books.loading ? <div className="loading">Opening the archive…</div> : books.data.length ? books.data.map(b => <BookCard key={b.id} book={b} />) : <Empty detail={books.error ? `Archive unavailable: ${books.error}` : undefined} />}</div></section><section className="quote-band"><div className="quote-mark">“</div><blockquote>Every story is a doorway. The best ones leave the light on.</blockquote><span>— THE ARCHIVIST</span></section><section className="section"><SectionTitle kicker="THE COMMUNITY" title="Voices of the dark" /><AuthorStrip /></section><section className="publish-cta"><div><div className="eyebrow">YOUR TURN</div><h2>Have a story to tell?</h2><p>The archive has room for one more unforgettable voice.</p></div><a className="button" href="/register">Start publishing <FiArrowUpRight /></a></section></Page></Shell> }
function AuthorStrip() { const authors = useAuthors(); return <div className="author-strip">{authors.loading ? <div className="loading">Finding the voices…</div> : authors.data.length ? authors.data.slice(0, 6).map(a => <a className="author-mini" href={`/authors/${a.id}`} key={a.id}><div className="avatar">{a.profileImage ? <img src={a.profileImage} alt="" /> : (a.name || 'A').slice(0, 1)}</div><span>{a.name}</span><small>AUTHOR</small></a>) : <Empty title="No authors yet." detail={authors.error ? `Author directory unavailable: ${authors.error}` : 'The first voice could be yours.'} />}</div> }
function Field({ label, ...props }) { return <label>{label}<input {...props} /></label> }
function Auth({ type }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('form')
  const [otp, setOtp] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const isRegister = type === 'register'
  const isForgot = type === 'forgot'
  const pw = form.password || ''
  const pwScore = (pw.length >= 8) + (pw.length >= 12) + (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) + (/\d/.test(pw)) + (/[^A-Za-z0-9]/.test(pw))
  const pwMeter = pwScore >= 4 ? ['good', 3, 'Strong'] : pwScore >= 2 ? ['ok', 2, 'Fair'] : pwScore >= 1 ? ['weak', 1, 'Too weak'] : ['', 0, '']
  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [step, secondsLeft])
  const startOtpFlow = async e => {
    e.preventDefault()
    setError('')
    try {
      await sendRegistrationOtp({ name: form.name, username: form.username, email: form.email, password: form.password })
      setOtp('')
      setSecondsLeft(300)
      setStep('otp')
      toast.success(`Code sent to ${form.email}`)
    } catch (err) { setError(err.message); toast.error(err.message) }
  }
  const verify = async e => {
    e.preventDefault()
    setError('')
    try {
      await verifyRegistrationOtp({ name: form.name, username: form.username, email: form.email, password: form.password, otp })
      toast.success('Account created. Welcome to StoryVerse!')
      navigate('/dashboard')
    } catch (err) { setError(err.message); toast.error(err.message) }
  }
  const resend = async () => {
    setError('')
    try {
      await sendRegistrationOtp({ name: form.name, username: form.username, email: form.email, password: form.password })
      setSecondsLeft(300)
      toast.success('A new code was sent')
    } catch (err) { setError(err.message); toast.error(err.message) }
  }
  const submit = async e => {
    e.preventDefault()
    setError('')
    if (isRegister) return startOtpFlow(e)
    try {
      const path = isForgot ? '/auth/forgot-password' : '/auth/login'
      const body = isForgot ? { email: form.email } : { usernameOrEmail: form.username, password: form.password }
      const result = await api(path, { method: 'POST', body: JSON.stringify(body) })
      if (result?.accessToken) localStorage.setItem('sv_token', result.accessToken)
      toast.success(isForgot ? 'Recovery link sent.' : 'Welcome back!')
      navigate(isForgot ? '/login' : '/dashboard')
    } catch (e) { setError(e.message); toast.error(e.message) }
  }
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  return (
    <div className="auth-page">
      <div className="auth-art">
        <a className="brand" href="/">STORY<span>VERSE</span></a>
        <div className="auth-art-copy">
          <div className="eyebrow">THE DIGITAL LITERARY ARCHIVE</div>
          <h1>{isRegister ? <>Join the <em>archive.</em></> : isForgot ? <>Rediscover the <em>classics.</em></> : <>Stories worth <em>staying up for.</em></>}</h1>
          <p>{isRegister ? 'A place for readers, reviewers, and writers who believe words still matter.' : 'Come for the verdict. Stay for the stories.'}</p>
        </div>
      </div>
      <div className="auth-panel">
        <a className="mobile-brand brand" href="/">STORY<span>VERSE</span></a>
        {step === 'otp' && isRegister ? (
          <>
            <div className="eyebrow">VERIFY YOUR EMAIL</div>
            <h2>Enter the code</h2>
            <p className="otp-note">We sent a 6-digit code to <strong>{form.email}</strong>. It expires in 5 minutes.</p>
            <form onSubmit={verify}>
              {error && <div className="form-error">{error}</div>}
              <label>Verification code
                <div className="otp-field">
                  <input inputMode="numeric" maxLength="6" autoFocus value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="••••••" />
                </div>
              </label>
              <div className="otp-timer">{secondsLeft > 0 ? <>Code expires in <strong>{mm}:{ss}</strong></> : <b className="otp-expired">Code expired — request a new one</b>}</div>
              <button className="button" disabled={otp.length !== 6 || secondsLeft <= 0}>Verify & create account <FiArrowUpRight /></button>
              <button type="button" className="button ghost" onClick={resend}>Resend code</button>
            </form>
            <div className="auth-bottom"><a href="#" onClick={e => { e.preventDefault(); setStep('form'); setError('') }}><FiArrowLeft /> Change email</a></div>
          </>
        ) : (
          <>
            <div className="eyebrow">{isRegister ? 'CREATE YOUR ACCOUNT' : isForgot ? 'ACCOUNT RECOVERY' : 'WELCOME BACK'}</div>
            <h2>{isRegister ? 'Join the Archive' : isForgot ? 'Reset your password' : 'Log in to StoryVerse'}</h2>
            <form onSubmit={submit}>
              {error && <div className="form-error">{error}</div>}
              {isRegister && <><Field label="Full name" placeholder="Your name" onChange={e => setForm({ ...form, name: e.target.value })} /><Field label="Username" placeholder="your_handle" onChange={e => setForm({ ...form, username: e.target.value })} /></>}
              <Field label="Email" type="email" placeholder="you@example.com" onChange={e => setForm({ ...form, email: e.target.value })} />
              {!isForgot && <label>Password<div className="password-field"><span className="lock-icon"><FiLock /></span><input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={pw} onChange={e => setForm({ ...form, password: e.target.value })} /><button type="button" onClick={() => setShowPassword(value => !value)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></div></label>}
              {isRegister && <><div className="strength"><div className={`meter ${pwMeter[0]}`}>{[0, 1, 2].map(i => <span key={i} className={i < pwMeter[1] ? 'on' : ''} />)}</div><b className={pwMeter[0]}>{pw ? pwMeter[2] : 'Password strength'}</b><small>Use 8+ characters with a mix of symbols</small></div><label className="check"><input type="checkbox" required /> I agree to the Terms of Use</label></>}
              {isForgot ? <button className="button">Send reset link <FiArrowUpRight /></button> : <button className="button">{isRegister ? 'Create account' : 'Log in'} <FiArrowUpRight /></button>}
            </form>
            <div className="auth-bottom">{isForgot ? <a href="/login"><FiArrowLeft /> Back to login</a> : isRegister ? <>Already have an account? <a href="/login">Log in</a></> : <>Forgot password? <a href="/forgot-password">Reset it</a><br /><br />Don't have an account? <a href="/register">Register</a></>}</div>
          </>
        )}
      </div>
    </div>
  )
}function Explore({ search = false }) { const [q, setQ] = useState(''); const books = useBooks(q ? `?q=${encodeURIComponent(q)}&size=24` : '?size=24'); return <Shell><Page><div className="catalog-head"><div className="eyebrow">DISCOVER YOUR NEXT OBSESSION</div><h1>{search ? 'Search the archive.' : 'Explore the archive.'}</h1><div className="searchbar"><span><FiSearch /></span><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search titles, authors, genres…" /></div></div><div className="catalog-layout"><aside className="filters"><div className="eyebrow">FILTERS</div><label>Genre<select><option>All genres</option><option>Drama</option><option>Horror</option><option>Mystery</option></select></label><label>Status<select><option>Any status</option><option>Published</option><option>In progress</option></select></label><label>Language<select><option>All languages</option><option>English</option></select></label><button className="button">Apply filters</button></aside><section className="catalog-results"><div className="tabs"><button className="active">Trending</button><button>Recently updated</button><button>Hidden gems</button><button>For you</button></div><div className="book-grid">{books.loading ? <div className="loading">Searching the stacks…</div> : books.data.length ? books.data.map(b => <BookCard key={b.id} book={b} />) : <Empty title="No matching manuscripts." detail={books.error ? `Catalog unavailable: ${books.error}` : 'Try a different title, author, or genre.'} />}</div></section></div></Page></Shell> }
function Genres() { const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Informative', 'Mystery', 'Romance', 'Sci-Fi', 'Sports', 'Thriller']; return <Shell><Page><div className="catalog-head"><div className="eyebrow">FIND YOUR MOOD</div><h1>Genres.</h1></div><div className="genre-grid">{genres.map((g, i) => <motion.a {...motionPresets.card} className={`genre-tile g${i}`} href={`/explore?genre=${g}`} key={g}><span>{g}</span><small>Explore <FiArrowRight /></small></motion.a>)}</div></Page></Shell> }
function Leaderboard() { const books = useBooks('?size=20&sort=updatedAt,desc'); return <Shell><Page><div className="catalog-head"><div className="eyebrow">THE PEOPLE'S VERDICT</div><h1>Leaderboard.</h1></div><div className="pill-row"><button className="pill active">All</button>{Object.values(verdicts).map(v => <button className="pill" key={v[0]}>{v[0]}</button>)}</div><div className="leader-list">{books.data.length ? books.data.map((b, i) => <motion.div {...motionPresets.card} className="leader-row" key={b.id}><strong>0{i + 1}</strong><Cover book={b} /><div><h3>{b.title}</h3><p>{b.authorName || 'Unknown author'} · {b.genre || 'Story'}</p></div><div className="spark"><FiTrendingUp /></div><div className="leader-score">{b.published ? '84' : '—'}<small>%</small></div><Verdict value={b.published ? 'GO_FOR_IT' : 'TIME_PASS'} /></motion.div>) : <Empty title="The leaderboard is waiting." detail="Publish and review stories to shape the ranking." />}</div></Page></Shell> }
function Reader({ bookId }) { const [theme, setTheme] = useState('dark'); const [book, setBook] = useState(null); const [chapters, setChapters] = useState([]); useEffect(() => { if (bookId) { api(`/books/${bookId}`).then(setBook).catch(() => {}); api(`/books/${bookId}/chapters`).then(setChapters).catch(() => {}) } }, [bookId]); const chapter = chapters[0]; return <div className={`reader reader-${theme}`}><div className="reader-bar"><a href="/explore"><FiArrowLeft /> Back to story</a><div className="brand">STORY<span>VERSE</span></div><div className="theme-switch"><button onClick={() => setTheme('dark')}><FiMoon /></button><button onClick={() => setTheme('light')}><FiSun /></button><button onClick={() => setTheme('sepia')}><FiBookOpen /></button></div></div><article className="reading-column"><div className="eyebrow">PART ONE · {book?.title || 'THE ARCHIVE'}</div><h1>{chapter?.title || 'A story waiting to be opened'}</h1>{chapter?.content ? <div className="prose" dangerouslySetInnerHTML={{ __html: chapter.content }} /> : <><p className="dropcap">There is a particular silence that arrives just before a story begins. It is not empty. It is an invitation — a held breath, a page turned in the dark.</p><p>Open a published manuscript from the Explore page to read its chapters here. Your reading theme is saved for this session and transitions smoothly between dark, light, and sepia.</p></>}<div className="reader-nav"><a href="#"><FiArrowLeft /> Previous</a><a href="#">Next chapter <FiArrowRight /></a></div></article></div> }
function Dashboard({ writer = false, admin = false }) { const navigate = useNavigate(); const [stats, setStats] = useState(null); const books = useBooks('/mine?size=12'); const authors = useAdminAuthors(); useEffect(() => { if (admin) api('/admin/dashboard').then(setStats).catch(() => {}) }, [admin]); const title = admin ? 'Welcome, Admin.' : writer ? 'Your stories, in motion.' : 'Welcome back.'; return <Shell><Page><div className="dashboard-head"><div><div className="eyebrow">{admin ? 'SYSTEM OVERVIEW' : writer ? 'WRITER DASHBOARD' : 'READER DASHBOARD'}</div><h1>{title}</h1><p>{admin ? 'A quiet view of everything happening in the archive.' : writer ? 'Shape the next page of your publishing journey.' : 'Pick up where your imagination left off.'}</p></div><span className="health-dot"><FiCheckCircle /> {admin ? 'Systems operational' : 'Archive open'}</span></div><div className="stats">{(admin ? [['Total users', stats?.totalUsers ?? '—'], ['Total stories', stats?.totalBooks ?? '—'], ['Reviews today', stats?.totalReviews ?? '—']] : writer ? [['Total readers', '—'], ['Stories published', books.data.filter(x => x.published).length], ['Total reads', '—']] : [['Stories read', '—'], ['Reviews given', '—'], ['Reading streak', '—']]).map(([k, v]) => <motion.div {...motionPresets.card} className="stat-card" key={k}><span>{k}</span><strong>{v}</strong><small>Live from your archive</small></motion.div>)}</div>{admin && <section className="admin-authors-section"><div className="section-title"><div><div className="eyebrow">AUTHOR DIRECTORY</div><h2>Authors.</h2></div><div className="admin-authors-actions"><button className="button" onClick={() => navigate('/admin/authors?create=1')}><FiPlus /> Create author</button><a className="text-link" href="/admin/authors">View all <FiArrowRight /></a></div></div><div className="author-grid">{authors.loading ? <div className="loading">Loading the directory…</div> : authors.data.length ? authors.data.map(a => <motion.a {...motionPresets.card} className="author-card" href={`/authors/${a.id}`} key={a.id}><div className="avatar large">{a.profileImage ? <img src={a.profileImage} alt="" /> : (a.name || 'A').slice(0, 1)}</div><h3>{a.name}</h3><p>{a.biography || 'A voice in the StoryVerse archive.'}</p><div className="card-meta"><span>Author</span><span>View profile <FiArrowRight /></span></div></motion.a>) : <Empty title="No authors yet." detail="Create the first author from the directory." />}</div></section>}<SectionTitle kicker={writer ? 'YOUR WORK' : 'CURATED NEXT'} title={writer ? 'Your stories' : 'Continue reading'} /><div className="book-grid">{books.loading ? <div className="loading">Loading dashboard…</div> : books.data.length ? books.data.map(b => <BookCard key={b.id} book={b} />) : <Empty title={writer ? 'Your shelf is empty.' : 'Your reading shelf is ready.'} detail={writer ? 'Create a manuscript to begin publishing.' : 'Your reading progress endpoint is not available yet.'} />}</div></Page></Shell> }
function WriterTools({ config = false, edit = false }) { const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [saved, setSaved] = useState(false); return <Shell><Page><div className="editor-head"><a href="/dashboard"><FiArrowLeft /> Back to dashboard</a><div><div className="eyebrow">{config ? 'MANUSCRIPT CONFIGURATION' : edit ? 'EDIT CHAPTER' : 'NEW CHAPTER'}</div><h1>{config ? 'Give it a shape.' : 'Write your story.'}</h1></div><div><button className="button ghost" onClick={() => setSaved(true)}>Save draft</button><button className="button">{config ? 'Publish manuscript' : 'Publish chapter'}</button></div></div><div className="editor-layout"><aside className="editor-sidebar"><div className="cover-placeholder">Cover<br />preview</div><p>Word count <strong>{body.trim() ? body.trim().split(/\s+/).length : 0}</strong></p><p>Reading time <strong>{Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 200))} min</strong></p></aside><section className="editor-main"><Field label={config ? 'Story title' : 'Chapter name'} value={title} onChange={e => setTitle(e.target.value)} placeholder={config ? 'The name readers will remember' : 'Chapter One'} />{config && <><label>Description<textarea rows="4" placeholder="A short synopsis…" /></label><div className="tag-editor"><span className="tag">Drama ×</span><span className="tag">Add genre +</span></div></>}<div className="toolbar"><button>B</button><button><i>I</i></button><button><u>U</u></button><button>H1</button><button><FiMoreHorizontal /></button><button><BsQuote /></button><button><FiCornerUpLeft /></button><button><FiCornerUpRight /></button></div><textarea className="body-editor" value={body} onChange={e => { setBody(e.target.value); setSaved(false) }} placeholder="Begin writing here…" />{saved && <div className="autosave">Saved just now</div>}</section></div></Page></Shell> }
function Authors({ mine = false }) { const authors = useAuthors(); return <Shell><Page><div className="catalog-head"><div className="eyebrow">THE PEOPLE BEHIND THE PAGES</div><h1>{mine ? 'Your profile.' : 'All authors.'}</h1><div className="searchbar"><span><FiSearch /></span><input placeholder="Search authors…" /></div></div><div className="author-grid">{authors.loading ? <div className="loading">Opening the directory…</div> : authors.data.length ? authors.data.map(a => <motion.a {...motionPresets.card} className="author-card" href={`/authors/${a.id}`} key={a.id}><div className="avatar large">{a.profileImage ? <img src={a.profileImage} alt="" /> : (a.name || 'A').slice(0, 1)}</div><h3>{a.name}</h3><p>{a.biography || 'A voice in the StoryVerse archive.'}</p><div className="card-meta"><span>Author</span><span>View profile <FiArrowRight /></span></div></motion.a>) : <Empty title="No authors found." detail={authors.error || 'Create the first author from the admin directory.'} />}</div></Page></Shell> }
function CreateAuthor() { const [name, setName] = useState(''); const [bio, setBio] = useState(''); const [message, setMessage] = useState(''); return <Shell><Page className="narrow-page"><div className="form-card"><div className="eyebrow">ADMIN DIRECTORY</div><h1>Create author.</h1><form onSubmit={async e => { e.preventDefault(); try { await api('/authors', { method: 'POST', body: JSON.stringify({ name, biography: bio }) }); setMessage('Author created.'); } catch (err) { setMessage(err.message) } }}><Field label="Author name" value={name} onChange={e => setName(e.target.value)} required /><label>Biography<textarea value={bio} onChange={e => setBio(e.target.value)} rows="6" /></label><button className="button">Create author <FiArrowUpRight /></button>{message && <p className="form-note">{message}</p>}</form></div></Page></Shell> }
function NotFound() { return <Shell><Page className="not-found"><div className="eyebrow">THE PAGE LEFT THE ARCHIVE</div><h1>4<span>0</span>4</h1><h2>Page not found.</h2><p>The page you're looking for may have been rewritten.</p><a className="button" href="/">Take me back home</a><small>…or just scroll</small></Page></Shell> }
function App() { const { pathname: path, search } = useLocation(); if (path === '/') return <Landing />; if (path === '/login') return <LoginPage />; if (path === '/register') return <Auth type="register" />; if (path === '/forgot-password') return <Auth type="forgot" />; if (path === '/explore' || path === '/search') return <ExplorePage />; if (path === '/genres') return <Genres />; if (path === '/leaderboard') return <LeaderboardPage />;     if (path.startsWith('/books/')) { if (path === '/books/new') return <RequireAuth><BookEditorPage /></RequireAuth>; const segments = path.split('/'); if (segments.length === 4 && segments[3] === 'reviews') return <AllReviewsPage bookId={segments[2]} />; if (path.endsWith('/edit')) return <RequireAuth><BookEditorPage id={path.split('/')[2]} /></RequireAuth>; return <BookDetailPage bookId={path.split('/')[2]} /> } if (path === '/reader') return <ReaderPage key={search} />; if (path === '/dashboard') return <RequireAuth><WriterDashboardPage /></RequireAuth>; if (path === '/bookmarks' || path === '/reader-dashboard') return <RequireAuth><ReaderDashboardPage /></RequireAuth>;     if (path === '/admin/authors') return <RequireAdmin><AdminAuthorsPage /></RequireAdmin>; if (path === '/admin' || path === '/admin/dashboard' || path === '/admin/analytics' || path === '/admin/content' || path === '/admin/users') return <RequireAdmin><Dashboard admin /></RequireAdmin>; if (path === '/write' || path === '/chapters/new' || path === '/chapters/edit') return <RequireAuth><ChaptersPage /></RequireAuth>; if (path === '/manuscript/configuration') return <RequireAuth><BookEditorPage /></RequireAuth>;     if (path === '/authors') return <Authors />; if (path === '/authors/create') return <RequireAdmin><CreateAuthor /></RequireAdmin>; if (path.startsWith('/authors/')) return <AuthorDetailPage authorId={path.split('/')[2]} />; if (path.startsWith('/users/')) return <UserProfilePage username={path.split('/')[2]} />; return <NotFound /> }

void Explore; void Leaderboard; void WriterTools; void Reader;
function AppWithAccountRoutes({ routePath, queryString }) { const path = routePath || window.location.pathname; const genre = new URLSearchParams(queryString || window.location.search).get('genre'); const genreFromPath = p => DEFAULT_GENRES.find(genre => genrePath(genre) === p) || p.replaceAll('-', ' '); if (path === '/') return <LandingPage />; if (path === '/genres') return <GenrePage />;     if (path === '/profile') return <><SharedNav /><RequireAuth><ProfilePage /></RequireAuth><Footer /></>; if (path === '/settings') return <><SharedNav /><RequireAuth><SettingsPage /></RequireAuth><Footer /></>; if (path === '/reviews') return <><SharedNav /><RequireAuth><ReviewsPage /></RequireAuth><Footer /></>; if (path.startsWith('/genre/') || path.startsWith('/explore/genre/')) return <GenreDetailPage genre={genreFromPath(path.split('/').pop())} />; if (path === '/explore' && genre) return <ExplorePage initialGenre={genre} />; return <App /> }
function AppLoading() { return <div className="app-loading"><div className="app-loading-inner">STORY<span>VERSE</span></div></div> }
function RouterApp() { const location = useLocation(); return <Suspense fallback={<AppLoading />}><AppWithAccountRoutes routePath={location.pathname} queryString={location.search} /></Suspense> }
export default RouterApp
