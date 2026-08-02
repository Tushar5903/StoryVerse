import { apiClient } from './apiClient'
export const listChapters = bookId => apiClient(`/books/${bookId}/chapters`)
export const getChapter = (bookId, chapterId) => apiClient(`/books/${bookId}/chapters/${chapterId}`)
export const createChapter = (bookId, payload) => apiClient(`/books/${bookId}/chapters`, { method: 'POST', body: JSON.stringify(payload) })
export const updateChapter = (bookId, chapterId, payload) => apiClient(`/books/${bookId}/chapters/${chapterId}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteChapter = (bookId, chapterId) => apiClient(`/books/${bookId}/chapters/${chapterId}`, { method: 'DELETE' })
