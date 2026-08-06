import { Link } from 'react-router-dom'
import './Footer.css'
export default function Footer() {
  return <footer className="sv-footer">
    <div className="sv-footer-inner">
      <div className="sv-footer-brand">
        <Link className="brand" to="/">STORY<span>VERSE</span></Link>
        <p>Reviews in four honest words.</p>
      </div>
      <span className="sv-footer-copy">© 2026 StoryVerse</span>
    </div>
  </footer>
}
