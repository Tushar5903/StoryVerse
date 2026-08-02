import { apiClient } from './apiClient'

export const getProgress = () => apiClient('/progress')
export const getBookProgress = bookId => apiClient(`/progress/book/${bookId}`)
export const markRead = (bookId, chapterId) => apiClient('/progress', { method: 'POST', body: JSON.stringify({ bookId, chapterId }) })
export const unmarkRead = chapterId => apiClient(`/progress/${chapterId}`, { method: 'DELETE' })
