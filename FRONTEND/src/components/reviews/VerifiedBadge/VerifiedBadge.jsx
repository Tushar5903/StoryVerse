import { BadgeCheck } from 'lucide-react'
import './VerifiedBadge.css'

export default function VerifiedBadge({ visible = false }) {
  if (!visible) return null
  return <span className="verified-badge"><BadgeCheck size={14} aria-hidden="true" /><span className="sr-only">Verified</span></span>
}
