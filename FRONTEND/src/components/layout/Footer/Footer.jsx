import { Link } from 'react-router-dom'
import './Footer.css'
export default function Footer() {
  return <footer className="sv-footer">
    <div className="sv-footer-inner">
      <div className="sv-footer-brand">
        <Link className="brand" to="/">STORY<span>VERSE</span></Link>
        <p>Reviews in four honest words.</p>
      </div>
      <nav className="sv-footer-links">
        <Link to="/explore">Explore</Link>
        <Link to="/genres">Genres</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/reviews">Reviews</Link>
        <Link to="/register">Start writing</Link>
      </nav>
      <span className="sv-footer-copy">© 2026 StoryVerse</span>
    </div>
  </footer>
}
