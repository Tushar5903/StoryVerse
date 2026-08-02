import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { FiBookOpen, FiLogOut, FiSettings } from 'react-icons/fi'
import { getMe } from '../../../services/usersApi'
import { logout } from '../../../services/authApi'
import { clearSession, setUser } from '../../../store/authSlice'
import './UserMenu.css'
export default function UserMenu(){
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(state => state.auth.user)
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  useEffect(() => {
    if (localStorage.getItem('sv_token')) getMe().then(value => { dispatch(setUser(value)); document.body.classList.add('authenticated') }).catch(() => document.body.classList.remove('authenticated'))
    else document.body.classList.remove('authenticated')
  }, [dispatch])
  useEffect(() => {
    if (!open) return
    const close = event => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  if (!user) return null
  const signOut = async () => {
    try { await logout(localStorage.getItem('sv_refresh_token') || '') } finally {
      dispatch(clearSession())
      document.body.classList.remove('authenticated')
      setOpen(false)
      toast.info('You have been logged out.')
      navigate('/login')
    }
  }
  return <div className="user-menu" ref={rootRef}>
    <button className="user-avatar" onClick={() => setOpen(value => !value)}>{user.profileImage ? <img src={user.profileImage} alt="" /> : (user.name || user.username || 'U').slice(0, 1).toUpperCase()}</button>
    {open && <div className="user-dropdown">
      <strong>{user.name || user.username}</strong>
      <Link to="/reviews" onClick={() => setOpen(false)}><FiBookOpen /> My Reviews</Link>
      <Link to="/settings" onClick={() => setOpen(false)}><FiSettings /> Settings</Link>
      <button className="logout-action" onClick={signOut}><FiLogOut /> Logout</button>
    </div>}
  </div>
}
