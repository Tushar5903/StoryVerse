import { useSelector } from 'react-redux'
import { BookOpen, Compass, Home, MoreHorizontal, PenLine, Trophy, User, Users } from 'lucide-react'
import NavItem from './NavItem'
import './BottomNav.css'

export default function BottomNav() {
  const user = useSelector(state => state.auth.user)
  const isAdmin = user?.role === 'ADMIN'
  const items = isAdmin ? [
    { to: '/', label: 'Home', icon: Home },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/admin/authors', label: 'Authors', icon: Users, emphasized: true },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/settings', label: 'More', icon: MoreHorizontal },
  ] : [
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/genres', label: 'Genres', icon: BookOpen },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/dashboard', label: 'Write', icon: PenLine, emphasized: true },
    { to: '/profile', label: 'Profile', icon: User },
  ]
  return (
    <nav className="bnv" aria-label="Primary">
      {items.map(item => <NavItem key={item.to} {...item} />)}
    </nav>
  )
}
