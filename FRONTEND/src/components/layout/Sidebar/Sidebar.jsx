import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import './Sidebar.css'
const links=[['/dashboard','Dashboard'],['/reader-dashboard','Reader Dashboard'],['/drafts','Drafts'],['/bookmarks','Bookmarks'],['/analytics','Analytics'],['/settings','Settings']]
export default function Sidebar(){const location=useLocation();const user=useSelector(state=>state.auth.user);return <aside className="auth-sidebar"><div className="sidebar-user"><div className="sidebar-avatar">{user?.profileImage?<img src={user.profileImage} alt=""/>:(user?.name||'U').slice(0,1)}</div><strong>{user?.name||'StoryVerse reader'}</strong><small>— followers</small></div><nav>{links.map(([href,label])=><Link className={location.pathname===href?'active':''} to={href} key={href}>{label}</Link>)}</nav><Link className="sidebar-write" to="/write">+ Write new story</Link></aside>}
