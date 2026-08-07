import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiSearch, FiUser, FiX } from 'react-icons/fi'
import { getMe } from '../../../services/usersApi'
import { setUser } from '../../../store/authSlice'
import UserMenu from '../UserMenu/UserMenu'
import SearchBox from './SearchBox'
import BottomNav from '../BottomNav/BottomNav'
import './SharedNav.css'
export default function SharedNav() {
  const location = useLocation()
  const dispatch = useDispatch()
  const user = useSelector(state => state.auth.user)
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => {
    const onNav = () => setSearchOpen(false)
    window.addEventListener('popstate', onNav)
    return () => window.removeEventListener('popstate', onNav)
  }, [])
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 800) setSearchOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  useEffect(() => { if (!user && localStorage.getItem('sv_token')) getMe().then(value => dispatch(setUser(value))).catch(() => {}) }, [dispatch, user])
  useEffect(() => { document.body.classList.add('sv-shell'); return () => document.body.classList.remove('sv-shell') }, [])
  const active = target => location.pathname === target || location.pathname.startsWith(`${target}/`)
  const isAdmin = user?.role === 'ADMIN'
  return <>
    <header className="shared-nav">
      <Link className="brand" to="/">STORY<span>VERSE</span></Link>
      <nav>
        <Link className={active('/explore') ? 'active' : ''} to="/explore">Explore</Link>
        {isAdmin ? <>
          <Link className={active('/admin/authors') ? 'active' : ''} to="/admin/authors">Author panel</Link>
          <Link className={active('/genres') ? 'active' : ''} to="/genres">Genres</Link>
        </> : <>
          <Link className={active('/genres') ? 'active' : ''} to="/genres">Genres</Link>
          <Link className={active('/leaderboard') ? 'active' : ''} to="/leaderboard">Leaderboard</Link>
        </>}
      </nav>
      <div className="shared-nav-actions">
        <SearchBox className="nav-search" />
        {user ? <>{!isAdmin && <Link className="nav-write" to="/dashboard">Write</Link>}<UserMenu /></> : <><Link className="nav-login" to="/login">Log in</Link><Link className="button" to="/register">Start writing</Link></>}
      </div>
    </header>
    <header className="mobile-header">
      <Link className="brand" to="/">STORY<span>VERSE</span></Link>
      <button className="mobile-search-btn" aria-label={searchOpen ? 'Close search' : 'Search'} aria-expanded={searchOpen} aria-controls="mobile-search-panel" onClick={() => setSearchOpen(value => !value)}>{searchOpen ? <FiX size={20} /> : <FiSearch size={20} />}</button>
      {user ? <UserMenu /> : <Link className="mobile-auth" to="/login" aria-label="Log in"><FiUser size={20} /></Link>}
    </header>
    {searchOpen && <div className="mobile-search-panel" id="mobile-search-panel">
      <SearchBox className="mobile-search" autoFocus onNavigate={() => setSearchOpen(false)} />
    </div>}
    <BottomNav />
  </>
}
