import { apiClient, superApiClient } from './apiClient'

export const superAdminLogin = credentials => apiClient('/auth/super-admin/login', {
  method: 'POST',
  body: JSON.stringify(credentials),
})

export const getSuperAdminSession = () => superApiClient('/super-admin/session')

export const updateUserRole = (userId, role) => superApiClient(`/super-admin/users/${userId}/role`, {
  method: 'PUT',
  body: JSON.stringify({ role }),
})

export const updateUserStatus = (userId, banned) => superApiClient(`/super-admin/users/${userId}/status`, {
  method: 'PUT',
  body: JSON.stringify({ banned }),
})

export const deleteUser = userId => superApiClient(`/super-admin/users/${userId}`, { method: 'DELETE' })

export const deleteAuthor = authorId => superApiClient(`/super-admin/authors/${authorId}`, { method: 'DELETE' })

export const updateAuthor = (authorId, payload) => superApiClient(`/authors/${authorId}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
})

export const deleteBook = bookId => superApiClient(`/books/${bookId}`, { method: 'DELETE' })

export const getDashboard = () => superApiClient('/admin/dashboard')
export const listAllUsers = query => superApiClient(`/admin/users${query || ''}`)
export const listAllAuthors = (query, options) => superApiClient(`/admin/authors${query || ''}`, options)
export const listAllBooks = query => superApiClient(`/admin/books${query || ''}`)
