import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiHome, FiMenu, FiMoreHorizontal, FiSearch, FiStar, FiUser } from 'react-icons/fi'
import { getMe } from '../../../services/usersApi'
import { setUser } from '../../../store/authSlice'
import UserMenu from '../UserMenu/UserMenu'
import SearchBox from './SearchBox'
import './SharedNav.css'
export default function SharedNav() {
  const location = useLocation()
  const dispatch = useDispatch()
  const user = useSelector(state => state.auth.user)
  const [open, setOpen] = useState(false)
  useEffect(() => { if (!user && localStorage.getItem('sv_token')) getMe().then(value => dispatch(setUser(value))).catch(() => {}) }, [dispatch, user])
  const active = target => location.pathname === target || location.pathname.startsWith(`${target}/`)
  return <>
    <header className="shared-nav">
      <button className="nav-menu" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(value => !value)}><FiMenu /></button>
      <Link className="brand" to="/">STORY<span>VERSE</span></Link>
      <nav>
        <Link className={active('/explore') ? 'active' : ''} to="/explore">Explore</Link>
        <Link className={active('/genres') ? 'active' : ''} to="/genres">Genres</Link>
        <Link className={active('/leaderboard') ? 'active' : ''} to="/leaderboard">Leaderboard</Link>
      </nav>
      <div className="shared-nav-actions">
        <SearchBox className="nav-search" />
        {user ? <><Link className="nav-write" to="/dashboard">Write</Link><UserMenu /></> : <><Link className="nav-login" to="/login">Log in</Link><Link className="button" to="/register">Start writing</Link></>}
      </div>
    </header>
    {open && <div className="mobile-drawer">
      <SearchBox className="drawer-search" />
      <Link to="/explore">Explore</Link>
      <Link to="/genres">Genres</Link>
      <Link to="/leaderboard">Leaderboard</Link>
      <Link to={user ? '/profile' : '/login'}>{user ? 'My profile' : 'Log in'}</Link>
    </div>}
    <nav className="mobile-tabs">
      <Link to="/"><FiHome /><small>Home</small></Link>
      <Link to="/explore"><FiSearch /><small>Explore</small></Link>
      <Link to="/reviews"><FiStar /><small>Reviews</small></Link>
      <Link to="/profile"><FiUser /><small>Profile</small></Link>
      <Link to="/settings"><FiMoreHorizontal /><small>More</small></Link>
    </nav>
  </>
}
