import { apiClient } from './apiClient'
export const listReviews = (bookId, query = '') => apiClient(`/reviews?bookId=${bookId}${query}`)
export const listAllReviews = (query = '') => apiClient(`/reviews${query}`)
export const listUserReviews = (userId, query = '') => apiClient(`/reviews?userId=${userId}${query}`)
export const listMyReviews = (query = '') => apiClient(`/reviews/mine${query}`)
export const createReview = payload => apiClient('/reviews', { method: 'POST', body: JSON.stringify(payload) })
export const updateReview = (id, payload) => apiClient(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteReview = id => apiClient(`/reviews/${id}`, { method: 'DELETE' })
