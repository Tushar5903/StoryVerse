import { useState } from 'react'
import { toast } from 'react-toastify'
import ReviewItem from '../ReviewItem/ReviewItem'
import ReviewSkeleton from '../ReviewSkeleton/ReviewSkeleton'
import ReviewEmptyState from '../ReviewEmptyState/ReviewEmptyState'
import ConfirmModal from '../../common/ConfirmModal/ConfirmModal'
import { deleteReview } from '../../../services/reviewsApi'
import './ReviewList.css'

export default function ReviewList({ reviews, loading = false, error = '', onRetry, user, timestampMode = 'relative', skeletonCount = 4, emptyTitle = 'No reviews yet', emptyText = 'Be the first to share your verdict.', emptyCtaLabel = '', onEmptyCta, onDeleted }) {
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = () => {
    if (!pendingDelete) return
    setDeleting(true)
    deleteReview(pendingDelete.id)
      .then(() => { setPendingDelete(null); toast.success('Review deleted.'); onDeleted?.() })
      .catch(err => { setPendingDelete(null); toast.error(err.message) })
      .finally(() => setDeleting(false))
  }

  if (loading) return <ReviewSkeleton count={skeletonCount} />
  if (error) return <div className="review-error"><p>Unable to load reviews.</p><button type="button" onClick={onRetry}>Try again</button></div>
  if (!reviews.length) return <ReviewEmptyState title={emptyTitle} text={emptyText} ctaLabel={emptyCtaLabel} onCta={onEmptyCta} />
  return <>
    <div className="review-feed">{reviews.map(review => <ReviewItem key={review.id} review={review} user={user} timestampMode={timestampMode} onDelete={setPendingDelete} />)}</div>
    {pendingDelete && <ConfirmModal title="Delete this review?" message={`Your ${String(pendingDelete.verdict).replace('_', ' ').toLowerCase()} verdict will be permanently removed. This action cannot be undone.`} pending={deleting} onConfirm={confirmDelete} onCancel={() => { setPendingDelete(null); setDeleting(false) }} />}
  </>
}
