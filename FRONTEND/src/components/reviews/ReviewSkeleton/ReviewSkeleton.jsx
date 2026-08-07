import './ReviewSkeleton.css'

export default function ReviewSkeleton({ count = 4 }) {
  return <div className="review-skeletons">{Array.from({ length: count }, (_, index) => (
    <div className="review-skeleton" key={index} aria-hidden="true">
      <div className="skeleton-avatar" />
      <div className="skeleton-main">
        <div className="skeleton-line wide" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
      <div className="skeleton-badge" />
    </div>
  ))}</div>
}
