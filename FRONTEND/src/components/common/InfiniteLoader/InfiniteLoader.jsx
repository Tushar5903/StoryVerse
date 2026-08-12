import { FiAlertCircle } from 'react-icons/fi'
import './InfiniteLoader.css'

/**
 * Small inline status row rendered BELOW the loaded cards during infinite
 * scrolling. Never covers or replaces the cards.
 * - loading: spinner + "Loading more…"
 * - error: non-blocking retry hint (next intersection event retries)
 * - end: subtle "You've reached the end."
 */
export default function InfiniteLoader({ loading, hasMore, error, endMessage = "You've reached the end." }) {
  if (error) {
    return <div className="inf-loader inf-loader--error"><FiAlertCircle />{error}</div>
  }
  if (!hasMore) {
    return <div className="inf-loader inf-loader--end">{endMessage}</div>
  }
  if (!loading) return null
  return <div className="inf-loader" role="status"><span className="inf-spinner" aria-hidden="true" />Loading more…</div>
}