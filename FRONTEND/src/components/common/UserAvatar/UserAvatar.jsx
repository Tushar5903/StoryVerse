import './UserAvatar.css'

export default function UserAvatar({ user = {}, size = 36, className = '' }) {
  const initial = (user.name || user.username || 'U').slice(0, 1).toUpperCase()
  if (user.profileImage) {
    return <img className={`user-avatar ${className}`} style={{ width: size, height: size, fontSize: size * 0.42 }} src={user.profileImage} alt="" />
  }
  return <span className={`user-avatar user-avatar-fallback ${className}`} style={{ width: size, height: size, fontSize: size * 0.42 }}>{initial}</span>
}
