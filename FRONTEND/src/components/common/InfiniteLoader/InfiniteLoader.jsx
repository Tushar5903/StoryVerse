import { FiAlertCircle } from 'react-icons/fi'
import './InfiniteLoader.css'

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