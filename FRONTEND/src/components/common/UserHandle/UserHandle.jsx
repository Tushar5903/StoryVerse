import { Link } from 'react-router-dom'
import UserAvatar from '../UserAvatar/UserAvatar'
import './UserHandle.css'

export default function UserHandle({ userId, user = {}, size = 30 }) {
  const targetId = userId || user.id
  const linkTo = user.username ? `/users/${user.username}` : targetId ? `/users/${targetId}` : null
  const content = <>
    <UserAvatar user={user} size={size} />
    <strong>@{user.username || 'reader'}</strong>
  </>
  return linkTo ? <Link className="user-handle" to={linkTo}>{content}</Link> : <span className="user-handle">{content}</span>
}
