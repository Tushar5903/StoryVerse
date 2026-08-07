import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import ReviewItem from '../ReviewItem/ReviewItem'
import SortDropdown from '../SortDropdown/SortDropdown'
import ReviewList from '../ReviewList/ReviewList'
import ConfirmModal from '../../common/ConfirmModal/ConfirmModal'
import { deleteReview } from '../../../services/reviewsApi'
import './ReviewSection.css'

export default function ReviewSection({ bookId, reviews, total = 0, loading = false, error = '', onRetry, user, myReview, onEditMyReview, onRefresh, emptyCtaLabel = '', onEmptyCta }) {
  const [sort, setSort] = useState('createdAt,desc')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const sorted = useMemo(() => {
    const list = [...reviews]
    list.sort((a, b) => sort === 'createdAt,asc'
      ? new Date(a.createdAt) - new Date(b.createdAt)
      : new Date(b.createdAt) - new Date(a.createdAt))
    return list
  }, [reviews, sort])

  const visible = useMemo(() => myReview ? sorted.filter(review => review.id !== myReview.id) : sorted, [sorted, myReview])

  const handleDeleteMyReview = useCallback(() => {
    if (!pendingDelete) return
    setDeleting(true)
    deleteReview(pendingDelete.id)
      .then(() => { setPendingDelete(null); toast.success('Review deleted.'); onRefresh?.() })
      .catch(err => { setPendingDelete(null); toast.error(err.message) })
      .finally(() => setDeleting(false))
  }, [pendingDelete, onRefresh])

  return <div className="review-section">
    {myReview && <>
      <div className="review-section-head"><h2>Your Review</h2></div>
      <div className="your-review"><ReviewItem review={myReview} user={user} onEdit={onEditMyReview} onDelete={setPendingDelete} /></div>
    </>}
    <div className="review-section-head"><h2>User Reviews</h2><SortDropdown value={sort} onChange={setSort} /></div>
    <ReviewList reviews={visible} loading={loading} error={error} onRetry={onRetry} user={user} onDeleted={onRefresh} emptyCtaLabel={emptyCtaLabel} onEmptyCta={onEmptyCta} />
    {total >= 10 && <Link className="show-all-reviews" to={`/books/${bookId}/reviews`}>Show All Reviews ({total.toLocaleString()})</Link>}
    {pendingDelete && <ConfirmModal title="Delete your review?" message="Your review on this story will be permanently removed. This action cannot be undone." pending={deleting} onConfirm={handleDeleteMyReview} onCancel={() => { setPendingDelete(null); setDeleting(false) }} />}
  </div>
}
