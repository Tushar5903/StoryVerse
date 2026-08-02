import { apiClient } from './apiClient'

const formWith = (payload, file, fileField = 'thumbnail') => {
  const body = new FormData()
  body.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (file) body.append(fileField, file)
  return body
}

export const listBooks = query => apiClient(`/books${query || ''}`)
export const getBook = id => apiClient(`/books/${id}`)
export const listGenres = () => apiClient('/books/genres')
export const listMyBooks = query => apiClient(`/books/mine${query || ''}`)
export const createDraft = payload => apiClient('/books', { method: 'POST', body: JSON.stringify(payload) })
export const createReviewBook = (payload, thumbnail) => apiClient('/books/review', { method: 'POST', body: formWith(payload, thumbnail) })
export const completeDetails = (id, payload, thumbnail) => apiClient(`/books/${id}/details`, { method: 'PUT', body: formWith(payload, thumbnail) })
export const updateBook = (id, payload, thumbnail) => apiClient(`/books/${id}`, { method: 'PUT', body: formWith(payload, thumbnail) })
export const publishBook = id => apiClient(`/books/${id}/publish`, { method: 'POST' })
export const deleteBook = id => apiClient(`/books/${id}`, { method: 'DELETE' })
export const uploadBookCover = file => {
  const body = new FormData()
  body.append('file', file)
  return apiClient('/upload/book-cover', { method: 'POST', body })
}
