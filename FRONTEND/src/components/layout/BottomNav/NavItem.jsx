import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const MotionLink = motion.create(Link)

const isActive = (pathname, to) => {
  if (to === '/explore') return pathname === '/explore' || pathname.startsWith('/search') || pathname.startsWith('/genre/') || pathname.startsWith('/explore/genre/')
  if (to === '/genres') return pathname === '/genres' || pathname.startsWith('/genre/')
  if (to === '/dashboard') return pathname.startsWith('/dashboard') || pathname.startsWith('/write') || pathname.startsWith('/chapters') || pathname.startsWith('/manuscript') || /^\/books\/(new|\d+\/edit)$/.test(pathname)
  return pathname === to || (to !== '/' && pathname.startsWith(`${to}/`))
}

export default function NavItem({ to, label, icon: Icon, emphasized = false }) {
  const { pathname } = useLocation()
  const active = isActive(pathname, to)
  return (
    <MotionLink
      to={to}
      className={`bnv-item${active ? ' active' : ''}${emphasized ? ' emphasized' : ''}`}
      aria-current={active ? 'page' : undefined}
      whileTap={{ scale: .96 }}
      transition={{ duration: .15 }}
    >
      <span className="bnv-icon">
        {active && !emphasized && (
          <motion.span
            className="bnv-pill"
            layoutId="bnv-pill"
            transition={{ type: 'spring', stiffness: 480, damping: 38 }}
          />
        )}
        <motion.span
          className="bnv-glyph"
          animate={{ scale: active ? 1.12 : 1 }}
          transition={{ type: 'spring', stiffness: 480, damping: 30 }}
        >
          <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
        </motion.span>
      </span>
      <small>{label}</small>
    </MotionLink>
  )
}
