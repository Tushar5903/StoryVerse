import { apiClient } from './apiClient'
export const listAuthors = query => apiClient(`/authors${query || ''}`)
export const getAuthor = id => apiClient(`/authors/${id}`)
export const getAuthorBooks = (id, query = '') => apiClient(`/authors/${id}/books${query}`)
export const createAuthor = payload => apiClient('/authors', { method: 'POST', body: JSON.stringify(payload) })
export const updateAuthor = (id, payload) => apiClient(`/authors/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
